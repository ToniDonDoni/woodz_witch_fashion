// Offline, deterministic smoke checks for the standalone single-event stage.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,offline:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});
 const filename=path.resolve(__dirname,'../../site/infinite-single-event-rc/index.html');
 await page.goto('file://'+filename);
 await page.waitForFunction(()=>window.runway?.ready);
 assert.equal(await page.title(),'WOODZ — Infinite Single Encounters');
 assert.equal((await page.evaluate(()=>runway.seek(0))).activeEventCount,0);
 const specs=await page.evaluate(()=>{
  const list=Array.from({length:200},(_,i)=>runway.spec(i));
  return {families:[...new Set(list.filter(x=>!x.empty).map(x=>x.family))],
   uniqueSeeds:new Set(list.map(x=>x.seed)).size,
   tailsValid:list.every(x=>x.trailing>=1.15-1e-9&&x.leading+x.duration+x.trailing<=7.0000001),
   emptyCount:list.filter(x=>x.empty).length};
 });
 assert.deepEqual(specs.families.sort(),['ribbon','watcher','wing']);
 assert.equal(specs.uniqueSeeds,200);
 assert(specs.tailsValid);
 assert(specs.emptyCount>5&&specs.emptyCount<35);
 const check=await page.evaluate(()=>{
  let count=0,valid=true;
  for(let i=0;i<200;i++){
   for(const delta of [0,.2,.6,1,2,3,4,5,6,6.99]){
    valid=valid&&runway.seek(i*7+delta).activeEventCount<=1;count++;
   }
  }
  return {valid,count,longSeek:runway.seek(1000000)};
 });
 assert(check.valid);assert(check.longSeek.slot>140000);
 const firstNonEmpty=await page.evaluate(()=>{
  for(let i=0;i<30;i++)if(!runway.spec(i).empty)return i;return -1;
 });
 assert(firstNonEmpty>=0);
 const target=firstNonEmpty*7+2.125;
 await page.evaluate(t=>runway.seek(t),target);
 const pixels=await page.locator('canvas').screenshot();
 await page.evaluate(()=>runway.seek(456));
 await page.evaluate(t=>runway.seek(t),target);
 assert(pixels.equals(await page.locator('canvas').screenshot()),'Seek history changed art');
 await page.evaluate(t=>runway.seek(t-.019),target);
 await page.evaluate(t=>runway.seek(t),target);
 assert(pixels.equals(await page.locator('canvas').screenshot()),'12 Hz phase is not canonical');
 const archive=path.join(__dirname,'captures');
 fs.mkdirSync(archive,{recursive:true});
 await page.screenshot({path:path.join(archive,'phone-black-encounter.png')});
 for(const dims of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(dims);
  await page.waitForFunction(d=>runway.state().viewport.w===d.width&&runway.state().viewport.h===d.height,dims);
  const st=await page.evaluate(t=>runway.seek(t),target);
  assert(st.figure.x>=0&&st.figure.y>=0);
  assert(st.figure.x+st.figure.width<=dims.width+.01);
  assert(st.figure.y+st.figure.height<=dims.height+.01);
  await page.screenshot({path:path.join(archive,'scene-'+dims.width+'x'+dims.height+'.png')});
 }
 const change=await page.evaluate(()=>{
  const old=runway.state().seed,updated=runway.setSeed(old+7919);
  return {old,updated:updated.seed,restarted:updated.time===0};
 });
 assert.notEqual(change.old,change.updated);assert(change.restarted);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const summary={offline:true,zeroNetwork:true,zeroRuntimeErrors:true,verifiedSlots:200,
  uniqueSeeds:specs.uniqueSeeds,emptySlots:specs.emptyCount,slotSamples:check.count,
  maxSimultaneousEvents:1,seekSeconds:1000000,
  viewportChecks:['390x844','320x568','844x390','1440x900'],physicalPhoneMeasured:false};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
