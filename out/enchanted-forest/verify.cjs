const fs = require('fs');
const path = require('path');
const assert = require('assert');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
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
    previous=state;assert(state.figure.x>=0&&state.figure.y>=0&&state.figure.x+state.figure.width<=430&&state.figure.y+state.figure.height<=932);}
  assert(Math.max(...counts)-Math.min(...counts)<16,'Objects accumulated');
  const first=await page.evaluate(()=>runway.seek(0));
  assert(first.forest.some(o=>o.kind==='tree'),'No visible tree layer');
  const early=new Set(),later=new Set();
  for(let t=0;t<=120;t+=5){const st=await page.evaluate(t=>runway.seek(t),t);assert.equal(st.cacheSize,st.forest.length,'Stale cached objects survived retirement');for(const o of st.forest)if(o.x+65*o.size>=0&&o.x-65*o.size<=430)(t<=30?early:later).add(o.kind);}
  for(const kind of ['tree','mushroom','stump','leshy']){assert(early.has(kind),'Missing early '+kind);assert(later.has(kind),'Missing recurring '+kind);}
  const distant=await page.evaluate(()=>runway.seek(3600));assert(distant.activeCount<70,'Long-run world accumulated objects');assert.equal(distant.cacheSize,distant.forest.length);
  const a=await page.evaluate(()=>runway.seek(10)),b=await page.evaluate(()=>runway.seek(10.1));
  for(const obj of a.butterflies){const match=b.butterflies.find(o=>o.id===obj.id);if(match){assert(match.x>obj.x);assert.equal(match.type,obj.type);assert.equal(match.palette,obj.palette);}}
  for(const obj of a.forest){const match=b.forest.find(o=>o.id===obj.id);if(match){assert(match.x>obj.x);assert.equal(match.kind,obj.kind);assert.equal(match.size,obj.size);}}
  await page.evaluate(()=>runway.seek(7.125));const shot1=await page.locator('canvas').screenshot();await page.evaluate(()=>runway.seek(7.125));assert(shot1.equals(await page.locator('canvas').screenshot()),'Same time did not produce the same forest');
  const screenshotTimes=[0,.5,1,32/24,33/24,5,20,120];
  for(let i=0;i<screenshotTimes.length;i++){await page.evaluate(t=>runway.seek(t),screenshotTimes[i]);await page.screenshot({path:path.join(__dirname,`phone-${String(i).padStart(3,'0')}.png`)});}
  fs.mkdirSync(path.join(__dirname,'motion'),{recursive:true});
  for(let i=0;i<66;i++){await page.evaluate(t=>runway.seek(t),i/12);await page.locator('canvas').screenshot({path:path.join(__dirname,'motion',`${String(i).padStart(3,'0')}.png`)});}
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'desktop.png')});
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'landscape.png')});
  const s=await page.evaluate(()=>runway.state());assert(s.figure.y>=0&&s.figure.y+s.figure.height<=390);
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await page.evaluate(()=>runway.seek(2));await page.screenshot({path:path.join(__dirname,'small-phone.png')});
  const oldSeed=await page.evaluate(()=>runway.state().seed);await page.getByRole('button',{name:'NEW DREAM'}).click();assert.notEqual(await page.evaluate(()=>runway.state().seed),oldSeed);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  const report={browser:await browser.version(),offline:true,realTimeAdvance:after-initial,simulatedSeconds:120,activeCountRange:[Math.min(...counts),Math.max(...counts)],errors,networkRequests:requests,viewports:['430x932','320x568','844x390','1440x900'],forestCategories:Array.from(early),physicalPhoneTested:false};
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
