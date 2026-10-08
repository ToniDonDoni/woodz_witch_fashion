// Browser-level checks: an isolated offline page, working WebGL2 when available,
// deterministic procedural variety, silent gaps, and original walker framing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,args:[
  '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'
 ]});
 const context=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:1,offline:true
 });
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',err=>errors.push(String(err)));
 page.on('request',req=>{if(/^https?:/.test(req.url()))requests.push(req.url());});
 const filename=path.resolve(__dirname,'../../site/living-paint-v2/index.html');
 await page.goto('file://'+filename);
 await page.waitForFunction(()=>window.runway?.ready);
 await page.evaluate(()=>window.runway.setSeed(42));
 const first=await page.evaluate(()=>window.runway.state());
 assert.equal(first.activeEventCount,0);
 assert.equal(first.frame,0);
 assert(first.backend==='webgl2'||first.backend==='canvas2d');

 const variety=await page.evaluate(()=>{
  const specs=Array.from({length:240},(_,i)=>runway.spec(i));
  const counts={};
  for(const s of specs){
   const key=s.bodyName+'/'+s.appendName+'/'+s.behaviorName;
   counts[key]=(counts[key]||0)+1;
  }
  return {
   topologyCount:new Set(specs.map(s=>s.bodyName)).size,
   appendageCount:new Set(specs.map(s=>s.appendName)).size,
   behaviorCount:new Set(specs.map(s=>s.behaviorName)).size,
   paletteCount:new Set(specs.map(s=>JSON.stringify(s.palette))).size,
   composedTypes:Object.keys(counts).length,
   genomeCount:new Set(specs.map(s=>s.genomeSeed)).size,
   empty:specs.filter(s=>s.empty).length,
   validSlots:specs.every(s=>s.start+s.duration+s.tail<=7.000000001&&s.tail>=1.1-1e-9),
   allBodyModes:new Set(specs.map(s=>s.genes.topology)).size
  };
 });
 assert.equal(variety.topologyCount,6);
 assert.equal(variety.appendageCount,6);
 assert.equal(variety.behaviorCount,6);
 assert.equal(variety.paletteCount,6);
 assert.equal(variety.genomeCount,240);
 assert(variety.composedTypes>50,'Combinations must exceed a handful of hard-coded types');
 assert(variety.validSlots);
 assert(variety.empty>5&&variety.empty<50);

 const timeline=await page.evaluate(()=>{
  let samples=0,max=0,quiet=true;
  for(let i=0;i<240;i++){
   const s=runway.spec(i);
   for(const dt of [0,.1,.4,1,2,3,4,5,6,6.999]){
    const st=runway.inspect(i*7+dt);
    max=Math.max(max,st.activeEventCount);
    quiet=quiet&&st.activeEventCount<=1;
    samples++;
   }
   const st=runway.inspect(i*7+s.start+s.duration+.0001);
   quiet=quiet&&st.activeEventCount===0;
  }
  return {samples,max,quiet};
 });
 assert.equal(timeline.max,1);
 assert(timeline.quiet);
 const far=await page.evaluate(()=>runway.seek(1000000));
 assert(far.slot>140000,'Direct seeking must not iterate preceding events');

 const folder=path.join(__dirname,'captures');fs.mkdirSync(folder,{recursive:true});
 const signatures=new Set();
 const seen=new Set();
 for(let i=0;i<240;i++){
  const spec=await page.evaluate(n=>runway.spec(n),i);
  if(spec.empty||seen.has(spec.bodyName))continue;
  seen.add(spec.bodyName);
  const result=await page.evaluate(n=>runway.seekEvent(n),i);
  assert.equal(result.activeEventCount,1);
  if(result.backend==='canvas2d')
    console.log('Fallback renderer:',result.fallbackReason);
  signatures.add(result.event.topology+'/'+result.event.appendage);
  await page.screenshot({path:path.join(folder,'organism-'+spec.bodyName+'.png')});
 }
 assert.equal(seen.size,6);

 // Drawing must produce nontransparent pixels; a successful shader compile alone isn't enough.
 const glResult=await page.evaluate(()=>{
   const backend=runway.state().backend,canvas=document.getElementById('pigment');
   if(backend!=='webgl2')return {backend};
   const gl=canvas.getContext('webgl2');
   const pixels=new Uint8Array(canvas.width*canvas.height*4);
   gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let lit=0;
   for(let i=3;i<pixels.length;i+=4)if(pixels[i]>10)lit++;
   return {backend,lit,pixels:canvas.width*canvas.height,error:gl.getError()};
 });
 if(glResult.backend==='webgl2'){
   assert(glResult.lit>150,'No visible colored pigment in framebuffer');
   assert.equal(glResult.error,0,'WebGL errors detected');
 }

 // Same seed, index and simulation time must reproduce identical shader+walker pixels.
 const eventIndex=await page.evaluate(()=>{
   for(let i=0;i<30;i++)if(!runway.spec(i).empty)return i;
   return -1;
 });
 assert(eventIndex>=0);
 const seekTime=eventIndex*7+2.44;
 await page.evaluate(t=>runway.seek(t),seekTime);
 const image1=await page.screenshot();
 await page.evaluate(()=>runway.seek(182));
 await page.evaluate(t=>runway.seek(t),seekTime);
 const image2=await page.screenshot();
 assert(image1.equals(image2),'Rendering must not depend on event history');
 const st=await page.evaluate(()=>runway.state());
 assert.equal(st.activeEventCount,1);
 assert(st.walker.x>=0&&st.walker.y>=0);
 assert(st.walker.x+st.walker.width<=390+.01);

 for(const dims of [{width:320,height:568},{width:844,height:390},
                    {width:1440,height:900}]){
  await page.setViewportSize(dims);
  await page.waitForFunction(d=>runway.state().viewport.width===d.width&&
     runway.state().viewport.height===d.height,dims);
  const current=await page.evaluate(t=>runway.seek(t),seekTime);
  assert(current.walker.x>=0&&current.walker.y>=0);
  assert(current.walker.x+current.walker.width<=dims.width+.01);
  assert(current.walker.y+current.walker.height<=dims.height+.01);
  await page.screenshot({path:path.join(folder,'viewport-'+dims.width+'x'+dims.height+'.png')});
 }

 const change=await page.evaluate(()=>{
  const old=runway.state().seed;
  const state=runway.setSeed(old+991);
  return {old,current:state.seed,reset:state.time===0};
 });
 assert.notEqual(change.old,change.current);
 assert(change.reset);
 assert.deepEqual(requests,[]);
 assert.deepEqual(errors,[]);
 const result={browser:'Chromium',offline:true,noRuntimeErrors:true,noNetworkRequests:true,
  activeEventsMax:timeline.max,timelineSamples:timeline.samples,
  combinatorialTypes:variety.composedTypes,genomes:variety.genomeCount,
  families:variety.topologyCount,appendages:variety.appendageCount,
  actions:variety.behaviorCount,palettes:variety.paletteCount,
  emptySlots:variety.empty,webgl:glResult,physicalPhoneMeasured:false};
 fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result));
 await browser.close();
})().catch(err=>{console.error(err);process.exitCode=1;});
