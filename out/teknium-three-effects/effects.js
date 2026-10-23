/* Three original procedural studies inspired by noise, liquid and smoke UI techniques.
   No dependency on, or copied implementation from, the Teknium website. */
(()=>{
'use strict';
const canvas=document.querySelector('#fx'),ctx=canvas.getContext('2d');
const walker=document.querySelector('#walker'),wctx=walker.getContext('2d');
const atlas=new Image();atlas.src='data:image/webp;base64,__ATLAS__';
const status=document.querySelector('#status');
const btns=[...document.querySelectorAll('[data-mode]')];
let W=0,H=0,D=1,seed=3213,clock=0,playing=true,last=0,mode='cycle',ready=false;
const TAU=Math.PI*2;
const hash=n=>{let x=n|0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;};
const random=(i,k=0)=>hash(seed+i*16411+k*1777);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
function resize(){
 W=innerWidth;H=innerHeight;D=Math.min(devicePixelRatio||1,1.5);
 for(const c of [canvas,walker]){c.width=Math.round(W*D);c.height=Math.round(H*D);}
 ctx.setTransform(D,0,0,D,0,0);wctx.setTransform(D,0,0,D,0,0);draw();
}
function glow(draw,color,width=1,blur=10,alpha=1){
 ctx.save();ctx.beginPath();draw();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=alpha;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=blur;ctx.shadowColor=color;ctx.stroke();ctx.restore();
}
function disk(x,y,r,color,alpha=1,blur=8){
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.shadowBlur=blur;ctx.shadowColor=color;
 ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,TAU);ctx.fill();ctx.restore();
}
function gradient(x,y,x2,y2,colors){
 const g=ctx.createLinearGradient(x,y,x2,y2);colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c));return g;
}
function noise(x,y,z=0){
 const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=ease(x-xi),fy=ease(y-yi),fz=ease(z-zi);
 const h=(a,b,c)=>hash(Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(c,2147483647)^seed);
 let a=0;
 for(let k=0;k<2;k++)for(let j=0;j<2;j++)for(let i=0;i<2;i++)
  a+=h(xi+i,yi+j,zi+k)*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);
 return a;
}
function fbm(x,y,z){
 let a=0,amp=.5;
 for(let i=0;i<4;i++){a+=amp*noise(x,y,z);x*=2.03;y*=2.03;z*=1.93;amp*=.5;}
 return a;
}
function palette(i){return [
 ['#ff8dd9','#9af5f4','#ffe1a0'],['#9abfff','#f8a5ff','#caffb5'],
 ['#fbd28c','#b6f9d8','#d2a1ff'],['#ff9eab','#9ae7ff','#e9ffb6']
 ][Math.floor(random(i,31)*4)];}
