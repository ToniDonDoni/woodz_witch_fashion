'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('playwright');
const main=path.resolve('site/index.html');
const couture=path.resolve('out/forest-couture-perf/couture.html');
const cached=path.resolve('out/forest-couture-perf/cached.html');
const source=fs.readFileSync(couture,'utf8');
const mark='forestBuyers.draw(c,w,h,time,seed);';
assert.equal(source.split(mark).length,2);
fs.writeFileSync(couture,source.replace(mark,
 'const buyerStart=performance.now();forestBuyers.draw(c,w,h,time,seed);'+
 '(window.buyerTime||(window.buyerTime=[])).push(performance.now()-buyerStart);'));
const cacheCode=[
 'if(!window.buyerCache||window.buyerCache.seed!==seed||',
 'window.buyerCache.width!==a.width||window.buyerCache.height!==a.height){',
 'const buffer=document.createElement("canvas");',
 'buffer.width=a.width;buffer.height=a.height;',
 'const bc=buffer.getContext("2d");bc.setTransform(ratio,0,0,ratio,0,0);',
 'forestBuyers.draw(bc,w,h,0,seed);',
 'window.buyerCache={canvas:buffer,width:a.width,height:a.height,seed};}',
 'const buyerStart=performance.now();',
 'c.clearRect(0,0,w,h);c.drawImage(window.buyerCache.canvas,0,0,w,h);',
 '(window.buyerTime||(window.buyerTime=[])).push(performance.now()-buyerStart);'
].join('');
fs.writeFileSync(cached,source.replace(mark,cacheCode));
const stats=arr=>{const a=[...arr].sort((x,y)=>x-y);return {
 median:+a[Math.floor(a.length*.5)].toFixed(2),
 p95:+a[Math.floor(a.length*.95)].toFixed(2),
 mean:+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)};};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const results=[];
 for(const dims of [{width:390,height:844,dpr:2},{width:1440,height:900,dpr:1}]){
  for(const item of [{name:'main',file:main},{name:'couture',file:couture},
                     {name:'couture-with-cache',file:cached}]){
   const ctx=await browser.newContext({viewport:{width:dims.width,height:dims.height},
                                      deviceScaleFactor:dims.dpr,offline:true});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.canvasOps={strokes:0,fills:0,images:0,gradients:0};
    const proto=CanvasRenderingContext2D.prototype;
    for(const [method,key] of [['stroke','strokes'],['fill','fills'],
       ['drawImage','images'],['createLinearGradient','gradients'],
       ['createRadialGradient','gradients']]){
      const original=proto[method];
      proto[method]=function(...args){window.canvasOps[key]++;
                               return original.apply(this,args);};
    }
   });
   await page.goto('file://'+item.file);
   await page.waitForFunction(()=>window.runway && window.runway.ready,
                              null,{timeout:45000});
   const cdp=await ctx.newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   const record=await page.evaluate(()=>{
    for(let i=0;i<8;i++)runway.seek(2+i*.04);
    window.buyerTime=[];
    const before={...window.canvasOps},times=[];
    for(let i=0;i<60;i++){
      const t=performance.now();runway.seek(3+i/60);
      times.push(performance.now()-t);
    }
    const ops={};
    for(const k of Object.keys(before))ops[k]=window.canvasOps[k]-before[k];
    return {times,buyers:window.buyerTime,ops,
      canvases:[...document.querySelectorAll('canvas')].map(x=>[x.width,x.height])};
   });
   assert.deepEqual(errors,[],item.name+' browser errors');
   const row={variant:item.name,viewport:dims,totalJsMs:stats(record.times),
              buyerJsMs:record.buyers.length?stats(record.buyers):null,
              opsIn60Frames:record.ops,canvases:record.canvases};
   console.log(JSON.stringify(row));results.push(row);
   await ctx.close();
  }
 }
 await browser.close();
 fs.writeFileSync('out/forest-couture-perf/results.json',JSON.stringify({
  environment:'Offline Chromium, emulated 4x CPU slowdown. Browser JS dispatch time; GPU present not included.',
  results},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
