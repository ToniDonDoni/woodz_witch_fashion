'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const baseDir=__dirname;
const optimized=path.resolve(baseDir,'../../site/forest-couture-buyers-optimized/index.html');
const original=path.join(baseDir,'original.html');
const captures=path.join(baseDir,'captures');
fs.mkdirSync(captures,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const reports=[];
 for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,offline:true});
  async function load(file){
   const page=await context.newPage(),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   await page.goto('file://'+file);
   await page.waitForFunction(()=>window.runway && window.runway.ready,null,{timeout:45000});
   return {page,errors,requests};
  }
  const optimizedCase=await load(optimized),originalCase=await load(original);
  const page=optimizedCase.page,prev=originalCase.page;
  const pristine=await page.evaluate(()=>{
   const st=runway.seek(0);
   return {state:st,background:document.querySelector('#audience').toDataURL()};
  });
  await prev.evaluate(()=>runway.seek(0));
  const [previousShot,optimizedShot]=await Promise.all([prev.screenshot(),page.screenshot()]);
  assert(previousShot.equals(optimizedShot),'Time zero should match original artwork pixel-for-pixel');
  const atStart=pristine.state.audiencePaints;
  assert.equal(atStart,1);
  // Thousands of individual strokes on each frame are exactly the work to avoid.
  const sample=await page.evaluate(()=>{
    const times=[];
    for(let i=0;i<15;i++)runway.seek(1+i/30);
    const before=runway.state();
    for(let i=0;i<120;i++){
     const t=performance.now();runway.seek(2+i/30);
     times.push(performance.now()-t);
    }
    const after=runway.state();
    return {before,after,times,background:document.querySelector('#audience').toDataURL(),
            character:document.querySelector('#model').toDataURL()};
  });
  assert.equal(sample.before.audiencePaints,atStart);
  assert.equal(sample.after.audiencePaints,atStart);
  assert(sample.after.modelPaints-sample.before.modelPaints>=120);
  assert.equal(sample.background,pristine.background,'Static audience must not re-rasterize');
  assert(sample.character.length>1000);
  assert.deepEqual(optimizedCase.requests,[]);
  assert.deepEqual(optimizedCase.errors,[]);
  assert.deepEqual(originalCase.requests,[]);
  assert.deepEqual(originalCase.errors,[]);
  await page.screenshot({path:path.join(captures,'optimized-'+viewport.width+'x'+viewport.height+'.png')});
  const recast=await page.evaluate(()=>{
   const before=runway.state();
   runway.setSeed(9819);
   return {before,after:runway.state(),
           background:document.querySelector('#audience').toDataURL()};
  });
  assert.equal(recast.after.audiencePaints,atStart+1,'New cast repaints static audience once');
  assert.notEqual(recast.background,pristine.background,'Seed must change audience');
  const same=await page.evaluate(()=>{
   const before=runway.state().audiencePaints;
   runway.seek(90);
   runway.seek(1);
   return {before,after:runway.state().audiencePaints};
  });
  assert.equal(same.before,same.after);
  const ordered=sample.times.slice().sort((a,b)=>a-b);
  const report={viewport,offline:true,pixelIdenticalAtTimeZero:true,
      audiencePaintsFor120ConsecutiveFrames:0,
      activeModelFrames:sample.after.modelPaints-sample.before.modelPaints,
      medianMs:+ordered[Math.floor(ordered.length*.5)].toFixed(2),
      p95Ms:+ordered[Math.floor(ordered.length*.95)].toFixed(2),
      errors:optimizedCase.errors};
  reports.push(report);console.log(JSON.stringify(report));
  await context.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(baseDir,'verification.json'),
 JSON.stringify({browser:'Offline headless Chromium',reports,phoneHardwareTested:false},null,2)+'\n');
})().catch(e=>{console.error(e);process.exit(1)});
