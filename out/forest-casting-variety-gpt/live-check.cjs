const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,offline:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+path.resolve(__dirname,'../../site/strange-passing-gpt/index.html'));await page.waitForFunction(()=>window.runway?.ready);
 await page.evaluate(()=>{runway.setSeed(12731);runway.seek(0);runway.play();window.liveFrames=[];let prior=performance.now();function sample(now){liveFrames.push(now-prior);prior=now;requestAnimationFrame(sample)}requestAnimationFrame(sample)});
 const samples=[];
 for(let i=0;i<12;i++){await page.waitForTimeout(10000);const s=await page.evaluate(()=>runway.state());assert(s.events.length<=1);samples.push({time:s.time,cache:s.cacheSize,event:s.events[0]?.type||null});console.log(JSON.stringify(samples.at(-1)));}
 const final=await page.evaluate(()=>{const frames=liveFrames.slice(2).sort((a,b)=>a-b);return {simulationTime:runway.state().time,frames:frames.length,rafMedianMs:frames[Math.floor(frames.length*.5)],rafP95Ms:frames[Math.floor(frames.length*.95)]}});
 assert(final.simulationTime>110,'Animation fell substantially behind wall time');assert.deepEqual(errors,[]);
 const report={wallSeconds:120,viewport:'390x844',offline:true,errors,samples,...final,physicalPhoneTested:false};
 fs.writeFileSync(path.join(__dirname,'live-verification.json'),JSON.stringify(report,null,2)+'\n');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