function creatureGeometry(i){
 const kind=Math.floor(random(i,1)*4),lobes=4+Math.floor(random(i,2)*7);
 return {kind,lobes,arms:5+Math.floor(random(i,3)*10),scale:.65+random(i,4)*.6,
  hue:palette(i),phase:random(i,5)*TAU,side:random(i,6)<.5?-1:1};
}
function pose(slot,local){
 const spec=creatureGeometry(slot),life=ease(local/.85)*(1-ease((local-4.6)/1.0));
 const side=spec.side;
 const x=W*(side<0?.24:.76)+side*W*.15*(1-ease(local/.85));
 const y=H*(.36+random(slot,7)*.3)+Math.sin(local*1.9+spec.phase)*9;
 return {...spec,x,y,life,scale:Math.min(W*.2,H*.29,190)*spec.scale};
}
// 1. DOMAIN-WARPED LIQUID: radial bands are warped by multi-octave noise.
// No image/video: every line is regenerated from time + slot genome.
function liquid(s,t){
 const [a,b,c]=s.hue;
 ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.scale/100,s.scale/100);
 for(let ring=0;ring<21;ring++){
  const color=[a,b,c][ring%3],radius=20+ring*3.15;
  const points=[];
  for(let j=0;j<=144;j++){
   const theta=j/144*TAU;
   const qx=Math.cos(theta),qy=Math.sin(theta);
   const warp=fbm(qx*2.4+ring*.08+t*.23,qy*2.4-t*.16,s.phase)-.45;
   const fold=fbm(qx*5+ring*.17-t*.3,qy*5+t*.24,s.phase+3)-.45;
   const r=radius+warp*25+fold*11+Math.sin(theta*s.lobes+t*1.5+ring*.22)*5;
   points.push([qx*r,qy*r*.74]);
  }
  glow(()=>{ctx.moveTo(...points[0]);for(let j=1;j<points.length;j++)ctx.lineTo(...points[j]);},
    color,ring%5===0?2.2:1.1,ring%4===0?17:5,s.life*(.25+.55*(1-ring/24)));
 }
 for(let i=0;i<32;i++){
  const a0=random(i,slotNumber)*TAU,r=(15+random(i,2)*85);
  const x=Math.cos(a0+t*.12)*r,y=Math.sin(a0+t*.12)*r*.7;
  disk(x,y,.5+random(i,8)*1.4,s.hue[i%3],s.life*.4,7);
 }
 ctx.restore();
}
// 2. PIXEL DISSOLVE: a creature is revealed as discrete quantized cells,
// which coalesce into a luminous mask then disintegrate into the black.
function pixels(s,t){
 const [a,b,c]=s.hue;
 ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.scale/100,s.scale/100);
 const n=32,cell=6.6,st=ease(t/.95),out=ease((t-4.1)/1.3);
 for(let iy=-n/2;iy<n/2;iy++)for(let ix=-n/2;ix<n/2;ix++){
  const x=ix*cell,y=iy*cell;
  const ang=Math.atan2(y,x),r=Math.hypot(x,y);
  const shape=s.kind===0?75+Math.sin(ang*s.lobes+s.phase)*12:
    s.kind===1?75*(1-.27*Math.abs(Math.sin(ang*2))):
    s.kind===2?66+18*Math.cos(ang*4):80+11*Math.sin(ang*7);
  if(r>shape||random(ix*99+iy,slotNumber)<.09)continue;
  const threshold=(random(ix*201+iy*9,slotNumber)*.9);
  if(st<threshold||out>1-threshold)continue;
  const drift=(1-st)*65+out*120;
  const px=x+Math.cos(ang)*drift,py=y+Math.sin(ang)*drift;
  const col=[a,b,c][Math.floor(random(ix+iy*71,9)*3)];
  ctx.globalAlpha=s.life*(.28+.7*(1-r/110));
  ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=(ix+iy)%6===0?9:0;
  const size=3+random(ix*17+iy,6)*3;
  ctx.fillRect(px-size*.5,py-size*.5,size,size);
 }
 ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
}
// 3. VOLUMETRIC SMOKE / GLASS: thousands of soft additive puffs advect
// around a translucent glassy silhouette, no static SVG preset.
function smoke(s,t){
 const [a,b,c]=s.hue;
 ctx.save();ctx.translate(s.x,s.y);ctx.scale(s.scale/100,s.scale/100);
 ctx.globalCompositeOperation='lighter';
 for(let i=0;i<340;i++){
  const age=(t*.24+random(i,17))%1;
  const angle=random(i,18)*TAU;
  const base=20+random(i,19)*55;
  const flow=fbm(Math.cos(angle)*2+age*2,Math.sin(angle)*2-t*.15,s.phase)-.45;
  const r=base+age*68+flow*35;
  const x=Math.cos(angle+age*.7)*r+Math.sin(t*.4+i)*3;
  const y=Math.sin(angle+age*.7)*r*.7-age*48;
  const radius=2+random(i,20)*8+age*5;
  const color=[a,b,c][i%3];
  disk(x,y,radius,color,s.life*(1-age)*.035,13);
 }
 ctx.globalCompositeOperation='source-over';
 for(let k=0;k<5;k++){
  const pts=[];
  for(let j=0;j<=120;j++){
   const ang=j/120*TAU,r=54+k*7+Math.sin(ang*s.lobes+t*.5+k)*8;
   pts.push([Math.cos(ang)*r,Math.sin(ang)*r*.78]);
  }
  glow(()=>{ctx.moveTo(...pts[0]);for(let j=1;j<pts.length;j++)ctx.lineTo(...pts[j]);},
    [a,b,c][k%3],k===0?2:1,12,s.life*(.6-k*.1));
 }
 ctx.restore();
}
let slotNumber=0;
function draw(){
 ctx.clearRect(0,0,W,H);wctx.clearRect(0,0,W,H);
 ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
 if(!ready)return;
 const cycle=Math.floor(clock/7),local=clock-cycle*7;
 slotNumber=cycle;
 const kind=mode==='cycle'?['liquid','pixels','smoke'][cycle%3]:mode;
 const s=pose(cycle,local);
 if(local<5.6&&s.life>.001){
  if(kind==='liquid')liquid(s,local);
  else if(kind==='pixels')pixels(s,local);
  else smoke(s,local);
 }
 const frame=Math.floor(clock*24)%33;
 const hh=Math.min(H*.68,W*1.42),ww=hh*420/790;
 wctx.drawImage(atlas,(frame%6)*420,Math.floor(frame/6)*790,420,790,(W-ww)/2,H*.86-hh,ww,hh);
 status.textContent=kind.toUpperCase()+' / '+(cycle+1)+' · '+(s.kind+1)+' · '+(Math.floor(s.scale));
}
function tick(now){
 if(playing&&last)clock+=Math.min(.05,(now-last)/1000);
 last=now;draw();requestAnimationFrame(tick);
}
document.querySelector('#pause').onclick=ev=>{
 playing=!playing;last=0;ev.currentTarget.textContent=playing?'Ⅱ PAUSE':'▶ PLAY';
};
document.querySelector('#new').onclick=()=>{seed=(seed+7919)|0;clock=0;draw();};
document.querySelector('#next').onclick=()=>{clock=(Math.floor(clock/7)+1)*7+.95;draw();};
btns.forEach(b=>b.onclick=()=>{
 mode=b.dataset.mode;btns.forEach(q=>q.setAttribute('aria-pressed',String(q===b)));
 clock=0;draw();
});
window.runwayFX={seek(t){clock=Math.max(0,+t||0);playing=false;draw();},
 setSeed(n){seed=n|0;clock=0;draw();},state(){return {seed,clock,mode,ready,slot:slotNumber}}};
atlas.onload=()=>{ready=true;draw();};
atlas.onerror=()=>{status.textContent='WALK ATLAS FAILED';};
addEventListener('resize',resize);resize();requestAnimationFrame(tick);
})();
