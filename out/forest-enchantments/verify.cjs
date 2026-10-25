const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
// Compare canvas pixels directly: element screenshots also capture overlaid UI.
const canvasPixels=async page=>Buffer.from(await page.locator('canvas').evaluate(c=>c.toDataURL().split(',')[1]),'base64');
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport:{width:430,height:932},deviceScaleFactor:1,offline:true});
  const page = await context.newPage();
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
  await page.goto('file://'+path.join(__dirname,'index.html'));
  await page.waitForFunction(()=>window.runway?.ready);
  const initial=await page.evaluate(()=>runway.state().time);
  await page.waitForTimeout(8000);
  const after=await page.evaluate(()=>runway.state().time);
  assert(after-initial>7,'Animation did not advance in real time');
  await page.getByRole('button',{name:'Pause animation'}).click();
  const paused=await page.evaluate(()=>runway.state().time);
  await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>runway.state().time),paused);
  const counts=[];
  let previous=null;
  for(let t=0;t<=120;t+=.5){const state=await page.evaluate(t=>runway.seek(t),t);counts.push(state.activeCount);assert.equal(state.cacheSize,state.forest.length);
    if(previous)for(const old of previous.forest){const radius=(old.kind==='tree'?230:150)*old.size;if(old.x-radius<=430&&old.x+radius>=0&&old.x<430){assert(state.forest.some(o=>o.id===old.id),'A visible forest object disappeared');}}
    assert.equal(state.spectatorCacheSize,state.spectators.length);
    if(previous)for(const old of previous.spectators){const radius=210*old.size;if(old.x-radius<=430&&old.x+radius>=0){const next=state.spectators.find(o=>o.id===old.id);if(next){assert(next.x>old.x);assert.equal(next.study,old.study);assert.equal(next.objectSeed,old.objectSeed);assert.equal(next.size,old.size);}else{assert(old.x+46*Math.min(430/430,932/900,1.3)*.5-radius>430,'Visible spectator disappeared');}}}
    previous=state;assert(state.figure.x>=0&&state.figure.y>=0&&state.figure.x+state.figure.width<=430&&state.figure.y+state.figure.height<=932);}
  assert(Math.max(...counts)-Math.min(...counts)<16,'Objects accumulated');
  const first=await page.evaluate(()=>runway.seek(0));
  assert(first.forest.some(o=>o.kind==='tree'),'No visible tree layer');
  const early=new Set(),later=new Set();
  for(let t=0;t<=120;t+=5){const st=await page.evaluate(t=>runway.seek(t),t);assert.equal(st.cacheSize,st.forest.length,'Stale cached objects survived retirement');for(const o of st.forest)if(o.x+65*o.size>=0&&o.x-65*o.size<=430)(t<=30?early:later).add(o.kind);}
  for(const kind of ['tree','mushroom','stump','leshy']){assert(early.has(kind),'Missing early '+kind);assert(later.has(kind),'Missing recurring '+kind);}
  const spectatorKinds=new Set();for(let t=0;t<=60;t+=2){const s=await page.evaluate(t=>runway.seek(t),t);for(const o of s.spectators)spectatorKinds.add(o.study);assert(s.spectatorCacheSize<=6,'Spectator cache grew');}
  assert.equal(spectatorKinds.size,8,'Not all eight studies appeared');
  const left=await page.evaluate(()=>runway.seek(0)),right=await page.evaluate(()=>runway.seek(8));assert(left.spectators.some(o=>o.lookX>0));assert(right.spectators.some(o=>o.lookX<0));
  const distant=await page.evaluate(()=>runway.seek(3600));assert(distant.activeCount<70,'Long-run world accumulated objects');assert.equal(distant.cacheSize,distant.forest.length);
  const a=await page.evaluate(()=>runway.seek(10)),b=await page.evaluate(()=>runway.seek(10.1));
  for(const obj of a.butterflies){const match=b.butterflies.find(o=>o.id===obj.id);if(match){assert(match.x>obj.x);assert.equal(match.type,obj.type);assert.equal(match.palette,obj.palette);}}
  for(const obj of a.forest){const match=b.forest.find(o=>o.id===obj.id);if(match){assert(match.x>obj.x);assert.equal(match.kind,obj.kind);assert.equal(match.size,obj.size);}}
  await page.evaluate(()=>runway.seek(7.125));const shot1=await canvasPixels(page);await page.evaluate(()=>runway.seek(7.125));assert(shot1.equals(await canvasPixels(page)),'Same time did not produce the same forest');
  await page.evaluate(()=>runway.seek(0));await page.evaluate(()=>runway.seek(7.125));assert(shot1.equals(await canvasPixels(page)),'History changed the target-time drawing');
  await page.evaluate(()=>runway.seek(0));await page.evaluate(()=>runway.seek(7.09));await page.evaluate(()=>runway.seek(7.125));assert(shot1.equals(await canvasPixels(page)),'First draw in a boil phase changed cached artwork');
  // All effects must be observable, bounded, deterministic and independently switchable.
  let bursts=0,plantsSeen=0,maxPlantCache=0;
  for(let t=0;t<=180;t+=.5){
    const state=await page.evaluate(t=>runway.seek(t),t),fx=state.effects;
    assert(fx.fogCount>0);assert.equal(fx.plantCacheSize,fx.plants.length);
    maxPlantCache=Math.max(maxPlantCache,fx.plantCacheSize);
    if(t<=30){bursts+=fx.spores.length;plantsSeen+=fx.plants.length;}
    for(const b of fx.spores){assert(b.age>=0&&b.age<=8);assert.equal(b.count,22);}
    assert(fx.plants.length<=3);assert(fx.spores.length<=4);
  }
  assert(bursts>0,'No spore burst in the first 30 seconds');
  assert(plantsSeen>0,'No fractal plants in the first 30 seconds');
  for(const name of ['fog','spores','plants']){
    await page.locator(`[data-effect="${name}"]`).click();
    assert.equal(await page.locator(`[data-effect="${name}"]`).getAttribute('aria-pressed'),'false');
    const fx=await page.evaluate(()=>runway.seek(10).effects);
    assert.equal(fx.enabled[name],false);
    if(name==='fog')assert.equal(fx.fogCount,0);
    else assert.equal(fx[name].length,0);
  }
  // Effects off must reproduce the exact original canvas, including walk sprites.
  await page.evaluate(()=>runway.seek(7.125));
  const restored=await canvasPixels(page);
  const original=await context.newPage();
  await original.goto('file://'+path.join(__dirname,'../forest-spectators/index.html'));
  await original.waitForFunction(()=>runway?.ready);
  await original.evaluate(()=>runway.seek(7.125));
  assert(restored.equals(await canvasPixels(original)),'Effects off changed the original forest');
  await original.close();
  for(const name of ['fog','spores','plants'])await page.locator(`[data-effect="${name}"]`).click();
  // A new seed must render identically with a warm and cold geometry cache.
  await page.getByRole('button',{name:'NEW DREAM'}).click();
  await page.evaluate(()=>runway.seek(10));const seeded=await canvasPixels(page);
  await page.locator('[data-effect="plants"]').click();await page.locator('[data-effect="plants"]').click();
  assert(seeded.equals(await canvasPixels(page)),'Plant cache retained an old seed');
  // Restore the reviewed default seed before screenshots.
  await page.reload();await page.waitForFunction(()=>runway?.ready);
  const screenshotTimes=[0,.5,1,32/24,33/24,5,20,120];
  for(let i=0;i<screenshotTimes.length;i++){await page.evaluate(t=>runway.seek(t),screenshotTimes[i]);await page.screenshot({path:path.join(__dirname,`phone-${String(i).padStart(3,'0')}.png`)});}
  fs.mkdirSync(path.join(__dirname,'motion'),{recursive:true});
  for(let i=0;i<36;i++){await page.evaluate(t=>runway.seek(t),i/12);await page.locator('canvas').screenshot({path:path.join(__dirname,'motion',`${String(i).padStart(3,'0')}.png`)});}
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'desktop.png')});await page.evaluate(()=>runway.seek(18));await page.screenshot({path:path.join(__dirname,'desktop-later.png')});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'landscape.png')});
  const s=await page.evaluate(()=>runway.state());assert(s.figure.y>=0&&s.figure.y+s.figure.height<=390);
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'small-phone.png')});
  const oldSeed=await page.evaluate(()=>runway.state().seed);await page.getByRole('button',{name:'NEW DREAM'}).click();assert.notEqual(await page.evaluate(()=>runway.state().seed),oldSeed);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const report={effects:{simulatedSeconds:180,earlySporeSamples:bursts,earlyPlantSamples:plantsSeen,maxPlantCache,originalCanvasRestored:true},browser:await browser.version(),offline:true,realTimeAdvance:after-initial,simulatedSeconds:120,activeCountRange:[Math.min(...counts),Math.max(...counts)],errors,networkRequests:requests,viewports:['430x932','320x568','844x390','1440x900'],forestCategories:Array.from(early),spectatorStudies:Array.from(spectatorKinds),physicalPhoneTested:false};
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
