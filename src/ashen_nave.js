// The selected Ashen Nave art direction, adapted to the persistent 620-unit
// cutaway rooms. This renderer owns architecture, never encounter/audio clocks.
const ashenNave=(()=>{
 const TAU=Math.PI*2;
 const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
 function path(c,s,fill,stroke,width=1){const p=new Path2D(s);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
 function poly(c,pts,fill,stroke,width=1){const p=new Path2D();pts.forEach((v,i)=>i?p.lineTo(...v):p.moveTo(...v));p.closePath();if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
 function line(c,pts,col,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=col;c.lineWidth=width;c.stroke()}
 function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill()}
 function gradient(c,x,y,xx,yy,stops){const g=c.createLinearGradient(x,y,xx,yy);stops.forEach(s=>g.addColorStop(...s));return g}
 function glow(c,x,y,r,rgb,alpha,stretch=1){c.save();c.translate(x,y);c.scale(1,stretch);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(.4,`rgba(${rgb},${alpha*.35})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore()}
 function lancet(c,x,y,w,h,fill,stroke,width=1){return path(c,`M ${x} ${y+h} L ${x} ${y+h*.28} Q ${x+w*.08} ${y+h*.12} ${x+w*.5} ${y} Q ${x+w*.92} ${y+h*.12} ${x+w} ${y+h*.28} L ${x+w} ${y+h} Z`,fill,stroke,width)}
 const grain=document.createElement('canvas');grain.width=128;grain.height=128;
 const gc=grain.getContext('2d'),pixels=gc.createImageData(128,128);
 for(let i=0;i<128*128;i++){const v=hash(i)*255;pixels.data.set([v,v,v,18+hash(i+73)*15],i*4)}gc.putImageData(pixels,0,0);
 function texture(c,x,y,w,h,alpha=.4){c.save();c.globalAlpha*=alpha;c.globalCompositeOperation='soft-light';c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(x,y,w,h);c.restore()}
 function crack(c,x,y,length,key){const pts=[[x,y]];for(let j=0;j<7;j++){x+=(hash(key+j)-.5)*15;y+=length/7;pts.push([x,y]);if(j===3)line(c,[[x,y],[x-11,y+8],[x-14,y+20]],'#05080c80',.6)}line(c,pts,'#05070b99',1);line(c,pts,'#8d98a31b',.4)}
 function window(c,id,t,x=65){
  const y=-626,w=126,h=346;
  lancet(c,x-10,y-12,w+20,h+25,'#07090d','#454b55',2);
  lancet(c,x,y,w,h,gradient(c,x,y,x+w,y+h,[[0,'#728199'],[.42,'#374355'],[1,'#111b29']]),'#78829175',1.1);
  line(c,[[x+w*.5,y+21],[x+w*.5,y+h]],'#101620',4);
  line(c,[[x+1,y+h*.43],[x+w-1,y+h*.43]],'#111722',3);
  line(c,[[x+1,y+h*.73],[x+w-1,y+h*.73]],'#111722',3);
  path(c,`M ${x} ${y+h*.24} Q ${x+w*.5} ${y+h*.56} ${x+w} ${y+h*.24}`,null,'#151c29',3);
  for(let j=0;j<3;j++){
   const drift=Math.sin(t*.41+id+j)*11;
   const p=poly(c,[[x+8+j*31,y+188],[x+30+j*31,y+187],[x+280+drift+j*35,54],[x+110+drift+j*14,54]],gradient(c,x,y+185,x+210,54,[[0,'#b0c5e421'],[1,'#7f9bbb00']]));
   c.save();c.clip(p);line(c,[[x+19+j*31,y+190],[x+202+drift+j*23,51]],'#9fb8db09',12);c.restore();
  }
  // Moonlit caustics stay attached to the window and lower wall.
  c.save();c.beginPath();c.rect(x-10,-275,330,340);c.clip();
  for(let j=0;j<6;j++){const yy=-230+j*49,dx=Math.sin(t*.55+j+id)*14;path(c,`M ${x-30} ${yy} C ${x+70+dx} ${yy-21} ${x+170-dx} ${yy+17} ${x+333} ${yy-9}`,null,`rgba(129,155,198,${.02+.012*Math.sin(t*.61+j)})`,1.3)}c.restore();
  // Stable tears and moving folds, rather than randomized cloth silhouettes.
  for(const side of [-1,1]){
   const xx=side<0?x-6:x+w-11,sw=Math.sin(t*.67+id+side)*3;
   path(c,`M ${xx} ${y-8} C ${xx+23+sw} ${y+82} ${xx-10} ${y+201} ${xx+10} ${y+h+55} L ${xx+18} ${y+h+33} L ${xx+24} ${y+h+67} C ${xx+1} ${y+169} ${xx+37+sw} ${y+61} ${xx+20} ${y-8} Z`,'#080a0eea','#6c76832c',.7);
  }
  line(c,[[x-15,y+h+13],[x+w+15,y+h+13]],'#747d8a6b',3);
 }
 function room(c,id,kind,t,worldSeed=0){
  c.save();c.lineJoin='round';c.beginPath();c.rect(0,-930,620,1110);c.clip();
  const key=id*397+worldSeed,breath=Math.sin(t*.72+id*.37),stomach=kind==='stomach';
  c.fillStyle=gradient(c,0,-800,620,40,[[0,'#101319'],[.4,'#292e37'],[.7,'#20252e'],[1,'#0d1118']]);c.fillRect(0,-930,620,950);
  // A bay of ribbed stone remains a side-on cutaway as it travels past her.
  const peak=-745+(stomach?breath*4:0);
  for(const inset of [0,19,38]){
   path(c,`M ${12+inset} 5 L ${12+inset} -522 Q ${39+inset} -648 310 ${peak+inset*.8} Q ${581-inset} -648 ${608-inset} -522 L ${608-inset} 5`,null,inset===0?'#070a0f':'#13171f',inset===0?21:8);
   path(c,`M ${17+inset} 5 L ${17+inset} -521 Q ${44+inset} -644 310 ${peak+inset*.8+4} Q ${577-inset} -644 ${603-inset} -521 L ${603-inset} 5`,null,inset===0?'#747e8f5b':'#747f902a',1.2);
  }
  // Carved wall recesses replace the old flat, brown wallpaper treatment.
  lancet(c,236,-615,314,595,'#12172042','#59637232',1.4);
  lancet(c,248,-595,290,574,null,'#02060b52',2);
  for(let j=0;j<9;j++){
   const x=29+hash(key+j*71)*564,y=-710+hash(key+j*43)*590;
   crack(c,x,y,25+hash(key+j*23)*85,key+j*31);
  }
  for(let j=0;j<5;j++)line(c,[[24,-560+j*117],[596,-560+j*117]],'#04080c20',.7);
  window(c,id,t,57+Math.round(hash(key+19)*22));
  // Dark wainscot follows the common floor line continuously across rooms.
  c.fillStyle=gradient(c,0,-145,0,0,[[0,'#13171f'],[1,'#080b10']]);c.fillRect(0,-145,620,151);
  for(let j=0;j<10;j++){
   const x=19+j*61;poly(c,[[x,-124],[x+43,-124],[x+43,-22],[x,-22]],'#0b1017','#68728429',.8);
   line(c,[[x+4,-119],[x+39,-119]],'#7f89982a',.6);
  }
  line(c,[[0,-145],[620,-145]],'#06090e',7);line(c,[[0,-141],[620,-141]],'#737d8d45',1.2);
  c.fillStyle=gradient(c,0,0,0,180,[[0,'#222833'],[.35,'#101620'],[1,'#05080d']]);c.fillRect(0,0,620,180);
  for(let j=0;j<17;j++){const x=j*39;line(c,[[x,0],[x-27,180]],'#8390a13a',.7);line(c,[[x-1,0],[x-28,180]],'#01040780',1)}
  for(const y of [14,38,77,132])line(c,[[0,y],[620,y]],'#02050a88',1);
  for(let j=0;j<16;j++){const x=hash(key+j*7)*620,y=5+hash(key+j*13)*111;line(c,[[x,y],[x+8+hash(key+j*19)*29,y-1]],'#8998ac14',.6)}
  line(c,[[0,1],[620,1]],'#8b95a24f',1.3);
  // Chandelier and grey candle ends carry only a cold glint, no yellow fill.
  const sway=Math.sin(t*.48+id)*.012;
  c.save();c.translate(306,-780);c.rotate(sway);line(c,[[0,0],[0,232]],'#727c8a66',1);
  path(c,'M -61 236 Q 0 269 61 236 M -36 228 Q 0 248 36 228',null,'#596372',2.5);
  for(const x of [-59,-34,0,34,59]){path(c,`M ${x} 239 L ${x} 216`,null,'#667282',2);oval(c,x,213,1.7,3.3,'#a3b1c674')}c.restore();
  if(kind==='foyer'){
   // A short gallery stair disappears behind the window bay.
   for(let j=0;j<7;j++){const x=24+j*26,y=-15-j*13;poly(c,[[x,y],[x+73,y-3],[x+76,y+9],[x,y+12]],'#303743','#67748748',.7)}
   path(c,'M 28 -39 L 187 -117 L 236 -117',null,'#616e815c',2);
   for(let j=0;j<7;j++)line(c,[[33+j*25,-42-j*12],[33+j*25,-11-j*13]],'#46526488',1.5);
  }
  if(stomach){
   // The mouldings slowly reveal themselves as the creature's rib cage.
   for(let j=0;j<6;j++){
    const xx=52+j*105,dx=Math.sin(t*.73+j*.3+id)*8;
    path(c,`M ${xx} -740 C ${xx+68+dx} -560 ${xx-46-dx} -268 ${xx+18} 0`,null,j%2?'#323944':'#0c1119',13);
    path(c,`M ${xx+3} -738 C ${xx+72+dx} -560 ${xx-42-dx} -268 ${xx+21} 0`,null,'#a5b0c53c',1.1);
   }
   glow(c,440,-280,180,'81,100,142',.10+breath*.015,1.8);
  }
  // Fixed plaster texture and seeded dust have bounded, frame-independent cost.
  texture(c,0,-900,620,1080,.6);
  for(let j=0;j<21;j++){
   const phase=(hash(key+j*29)+t/18)%1,x=29+hash(key+j*17)*557+Math.sin(t*.3+j)*3,y=-12-phase*663;
   oval(c,x,y,.4,.65,`rgba(166,185,213,${Math.sin(phase*Math.PI)*.20})`);
  }
  c.restore();
 }
 function door(c,x,y,w,h,open=0){
  c.save();c.lineJoin='round';lancet(c,x-9,y-21,w+18,h+22,'#06090e','#657082',2.3);
  const panel=(xx,ww)=>{
   const fill=gradient(c,xx,y,xx+ww,y+h,[[0,'#3c4655'],[.35,'#202833'],[1,'#131923']]);
   lancet(c,xx,y,ww,h,fill,'#8995a86e',1);
   lancet(c,xx+9,y+29,Math.max(8,ww-18),h*.55,'#101721','#5d6c8255',.9);
   poly(c,[[xx+10,y+h*.7],[xx+ww-10,y+h*.7],[xx+ww-10,y+h-16],[xx+10,y+h-16]],'#10161e','#73809546',.8);
  };
  panel(x,w);
  if(open>0){
   c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#020407';c.fillRect(x+w*.40,y+3,w*.60,h-4);
   c.translate(x+w*.42,y);c.scale(Math.max(.09,1-open*.85),1);c.translate(-x-w*.42,-y);panel(x+w*.42,w*.58);c.restore();
  }
  oval(c,x+w*.34,y+h*.56,2.1,2.6,'#a3b2c888');c.restore();
 }
 function chair(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  lancet(c,-25,-164,50,164,'#0b1017','#68758b80',1);
  lancet(c,-17,-146,34,129,'#05080e','#3f4d6266',.8);
  path(c,'M -25 0 L -31 67 M 24 0 L 32 67',null,'#303c4d',5);
  path(c,'M -25 0 L -31 67 M 24 0 L 32 67',null,'#8a9bb43e',.8);
  poly(c,[[-28,-8],[27,-8],[34,4],[-32,4]],'#3d4a5c','#8898b15b',.8);c.restore();
 }
 function portrait(c,x,y,w,h,tilt=0){
  c.save();c.translate(x,y);c.rotate(tilt);poly(c,[[0,0],[w,0],[w,h],[0,h]],'#121821','#6c7c9670',2);poly(c,[[6,6],[w-6,6],[w-6,h-6],[6,h-6]],'#080d16','#8a99ad2a',.8);
  oval(c,w*.5,h*.34,w*.12,h*.16,'#3e4c6269');path(c,`M ${w*.24} ${h*.87} Q ${w*.20} ${h*.52} ${w*.5} ${h*.52} Q ${w*.8} ${h*.52} ${w*.76} ${h*.87} Z`,'#29384c6b');c.restore();
 }
 function diningLeg(c){c.save();poly(c,[[501,-203],[526,-203],[523,-12],[505,-12]],'#111822','#7a8ba548',1);line(c,[[506,-195],[510,-17]],'#93a9c12d',.7);c.restore()}
 function furniture(c,kind,t,id=0){
  c.save();c.lineJoin='round';
  if(kind==='foyer'){
   door(c,422,-407,158,407,0);
   poly(c,[[225,-160],[345,-160],[345,-9],[225,-9]],'#121922','#75839a59',1);
   poly(c,[[215,-175],[350,-175],[358,-161],[211,-161]],'#455266','#899db556',.8);
   for(let j=0;j<3;j++){poly(c,[[233,-143+j*41],[337,-143+j*41],[337,-112+j*41],[233,-112+j*41]],'#1c2531','#63758e55',.7);oval(c,285,-127+j*41,2.1,1.8,'#8b9cb575')}
   portrait(c,247,-421,84,154,-.038);
   path(c,'M 281 -177 L 278 -210 Q 291 -222 302 -209 L 299 -176 Z','#29364a','#8b9caf4a',1);
  }else if(kind==='wardrobe'){
   lancet(c,350,-516,242,511,'#06090f','#556176',3);
   path(c,'M 355 -450 Q 366 -497 470 -527 Q 580 -497 588 -450',null,'#8996aa75',2);
   line(c,[[352,-12],[590,-12]],'#76839a5c',4);
  }else if(kind==='dining'){
   for(let j=0;j<3;j++)chair(c,236+j*111,-175,.72);
   poly(c,[[181,-238],[536,-238],[552,-213],[178,-205]],gradient(c,180,-240,550,-205,[[0,'#5a677c'],[.5,'#333f52'],[1,'#192331']]),'#9aaac15c',1);
   poly(c,[[206,-205],[231,-205],[228,-12],[209,-12]],'#101721','#7a8ba548',1);
   diningLeg(c);
   path(c,'M 178 -209 L 547 -209 L 536 -171 Q 502 -181 475 -168 Q 443 -179 413 -168 Q 380 -179 350 -168 Q 317 -180 288 -169 Q 247 -180 199 -168 Z',gradient(c,0,-209,0,-165,[[0,'#7d89985c'],[1,'#3e4d6388']]),'#93a5be42',.8);
   for(let j=0;j<5;j++)oval(c,219+j*64,-229,14,3.1,'#c0cbdb43');
   glow(c,420,-85,130,'103,124,158',.09,.65);
  }else if(kind==='mirror'){
   lancet(c,359,-537,198,397,'#080c13','#8393ae80',5);
   lancet(c,374,-515,168,364,gradient(c,373,-510,542,-151,[[0,'#2b394d'],[.5,'#0a111d'],[1,'#36465c4a']]),'#b6c3d447',1);
   path(c,'M 390 -470 L 433 -369 L 423 -301 L 485 -158 M 433 -369 L 525 -413 M 423 -301 L 382 -254',null,'#a8bfdb50',.9);
   poly(c,[[390,-149],[525,-149],[532,-136],[386,-136]],'#3c4b63','#8fa1bc5a',1);
  }else if(kind==='nursery'){
   // The cot and chest retain the approved encounter anchors.
   poly(c,[[388,-320],[535,-320],[535,-25],[388,-25]],'#101722','#5b6b8563',1);
   poly(c,[[398,-311],[525,-311],[525,-269],[398,-269]],'#39475c','#8f9db352',1);
   path(c,'M 388 -328 L 388 -26 M 535 -328 L 535 -26',null,'#61728d',5);
   for(let j=0;j<5;j++)line(c,[[406+j*27,-309],[406+j*27,-29]],'#889bb78c',3);
   poly(c,[[324,-150],[424,-150],[424,-33],[324,-33]],'#253043','#7e91ae64',1);
   line(c,[[321,-151],[427,-151]],'#9dacc276',3);poly(c,[[333,-136],[414,-136],[414,-47],[333,-47]],'#141d2b','#667e9c55',.8);oval(c,375,-90,3,2.5,'#95a9c681');
   const sway=Math.sin(t*.53+id)*.025;c.save();c.translate(454,-546);c.rotate(sway);line(c,[[0,-72],[0,0]],'#8a9db55c',.7);line(c,[[-47,0],[47,0]],'#7789a25c',1);
   for(let j=0;j<3;j++){const x=-40+j*40;line(c,[[x,0],[x,34]],'#8b9fb855',.6);poly(c,[[x,30],[x+6,40],[x,50],[x-6,40]],'#657a9677','#b0c0d12b',.7)}c.restore();
  }else if(kind==='inkwall'){
   door(c,425,-440,145,433,0);portrait(c,249,-451,71,134,.045);
  }
  c.restore();
 }
 function throat(c,t,strength,id=0){
  c.save();c.lineJoin='round';const pulse=.5+.5*Math.sin(t*1.3),gape=(.6+.4*Math.sin(t*1.3))*strength;
  const cx=432,cy=-248,rx=101+27*gape,ry=145+63*gape;
  // A pointed void in the nave opens into an anatomical throat. Ribs and teeth
  // belong to the same cold stone/bone palette as the rest of the house.
  glow(c,cx,cy,178,'91,108,150',.12+pulse*.025,1.55);
  for(let j=3;j>=0;j--){const x=rx+11+j*8,y=ry+11+j*9;
   path(c,`M ${cx-x} ${cy+y*.91} L ${cx-x} ${cy-y*.26} Q ${cx-x*.87} ${cy-y*.72} ${cx} ${cy-y-19} Q ${cx+x*.87} ${cy-y*.72} ${cx+x} ${cy-y*.26} L ${cx+x} ${cy+y*.91}`,null,j%2?'#57667e6b':'#080e17',j%2?2:10);
  }
  const voidShape=`M ${cx} ${cy-ry-13} C ${cx+rx*.81} ${cy-ry*.76} ${cx+rx*1.05} ${cy-ry*.22} ${cx+rx} ${cy+ry*.23} C ${cx+rx*.98} ${cy+ry*.77} ${cx+rx*.45} ${cy+ry} ${cx} ${cy+ry} C ${cx-rx*.55} ${cy+ry} ${cx-rx*1.04} ${cy+ry*.72} ${cx-rx} ${cy+ry*.19} C ${cx-rx*1.02} ${cy-ry*.34} ${cx-rx*.78} ${cy-ry*.81} ${cx} ${cy-ry-13} Z`;
  const clip=path(c,voidShape,gradient(c,cx-rx,cy,cx+rx,cy,[[0,'#0e1725'],[.25,'#020509'],[.7,'#010204'],[1,'#111b2b']]),'#7f90ad60',1.1);
  c.save();c.clip(clip);
  for(let j=0;j<9;j++){
   const u=-.88+j*.22,xx=cx+u*rx,curve=Math.sqrt(Math.max(0,1-u*u)),top=cy-ry*curve,bottom=cy+ry*curve;
   const length=22+hash(id+j*13)*24+gape*11,half=5+hash(id+j*7)*5;
   poly(c,[[xx-half,top-6],[xx+half,top-5],[xx+half*.15,top+length]],gradient(c,0,top,0,top+length,[[0,'#8793a5'],[1,'#3a485e']]),'#a7b4c35e',.7);
   poly(c,[[xx-half,bottom+5],[xx+half,bottom+5],[xx-half*.12,bottom-length*.82]],gradient(c,0,bottom-length,0,bottom,[[0,'#53627b'],[1,'#8793a5']]),'#a7b4c35e',.7);
  }
  c.restore();c.restore();
 }
 return {room,door,furniture,diningLeg,throat};
})();
