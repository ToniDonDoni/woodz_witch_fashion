// Deterministic offline WebGL2 regression, visual captures, and mobile framing.
// Run from the repository root after python out/teknium-three-fx/build.py.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,args:[
   '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
 ]});
 try{
  const context=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:1,offline:true
  });
  const page=await context.newPage();
  const errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  const filename=path.resolve(__dirname,'../../site/teknium-three-fx/index.html');
  await page.goto('file://'+filename);
  await page.waitForFunction(()=>window.runway?.ready);
  const initial=await page.evaluate(()=>window.runway.setSeed(349122));
  assert.equal(initial.ready,true);
  assert.equal(initial.activeEventCount,0);
  assert.equal(initial.frame,0);
  assert.equal(initial.backend,'webgl2','Chromium smoke test must exercise GLSL, not the fallback');

  const generated=await page.evaluate(()=>{
   const samples=Array.from({length:240},(_,i)=>runway.spec(i));
   const counts=Array(3).fill(0);
   for(const item of samples)counts[item.type]++;
   let overlap=0,checked=0,quiet=true;
   for(let i=0;i<240;i++){
    const spec=samples[i];
    if(spec.start+spec.duration>8.4+.00001 || spec.tail<1.1)quiet=false;
    for(const offset of [0,.2,.4,.6,1.2,3,5,6.8,7.6,8.399]){
     const state=runway.inspect(i*8.4+offset);
     overlap=Math.max(overlap,state.activeEventCount);
     checked++;
    }
   }
   return {counts,variants:new Set(samples.map(s=>s.id)).size,
     colorVariations:new Set(samples.map(s=>JSON.stringify(s.palette))).size,
     sides:new Set(samples.map(s=>s.side)).size,
     overlap,checked,quiet};
  });
  assert.deepEqual(generated.counts,[80,80,80]);
  assert.equal(generated.variants,240);
  assert.equal(generated.sides,2);
  assert(generated.colorVariations>=5);
  assert.equal(generated.overlap,1);
  assert(generated.quiet);

  const captures=path.join(__dirname,'captures');
  fs.mkdirSync(captures,{recursive:true});
  const effects=[];
  for(let kind=0;kind<3;kind++){
   const slot=await page.evaluate(k=>{
     for(let i=0;i<3;i++)if(runway.spec(i).type===k)return i;
     return -1;
   },kind);
   assert(slot>=0);
   const state=await page.evaluate(i=>runway.seekSlot(i),slot);
   assert.equal(state.backend,'webgl2');
   assert.equal(state.event.type,kind);
   assert.equal(state.activeEventCount,1);
   const pixels=await page.evaluate(()=>{
     const canvas=document.getElementById('fx');
     const gl=canvas.getContext('webgl2');
     const rgba=new Uint8Array(canvas.width*canvas.height*4);
     gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
     let lit=0,high=0,left=0,right=0,peak=0,sum=0;
     for(let i=0;i<rgba.length;i+=4){
       if(rgba[i+3]>20){
         lit++;peak=Math.max(peak,rgba[i+3]);sum+=rgba[i]+rgba[i+1]+rgba[i+2];
         if((i/4)%canvas.width<canvas.width/2)left++;else right++;
       }
       if(rgba[i+3]>100)high++;
     }
     return {lit,high,left,right,peak,meanRgb:sum/Math.max(1,lit),error:gl.getError()};
   });
   assert(pixels.lit>200,'Shader emitted insufficient color pixels for effect '+kind);
   assert(pixels.high>50,'Effect looks invisible / too transparent: '+kind);
   assert.equal(pixels.error,0,'WebGL error on '+kind);
   await page.screenshot({path:path.join(captures,['liquid-glass','spectral-smoke','pixel-dissolve'][kind]+'.png')});
   effects.push({kind,slot,pixels});
  }

  // Seeking back to exactly the same time must not accumulate simulation history.
  const a=await page.evaluate(()=>runway.seekSlot(3));
  const first=await page.screenshot();
  await page.evaluate(()=>runway.seek(777.42));
  await page.evaluate(()=>runway.seekSlot(3));
  const second=await page.screenshot();
  assert(first.equals(second),'Same seed/slot must reproduce the same pixels');

  // Effect-selection and next-encounter UI must work.
  await page.locator('[data-effect="1"]').click();
  assert.equal((await page.evaluate(()=>runway.state())).event.type,1);
  const before=(await page.evaluate(()=>runway.state())).slot;
  await page.locator('#next').click();
  assert.equal((await page.evaluate(()=>runway.state())).slot,before+1);
  await page.locator('#dream').click();
  assert.equal((await page.evaluate(()=>runway.state())).time,0);

  // Responsive captures include two phone orientations and desktop.
  for(const vp of [{width:320,height:568},{width:844,height:390},
                   {width:1440,height:900}]){
   await page.setViewportSize(vp);
   await page.waitForFunction(v=>runway.state().viewport.width===v.width&&
                             runway.state().viewport.height===v.height,vp);
   const st=await page.evaluate(()=>runway.seekSlot(0));
   assert(st.walker.x>=0&&st.walker.y>=0);
   assert(st.walker.x+st.walker.width<=vp.width+.01);
   assert(st.walker.y+st.walker.height<=vp.height+.01);
   await page.screenshot({path:path.join(captures,'viewport-'+vp.width+'x'+vp.height+'.png')});
  }
  const huge=await page.evaluate(()=>runway.seek(1000000));
  assert(huge.slot>100000,'Direct seeking must be O(1) in timeline length');
  assert.deepEqual(errors,[],'Runtime errors');
  assert.deepEqual(requests,[],'Offline HTML must not request a network resource');
  const summary={
   offline:true,backend:'webgl2',runtimeErrors:errors,networkRequests:requests,
   seed:349122,testedSlots:240,frameSamples:generated.checked,
   kinds:generated.counts,uniqueGenomes:generated.variants,
   distinctPalettes:generated.colorVariations,maxConcurrentEffects:generated.overlap,
   framebuffer:effects,deterministicScreenshot:true,physicalPhoneVerified:false
  };
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify(summary));
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
