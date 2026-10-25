'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const assemble=function assemble(html,directorCode,rendererCode,commitSha){
 function sub(a,b,why){const n=html.split(a).length-1;if(n!==1)throw Error(`Need one ${why}; found ${n}`);html=html.replace(a,b);}
 sub('<title>Woodz — The Forest Is Watching</title>','<title>Woodz — The Forest Is Watching · Three FX</title>','title');
 sub('</style>',`
#scene{position:fixed;inset:0;z-index:0}
.fx-layer{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
#fx,#fallback{z-index:1}#fallback{display:none}
#walker{z-index:2}
.masthead,.caption,.hint,#loading{z-index:4}
.controls{z-index:6;justify-content:center;flex-wrap:wrap;gap:7px;bottom:max(12px,env(safe-area-inset-bottom))}
.fx-buttons{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px}
.fx-buttons button{min-height:40px;font-size:9px;padding:0 10px}
.fx-buttons button[aria-pressed=true]{border-color:#80ebed;background:#17272b;color:#f0ffff}
.fx-status{position:fixed;top:153px;left:28px;z-index:5;pointer-events:none;font-size:9px;
 text-transform:uppercase;letter-spacing:.15em;color:#b9f0ef;text-shadow:0 2px 10px #000}
#revision{position:fixed;left:20px;bottom:max(94px,calc(env(safe-area-inset-bottom) + 90px));
 z-index:9;color:#beb1c8;text-decoration:none;padding:4px 6px;border-radius:3px;
 background:#05050ab8;font:10px/1.2 monospace}
#revision:hover{color:#f1ebf7}
@media(max-width:590px){
 .masthead{left:14px;right:14px}.brand{font-size:16px}
 .caption{left:14px;top:74px}.caption h1{font-size:22px}.caption p{font-size:8px}
 .fx-status{top:135px;left:14px}
 .controls{left:7px;right:7px;gap:5px}
 .fx-buttons button{padding:0 8px;min-height:36px;font-size:8px}
 #revision{left:10px;bottom:max(140px,calc(env(safe-area-inset-bottom) + 138px));font-size:9px}
}
</style>`,'new CSS');
 sub('<canvas id="scene" aria-label="A woman walking on an infinite illustrated forest runway among trees, mushrooms and woodland spirits"></canvas>',
 `<canvas id="scene" aria-label="Original Forest Audience: endless hand-drawn enchanted forest with chalk spectators"></canvas>
 <canvas id="fx" class="fx-layer" aria-hidden="true"></canvas>
 <canvas id="fallback" class="fx-layer" aria-hidden="true"></canvas>
 <canvas id="walker" class="fx-layer" aria-label="Walking woman in front of the forest and special effects"></canvas>`,
 'forest canvas');
 sub('<div class="hint">EVERY PASS, A DIFFERENT DREAM</div>',
 `<div class="hint">EVERY PASS, A DIFFERENT DREAM</div>
 <div id="fx-name" class="fx-status" aria-live="off">FX · waiting</div>
 <a id="revision" title="Git HEAD used to build this exact HTML" aria-label="Source commit SHA"></a>`,
 'labels');
 sub('<div class="controls"><button id="play" aria-label="Pause animation">Ⅱ PAUSE</button><label class="tempo">PACE <input id="pace" aria-label="Walking pace" type="range" min="0.6" max="1.6" value="1" step="0.1"></label><button id="dream">NEW DREAM ↗</button></div>',
 `<nav class="controls" aria-label="Forest playback and effect selection">
 <button id="play" aria-label="Pause animation">Ⅱ PAUSE</button>
 <label class="tempo">PACE <input id="pace" aria-label="Walking pace" type="range" min="0.6" max="1.6" value="1" step="0.1"></label>
 <div class="fx-buttons" role="group" aria-label="Creature effects">
 <button data-effect="0" aria-pressed="false">LIQUID GLASS</button>
 <button data-effect="1" aria-pressed="false">SMOKE</button>
 <button data-effect="2" aria-pressed="false">PIXEL</button>
 <button id="next-fx">NEXT FX ↗</button>
 </div>
 <button id="dream">NEW DREAM ↗</button>
 </nav>`,
 'controls');
 sub("(() => {\nconst canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false});",
 `(() => {\n${directorCode}\n${rendererCode}
 const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false});
 const walkerCanvas=document.getElementById('walker'),walkerCtx=walkerCanvas.getContext('2d',{alpha:true});
 const painter=threeFxRenderer.create(document.getElementById('fx'),document.getElementById('fallback'));
 const mobileBudget=matchMedia('(pointer: coarse) and (max-width: 850px)').matches;
 const sourceCommit='${commitSha}';
 const revision=document.getElementById('revision');
 if(/^[a-f0-9]{40}$/.test(sourceCommit)){
   revision.textContent='SHA · '+sourceCommit.slice(0,12);
   revision.href='https://github.com/ToniDonDoni/woodz_witch_fashion/commit/'+sourceCommit;
   revision.target='_blank';revision.rel='noopener noreferrer';revision.title=sourceCommit;
 } else {revision.textContent='SHA · UNSTAMPED BUILD';}
 `,'shader source');
 sub("let debug={};",`let debug={};let fxTime=0,fxSeed=12731;`,'FX clock');
 sub("function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(ready)draw();}",
 `function resize(){
  w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  walkerCanvas.width=canvas.width;walkerCanvas.height=canvas.height;
  ctx.setTransform(dpr,0,0,dpr,0,0);walkerCtx.setTransform(dpr,0,0,dpr,0,0);
  painter.resize(w,h,mobileBudget?1:dpr);
  if(ready)draw();
 }`,'resize');
 sub("const woodland=drawForestBackground();drawDust();const butterflies=drawButterflies(),path=drawPath();const forest=drawForestGround(woodland);const spectators=drawSpectators();",
 `const woodland=drawForestBackground();drawDust();const butterflies=drawButterflies(),path=drawPath();const forest=drawForestGround(woodland);const spectators=drawSpectators();
 // Overlay procedural shaders without changing the original forest composition.
 const fxState=fxDirector.at(fxSeed,fxTime);
 painter.draw(fxState,fxTime);
 document.getElementById('fx-name').textContent='FX · '+(fxState.active?fxState.spec.name.replaceAll('-',' '):'next visitor');
 document.querySelectorAll('[data-effect]').forEach(b=>
  b.setAttribute('aria-pressed',String(fxState.active&&Number(b.dataset.effect)===fxState.spec.type)));`,
 'FX compositing');
 sub("ctx.drawImage(atlas,(frame%COLS)*FW,Math.floor(frame/COLS)*FH,FW,FH,x,y,figureWidth,figureHeight);",
 `// Keep the approved walking figure above any shader creature.
 walkerCtx.clearRect(0,0,w,h);
 walkerCtx.drawImage(atlas,(frame%COLS)*FW,Math.floor(frame/COLS)*FH,FW,FH,x,y,figureWidth,figureHeight);`,
 'walker');
 sub("activeCount:butterflies.length+path.length+forest.length+spectators.length};",
 `activeCount:butterflies.length+path.length+forest.length+spectators.length,
 fx:{backend:painter.backend,type:fxState.active?fxState.spec.type:null,
 active:fxState.active,name:fxState.active?fxState.spec.name:null,fxTime,
 fallbackReason:painter.fallbackReason},sourceCommit};`,
 'diagnostics');
 sub("function tick(now){if(last!==null&&playing&&!document.hidden)time+=Math.min((now-last)/1000,.05)*pace;last=now;if(ready&&playing)draw();requestAnimationFrame(tick);}",
 `function tick(now){
  if(last!==null&&playing&&!document.hidden){
   const dt=Math.min(Math.max((now-last)/1000,0),.05);
   time+=dt*pace;fxTime+=dt;
  }
  last=now;if(ready&&playing&&!document.hidden)draw();
  requestAnimationFrame(tick);
 }`,'tick');
 sub("document.querySelector('#dream').onclick=()=>{seed=(seed+7919)|0;if(ready)draw()};",
 `function seekEffect(type){
  let slot=Math.floor(fxTime/fxDirector.SLOT_SECONDS);
  for(let n=0;n<6;n++,slot++)if(fxDirector.spec(fxSeed,slot).type===type)break;
  const selected=fxDirector.spec(fxSeed,slot);
  fxTime=slot*fxDirector.SLOT_SECONDS+selected.start+1.6;
  if(ready)draw();
  return debug;
 }
 document.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>seekEffect(Number(b.dataset.effect)));
 document.querySelector('#next-fx').onclick=()=>{
  const slot=Math.floor(fxTime/fxDirector.SLOT_SECONDS)+1;
  const next=fxDirector.spec(fxSeed,slot);
  fxTime=slot*fxDirector.SLOT_SECONDS+next.start+1.6;
  if(ready)draw();
 };
 document.querySelector('#dream').onclick=()=>{
  seed=(seed+7919)|0;fxSeed=(fxSeed+1299709)|0;fxTime=0;
  if(ready)draw();
 };`,
 'FX controls');
 sub("window.runway={seek(t){setPlaying(false);time=Math.max(0,t);if(ready)draw();return debug},play(){setPlaying(true)},state(){return debug},get ready(){return ready}};",
 `window.runway={
  seek(t){setPlaying(false);time=Math.max(0,t);fxTime=Math.max(0,t);if(ready)draw();return debug},
  seekEffect,play(){setPlaying(true)},state(){return debug},
  spec(n){return fxDirector.spec(fxSeed,n)},
  get ready(){return ready},get sourceCommit(){return sourceCommit}
 };`,'test API');
 return html;
};
const forestPath=path.join(root,'out/forest-spectators/index.html');
const forest=fs.readFileSync(forestPath,'utf8');
const gitBlob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(forest)+'\0').update(forest).digest('hex');
if(gitBlob!=='434db5a823e39df15507a87c90a73a3924c36c32')
 throw Error('Forest Audience source changed: expected approved published artifact');
const director=fs.readFileSync(path.join(root,'out/teknium-three-fx/director.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'out/teknium-three-fx/renderer.js'),'utf8');
const head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const stamp=process.env.SOURCE_COMMIT||head;
if(stamp!==head||!/^[a-f0-9]{40}$/.test(stamp))
 throw Error('Commit stamp must match the actual checkout HEAD');
const html=assemble(forest,director,renderer,stamp);
if(!html.includes(stamp))throw Error('No Git stamp');
const dest=path.join(root,'site/forest-teknium-three-fx/index.html');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,html);
console.log('Built exact published forest + three WebGL2 effects for source commit '+stamp);
