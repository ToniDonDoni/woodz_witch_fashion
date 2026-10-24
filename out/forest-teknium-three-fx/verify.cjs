'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const htmlPath=path.resolve(__dirname,'../../site/forest-teknium-three-fx/index.html');
 const html=fs.readFileSync(htmlPath,'utf8');
 const head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert(html.includes(head)&&head.length===40,'Must stamp real current Git branch commit');
 assert(!html.includes('UNSTAMPED_REBUILD_FROM_HEAD'));
 assert(html.includes('The forest is watching.')&&html.includes('drawSpectators()'));
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-web-security']});
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:mobile?{width:393,height:851}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,offline:true});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+htmlPath);
  await page.waitForFunction(()=>window.runway&&window.runway.ready,null,{timeout:60000});
  for(const kind of [0,1,2]){
   const state=await page.evaluate(kind=>{
    const first=runway.state().time,state=runway.seekEffect(kind);
    const bg=document.querySelector('#scene'),wc=document.querySelector('#walker');
    const gl=document.querySelector('#fx').getContext('webgl2');
    const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
    gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);
    let activeFx=0;for(let i=3;i<p.length;i+=4)if(p[i]>30)activeFx++;
    const walker=wc.getContext('2d').getImageData(0,0,wc.width,wc.height).data;
    let activeWalker=0;for(let i=3;i<walker.length;i+=4)if(walker[i]>30)activeWalker++;
    return {sourceCommit:runway.sourceCommit,badge:document.getElementById('revision').textContent,
      backend:state.fx.backend,type:state.fx.type,active:state.fx.active,activeFx,activeWalker,
      spectators:state.spectators?.length,forest:state.forest?.length,
      bgPx:bg.width,fxWidth:document.querySelector('#fx').width,
      first,after:state.time};
   },kind);
   assert.equal(state.sourceCommit,head);
   assert(state.badge.includes(head.slice(0,12)));
   assert.equal(state.backend,'webgl2');
   assert.equal(state.type,kind);
   assert.equal(state.active,true);
   assert(state.spectators>0&&state.forest>0,'Forest must remain populated');
   assert(state.activeWalker>100,'Walking woman must remain visible');
   assert(state.activeFx>100,'All three shaders must render real pixels');
   assert.equal(state.first,state.after,'Selecting a shader must not skip forest time');
  }
  assert.deepEqual(errors,[]);
  await ctx.close();
 }
 await browser.close();
 console.log('PASS: intact forest, 3 real WebGL2 overlays, walking figure, exact HEAD badge, desktop and mobile');
})().catch(e=>{console.error(e);process.exitCode=1});
