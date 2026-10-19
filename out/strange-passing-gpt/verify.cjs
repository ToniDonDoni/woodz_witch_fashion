const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,offline:true});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto('file://'+path.resolve(__dirname,'../../site/strange-passing-gpt/index.html'));
 await page.waitForFunction(()=>window.runway?.ready);
 await page.evaluate(()=>{runway.setSeed(12731);runway.seek(0)});
 const plans=await page.evaluate(()=>runway.programme(1000));
 for(let i=0;i<plans.length;i++){if(i)assert.notEqual(plans[i].type,plans[i-1].type);if(i%8===0&&i+8<=plans.length)assert.equal(new Set(plans.slice(i,i+8).map(p=>p.type)).size,8);}
 assert.equal(new Set(plans.map(p=>p.signature)).size,1000);
 const captures=path.join(__dirname,'captures');fs.mkdirSync(captures,{recursive:true});
 for(const plan of plans.slice(0,8)){
  await page.evaluate(t=>runway.seek(t),plan.start+plan.duration*.49);
  await page.screenshot({path:path.join(captures,plan.type+'.png')});
 }
 await page.evaluate(()=>runway.seek(8.125));
 const snapshot=await page.locator('canvas').screenshot();
 await page.evaluate(()=>{runway.seek(36000);runway.seek(8.125)});
 assert(snapshot.length>50000,'A blank screenshot cannot establish determinism');
 assert(snapshot.equals(await page.locator('canvas').screenshot()),'Seeking must reproduce exact pixels');
 const coverage={};let maxCache=0,maxActive=0,maxVisitors=0;
 for(let t=0;t<600;t+=.7){const s=await page.evaluate(t=>runway.seek(t),t);maxCache=Math.max(maxCache,s.cacheSize);maxActive=Math.max(maxActive,s.activeCount);maxVisitors=Math.max(maxVisitors,s.events.length);assert(s.events.length<=1,'Only one interruption at a time');for(const e of s.events)coverage[e.type]=(coverage[e.type]||0)+1;}
 assert(maxCache<150);assert.equal(Object.keys(coverage).length,8);
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.waitForFunction(v=>runway.state().viewport.w===v.width,viewport);
  for(const type of ['leshy','owlbuyer','moonwalker','rainfish']){const p=plans.find(p=>p.type===type);const s=await page.evaluate(t=>runway.seek(t),p.start+p.duration*.48);assert(s.figure.y>=0&&s.figure.x>=0&&s.figure.x+s.figure.width<=viewport.width);await page.screenshot({path:path.join(captures,`${type}-${viewport.width}.png`)});}
  const controls=await page.locator('.controls').boundingBox();assert(controls.x>=0&&controls.x+controls.width<=viewport.width);
 }
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>runway.state().viewport.w===390);
 await page.evaluate(()=>runway.seek(10));
 const samples=await page.evaluate(()=>{const times=[];for(let i=0;i<120;i++){const start=performance.now();runway.seek(10+i/60);times.push(performance.now()-start);}return times.sort((a,b)=>a-b);});
 // Review the actual approved frame boundary, without substituting or blending poses.
 for(const frame of [31,32,0,1]){await page.evaluate(t=>runway.seek(t),frame/24+.00001);await page.screenshot({path:path.join(captures,`seam-${frame}.png`)});}
 const paused=(await page.evaluate(()=>runway.state())).time;await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>runway.state())).time,paused);
 await page.locator('#next').click();assert.equal((await page.evaluate(()=>runway.state())).time,24);
 const seed=(await page.evaluate(()=>runway.state())).seed;await page.locator('#dream').click();assert.notEqual((await page.evaluate(()=>runway.state())).seed,seed);
 await page.locator('#pace').evaluate(el=>{el.value='1.4';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#play').click();await page.waitForTimeout(300);assert((await page.evaluate(()=>runway.state())).time>0);
 await page.locator('#play').click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>window.runway?.ready);assert.equal((await page.evaluate(()=>runway.state())).playing,false);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
 const report={browser:await browser.version(),offline:true,errors,requests,families:Object.keys(coverage),programmeChecked:1000,maxVisitors,maxCache,maxActive,deterministicPixels:true,simulatedSeconds:36000,drawMedianMs:samples[60],drawP95Ms:samples[114],physicalPhoneTested:false,originalGaitSeam:'Unchanged; source frames 0–32 retained'};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
