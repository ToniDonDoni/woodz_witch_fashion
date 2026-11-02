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
    await page.goto('file://'+path.join(ROOT,'dist','index.html'));
    await page.waitForFunction(()=>window.runway?.ready);
    assert.deepEqual(await page.evaluate(()=>runway.groove()),{
      playing:false,armed:false,bpm:88,pace:1,volume:.62,scheduled:0
    });
    const button=page.locator('#forest-groove-start');
    const volume=page.locator('#forest-groove-volume');
    const tempo=page.locator('#forest-tempo');
    const pace=page.locator('#pace');
    assert(await button.isVisible(),'Groove button must be visible in the forest');
    assert(await volume.isVisible(),'Volume slider must be visible before playback');
    assert(await tempo.isVisible(),'Tempo calibration slider must be visible');
    assert.equal(await button.textContent(),'START GROOVE');
    assert.equal(await page.locator('#pace-readout').textContent(),'1.0x');
    assert.equal(await page.locator('#forest-tempo-readout').textContent(),'88 BPM');

    for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:1280,height:800}]){
      await page.setViewportSize(viewport);
      const bounds=await page.evaluate(()=>{
        const rect=selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};
        };
        return {groove:rect('#forest-groove'),effects:rect('.effects'),controls:rect('.controls'),card:rect('#actcard')};
      });
      assert(bounds.groove.left>=0&&bounds.groove.right<=viewport.width,'Groove controls clipped: '+JSON.stringify(viewport));
      assert(bounds.groove.bottom<=viewport.height,'Groove controls extend below viewport');
      assert(bounds.groove.top>=bounds.controls.bottom+3,'Tempo panel overlaps runway controls');
      assert(bounds.effects.bottom<=bounds.controls.top-5,'Effects overlap playback controls');
      assert(bounds.card.bottom<bounds.effects.top,'Act title overlaps effects');
    }
    await page.setViewportSize({width:390,height:844});
    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing&&runway.groove().scheduled>0);
    assert.equal(await button.textContent(),'GROOVE ON');
    assert.equal(await button.getAttribute('aria-pressed'),'true');
    assert(await button.isDisabled(),'Only the main PAUSE/PLAY may stop active music');

    await setRange('#pace',1.2);
    assert.equal(await page.locator('#pace-readout').textContent(),'1.2x');
    assert.equal(await page.locator('#forest-tempo-readout').textContent(),'106 BPM');
    assert.equal(await tempo.inputValue(),'106');
    assert.equal(await page.evaluate(()=>runway.groove().bpm),106);
    await setRange('#forest-tempo',100);
    assert.equal(await page.locator('#forest-tempo-readout').textContent(),'100 BPM');
    assert.equal(await page.evaluate(()=>runway.groove().bpm),100);
    await setRange('#pace',1.5);
    assert.equal(await page.locator('#pace-readout').textContent(),'1.5x');
    assert.equal(await page.locator('#forest-tempo-readout').textContent(),'125 BPM');
    assert.equal(await tempo.inputValue(),'125');
    await page.waitForTimeout(240);
    assert.equal(await page.evaluate(()=>runway.groove().scheduled>0),true,'Tempo change left no scheduled audio');

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
    assert.equal(await page.evaluate(()=>runway.groove().bpm),125);

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

    assert.deepEqual(errors,[],'JavaScript exceptions: '+errors.join('; '));
    assert.deepEqual(requests,[],'Unexpected network requests');
    await page.screenshot({path:path.join(OUT,'forest-groove-phone.png')});
    console.log('Forest tempo calibration, pace sync, global pause, and house isolation passed');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
