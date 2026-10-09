/* Procedural couture audience, deterministic and completely offline. */
const forestBuyers=(()=>{
 const kinds=['wolf','owl','deer','fox','raven','hare','moth','lynx','wolf','owl','fox'];
 const colors=[32,260,40,16,220,180,305,26,48,190,330];
 const rnd=(s,n)=>{let x=Math.sin((s+1)*91.731+n*76.381)*43758.5453;return x-Math.floor(x)};
 const poly=(c,pts,fill,stroke,w=1)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}};
 const line=(c,pts,color,w=1)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.strokeStyle=color;c.lineWidth=w;c.stroke()};
 const oval=(c,x,y,rx,ry,fill,stroke,w=1)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke()}};
 function buyer(c,id,x,y,s,t,seed){
  const kind=kinds[id%kinds.length],hue=colors[id%colors.length];
  const light='hsla('+hue+',65%,84%,.8)',trim='hsla('+hue+',70%,75%,.85)';
  c.save();c.translate(x,y+Math.sin(t*.6+id)*1.4);c.scale(s,s);
  c.shadowColor='hsla('+hue+',75%,65%,.19)';c.shadowBlur=11;
  const jacket=c.createLinearGradient(-45,80,45,175);
  jacket.addColorStop(0,'#323038');jacket.addColorStop(.5,'#09090e');jacket.addColorStop(1,'#25212d');
  poly(c,[[-32,90],[-51,110],[-45,165],[-27,179],[28,179],[48,165],[47,110],[30,90],[8,85],[-9,85]],jacket,'#716771',1.2);
  poly(c,[[-8,88],[-20,107],[-5,149],[3,178],[12,149],[22,107],[8,88]],'#09090d','#8d7985',.8);
  poly(c,[[-32,92],[-8,86],[1,118],[-17,141]],'#1b1b25',trim,.8);
  poly(c,[[29,92],[8,86],[1,118],[17,141]],'#15151c',trim,.8);
  line(c,[[-31,108],[-37,157],[-30,172]],'#897e89',.8);
  line(c,[[32,108],[38,157],[29,172]],'#897e89',.8);
  for(let i=0;i<4;i++)oval(c,1,130+i*10,1,1,'#e8d5a7');
  c.shadowBlur=0;
  line(c,[[-10,92],[-4,105],[8,100],[13,89]],'#dbc49c',2);
  for(let k=0;k<3;k++)oval(c,-9+k*9,102+Math.sin(k)*3,1.4,1.4,'#cfb58b');
  if(id%3===0){line(c,[[32,140],[44,133],[49,112]],'#d6c2aa',2);oval(c,49,110,6,2,'#e7d8bb');line(c,[[49,112],[49,123]],'#e7d8bb',1)}
  else if(id%3===1){c.save();c.translate(35,139);c.rotate(-.18);c.fillStyle='#33343c';c.fillRect(-8,-16,15,25);c.strokeStyle='#b7acb9';c.strokeRect(-8,-16,15,25);c.restore()}
  oval(c,0,84,23,17,'#0d0c12','#988e96',1);
  const fur=c.createRadialGradient(-12,21,2,0,42,65);
  fur.addColorStop(0,'hsl('+hue+',25%,66%)');fur.addColorStop(.44,'hsl('+hue+',21%,34%)');fur.addColorStop(1,'#090b10');
  c.shadowColor='hsla('+hue+',90%,77%,.22)';c.shadowBlur=9;
  if(['wolf','fox','lynx'].includes(kind)){
   const fox=kind==='fox';
   poly(c,[[-30,35],[-36,-10],[-13,9],[0,13],[17,6],[36,-13],[30,36],[22,70],[0,86],[-24,70]],fur,trim,1.3);
   poly(c,[[-25,18],[-34,-10],[-11,19]],fox?'#9e6446':'#4a4548',trim,1);
   poly(c,[[24,18],[35,-10],[12,18]],fox?'#9e6446':'#4a4548',trim,1);
   if(kind==='lynx'){line(c,[[-33,-9],[-40,-23]],'#c9c1ad',2);line(c,[[35,-9],[42,-23]],'#c9c1ad',2)}
   poly(c,[[-22,48],[-10,66],[0,80],[15,63],[22,45],[0,57]],fox?'#d3b8a0':'#77737a');
   poly(c,[[-10,56],[0,51],[17,57],[6,67]],'#17151a');
   oval(c,-12,43,5,2.2,'#f0d6a2');oval(c,13,43,5,2.2,'#f0d6a2');
   oval(c,-12,43,1.6,2,'#0a0b0d');oval(c,13,43,1.6,2,'#0a0b0d');
   oval(c,1,64,4,2.5,'#111116');
  }else if(kind==='deer'||kind==='hare'){
   oval(c,0,48,27,39,fur,trim,1.3);
   if(kind==='deer'){
    for(const sign of [-1,1]){
     line(c,[[sign*13,17],[sign*20,-14],[sign*35,-32]],'#d4c0a4',2.6);
     line(c,[[sign*19,-12],[sign*5,-26]],'#d4c0a4',1.6);
     line(c,[[sign*25,-23],[sign*37,-9]],'#d4c0a4',1.6);
    }
   }else for(const sign of [-1,1]){oval(c,sign*18,-8,8,42,'#756a69','#c6b6b2',1);oval(c,sign*18,-8,3.5,32,'#b78e9a')}
   oval(c,-11,45,5,3,'#efe4c4');oval(c,11,45,5,3,'#efe4c4');
   oval(c,-11,45,1.6,2.4,'#0a0a0d');oval(c,11,45,1.6,2.4,'#0a0a0d');
   oval(c,0,65,5,3,'#231c21');
  }else if(kind==='owl'){
   oval(c,0,44,36,42,fur,trim,1.2);
   poly(c,[[-32,22],[-28,-4],[-8,16],[0,21],[12,14],[30,-4],[32,22]],'#6c6364',trim,1);
   for(const sign of [-1,1]){oval(c,sign*15,43,15,16,'#cbb99c','#4e4546');oval(c,sign*15,43,9,11,'#f6db8b');oval(c,sign*15,43,4.2,8,'#151117')}
   poly(c,[[-6,58],[0,72],[7,58]],'#c99b5d','#efc991');
   for(let i=0;i<8;i++)line(c,[[-24+i*7,76],[-20+i*6,87]],'#b4a69a',.7);
  }else if(kind==='raven'){
   oval(c,0,40,28,40,'#161922','#817d9a');
   poly(c,[[-22,42],[9,35],[38,47],[9,55]],'#242630','#b4a9a0');
   oval(c,-9,35,4.4,4,'#d7cbb5');oval(c,-9,35,1.8,2.8,'#13151c');
   for(let k=0;k<7;k++)line(c,[[-20+k*5,70],[-22+k*6,90]],'#55566c');
  }else{
   for(const sign of [-1,1]){
    c.save();c.translate(sign*24,39);c.rotate(sign*.17);
    const wg=c.createLinearGradient(0,-30,sign*45,56);
    wg.addColorStop(0,'#a88eaf');wg.addColorStop(.55,'#6f7b88');wg.addColorStop(1,'#2a213a');
    poly(c,[[0,0],[sign*22,-38],[sign*52,-24],[sign*46,30],[sign*18,44]],wg,'#f5b9de',1.2);
    for(let i=0;i<5;i++)line(c,[[0,0],[sign*(17+i*6),-27+i*12]],'#dbd4bc',.65);
    c.restore();
   }
   oval(c,0,40,23,34,fur,'#d2b9c9');
   for(const sign of [-1,1]){line(c,[[sign*9,11],[sign*24,-20]],'#dcc5b5');oval(c,sign*24,-20,3,3,'#e8c4e5')}
   oval(c,-9,43,4,3,'#e4e0c4');oval(c,9,43,4,3,'#e4e0c4');
  }
  c.shadowBlur=0;
  if(id%4===1||id%4===2){
   for(const sign of [-1,1]){
    poly(c,[[sign*2,37],[sign*26,36],[sign*25,49],[sign*5,50]],'#080a0ecc','#ddd1c6');
    line(c,[[sign*7,39],[sign*18,39]],'#a7d6e5',.9);
   }
   line(c,[[-4,40],[4,40]],'#c8b9a6',1.2);
  }
  c.globalAlpha=.3;
  for(let k=0;k<95;k++){
   const rx=(rnd(seed+id,k*3)-.5)*54,ry=14+rnd(seed+id,k*3+1)*62;
   if(Math.abs(rx)>30*(.8+Math.sin((ry-14)/74*Math.PI)*.15))continue;
   const len=2+rnd(seed+id,k*3+2)*7;
   line(c,[[rx,ry],[rx+(rnd(seed+id,k+900)-.5)*3,ry+len]],light,.36);
  }
  c.globalAlpha=1;c.restore();
 }
 function draw(c,w,h,time=0,seed=42){
  c.clearRect(0,0,w,h);
  const baseline=h*.735;
  const runway=c.createLinearGradient(0,h*.54,0,h);
  runway.addColorStop(0,'#050408');runway.addColorStop(.5,'#121016');runway.addColorStop(1,'#020205');
  poly(c,[[w*.42,h*.60],[w*.58,h*.60],[w*.91,h],[w*.09,h]],runway,'#514653');
  for(const side of [-1,1])line(c,[[w*(side<0?.42:.58),h*.60],[w*(side<0?.09:.91),h]],'#a3949e',1.4);
  const count=w<550?9:11,gap=w/(count+.3);
  for(let i=0;i<count;i++){
   const xx=gap*(i+.65),s=Math.min(1.05,Math.max(.42,w/1280))*(.82+rnd(seed,i+100)*.24);
   buyer(c,i,xx,baseline-160*s,s,time,seed);
   c.fillStyle='#0b0a0f';c.fillRect(xx-42*s,baseline+5*s,84*s,18*s);
   c.strokeStyle='#4b444d';c.lineWidth=.65;c.strokeRect(xx-42*s,baseline+5*s,84*s,18*s);
  }
  c.globalAlpha=.26;
  for(let i=0;i<16;i++){const xx=w*(.17+rnd(seed,i+310)*.66),yy=h*(.77+rnd(seed,i+410)*.23);line(c,[[xx-7,yy],[xx+7,yy]],'#ab8e9e',.4)}
  c.globalAlpha=1;
 }
 return {draw,kinds};
})();