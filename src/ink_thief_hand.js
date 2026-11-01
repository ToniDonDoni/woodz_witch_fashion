// The Ink Thief: the selected living-ink hand, painted directly into the house.
// Geometry is a pure function of time; no assets, timers or growing particle lists.
const inkThiefHand=(()=>{
 const TAU=Math.PI*2;
 const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
 const rgba=(rgb,a)=>`rgba(${rgb},${Math.max(0,Math.min(1,a))})`;
function path(c,s,fill,stroke,width=1){const p=new Path2D(s);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
function gradient(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [p,v]of stops)g.addColorStop(p,v);return g}
function ellipse(c,x,y,rx,ry,fill,angle=0){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill()}
function line(c,points,color,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x??p[0],p.y??p[1]):c.moveTo(p.x??p[0],p.y??p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function finger(base,angle,lengths,flex,idx){
 const points=[{x:base[0],y:base[1],r:idx===4?12:10-idx*.7}];
 let a=angle;
 for(let k=0;k<3;k++){
  if(k)a-=flex*(k===1?.84:1.15);
  const prev=points[points.length-1];points.push({x:prev.x+Math.cos(a)*lengths[k],y:prev.y+Math.sin(a)*lengths[k],r:(idx===4?10:8.5-idx*.55)-k*(idx===4?2.5:2.1)});
 }
 return points;
}
function ribbon(points){
 const samples=[];
 // Catmull-Rom interpolation gives soft joint transitions without rubber-hose width.
 for(let seg=0;seg<points.length-1;seg++)for(let i=0;i<10;i++){
  const u=i/10,u2=u*u,u3=u2*u,p0=points[Math.max(0,seg-1)],p1=points[seg],p2=points[seg+1],p3=points[Math.min(points.length-1,seg+2)];
  const cr=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*u+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*u2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*u3);
  samples.push({x:cr('x'),y:cr('y'),r:p1.r*(1-u)+p2.r*u});
 }
 samples.push(points.at(-1));
 const left=[],right=[];
 for(let i=0;i<samples.length;i++){
  const a=samples[Math.max(0,i-1)],b=samples[Math.min(samples.length-1,i+1)],p=samples[i],angle=Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2;
  const dx=Math.cos(angle)*p.r,dy=Math.sin(angle)*p.r;left.push({x:p.x+dx,y:p.y+dy});right.push({x:p.x-dx,y:p.y-dy});
 }
 const p=new Path2D();p.moveTo(left[0].x,left[0].y);for(const q of left)p.lineTo(q.x,q.y);
 const tip=points.at(-1);p.quadraticCurveTo(tip.x+(tip.x-points.at(-2).x)*.19,tip.y+(tip.y-points.at(-2).y)*.19,right.at(-1).x,right.at(-1).y);
 for(let i=right.length-1;i>=0;i--)p.lineTo(right[i].x,right[i].y);p.closePath();return {p,left,right,samples};
}
const arm='M 498 421 C 428 408 376 362 321 333 C 292 317 278 293 253 282 C 234 272 214 278 207 292 C 202 311 208 338 224 355 C 241 374 272 376 292 390 C 358 434 412 477 498 481 Z';
function pose(t){

 const fingers=[],bases=[[229,289],[216,307],[220,327],[235,344],[269,346]],angles=[-2.35,-2.74,-3.02,-3.16,2.63],lengths=[[39,26,17],[43,31,20],[38,27,18],[29,22,15],[29,23,15]];
 for(let i=0;i<5;i++){
  const flex=.18+.23*(.5+.5*Math.sin(t*1.3-i*.8))+(.5+.5*Math.sin(t*.72-i*.4))*.35;
  const ps=finger(bases[i],angles[i]+Math.sin(t*.8+i)*.025,lengths[i],i===4?flex*.7:flex,i);fingers.push({points:ps,mesh:ribbon(ps)});
 }
 return fingers;
}

 function draw(c,x,y,reach,alpha,t,id){
  if(reach<=0||alpha<=0)return;
  // The arm starts at (480,450) in the study. Aim it left, below the tabletop.
  const scale=.4*reach,fingers=pose(t+(id%13)*.17),rgb='164,142,181';
  c.save();c.globalAlpha*=Math.max(0,Math.min(1,alpha));
  c.translate(x,y);c.rotate(-.25);c.scale(scale,scale);c.translate(-480,-450);
  c.translate(0,Math.sin(t*.65)*3);c.translate(365,387);c.rotate(Math.sin(t*.7)*.025);c.translate(-365,-387);
  const silhouette=new Path2D(arm);for(const f of fingers)silhouette.addPath(f.mesh.p);
  const fill=gradient(c,160,260,390,460,[[0,'#15121e'],[.4,'#1e1929'],[.7,'#282332'],[1,'#12141b']]);
  c.save();c.filter='blur(3px)';c.fillStyle=rgba(rgb,.13);c.fill(silhouette);c.restore();
  c.fillStyle=fill;c.fill(silhouette);
  c.save();c.clip(silhouette);
  const boil=Math.floor(t*12);
  for(let j=0;j<650;j++){
   const xx=125+hash(j*3)*380,yy=225+hash(j*3+1)*290,delta=(hash(j+boil*13)-.5)*1.2;
   line(c,[[xx,yy],[xx+10+hash(j+50)*20,yy+4+delta]],rgba(j%4?'167,151,178':'87,78,99',.04+hash(j+84)*.07),.5);
  }
  c.restore();
  for(let i=0;i<4;i++){
   const root=fingers[i].points[0];
   path(c,`M 365 400 C 319 376 283 326 ${root.x+8} ${root.y+8}`,null,rgba(rgb,.19),.7);
   path(c,`M 358 396 C 313 370 279 321 ${root.x+7} ${root.y+4}`,null,rgba(rgb,.15),.7);
  }
  for(const f of fingers){
   const pts=f.points;
   line(c,f.mesh.left,rgba(rgb,.34),.65);
   for(let k=1;k<3;k++){
    const p=pts[k],prev=pts[k-1],a=Math.atan2(p.y-prev.y,p.x-prev.x);
    c.save();c.translate(p.x,p.y);c.rotate(a);
    path(c,`M -3 ${-p.r*.65} Q 1 0 -2 ${p.r*.65}`,null,rgba(rgb,.24),.65);
    path(c,`M 1 ${-p.r*.52} Q 4 0 1 ${p.r*.52}`,null,rgba(rgb,.21),.55);c.restore();
   }
   const p=pts[3],prev=pts[2],a=Math.atan2(p.y-prev.y,p.x-prev.x);
   c.save();c.translate(p.x,p.y);c.rotate(a);
   path(c,`M -10 ${-p.r*.7} Q -1 ${-p.r*1.3} 4 1 Q -1 ${p.r*.6} -10 ${p.r*.7} Z`,'#5545619c');c.restore();
  }
  path(c,'M 265 332 C 258 348 266 362 282 367 M 311 348 Q 311 367 301 381 M 318 353 Q 319 371 309 385',null,rgba(rgb,.20),.8);
  for(let j=0;j<64;j++){
   const f=fingers[j%5],p=f.mesh.left[Math.floor(hash(j+4)*(f.mesh.left.length-1))],s=2+hash(j+55)*7;
   const dx=Math.sin(t*.8+j)*4;
   path(c,`M ${p.x} ${p.y} Q ${p.x+dx-s} ${p.y-s} ${p.x-s*1.6+dx} ${p.y-s*1.7}`,null,rgba(rgb,.10+hash(j+33)*.13),.35+hash(j+88)*.4);
  }
  for(let j=0;j<30;j++){
   const ph=(hash(j+239)+t*.06)%1,xx=150+hash(j+93)*300-ph*30,yy=280+hash(j+74)*170+Math.sin(j+t)*4;
   ellipse(c,xx,yy,.35,.6,rgba(rgb,Math.sin(ph*Math.PI)*.28));
  }
  c.restore();
 }
 return {draw,pose};
})();
