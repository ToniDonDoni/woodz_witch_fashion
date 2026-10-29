// The Little Usher: the selected wooden marionette, local to the nursery.
// The room supplies encounter age; the study page and its clock are not included.
const littleUsherDoll=(()=>{
 const TAU=Math.PI*2;
 const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
 const rgba=(rgb,a)=>`rgba(${rgb},${Math.max(0,Math.min(1,a))})`;
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 const pulse=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
 function pose(t){
  const w=TAU*t/8,phase=t%8,raise=pulse(phase,.8,2.9,4.6,6.9),sway=Math.sin(w)*5,tilt=.06+Math.sin(w)*.075;
  const shoulders=[[204+sway,292],[275+sway,293]],elbows=[[174+sway,335-raise*25],[304+sway,331-raise*8]],hands=[[161+sway,387-raise*58],[319+sway,377-raise*11]];
  const headPin=[240+sway-2*Math.cos(tilt)+91*Math.sin(tilt),257-2*Math.sin(tilt)-91*Math.cos(tilt)];
  const strings=[[[192,67],hands[0]],[[288,69],hands[1]],[[234,68],headPin],[[213,68],[217+sway,408]],[[264,69],[266+sway,408]]];
  return {w,phase,raise,sway,tilt,shoulders,elbows,hands,strings};
 }
function path(c,s,fill,stroke,width=1){const p=new Path2D(s);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
function gradient(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [p,v]of stops)g.addColorStop(p,v);return g}
function ellipse(c,x,y,rx,ry,fill,angle=0){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill()}
function line(c,points,color,width=1){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function glow(c,x,y,r,rgb,a,stretch=1){c.save();c.translate(x,y);c.scale(1,stretch);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,rgba(rgb,a));g.addColorStop(.4,rgba(rgb,a*.4));g.addColorStop(1,rgba(rgb,0));c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore()}
function texture(c,s,color,alpha=.1,kind='weave'){
 c.save();c.clip(new Path2D(s));c.strokeStyle=rgba(color,alpha);c.lineWidth=.5;
 if(kind==='weave'){for(let x=120;x<370;x+=3.5)line(c,[[x,80],[x+3,575]],rgba(color,alpha),.4);for(let y=90;y<580;y+=4)line(c,[[100,y],[380,y+1]],rgba(color,alpha*.7),.4)}
 else{for(let j=0;j<85;j++){const y=100+hash(j+3)*450,x=150+hash(j+54)*170;path(c,`M ${x} ${y} Q ${x+5} ${y+14} ${x+1} ${y+34}`,null,rgba(color,alpha),.6)}}
 c.restore();
}
function shoe(c,x,y,s=1,color='#29272a'){
 c.save();c.translate(x,y);c.scale(s,s);path(c,'M -16 -13 Q -4 -21 9 -12 L 14 2 Q 27 6 25 14 Q 19 23 -13 20 Q -22 17 -19 8 Z',gradient(c,-15,-15,20,20,[[0,color],[.5,'#3a3637'],[1,'#181b1b']]),'#9e958457',.8);path(c,'M -15 9 Q 0 4 14 7',null,'#aca08b72',1.7);ellipse(c,9,7,1.7,1.7,'#a19371');c.restore();
}
function woodLimb(c,a,b,width){
 const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);c.save();c.translate(...a);c.rotate(ang);
 path(c,`M 0 ${-width*.5} Q ${len*.45} ${-width*.65} ${len} ${-width*.38} L ${len} ${width*.38} Q ${len*.5} ${width*.6} 0 ${width*.5} Z`,gradient(c,0,-width/2,0,width/2,[[0,'#ae9470'],[.3,'#8c7354'],[.75,'#67573f'],[1,'#413d31']]),'#c2a67938',.7);
 for(let i=0;i<3;i++)path(c,`M 4 ${-width*.2+i*width*.2} Q ${len*.6} ${-width*.25+i*width*.2} ${len-5} ${-width*.2+i*width*.2}`,null,'#493f313f',.5);c.restore();
}
function marionette(c,t){
 const {w,phase,raise,sway,tilt,shoulders,elbows,hands,strings}=pose(t);
 // Fine taut strings are drawn first, then connected exactly at the moving joints.
 line(c,[[170,66],[310,70]],'#a79d7b',6);line(c,[[240,43],[240,88]],'#a79d7b',4);
 for(const [top,target]of strings)line(c,[top,target],'#c7c2a64d',.7);
 // Long separate wooden shins with jointed knees.
 for(const side of [-1,1]){
  const hip=[240+sway+side*23,398],knee=[240+sway+side*(29+Math.sin(w+side)*3),457],ankle=[240+sway+side*(34+Math.sin(w+side)*6),516];
  woodLimb(c,hip,knee,23);ellipse(c,...knee,8,8,'#4f4b3b');ellipse(c,...knee,3,3,'#b4a17a');woodLimb(c,knee,ankle,17);
  for(let j=0;j<5;j++){const yy=470+j*8,xx=knee[0]+(ankle[0]-knee[0])*(yy-knee[1])/(ankle[1]-knee[1]);line(c,[[xx-7,yy],[xx+7,yy]],'#292e2d',3)}
  shoe(c,ankle[0],ankle[1]+8,.8,'#2b302e');
 }
 for(let i=0;i<2;i++){
  woodLimb(c,shoulders[i],elbows[i],19);ellipse(c,...elbows[i],6,6,'#333a33');ellipse(c,...elbows[i],2.4,2.4,'#ab966f');woodLimb(c,elbows[i],hands[i],13);
  const [x,y]=hands[i];ellipse(c,x,y+7,7,12,'#8c7857',i?-.1:.2);for(let j=0;j<3;j++)line(c,[[x-3+j*3,y+8],[x-4+j*3,y+17]],'#4e4b37',.6);
 }
 const coat=`M ${207+sway} 279 Q ${241+sway} 265 ${274+sway} 281 L ${283+sway} 346 L ${287+sway} 410 L ${255+sway} 419 L ${241+sway} 399 L ${226+sway} 419 L ${194+sway} 411 L ${199+sway} 346 Z`;
 path(c,coat,gradient(c,195,280,284,420,[[0,'#414746'],[.4,'#242d2d'],[.8,'#343c3b'],[1,'#182322']]));texture(c,coat,'153,161,145',.055);
 path(c,`M ${213+sway} 280 L ${239+sway} 333 L ${230+sway} 303 L ${229+sway} 277 Z M ${267+sway} 280 L ${242+sway} 333 L ${252+sway} 302 L ${251+sway} 277 Z`,'#626b5c');
 path(c,`M ${228+sway} 276 L ${240+sway} 309 L ${253+sway} 276 Z`,'#b3ab8b');path(c,`M ${239+sway} 283 L ${233+sway} 320 L ${240+sway} 332 L ${246+sway} 319 Z`,'#726651');
 for(let j=0;j<4;j++)ellipse(c,241+sway,336+j*17,2.1,2.1,'#a18e62');
 path(c,`M ${229+sway} 249 L ${227+sway} 279 Q ${240+sway} 287 ${253+sway} 278 L ${252+sway} 249 Z`,'#887452');
 c.save();c.translate(240+sway,257);c.rotate(tilt);c.translate(-240,-257);
 const hair='M 188 192 Q 179 146 212 131 Q 241 118 270 137 Q 299 155 289 196 L 280 235 L 198 232 Z';
 path(c,hair,'#34332c');for(let j=0;j<17;j++){const x=190+j*6;path(c,`M ${x} 158 Q ${x+10} 175 ${x+6} 216`,null,j%2?'#665d42':'#161f1d',1.1)}
 const face='M 240 146 C 214 145 199 164 200 196 L 206 231 Q 219 251 241 259 Q 262 248 275 229 L 281 193 Q 281 159 258 149 Z';
 path(c,face,gradient(c,200,170,279,240,[[0,'#918064'],[.3,'#c7b48b'],[.62,'#d1be91'],[1,'#817658']]));texture(c,face,'90,79,53',.11,'wood');
 // Carved eye sockets, inset amber eyes and angular brows.
 for(const side of [-1,1]){const x=240+side*21,y=196;path(c,`M ${x-12} ${y-1} Q ${x} ${y-12} ${x+12} ${y} Q ${x} ${y+11} ${x-12} ${y-1} Z`,'#414b40');ellipse(c,x+Math.sin(w)*1.5,y,5.3,6.2,'#8a8561');ellipse(c,x+Math.sin(w)*1.5,y,2.5,4.4,'#1a2923');ellipse(c,x-1,y-2,1,1.3,'#dcd3a6');path(c,`M ${x-12} ${y-12} L ${x+10} ${y-15}`,null,'#605c42',1.5)}
 path(c,'M 238 201 L 233 220 L 246 220 Z','#a39269','#6e715247',.65);path(c,'M 223 237 Q 240 232 257 237',null,'#655f44',1.1);
 // Jaw is a separate hinged piece, with brass pins and a restrained opening.
 const jawDrop=pulse(phase,4.6,5.1,5.8,6.9)*2;
 path(c,`M 217 ${240+jawDrop} L 223 ${252+jawDrop} Q 240 ${268+jawDrop} 257 ${251+jawDrop} L 264 ${238+jawDrop}`,null,'#514f3c',1);
 for(const x of [211,268]){ellipse(c,x,231,3.4,3.4,'#6c6249');ellipse(c,x-.6,230,1.1,1.1,'#b6a172')}
 path(c,'M 257 150 L 250 170 L 257 185 L 248 208 L 253 222',null,'#6f73525c',.7);
 c.restore();
}

 function draw(c,x,feetY,size,age){
  if(size<=0)return;
  // Pause before the false alarm, perform one gesture, then settle in recovery.
  const t=Math.min(8,Math.max(0,age+1.1)*1.6);
  c.save();c.translate(x,feetY);c.scale(size,size);c.translate(-240,-540);
  marionette(c,t);c.restore();
 }
 return {draw,pose};
})();
