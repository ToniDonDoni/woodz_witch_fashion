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
  try{
    await page.goto('file://'+path.join(ROOT,'dist','index.html'));
    await page.waitForFunction(()=>window.runway?.ready);
    assert.deepEqual(await page.evaluate(()=>runway.groove()),{
      playing:false,bpm:88,volume:.62,scheduled:0
    });
    assert.equal(await page.locator('[id*=bpm]').count(),0,'There must be no BPM slider');
    const button=page.locator('#forest-groove-start');
    const volume=page.locator('#forest-groove-volume');
    assert(await button.isVisible(),'Groove button must be visible in the forest');
    assert(await volume.isVisible(),'Volume slider must be visible before starting playback');
    assert.equal(await button.textContent(),'START GROOVE');
    assert.equal(await button.getAttribute('aria-pressed'),'false');

    for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:844,height:390},{width:1280,height:800}]){
      await page.setViewportSize(viewport);
      const bounds=await page.evaluate(()=>{
        const rect=selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();
          return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};
        };
        return {groove:rect('#forest-groove'),effects:rect('.effects'),controls:rect('.controls'),card:rect('#actcard')};
      });
      assert(bounds.groove.left>=0&&bounds.groove.right<=viewport.width,'Groove controls clipped at '+JSON.stringify(viewport));
      assert(bounds.groove.bottom<=viewport.height,'Groove controls extend below viewport');
      assert(bounds.groove.bottom<=bounds.controls.top-3,'Groove overlaps original controls');
      assert(bounds.effects.bottom<=bounds.controls.top-5,'Effects overlap original controls');
      assert(bounds.card.bottom<bounds.effects.top,'Act title overlaps effects');
    }
    await page.setViewportSize({width:390,height:844});
    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing&&runway.groove().scheduled>0);
    assert.equal(await button.textContent(),'PAUSE GROOVE');
    assert.equal(await button.getAttribute('aria-pressed'),'true');

    await volume.evaluate(el=>{
      el.value='28';
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    assert.equal(await page.evaluate(()=>runway.groove().volume),.28);
    assert.equal(await page.evaluate(()=>localStorage.getItem('woodz-forest-groove-volume')),'0.28');

    await page.locator('#house-mode').tap();
    await page.waitForFunction(()=>!runway.groove().playing);
    assert.equal(await page.locator('#forest-groove').isVisible(),false,'Groove controls must be hidden in the house');
    assert.equal(await page.evaluate(()=>runway.groove().scheduled),0,'Forest audio sources must stop in the house');
    assert.equal(await button.getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('#house-sound').isVisible(),true,'House sound must remain available');
    await page.locator('#house-mode').tap();
    assert(await page.locator('#forest-groove').isVisible(),'Groove controls must return to the forest');
    assert.equal(await page.evaluate(()=>runway.groove().playing),false,'Groove must not restart without consent');
    assert.equal(await volume.inputValue(),'28','Volume choice must survive a scene change');

    await button.tap();
    await page.waitForFunction(()=>runway.groove().playing);
    await page.evaluate(()=>runway.setHouse(true));
    assert.equal(await page.evaluate(()=>runway.groove().playing),false,'Programmatic house entry must also stop audio');
    await page.evaluate(()=>runway.setHouse(false));

    assert.deepEqual(errors,[],'JavaScript exceptions: '+errors.join('; '));
    assert.deepEqual(requests,[],'Unexpected network requests');
    await page.screenshot({path:path.join(OUT,'forest-groove-phone.png')});
    console.log('Forest groove, 88 BPM, volume, offline controls and house isolation passed');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
