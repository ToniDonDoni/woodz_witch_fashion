// Stateless encounter grammar: O(1) time and bounded memory even after long seeks.
const families = ['moonwalker','rainfish','doorsnail','leshy','wind','ribbon','jellycap','owlbuyer'];
const visitorPalettes = [
 ['#c6bf9f','#825e60','#8faaa0','#e4dfc7'],
 ['#aa8a91','#625b73','#a4ac93','#e6dcc0'],
 ['#9baea6','#566b79','#ad8872','#dfd9bf'],
 ['#b5bb7e','#657f71','#d89c99','#f4e1b5'],
 ['#a3a0ae','#716a7b','#b59679','#e0dccd']
];
function moodTint(hex){return hex;}
function smooth(a,b,x){const k=Math.max(0,Math.min(1,(x-a)/(b-a)));return k*k*(3-2*k);}
function rawOrder(block){
 const order=families.map((name,k)=>({name,weight:rand(block*7919+k*137+8901)})).sort((a,b)=>a.weight-b.weight).map(v=>v.name);
 if(block===0){const first=rand(8191)>.5?'leshy':'owlbuyer',at=order.indexOf(first);[order[0],order[at]]=[order[at],order[0]];}
 return order;
}
function encounter(index){
 const block=Math.floor(index/8),order=rawOrder(block);
 if(block>0&&order[0]===rawOrder(block-1)[7])[order[0],order[1]]=[order[1],order[0]];
 const id=index*65537+4301;
 return {index,id,type:order[index%8],start:index*24,duration:19+rand(id+2)*3,
  palette:Math.floor(rand(id+3)*visitorPalettes.length),count:3+Math.floor(rand(id+4)*5),
  width:.83+rand(id+5)*.34,height:.88+rand(id+6)*.26,mark:Math.floor(rand(id+7)*3),
  cargo:Math.floor(rand(id+8)*4),direction:rand(id+9)>.3?1:-1,altitude:rand(id+10),
  signature:[seed,index,Math.floor(rand(id+11)*1e9)].join(':')};
}
function visitorsAt(t){
 const result=[],center=Math.floor(t/24);
 for(let i=Math.max(0,center-2);i<=center+1;i++){
  const e=encounter(i),p=(t-e.start)/e.duration;
  if(p>=0&&p<1)result.push({...e,p});
 }
 return result;
}
// Shapes are sampled into deliberately imperfect outlines. Identity uses only the
// encounter seed; local drawing offsets use the separate 12 Hz contour clock.
function pencil(e){
 const pal=visitorPalettes[e.palette],ink='#302d39',phase=Math.floor(time*12);
 let serial=0;
 function stroke(points,color=pal[3],width=1,fill=null,close=false){
  const key=serial++*313;
  const pts=points.map((p,k)=>[p[0]+nrand(e.id+key+k*47+phase*101)*.85,p[1]+nrand(e.id+key+k*71+phase*101)*.85]);
  ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(...p):ctx.moveTo(...p));if(close)ctx.closePath();
  if(fill){
   ctx.fillStyle=fill;ctx.fill();
   ctx.save();ctx.clip();
   const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
   // Stable dry-pigment flecks; the paper texture does not flash with the boil.
   for(let k=0;k<26;k++){const x=left+rand(e.id+key+k*97+177)*width,y=top+rand(e.id+key+k*101+191)*height;ctx.fillStyle=k%3?pal[3]+'27':ink+'20';ctx.fillRect(x,y,.7+rand(e.id+k)*2,1+rand(e.id+k+1)*3);}
   ctx.restore();
  }ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  if(fill){ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0]+1.5,p[1]-.8):ctx.moveTo(p[0]+1.5,p[1]-.8));ctx.closePath();ctx.strokeStyle=pal[3]+'66';ctx.lineWidth=.65;ctx.stroke();}
 }
 function oval(x,y,rx,ry,fill=pal[0],angle=0){
  const pts=[];for(let k=0;k<34;k++){const a=k/34*TAU,r=1+.025*Math.sin(a*5+e.id);const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;pts.push([x+px*Math.cos(angle)-py*Math.sin(angle),y+px*Math.sin(angle)+py*Math.cos(angle)]);}
  stroke(pts,ink,1.6,fill,true);
 }
 function shape(pts,fill=pal[0]){stroke(pts,ink,1.8,fill,true);}
 function curve(a,b,c,color=pal[3],width=1.2){stroke(sampledCurve(a,b,c,20),color,width);}
 function star(x,y,r,fill=pal[3]){const pts=[];for(let k=0;k<10;k++){const a=k/10*TAU-Math.PI/2,d=k%2?r*.4:r;pts.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}shape(pts,fill);}
 function leaf(x,y,s,angle=0){oval(x,y,s*.4,s,pal[2],angle);stroke([[x,y-s*.7],[x,y+s*.7]],pal[3],.7);}
 function eye(x,y,s=1){oval(x,y,8*s,11*s,pal[3]);const blink=Math.sin(time*1.9+e.id)>.975;oval(x+2*s,y,2.8*s,blink?.6:5*s,ink);}
 function hatch(x,y,rx,ry){for(let k=0;k<18;k++){const a=rand(e.id+k*97+401)*TAU,r=Math.sqrt(rand(e.id+k*101+407));const xx=x+Math.cos(a)*rx*r,yy=y+Math.sin(a)*ry*r;stroke([[xx-3,yy+3],[xx+3,yy-3]],pal[1]+'99',.9);}}
 function cargo(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(e.cargo===0)star(0,0,8);else if(e.cargo===1){oval(0,-4,4,5,pal[3]);stroke([[0,1],[0,12],[5,12],[5,8]],pal[3],2);}else if(e.cargo===2)leaf(0,0,9,.5);else eye(0,0,.65);ctx.restore();}
 return {pal,ink,stroke,oval,shape,curve,star,leaf,eye,hatch,cargo};
}
function paintVisitor(e){
 const b=pencil(e),{pal,stroke,oval,shape,curve,star,leaf,eye,hatch,cargo}=b;
 const t=time,s=Math.sin(t*2.7+e.id),reveal=smooth(.28,.57,e.p),release=smooth(.60,.92,e.p);
 if(e.type==='moonwalker'){
  // A long-legged moon deer, with a crescent caught in its twig antlers.
  for(let k=0;k<4;k++){const x=-48+k*32,step=Math.sin(t*4+k*1.8)*13;curve([x,22],[x+step,61],[x-step,104],pal[2],5);oval(x-step+4,105,12,5,pal[1]);}
  shape([[-86,-22],[-56,-40],[29,-36],[52,-90],[83,-104],[104,-89],[85,-68],[72,-13],[44,21],[-47,28],[-78,11]],pal[0]);
  hatch(-10,-5,56,21);eye(83,-86,.65);shape([[68,-101],[53,-125],[77,-112]],pal[2]);
  curve([-81,-14],[-120,-15],[-109,-48],pal[2],6);
  for(let side of [-1,1]){const x=72+side*9;curve([x,-103],[x+side*23,-130],[x+side*30,-159],pal[1],2.8);for(let k=0;k<3;k++)stroke([[x+side*(10+k*7),-119-k*12],[x+side*(30+k*10),-121-k*14]],pal[1],1.6);}
  const moon=[];for(let k=0;k<=28;k++){let a=-1.25+k/28*4.7;moon.push([17+Math.cos(a)*24,-139+Math.sin(a)*24]);}for(let k=0;k<=24;k++){let a=2.15-k/24*3.9;moon.push([28+Math.cos(a)*19,-143+Math.sin(a)*19]);}shape(moon,pal[3]);
  for(let k=0;k<e.count;k++){const x=-47+k*17;curve([x,-35],[x-5,-63],[x+s*3,-76-reveal*12],pal[3],.8);star(x+s*3,-76-reveal*12,4+reveal*3);}
 }else if(e.type==='rainfish'){
  const pts=[[-108,0]];for(let k=0;k<=24;k++){let a=Math.PI+k/24*Math.PI;pts.push([Math.cos(a)*108,Math.sin(a)*75]);}pts.push([108,0],[65,-9],[25,2],[-15,-9],[-62,2]);shape(pts);hatch(0,-38,85,24);
  for(let x=-65;x<=65;x+=43)curve([0,-73],[x*.8,-42],[x,0],pal[1],1.4);
  curve([0,-70],[-6,77],[30,62],pal[3],3);
  shape([[95,-4],[137,-46],[126,-1],[142,29],[97,13]],pal[2]);eye(-65,-20);curve([-85,0],[-78,10],[-63,5],pal[1],1.5);
  for(let k=0;k<e.count*3;k++){const f=positiveMod(t*.32+k*.139,1),x=-85+rand(e.id+k+81)*165,y=89-f*190*reveal;stroke([[x,y],[x-4,y+12]],pal[2],2);if(f>.82)star(x,y,3);}
 }else if(e.type==='doorsnail'){
  oval(-3,72,114,28,pal[2]);curve([74,55],[76,-15],[91,-33],pal[2],5);curve([91,55],[110,0],[120,-17],pal[2],5);eye(91,-33,.8);eye(120,-17,.8);
  shape([[-76,58],[-76,-54],[-62,-77],[22,-85],[45,-62],[45,60]],pal[1]);
  shape([[-65,54],[-65,-48],[-54,-65],[17,-68],[31,-53],[31,54]],'#262b3b');
  const door=1-reveal*.76;shape([[-62,53],[-62,-61],[-62+88*door,-61-reveal*8],[-62+88*door,53-reveal*8]],pal[0]);oval(-62+72*door,-1,3,4,pal[1]);
  for(let k=0;k<e.count;k++){const f=positiveMod(t*.18+k/e.count,1);star(-16+f*146*reveal,8-f*150*reveal+Math.sin(k+t)*8,4+reveal*3);}
  for(let k=0;k<8;k++)curve([-83+k*19,75],[-70+k*19,90+s*2],[-60+k*19,80],pal[1],.8);
 }else if(e.type==='leshy'){
  // A forest buyer on a spindly folding chair, wearing a striped tracksuit.
  stroke([[-57,-71],[-57,61],[45,61],[45,111]],pal[1],5);
  stroke([[-57,61],[-64,112]],pal[1],5);stroke([[-63,-65],[-63,3],[49,3]],pal[1],4);
  shape([[-39,5],[-47,-45],[-28,-68],[21,-65],[37,-41],[28,12]],pal[2]);
  for(let k=0;k<3;k++)stroke([[-35+k*4,-49],[-27+k*4,-6]],pal[3],1.4);
  shape([[-31,7],[25,9],[32,49],[1,74],[-4,104],[-22,104],[-20,65],[8,38],[-28,38]],pal[1]);
  oval(-13,108,23,7,pal[3]);oval(29,58,25,8,pal[3]);
  shape([[-27,-70],[-33,-102],[-19,-120],[-12,-137],[-3,-117],[11,-132],[14,-111],[33,-99],[24,-66],[3,-55]],pal[0]);
  for(let k=0;k<e.count;k++){const x=-27+k*52/(e.count-1);curve([x,-100],[x-9,-132],[x+Math.sin(k)*22,-151],pal[2],2);leaf(x+Math.sin(k)*22,-151,9,k);}
  eye(-12,-88,.75);eye(12,-88,.7);stroke([[-6,-71],[5,-70]],pal[1],1.2);
  // A small blank buying card lifts as the model approaches; never numeric scoring.
  curve([26,-43],[57,-13],[56,-25-reveal*34],pal[2],9);
  shape([[44,-46-reveal*34],[73,-40-reveal*34],[69,-16-reveal*34],[42,-19-reveal*34]],pal[3]);
  for(let k=0;k<3;k++)leaf(-30+k*18,18,8,k*.7);
 }else if(e.type==='wind'){
  // The interruption is a drawn gust: long scarf strokes, leaves and loose threads.
  for(let k=0;k<e.count;k++){
   const pts=[];for(let j=0;j<65;j++){const x=-190+j*6,env=Math.sin(j/64*Math.PI);pts.push([x,(k-e.count/2)*19+Math.sin(j*.10+t*1.8+k*.5)*env*(28+reveal*35)]);}
   stroke(pts,k%2?pal[2]:pal[3],k===2?8:1.1);
  }
  for(let k=0;k<e.count*2;k++){const f=positiveMod(t*.25+k*.14,1);leaf(-160+f*320,Math.sin(f*TAU+k)*72,6+rand(e.id+k)*5,t+k);}
 }else if(e.type==='ribbon'){
  const pts=[];for(let k=0;k<60;k++){let x=-150+k*5;pts.push([x,Math.sin(k*.115+t*2)*28]);}for(let k=59;k>=0;k--){let x=-150+k*5;pts.push([x,Math.sin(k*.115+t*2)*28+26]);}shape(pts,pal[2]);
  for(let k=0;k<e.count;k++){const x=-120+k*240/(e.count-1),y=Math.sin((x+150)/5*.115+t*2)*28;curve([x,y],[x-10,y-52],[x+10,y-66],pal[0],1.5);cargo(x+10,y-66,1+reveal*.3);}
  oval(146,Math.sin(59*.115+t*2)*28+7,24,20,pal[0]);eye(152,Math.sin(59*.115+t*2)*28+3,.8);
 }else if(e.type==='jellycap'){
  for(let k=0;k<e.count;k++){const x=-66+k*132/(e.count-1),y=85+Math.sin(t*2+k)*19;curve([x,1],[x+Math.sin(t*2+k)*25,58],[x+s*12,y],pal[2],2.2);cargo(x+s*12,y,.7+reveal*.4);}
  const pts=[];for(let k=0;k<=30;k++){const a=Math.PI+k/30*Math.PI;pts.push([Math.cos(a)*99,Math.sin(a)*73]);}for(let k=0;k<=12;k++)pts.push([99-k*16.5,6+Math.sin(k*2)*5]);shape(pts,pal[1]);
  for(let k=0;k<e.count+3;k++){const x=-65+rand(e.id+k+66)*130,y=-12-rand(e.id+k+67)*36;oval(x,y,6+rand(e.id+k+68)*7,4,pal[0]);}eye(-18,-15,.8);eye(13,-16,.8);
 }else{
  // A solemn owl buyer: coat, folding stool, long toes and a botanical lapel.
  stroke([[-48,44],[42,44],[49,102]],pal[1],4);stroke([[-48,44],[-54,102]],pal[1],4);
  shape([[-46,44],[-54,-49],[-29,-76],[27,-75],[52,-46],[43,47]],pal[2]);
  for(let side of [-1,1]){shape([[side*42,-35],[side*63,25],[side*29,34],[side*17,-2]],pal[1]);stroke([[side*18,46],[side*25,90],[side*48,91]],pal[0],4);}
  shape([[-45,-58],[-50,-112],[-23,-95],[0,-104],[24,-96],[50,-115],[44,-55],[19,-41],[-16,-41]],pal[0]);
  oval(-20,-77,22,26,pal[3]);oval(20,-77,22,26,pal[3]);eye(-20,-78,1.1);eye(20,-78,1.1);shape([[-7,-65],[8,-65],[0,-50]],pal[1]);
  shape([[-29,-43],[0,-18],[29,-43],[12,2],[-2,28],[-17,0]],pal[1]);
  leaf(27,-27,11,.6);for(let k=0;k<e.count;k++)stroke([[-30+k*12,11],[-26+k*12,20]],pal[3],1);
  curve([-42,-19],[-67,-37],[-75,-24-reveal*20],pal[2],7);cargo(-76,-34-reveal*20,.9);

 }
 // A common hand-painted vocabulary, with seed-selected stitches / freckles.
 if(e.mark===1)for(let k=0;k<5;k++)stroke([[-25+k*10,20],[-20+k*10,25]],pal[3],1);
}
function visitorTransform(e){
 const p=e.p,u=Math.min(w/500,h/820,1.22),margin=220*u;
 // Slow down beside her so the transformation has time to read.
 const travel=p<.28?smooth(0,.28,p)*.36:p<.68?.36+(p-.28)/.4*.28:.64+smooth(.68,1,p)*.36;
 let x=e.direction>0?-margin+(w+margin*2)*travel:w+margin-(w+margin*2)*travel;
 if(['leshy','owlbuyer'].includes(e.type)){const target=w*(e.direction>0?.24:.76);x=e.p<.3?(-margin+(target+margin)*smooth(0,.3,e.p)):e.p<.7?target:target+(w+margin-target)*smooth(.7,1,e.p);if(e.direction<0)x=e.p<.3?w+margin+(target-w-margin)*smooth(0,.3,e.p):e.p<.7?target:target+(-margin-target)*smooth(.7,1,e.p);}
 const grounded=['doorsnail','moonwalker','owlbuyer','leshy'].includes(e.type);
 const y=grounded?h*.81-96*u:h*(.34+e.altitude*.18)+Math.sin(p*TAU+e.id)*h*.045;
 return {x,y,u,front:grounded||e.type==='wind'};
}
function drawVisitors(visitors,front){
 const drawn=[];
 for(const e of visitors){const tr=visitorTransform(e);if(tr.front!==front)continue;
  ctx.save();ctx.translate(tr.x,tr.y);ctx.scale(tr.u*e.direction*e.width,tr.u*e.height);
  ctx.rotate(Math.sin(time*1.5+e.id)*.028);paintVisitor(e);ctx.restore();
  drawn.push({...e,...tr});
 }
 return drawn;
}
