// Stateless encounter grammar: O(1) time and bounded memory even after long seeks.
const families = ['moonwalker','rainfish','doorsnail','leshy','wind','ribbon','jellycap','owlbuyer',
 'boartailor','hareporter','walkingmirror','heron','badgerbuyer','roothand','stumporgan','lanternfox'];
const visitorPalettes = [
 ['#c6bf9f','#825e60','#8faaa0','#e4dfc7'],
 ['#aa8a91','#625b73','#a4ac93','#e6dcc0'],
 ['#9baea6','#566b79','#ad8872','#dfd9bf'],
 ['#b5bb7e','#657f71','#d89c99','#f4e1b5'],
 ['#a3a0ae','#716a7b','#b59679','#e0dccd']
];
function moodTint(hex){return hex;}
function smooth(a,b,x){const k=Math.max(0,Math.min(1,(x-a)/(b-a)));return k*k*(3-2*k);}
// Shuffle four-position bands independently. A family can move at most three
// slots across a block boundary, so it cannot return within the last 12 guests.
// No history list, recursion, or index-only uniqueness claim is needed.
function castOrder(block){
 const base=families.map((name,k)=>({name,weight:rand(k*137+8901)})).sort((a,b)=>a.weight-b.weight).map(v=>v.name);
 const first=rand(8191)>.5?'leshy':'owlbuyer',at=base.indexOf(first);
 [base[0],base[at]]=[base[at],base[0]];
 const order=[];
 for(let offset=0;offset<16;offset+=4){
  const group=base.slice(offset,offset+4).map((name,k)=>({name,weight:rand(block*7919+(offset+k)*317+51)})).sort((a,b)=>a.weight-b.weight).map(v=>v.name);
  if(block===0&&offset===0){const at=group.indexOf(first);[group[0],group[at]]=[group[at],group[0]];}
  order.push(...group);
 }
 return order;
}
function encounter(index){
 const block=Math.floor(index/16),order=castOrder(block),id=index*65537+4301,type=order[index%16];
 const family=families.indexOf(type),form=(block+Math.floor(rand(family*97+31)*4))%4;
 const action=(block+Math.floor(rand(family*317+89)*3))%3;
 return {index,id,type,form,action,start:index*24,duration:19+rand(id+2)*3,
  palette:Math.floor(rand(id+3)*visitorPalettes.length),count:3+Math.floor(rand(id+4)*5),
  width:.83+rand(id+5)*.34,height:.88+rand(id+6)*.26,mark:Math.floor(rand(id+7)*3),
  cargo:Math.floor(rand(id+8)*4),direction:rand(id+9)>.3?1:-1,altitude:rand(id+10),
  signature:[type,form,action,Math.floor(rand(id+3)*5),3+Math.floor(rand(id+4)*5)].join(':')};
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
 if(paintNewGuest(e,b,reveal,release))return;
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
 if(e.form===1){for(let k=0;k<3;k++)leaf(-30+k*24,-85,21,.7*k);}
 if(e.form===2){curve([-45,-12],[-100,35],[-130,14],pal[1],10);}
 if(e.form===3){for(let side of [-1,1])shape([[side*25,-20],[side*96,-81],[side*119,-33],[side*33,25]],pal[2]);}
 if(e.mark===1)for(let k=0;k<5;k++)stroke([[-25+k*10,20],[-20+k*10,25]],pal[3],1);
}
function visitorTransform(e){
 const p=e.p,u=Math.min(w/500,h/820,1.22),margin=290*u;
 // Slow down beside her so the transformation has time to read.
 const travel=p<.28?smooth(0,.28,p)*.36:p<.68?.36+(p-.28)/.4*.28:.64+smooth(.68,1,p)*.36;
 let x=e.direction>0?-margin+(w+margin*2)*travel:w+margin-(w+margin*2)*travel;
 if(['leshy','owlbuyer','badgerbuyer','stumporgan'].includes(e.type)){const target=w*(e.direction>0?.24:.76);x=e.p<.3?(-margin+(target+margin)*smooth(0,.3,e.p)):e.p<.7?target:target+(w+margin-target)*smooth(.7,1,e.p);if(e.direction<0)x=e.p<.3?w+margin+(target-w-margin)*smooth(0,.3,e.p):e.p<.7?target:target+(-margin-target)*smooth(.7,1,e.p);}
 const grounded=['doorsnail','moonwalker','owlbuyer','leshy','boartailor','hareporter','walkingmirror','heron','badgerbuyer','roothand','stumporgan','lanternfox'].includes(e.type);
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

// Additional guests have separate body plans and readable little actions. Owl
// forms deliberately change head/body silhouette, furniture and performance.
function paintNewGuest(e,b,reveal,release){
 const {pal,stroke,oval,shape,curve,star,leaf,eye,hatch,cargo}=b,t=time;
 const step=Math.sin(t*3.8+e.id),gesture=reveal*(1-release*.4);
 function shoes(x,y){oval(x,y,16,6,pal[3]);}
 function fan(x,y,r){
  const pts=[[x,y]];for(let k=0;k<=18;k++){const a=Math.PI+k*Math.PI/18;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}shape(pts,pal[1]);
  for(let k=0;k<7;k++){const a=Math.PI+k*Math.PI/6;stroke([[x,y],[x+Math.cos(a)*r,y+Math.sin(a)*r]],pal[3],1);}
 }
 function chair(wide=45){stroke([[-wide,-55],[-wide,50],[wide,50],[wide,110]],pal[1],4);stroke([[-wide,50],[-wide-9,109]],pal[1],4);}
 function flutter(x,y){for(let k=0;k<e.count;k++){const f=positiveMod(t*.22+k*.17,1);leaf(x+f*110*gesture,y-f*100*gesture,5+gesture*3,t+k);}}
 function actionProp(x,y){
  if(e.action===0)fan(x,y,12+gesture*35);
  else if(e.action===1){shape([[x-14,y-12],[x+15,y-12],[x+15,y+8],[x-14,y+8]],pal[1]);oval(x,y-2,8,8,pal[3]);oval(x,y-2,4,4,pal[2]);if(gesture>.7){stroke([[x+22,y-20],[x+34,y-29]],pal[3],1);stroke([[x+25,y-7],[x+40,y-6]],pal[3],1);}}
  else {curve([x,y],[x+45,y-20],[x+58,y+55*gesture],pal[3],8);for(let k=0;k<7;k++)stroke([[x+58,y+k*7*gesture],[x+63,y+k*7*gesture]],pal[1],1);}
 }
 if(e.type==='owlbuyer'){
  if(e.form===0){
   // Tall barn owl in a long coat: heart-shaped face, low round stool, folding fan.
   oval(0,62,43,9,pal[1]);stroke([[-30,64],[-39,112]],pal[1],4);stroke([[30,64],[38,112]],pal[1],4);
   shape([[-32,58],[-42,-38],[-23,-86],[23,-86],[41,-35],[31,58]],pal[2]);
   shape([[0,-122],[-36,-134],[-47,-100],[-26,-64],[0,-50],[29,-66],[45,-101],[33,-133]],pal[0]);
   shape([[0,-108],[-25,-121],[-32,-99],[-19,-78],[0,-63],[20,-81],[30,-102],[24,-123]],pal[3]);
   eye(-14,-102,.9);eye(14,-102,.9);shape([[-5,-87],[7,-88],[0,-73]],pal[1]);
   stroke([[-13,58],[-17,102],[-30,107]],pal[0],4);stroke([[13,58],[18,102],[31,107]],pal[0],4);
   curve([-31,-26],[-59,0],[-76,-11-gesture*24],pal[2],10);actionProp(-76,-17-gesture*24);
  }else if(e.form===1){
   // Squat little owl on a suitcase; huge round spectacles, a rain canopy.
   shape([[-56,52],[53,52],[58,98],[-59,98]],pal[1]);stroke([[-16,52],[-16,43],[15,43],[15,52]],pal[3],3);
   oval(0,2,64,54,pal[2]);oval(0,-40,62,52,pal[0]);
   for(const x of [-27,27]){oval(x,-43,26,28,pal[3]);eye(x,-43,1);oval(x,-43,23,24,'#ffffff00');}stroke([[-4,-43],[4,-43]],pal[1],3);
   shape([[-9,-22],[10,-22],[0,-8]],pal[1]);for(const x of [-30,30]){stroke([[x,49],[x,66]],pal[0],4);shoes(x,66);}
   curve([50,9],[82,22],[80,-28],pal[2],11);stroke([[79,27],[79,-96]],pal[3],3);
   const radius=32+gesture*31;shape([[79-radius,-96],[79-radius*.5,-125],[79,-137],[79+radius*.6,-125],[79+radius,-96]],pal[1]);
   for(let k=0;k<e.count;k++)star(-32+k*15,-3+Math.sin(t+k)*3,3);
  }else if(e.form===2){
   // Long-eared owl standing on a narrow perch, cape opens into a camera pose.
   stroke([[0,59],[0,112]],pal[1],7);stroke([[-41,57],[41,57]],pal[1],5);
   shape([[-24,39],[-39,-31],[-19,-72],[21,-72],[42,-31],[25,39]],pal[2]);
   shape([[-29,-60],[-43,-143],[-10,-112],[12,-110],[42,-144],[29,-60],[0,-44]],pal[0]);
   eye(-15,-86,1.1);eye(15,-86,1.1);shape([[-7,-67],[7,-67],[0,-53]],pal[1]);
   for(const side of [-1,1]){shape([[side*23,-47],[side*(49+gesture*29),-17],[side*(60+gesture*25),40],[side*23,16]],pal[1]);stroke([[side*14,36],[side*20,57]],pal[0],5);}
   actionProp(0,-18-gesture*9);
  }else{
   // Snow owl with a wide feathery collar and asymmetric top hat on a high chair.
   chair(53);shape([[-47,40],[-59,-19],[-36,-68],[35,-67],[60,-15],[43,42]],pal[2]);
   const collar=[];for(let k=0;k<18;k++){const a=k/18*TAU;collar.push([Math.cos(a)*(k%2?43:66),-45+Math.sin(a)*(k%2?25:35)]);}shape(collar,pal[3]);
   oval(0,-86,42,39,pal[0]);eye(-17,-86,1);eye(17,-86,1);shape([[-7,-71],[8,-71],[0,-58]],pal[1]);
   shape([[-29,-122],[-31,-163],[21,-171],[31,-127]],pal[1]);oval(0,-124,54,7,pal[2]);
   for(let side of [-1,1]){stroke([[side*21,41],[side*28,87]],pal[0],5);shoes(side*28,88);}
   curve([43,-5],[66,10],[72,-16-gesture*13],pal[2],10);actionProp(74,-21-gesture*13);
  }
  return true;
 }
 if(e.type==='leshy'&&e.form>0){
  // Root elder / birch-mask critic / moss hood: different head and coat shapes.
  chair(e.form===1?61:43);
  if(e.form===1){shape([[-54,49],[-70,-32],[-32,-71],[36,-70],[64,-23],[49,49]],pal[2]);oval(0,-91,52,42,pal[0]);for(let k=0;k<7;k++)curve([-39+k*13,-107],[-48+k*15,-137],[-60+k*19,-146-Math.sin(k)*14],pal[1],4);}
  else if(e.form===2){shape([[-26,48],[-32,-59],[28,-59],[37,48]],pal[1]);shape([[-21,-62],[-35,-145],[27,-134],[32,-63]],pal[3]);for(let k=0;k<6;k++)stroke([[-26,-130+k*11],[-10,-131+k*11]],pal[1],2);}
  else {shape([[-55,48],[-69,-12],[-47,-82],[0,-141],[50,-81],[70,-8],[54,48]],pal[2]);oval(0,-77,29,30,pal[1]);for(let k=0;k<e.count;k++)leaf(-56+k*112/(e.count-1),-23,16,k);}
  eye(-13,-85,.8);eye(13,-85,.8);for(let k=0;k<5;k++)curve([-18+k*9,-60],[-30+k*14,-16],[-20+k*11,-5],pal[0],2);
  for(const side of [-1,1]){stroke([[side*18,46],[side*31,99]],pal[1],10);shoes(side*31,101);}
  curve([38,-23],[72,13],[73,-5-gesture*25],pal[2],11);actionProp(74,-10-gesture*25);return true;
 }
 if(e.type==='boartailor'){
  for(let k=0;k<4;k++){const x=-53+k*35;stroke([[x,41],[x+Math.sin(t*4+k)*9,94]],pal[1],10);shoes(x+Math.sin(t*4+k)*9,96);}
  oval(-10,-4,88,57,pal[2]);oval(69,-19,49,43,pal[0]);oval(111,-12,22,18,pal[1]);oval(108,-15,3,4,pal[3]);oval(118,-14,3,4,pal[3]);eye(76,-37,.85);
  shape([[44,-51],[43,-82],[70,-59]],pal[1]);shape([[75,9],[105,22],[102,-7],[95,8]],pal[3]);
  for(let k=0;k<e.count;k++)shape([[-75+k*20,-40],[-67+k*20,-64],[-56+k*20,-42]],pal[1]);
  curve([-81,4],[-132,-18],[-109,-43],pal[1],3);curve([-35,-49],[-15,47],[68,8+gesture*39],pal[3],9);for(let k=0;k<9;k++)stroke([[-26+k*10,-8+k*4],[-24+k*10,-1+k*4]],pal[1],1);return true;
 }
 if(e.type==='hareporter'){
  for(const side of [-1,1]){stroke([[side*14,32],[side*(25+step*3),94]],pal[1],8);shoes(side*(25+step*3),98);}
  shape([[-28,37],[-40,-24],[-19,-49],[24,-50],[40,-23],[30,37]],pal[2]);
  oval(0,-71,30,30,pal[0]);oval(-15,-120,10,44,pal[0],-.14);oval(18,-121,9,48,pal[0],.18);eye(-11,-73,.65);eye(10,-73,.65);oval(0,-59,4,3,pal[1]);
  const lift=gesture*25;stroke([[-35,-13],[-63,26-lift]],pal[0],6);stroke([[33,-11],[62,24-lift]],pal[0],6);
  shape([[-107,24-lift],[105,24-lift],[103,35-lift],[-105,35-lift]],pal[1]);
  for(let k=0;k<3;k++){const x=-65+k*60;oval(x,15-lift,17,8,pal[3]);shape([[x-17,15-lift],[x-12,-10-lift],[x+12,-10-lift],[x+17,15-lift]],pal[0]);star(x,-17-lift,5);}
  if(e.form%2)fan(0,-47,21);return true;
 }
 if(e.type==='walkingmirror'){
  for(const side of [-1,1]){curve([side*34,43],[side*55+step*9,76],[side*51-step*9,107],pal[1],5);shoes(side*51-step*9,108);}
  const frame=e.form%2?[[0,-136],[57,-99],[64,30],[0,58],[-63,29],[-56,-98]]:[[-60,-118],[60,-118],[60,48],[-60,48]];shape(frame,pal[0]);
  shape([[-47,-104],[47,-104],[47,33],[-47,33]],'#33434c');
  // The reflection sprouts its own branches instead of copying the model.
  curve([0,24],[-9,-42],[9,-84],pal[2],5);for(let k=0;k<e.count;k++){const y=10-k*17,side=k%2?1:-1;curve([0,y],[side*22,y-9],[side*35,y-17-gesture*14],pal[3],1.3);leaf(side*35,y-17-gesture*14,7,k);}
  for(let k=0;k<3;k++)stroke([[-34,-85+k*28],[24,-113+k*28]],'#dce4df44',3);star(0,-136,12);return true;
 }
 if(e.type==='heron'){
  for(const side of [-1,1]){stroke([[side*18,20],[side*(29+step*3),66],[side*27-step*12,113]],pal[1],3);stroke([[side*27-step*12,113],[side*27-step*12+22,112]],pal[1],3);}
  oval(-10,-7,59,36,pal[2],-.2);curve([29,-16],[72,-58],[44,-102],pal[0],15);oval(49,-111,25,18,pal[0]);shape([[68,-117],[124,-104],[68,-102]],pal[1]);eye(53,-113,.65);
  for(let k=0;k<4;k++)shape([[-48+k*17,-21],[-92+k*23,33+gesture*13],[-26+k*17,14]],pal[3]);
  stroke([[99,-106],[100,-55+gesture*31]],pal[3],1);cargo(100,-49+gesture*31,1.4);if(e.form%2)fan(42,-132,23);return true;
 }
 if(e.type==='badgerbuyer'){
  chair(65);shape([[-51,45],[-62,-25],[-32,-62],[35,-62],[61,-20],[49,45]],pal[1]);oval(0,-83,49,34,pal[3]);
  for(const side of [-1,1]){shape([[side*14,-110],[side*37,-101],[side*28,-61],[side*10,-54]],pal[2]);oval(side*34,-109,13,13,pal[1]);eye(side*19,-83,.7);stroke([[side*21,42],[side*34,100]],pal[2],11);shoes(side*35,103);}
  oval(0,-58,9,6,pal[1]);shape([[-47,-35],[0,-8],[48,-37],[28,19],[-30,19]],pal[0]);
  curve([-42,-13],[-72,8],[-74,-10-gesture*17],pal[1],12);actionProp(-76,-16-gesture*17);return true;
 }
 if(e.type==='roothand'){
  // A root rises with an offering; the whole hand has a different count and crown.
  const grow=.5+gesture*.5;ctx.save();ctx.translate(0,70);ctx.scale(1,grow);
  shape([[-48,24],[-37,-47],[-67,-65],[-80,-106],[-66,-113],[-46,-84],[-35,-87],[-39,-157],[-24,-162],[-16,-91],[-7,-173],[8,-176],[12,-88],[29,-158],[43,-154],[33,-69],[59,-119],[73,-109],[45,-27],[38,22]],pal[2]);
  for(let k=0;k<5;k++)curve([-31+k*15,16],[-53+k*23,39],[-70+k*35,52],pal[1],3);
  for(let k=0;k<e.count;k++)leaf(-42+k*84/(e.count-1),-36-k%2*22,12,k*.8);
  cargo(0,-96,2.4);ctx.restore();return true;
 }
 if(e.type==='stumporgan'){
  // A stump musician opens an accordion and lets small seed-notes escape.
  shape([[-64,71],[-55,-40],[-37,-54],[49,-49],[65,71]],pal[1]);oval(0,-48,57,14,pal[0]);
  for(let k=0;k<5;k++)curve([-43+k*20,-33],[-48+k*24,12],[-49+k*25,61],pal[3],1);eye(-18,-18,.85);eye(19,-18,.85);
  const spread=26+gesture*37;shape([[-spread,12],[spread,12],[spread,55],[-spread,55]],pal[2]);for(let x=-spread+5;x<spread;x+=8)stroke([[x,13],[x-4,34],[x,54]],pal[3],1.5);
  shape([[-spread-20,6],[-spread,7],[-spread,61],[-spread-20,61]],pal[0]);shape([[spread,6],[spread+22,6],[spread+22,61],[spread,61]],pal[0]);
  for(let k=0;k<5;k++)stroke([[spread+4,15+k*8],[spread+17,15+k*8]],pal[1],3);flutter(55,-18);
  for(let k=0;k<3;k++)shape([[-47+k*46,73],[-73+k*66,99],[-17+k*35,84]],pal[2]);return true;
 }
 if(e.type==='lanternfox'){
  for(let k=0;k<4;k++){const x=-40+k*29;stroke([[x,26],[x+Math.sin(t*4+k)*12,99]],pal[1],5);shoes(x+Math.sin(t*4+k)*12,101);}
  shape([[-72,7],[-55,-39],[35,-37],[66,-78],[96,-65],[120,-23],[73,-7],[50,26],[-36,29]],pal[0]);
  shape([[61,-65],[52,-111],[80,-82]],pal[1]);shape([[79,-66],[88,-102],[97,-61]],pal[1]);eye(88,-47,.7);oval(119,-23,6,5,pal[1]);
  shape([[-62,4],[-104,12],[-155,-32],[-175,-85],[-112,-73],[-78,-31]],pal[2]);shape([[-155,-32],[-175,-85],[-135,-77],[-126,-48]],pal[3]);
  stroke([[109,-17],[112,25+gesture*18]],pal[1],1.5);const y=28+gesture*18;shape([[97,y],[127,y],[131,y+37],[93,y+37]],pal[1]);oval(112,y+18,10,13,pal[3]);flutter(-71,-40);return true;
 }
 return false;
}
