const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'dist','verification');

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({
    headless:true,
    ...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})
  });
  const context=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:1,offline:true,hasTouch:true,isMobile:true
  });
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{
    if(/^https?:/.test(request.url()))requests.push(request.url());
  });
  const setRange=async(selector,value)=>page.locator(selector).evaluate((el,next)=>{
    el.value=String(next);
    el.dispatchEvent(new Event('input',{bubbles:true}));
  },value);
  try{
    // Spy on the Web Audio gain schedule: a PACE change must restore volume
    // at the new bar, not five seconds later at the end of the look-ahead queue.
    await page.addInitScript(()=>{
      window.__grooveGainCalls=[];
      const originalCreateGain=AudioContext.prototype.createGain;
      AudioContext.prototype.createGain=function(){
        const gain=originalCreateGain.call(this);
        if(!window.__grooveMaster)window.__grooveMaster={parameter:gain.gain,context:this};
        return gain;
      };
      const originalTarget=AudioParam.prototype.setTargetAtTime;
      AudioParam.prototype.setTargetAtTime=function(value,startTime,timeConstant){
        if(window.__grooveMaster?.parameter===this){
          window.__grooveGainCalls.push({value,startTime,now:window.__grooveMaster.context.currentTime});
        }
        return originalTarget.call(this,value,startTime,timeConstant);
      };
    });
    await page.goto('file://'+path.join(ROOT,'dist','index.html'));
    await page.waitForFunction(()=>window.runway?.ready);
    assert.deepEqual(await page.evaluate(()=>runway.groove()),{
      playing:false,armed:false,bpm:87.27,pace:1,volume:.62,scheduled:0
    });
    const button=page.locator('#forest-groove-start');
    const volume=page.locator('#forest-groove-volume');

    assert(await button.isVisible(),'Groove button must be visible in the forest');
    assert(await volume.isVisible(),'Volume slider must be visible before playback');
    assert.equal(await page.locator('#forest-tempo').count(),0,'Temporary TEMPO slider must be removed');
    assert.equal(await page.locator('#forest-tempo-readout').count(),0,'BPM readout must be removed');
    assert.equal(await page.locator('#pace-readout').count(),0,'PACE readout must be removed');
    assert.equal(await button.textContent(),'START GROOVE');

    for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:1280,height:800}]){
      await page.setViewportSize(viewport);
      const bounds=await page.evaluate(()=>{
        const rect=selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};
        };
        return {groove:rect('#forest-groove'),effects:rect('.effects'),controls:rect('.controls'),card:rect('#actcard'),
          play:rect('#play'),pace:rect('#pace'),dream:rect('#dream')};
      });
      assert(bounds.groove.left>=0&&bounds.groove.right<=viewport.width,'Groove controls clipped: '+JSON.stringify(viewport));
      assert(bounds.groove.bottom<=viewport.height,'Groove controls extend below viewport');
      const grooveCenter=(bounds.groove.left+bounds.groove.right)/2;
      assert(Math.abs(grooveCenter-viewport.width/2)<3,'Groove and volume must be centered beneath PACE');
      assert(bounds.play.right<=bounds.pace.left,'Main PLAY must be directly left of PACE');
      assert(bounds.pace.right<=bounds.dream.left-4,'NEW DREAM overlaps PACE');
      assert(bounds.groove.top>=bounds.controls.bottom+3,'Groove overlaps runway controls');
      assert(bounds.effects.bottom<=bounds.controls.top-5,'Effects overlap playback controls');
      assert(bounds.card.bottom<bounds.effects.top,'Act title overlaps effects');
    }
    await page.setViewportSize({width:390,height:844});
    // The first click in the forest starts groove, without using its button.
    await page.locator('#scene').tap({position:{x:80,y:160}});
    await page.waitForFunction(()=>runway.groove().playing&&runway.groove().scheduled>0);
    assert.equal(await button.textContent(),'GROOVE ON');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert(await button.isEnabled(),'Groove button must remain available to toggle off');

    // After that first activation, unrelated clicks must never restart music.
    await button.tap();
    assert.equal(await button.textContent(),'START GROOVE');
    assert.equal(await page.evaluate(()=>runway.groove().armed),false);
    await page.locator('#scene').tap({position:{x:80,y:160}});
    assert.equal(await page.evaluate(()=>runway.groove().armed),false,
      'Only the first forest click may auto-start groove');
    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing);
    assert.equal(await button.textContent(),'GROOVE ON');

    const gainEventsBefore=await page.evaluate(()=>window.__grooveGainCalls.length);
    await setRange('#pace',1.2);
    assert.equal(await page.evaluate(()=>runway.groove().bpm),104.724);
    await page.waitForFunction(before=>window.__grooveGainCalls.slice(before).some(event=>event.value>0),gainEventsBefore);
    let restore=await page.evaluate(before=>window.__grooveGainCalls.slice(before).find(event=>event.value>0),gainEventsBefore);
    assert(restore.startTime-restore.now<.3,'PACE left music muted until the look-ahead queue finished');
    assert.equal(await page.evaluate(()=>runway.groove().playing),true,'Music stopped when PACE changed');
    const secondChange=await page.evaluate(()=>window.__grooveGainCalls.length);
    await setRange('#pace',1.5);
    assert.equal(await page.evaluate(()=>runway.groove().bpm),130.905);
    await page.waitForFunction(before=>window.__grooveGainCalls.slice(before).some(event=>event.value>0),secondChange);
    restore=await page.evaluate(before=>window.__grooveGainCalls.slice(before).find(event=>event.value>0),secondChange);
    assert(restore.startTime-restore.now<.3,'A repeated PACE change left music muted');
    assert.equal(await page.evaluate(()=>runway.groove().playing),true,'Music stopped after repeated PACE changes');
    assert.equal(await page.evaluate(()=>runway.groove().scheduled>0),true,'Tempo change left no scheduled audio');
    await setRange('#pace',1);
    assert.equal(await page.evaluate(()=>runway.groove().bpm),87.27);

    await setRange('#forest-groove-volume',28);
    assert.equal(await page.evaluate(()=>runway.groove().volume),.28);
    assert.equal(await page.evaluate(()=>localStorage.getItem('woodz-forest-groove-volume')),'0.28');

    await page.locator('#play').tap();
    assert.equal(await page.locator('#play').getAttribute('aria-label'),'Play animation');
    assert.equal(await page.evaluate(()=>runway.groove().playing),false,'Runway PAUSE must stop music');
    assert.equal(await page.evaluate(()=>runway.groove().armed),true,'PAUSE must preserve groove opt-in');
    assert.equal(await page.evaluate(()=>runway.groove().scheduled),0);
    assert.equal(await button.textContent(),'GROOVE READY');
    await page.locator('#play').tap();
    await page.waitForFunction(()=>runway.groove().playing);
    assert.equal(await button.textContent(),'GROOVE ON');
    assert.equal(await page.evaluate(()=>runway.groove().bpm),87.27);

    await page.locator('#house-mode').tap();
    await page.waitForFunction(()=>!runway.groove().playing);
    assert.equal(await page.locator('#forest-groove').isVisible(),false,'Groove controls visible in the house');
    assert.equal(await page.evaluate(()=>runway.groove().armed),false,'House entry must clear groove opt-in');
    assert.equal(await page.evaluate(()=>runway.groove().scheduled),0,'House entry must stop all groove sources');
    assert.equal(await page.locator('#house-sound').isVisible(),true,'House sound must remain available');
    await page.locator('#house-mode').tap();
    assert(await page.locator('#forest-groove').isVisible(),'Groove controls must return to forest');
    assert.equal(await button.textContent(),'START GROOVE');
    assert.equal(await page.evaluate(()=>runway.groove().playing),false,'Returning to forest must not auto-play');
    assert.equal(await volume.inputValue(),'28');

    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing);
    await page.evaluate(()=>runway.setHouse(true));
    assert.equal(await page.evaluate(()=>runway.groove().playing),false,'Programmatic house entry must stop music');
    await page.evaluate(()=>runway.setHouse(false));

    // After a reload, the first click directly on START GROOVE must not
    // both turn audio on and immediately toggle it off as it bubbles.
    await page.reload();
    await page.waitForFunction(()=>window.runway?.ready);
    assert.equal(await button.textContent(),'START GROOVE');
    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing);
    assert.equal(await button.textContent(),'GROOVE ON');
    await button.tap();
    assert.equal(await page.evaluate(()=>runway.groove().armed),false,
      'The groove button must toggle off after direct first-click activation');

    assert.deepEqual(errors,[],'JavaScript exceptions: '+errors.join('; '));
    assert.deepEqual(requests,[],'Unexpected network requests');
    await page.screenshot({path:path.join(OUT,'forest-groove-phone.png')});
    console.log('First forest click, groove on/off, 87.27 BPM pace sync, pause and house isolation passed');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
