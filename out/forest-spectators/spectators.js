// Reuse the reviewed neon chalk studies as live Canvas spectators.
// Each object keeps its world ID, anatomy, palette and seeded detail until exit.
const neonAudience = (() => {
const TAU=Math.PI*2;
let seed=0,time=0,phase=0,energy=1.2,lookX=0;
function hash(n){let x=(n^seed)|0;x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
const studies=[
 {id:'A1',name:'Root Keeper',kind:'LESHY',note:'Old roots, a moss beard, and curious eyes.',color:'#98f4c4',accent:'#ffda8c',draw:rootKeeper},
 {id:'A2',name:'Moss Oracle',kind:'LESHY',note:'A fern crown and a handful of borrowed stars.',color:'#c0f18b',accent:'#e3a3ff',draw:mossOracle},
 {id:'M1',name:'Lantern Cap',kind:'MUSHROOM',note:'Warm light caught between delicate gills.',color:'#ffc477',accent:'#88f3e2',draw:lanternCap},
 {id:'M2',name:'Midnight Choir',kind:'MUSHROOMS',note:'Three small voices humming under one moon.',color:'#ff98d6',accent:'#aeafff',draw:mushroomChoir},
 {id:'H1',name:'Moon Hare',kind:'HARE',note:'Long ears listening to the grass grow.',color:'#a5e9ff',accent:'#ffa4da',draw:moonHare},
 {id:'W1',name:'Violet Howl',kind:'WOLF',note:'A wild silhouette with starlight in its fur.',color:'#c2a3ff',accent:'#81eed9',draw:violetWolf},
 {id:'S1',name:'Star Stag',kind:'DEER',note:'Branches for antlers. Constellations for a crown.',color:'#83ecc9',accent:'#ffe098',draw:starStag},
 {id:'O1',name:'Night Librarian',kind:'OWL',note:'A round little keeper of improbable stories.',color:'#ffcf86',accent:'#9bf1c7',draw:nightOwl}
];
function smooth(points,closed=false){
 const out=[],n=points.length;
 for(let i=0;i<(closed?n:n-1);i++){
  const at=k=>points[closed?(k+n)%n:Math.max(0,Math.min(n-1,k))];
  const [a,b,c,d]=[at(i-1),at(i),at(i+1),at(i+2)];
  for(let k=0;k<8;k++){const t=k/8,t2=t*t,t3=t2*t;
   out.push([.5*((2*b[0])+(-a[0]+c[0])*t+(2*a[0]-5*b[0]+4*c[0]-d[0])*t2+(-a[0]+3*b[0]-3*c[0]+d[0])*t3),.5*((2*b[1])+(-a[1]+c[1])*t+(2*a[1]-5*b[1]+4*c[1]-d[1])*t2+(-a[1]+3*b[1]-3*c[1]+d[1])*t3)]);
  }
 }
 if(!closed)out.push(points[n-1]);return out;
}
function brush(c,study,index){
 let strokeId=0;const key=7103+index*11359,ink=study.color,accent=study.accent;
 function stroke(points,color=ink,width=1.55,closed=false,fill=false){
  const id=key+(strokeId++)*317;
  const perturbed=points.map((p,i)=>[p[0]+(hash(id+i*17+phase*101)-.5)*energy*1.25,p[1]+(hash(id+i*31+phase*173)-.5)*energy*1.25]);
  c.beginPath();perturbed.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(closed)c.closePath();
  if(fill){c.fillStyle=color+'0e';c.fill();}
  c.shadowBlur=0;c.globalAlpha=.94;c.strokeStyle=color;c.lineWidth=width;c.stroke();
  // Discontinuous fine highlights imitate grains deposited by a chalk pencil.
  c.globalAlpha=.43;c.strokeStyle='#f4fff4';c.lineWidth=.5;
  c.beginPath();for(let i=1;i<perturbed.length;i++){if((i+id)%7<3){c.moveTo(...perturbed[i-1]);c.lineTo(...perturbed[i]);}}c.stroke();c.globalAlpha=1;
 }
 function oval(x,y,rx,ry,color=ink,width=1.3,fill=false,angle=0){
  const p=[];for(let i=0;i<64;i++){const a=i*TAU/64,dx=Math.cos(a)*rx,dy=Math.sin(a)*ry;p.push([x+dx*Math.cos(angle)-dy*Math.sin(angle),y+dx*Math.sin(angle)+dy*Math.cos(angle)]);}
  stroke(p,color,width,true,fill);
 }
 function dot(x,y,r,color=accent,alpha=1){c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.globalAlpha=1;}
 function eye(x,y,rx=9,ry=6,color=ink){const blink=Math.sin(time*.93+index*2.19)>.993;oval(x,y,rx,blink?1:ry,color,1.1,true);if(!blink){dot(x+lookX*rx*.45,y-ry*.28,Math.min(ry*.6,3.1),color,.95);dot(x+lookX*rx*.45+1,y-ry*.28-1,.8,'#ffffff',.9);}}
 return {ink,accent,stroke,curve:(p,col=ink,width=1.55)=>stroke(smooth(p),col,width),shape:(p,col=ink,width=1.55,fill=true)=>stroke(smooth(p,true),col,width,true,fill),oval,dot,eye};
}
function twig(b,points,color=b.ink,width=1.7){b.curve(points,color,width);const tip=points.at(-1);b.oval(tip[0]-5,tip[1]-3,8,3,color,.8,true,-.5);}
function star(b,x,y,r,color=b.accent){b.stroke([[x-r,y],[x+r,y]],color,.9);b.stroke([[x,y-r],[x,y+r]],color,.9);b.dot(x,y,1.1,color);}
function fern(b,x,y,length,angle,id,color=b.ink){
 const points=[];
 for(let k=0;k<=8;k++){const t=k/8;points.push([x+Math.cos(angle)*length*t,y+Math.sin(angle)*length*t-14*Math.sin(t*Math.PI)]);}
 b.curve(points,color,.85);
 for(let k=2;k<8;k++){const [xx,yy]=points[k],r=(1-k/9)*length*.19;
  b.curve([[xx,yy],[xx-r*.5,yy-5],[xx-r,yy-11]],color,.8);
  b.curve([[xx,yy],[xx+r*.5,yy-5],[xx+r,yy-11]],color,.8);
 }
}
function forestFloor(b,index){
 b.curve([[62,358],[121,351],[205,359],[284,350],[358,357]],b.ink,.65);
 for(let k=0;k<12;k++){const x=75+hash(index*733+k*13)*272,y=353+hash(index*29+k)*8;
  b.curve([[x-5,y+1],[x-3,y-6],[x,y]],b.ink,.7);
 }
 for(let k=0;k<8;k++){const x=65+hash(index*19+k*29+200)*285,y=70+hash(index*37+k*17+210)*240;star(b,x,y,1.5+hash(k+index*11)*2,b.accent);}
}
function rootKeeper(b,index){
 const breathe=Math.sin(time*.8)*1.8;
 b.shape([[143,318],[144,231],[153,184],[178,152],[209,136],[239,152],[261,194],[271,244],[267,317],[242,330],[211,320],[181,331]],b.ink,1.8);
 for(const side of [-1,1]){
  const x=210+side*31;twig(b,[[x,164],[x+side*17,130],[x+side*8,94],[x+side*30,68]],b.accent,1.6);
  twig(b,[[x+side*17,127],[x+side*43,116],[x+side*51,89]],b.ink,1.1);
  twig(b,[[x+side*11,104],[x-side*8,84],[x-side*5,59]],b.ink,1);
  b.curve([[210+side*53,223],[210+side*91,244],[210+side*111,220],[210+side*116,197]],b.ink,2);
  b.curve([[210+side*110,220],[210+side*125,211],[210+side*127,196]],b.accent,1);
  b.curve([[210+side*31,316],[210+side*48,341],[210+side*75,349]],b.ink,3);
 }
 b.eye(184,198+breathe,11,6);b.eye(235,198+breathe,11,6);
 b.curve([[207,194],[201,220],[213,225]],b.accent,1.3);
 b.curve([[192,236],[210,242+breathe],[230,234]],b.ink,1.15);
 for(let k=0;k<15;k++){const x=171+k*5.3,y=248+Math.abs(k-7)*.8;const sway=Math.sin(time*.9+k*.7)*2;
  b.curve([[x,y],[x-6+sway,y+25],[x+3+sway,y+58-hash(k+42)*13],[x+6,y+73-hash(k+52)*13]],k%3?b.ink:b.accent,1);
 }
 for(let k=0;k<6;k++)b.curve([[155+k*19,285],[160+k*16,304],[153+k*20,324]],b.ink,.7);
 b.oval(209,170,9,4,b.accent,.8);
}
function mossOracle(b,index){
 b.shape([[115,300],[136,216],[157,168],[177,127],[205,116],[237,136],[255,188],[290,311],[265,328],[212,316],[161,331]],b.ink,1.6);
 b.shape([[174,161],[205,143],[239,159],[237,206],[212,228],[183,212]],b.accent,1.15);
 b.eye(190,179,8,4,b.accent);b.eye(220,179,8,4,b.accent);
 b.curve([[207,182],[203,199],[211,204]],b.ink,1);
 for(let k=0;k<21;k++){const x=131+k*7.3,y=222-Math.sin(k/20*Math.PI)*13,sway=Math.sin(time*.65+k*.5)*3;
  b.curve([[x,y],[x-10+sway,y+30],[x+9+sway,y+57],[x+3,y+98-hash(k+201)*20]],k%4?b.ink:b.accent,.9);
 }
 for(let k=0;k<5;k++)fern(b,207,138,58,-2.6+k*.55,k,b.ink);
 b.curve([[133,242],[93,261],[79,240]],b.ink,2);
 b.curve([[263,237],[309,261],[334,233]],b.ink,2);
 const orbY=207+Math.sin(time*1.4)*4;
 b.oval(335,orbY,15,15,b.accent,1.1);b.oval(335,orbY,8,9,b.accent,.8);
 star(b,335,orbY,6,b.accent);
 for(let k=0;k<7;k++){const x=151+hash(k+600)*109,y=120+hash(k+650)*132;b.dot(x,y,1.8,b.accent,.8);b.oval(x,y,5,3,b.accent,.55,false,k*.7);}
}
function mushroom(b,x,base,size,color,id,face=false){
 const capY=base-150*size;
 b.shape([[x-19*size,capY+15*size],[x-20*size,base-18*size],[x-36*size,base],[x+33*size,base],[x+17*size,base-23*size],[x+18*size,capY+12*size]],b.accent,1.5);
 b.oval(x,capY+15*size,99*size,25*size,color,1.4,true);
 for(let k=0;k<15;k++){const angle=k*Math.PI/14;
  b.curve([[x,capY+39*size],[x+Math.cos(angle)*52*size,capY+28*size],[x+Math.cos(angle)*98*size,capY+15*size-Math.sin(angle)*5*size]],b.accent,.75);
 }
 b.shape([[x-102*size,capY+9*size],[x-79*size,capY-27*size],[x-43*size,capY-57*size],[x+1*size,capY-72*size],[x+48*size,capY-58*size],[x+81*size,capY-27*size],[x+103*size,capY+9*size],[x+63*size,capY+17*size],[x,capY+13*size],[x-58*size,capY+18*size]],color,1.9);
 for(let k=0;k<11;k++){const dx=(hash(id+k*17)-.5)*140*size,dy=(20+hash(id+k*31)*21)*size;
  b.oval(x+dx,capY-dy,4*size,2.3*size,b.accent,.8,false,-.3);
 }
 if(face){b.eye(x-9*size,base-80*size,5*size,4*size,color);b.eye(x+9*size,base-80*size,5*size,4*size,color);b.curve([[x-8*size,base-63*size],[x,base-59*size],[x+8*size,base-64*size]],color,1);}
 return capY;
}
function lanternCap(b,index){
 const capY=mushroom(b,210,338,1.25,b.ink,411);
 b.oval(210,280,10,25,b.accent,1.5,true);
 b.curve([[208,302],[204,280],[213,266],[208,249]],'#fff3b8',1.4);
 for(let k=0;k<5;k++)b.curve([[193+k*8,198],[190+k*9,246],[193+k*8,333]],b.accent,.65);
 for(let k=0;k<5;k++){const x=111+k*47,y=capY+17+Math.sin(k)*8;b.curve([[x,y],[x+1,y+22],[x-2,y+33]],b.accent,.65);b.oval(x-2,y+36,3,5,b.accent,.8);}
 b.curve([[124,114],[169,91],[214,90],[269,110]],b.accent,.75);
 for(let k=0;k<6;k++)star(b,126+k*31,100+Math.sin(k*.9)*9,2,b.accent);
}
function mushroomChoir(b,index){
 mushroom(b,101,339,.55,b.accent,501,true);
 mushroom(b,310,334,.63,'#8ef2da',502,true);
 mushroom(b,210,346,1.02,b.ink,503,true);
 for(let k=0;k<8;k++){const x=132+k*22,y=119+Math.sin(k*.8)*13;b.oval(x,y,2.6,4,b.accent,.7);}
 for(let k=0;k<3;k++){const x=145+k*70,y=277+Math.sin(time*.75+k)*5;
  b.curve([[x,y],[x-7,y-4],[x-7,y-12]],b.accent,.8);b.dot(x-8,y-12,2,b.accent);
 }
}
function moonHare(b,index){
 b.shape([[147,308],[139,268],[149,234],[171,211],[182,226],[223,229],[253,266],[259,313],[237,337],[191,339]],b.ink,1.7);
 const twitch=Math.sin(time*.6)*2.4;
 b.shape([[178,199],[153,153],[137+twitch,110],[135+twitch,68],[150+twitch,51],[167,86],[178,137],[197,186]],b.ink,1.8);
 b.curve([[177,171],[155,120],[150,76]],b.accent,1.1);
 b.shape([[207,188],[207,137],[220-twitch,90],[239-twitch,68],[249-twitch,78],[247,118],[237,160],[224,196]],b.ink,1.6);
 b.curve([[222,168],[228,128],[237,92]],b.accent,1);
 b.shape([[173,196],[197,177],[224,180],[243,194],[255,215],[270,224],[264,237],[241,246],[213,251],[183,238]],b.ink,1.65);
 b.eye(233,206,7,5);
 b.shape([[263,224],[272,225],[267,231]],b.accent,1,false);
 for(let k=0;k<3;k++)b.curve([[253,234+k*4],[274,238+k*6],[291,232+k*8]],b.ink,.7);
 b.curve([[246,251],[237,285],[242,321],[265,327]],b.ink,1.7);
 b.oval(204,287,44,44,b.ink,1.4,false,-.2);
 b.shape([[201,324],[229,327],[275,325],[291,334],[282,342],[221,343],[187,340]],b.ink,1.5);
 b.oval(137,304,17,20,b.ink,1.3,true);
 for(let k=0;k<12;k++){const x=160+hash(k+710)*67,y=246+hash(k+715)*67;b.curve([[x,y],[x-3,y+4],[x+1,y+9]],b.ink,.7);}
 b.curve([[195,190],[192,201],[202,205]],b.accent,.85);
}
function violetWolf(b,index){
 const breath=Math.sin(time*.8)*1.2;
 b.shape([[119,281],[138,252],[172,239],[209,241],[245,213],[257,182],[263,155],[265,137],[260,120],[280,126],[291,137],[302,125],[305,109],[318,127],[321,142],[340,120],[350,115],[358,122],[344,141],[327,161],[314,183],[312,209],[323,229],[302,270],[292,329],[310,341],[280,343],[273,304],[267,270],[235,275],[216,298],[188,320],[179,338],[196,344],[163,345],[158,324],[173,301],[149,284]],b.ink,1.7);
 b.shape([[128,263],[98,269],[83,297],[57,313],[42,339],[75,332],[109,318],[135,288]],b.accent,1.5);
 b.curve([[105,285],[76,310],[62,325]],b.ink,1);
 b.eye(307,139+breath,4.5,3,b.accent);
 b.dot(352,120,2.3,b.accent);
 b.curve([[323,157],[334,142],[343,132]],b.accent,1);
 b.curve([[282,162],[292,173],[283,180],[300,184],[283,194],[299,205],[282,210],[293,225],[270,220]],b.accent,1);
 b.curve([[147,263],[188,258],[219,265],[250,251]],b.accent,.95);
 for(let k=0;k<15;k++){const x=143+hash(k+822)*98,y=257+hash(k+838)*27;b.curve([[x,y],[x+7,y-2],[x+11,y-7]],b.ink,.7);}
 b.curve([[173,301],[191,287],[205,283]],b.accent,1);
 b.curve([[285,262],[284,301],[284,330]],b.accent,.75);
 b.curve([[258,181],[260,195],[250,208]],b.ink,1);
 for(let k=0;k<4;k++)star(b,330+k*6,85-k*12,2-k*.25,b.accent);
}
function starStag(b,index){
 b.shape([[109,246],[131,224],[170,220],[209,229],[235,227],[255,191],[265,164],[276,147],[292,148],[306,160],[327,166],[321,178],[298,180],[283,196],[279,226],[265,247],[244,265],[204,271],[166,261],[135,264]],b.ink,1.7);
 b.shape([[269,155],[250,136],[250,124],[273,141]],b.accent,1,false);
 b.shape([[291,151],[301,136],[318,128],[312,147]],b.accent,1,false);
 b.eye(297,162,4.2,3,b.accent);b.dot(323,170,1.8,b.accent);
 for(const side of [-1,1]){
  const x=279+side*7;
  b.curve([[x,146],[x+side*10,116],[x+side*26,90],[x+side*34,56]],b.accent,1.7);
  b.curve([[x+side*12,116],[x+side*36,111],[x+side*47,95]],b.accent,1.1);
  b.curve([[x+side*26,90],[x+side*9,82],[x+side*8,62]],b.accent,1.05);
  b.curve([[x+side*33,69],[x+side*51,57]],b.accent,.9);
  for(let k=0;k<3;k++)b.dot(x+side*(10+k*11),115-k*22,1.6,b.accent);
 }
 b.curve([[149,256],[143,295],[135,335],[148,341]],b.ink,2.7);
 b.curve([[167,263],[174,301],[170,338],[182,343]],b.ink,2.4);
 b.curve([[240,259],[250,294],[246,337],[259,342]],b.ink,2.7);
 b.curve([[257,250],[273,291],[276,331],[289,340]],b.ink,2.1);
 b.shape([[114,242],[91,233],[80,214],[110,224],[129,230]],b.ink,1.15);
 for(let k=0;k<9;k++){const x=140+hash(k+901)*99,y=235+hash(k+950)*21;b.oval(x,y,2,1.4,b.accent,.6);}
 b.curve([[274,194],[265,210],[263,232]],b.accent,.85);
}
function nightOwl(b,index){
 b.shape([[150,310],[133,274],[139,220],[163,190],[207,179],[253,190],[282,225],[286,273],[268,312],[237,330],[198,329]],b.ink,1.7);
 b.shape([[145,129],[133,104],[140,82],[164,103],[198,105],[227,105],[254,99],[278,84],[281,111],[271,135],[288,158],[279,185],[249,205],[209,213],[171,202],[143,187],[132,160]],b.ink,1.7);
 b.oval(174,158,30,30,b.accent,1.4,true);b.oval(246,158,30,30,b.accent,1.4,true);
 b.oval(174,158,20,23,b.ink,.85);b.oval(246,158,20,23,b.ink,.85);
 b.eye(174,160,9,11,b.accent);b.eye(246,160,9,11,b.accent);
 b.shape([[201,184],[218,184],[209,202]],b.accent,1.1,true);
 b.curve([[160,209],[153,247],[170,292],[177,316]],b.accent,1.4);
 b.curve([[261,209],[266,247],[254,290],[243,315]],b.accent,1.4);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){const x=180+col*19+(row%2?7:0),y=225+row*21;
  b.curve([[x-6,y],[x,y+7],[x+6,y]],row%2?b.ink:b.accent,.75);
 }
 b.shape([[197,324],[207,346],[229,324]],b.accent,1);
 for(const side of [-1,1]){const x=210+side*28;b.curve([[x,322],[x,341],[x-9,347]],b.accent,1.5);b.curve([[x,341],[x+7,348]],b.accent,1.2);}
 b.curve([[154,122],[171,127],[189,131]],b.accent,.8);b.curve([[232,131],[249,127],[266,120]],b.accent,.8);
 star(b,210,122,7,b.accent);
}

return {
paint(canvas,index,objectSeed,t,look){
 seed=objectSeed;time=t;phase=Math.floor(t*12);lookX=look;
 const c=canvas.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);
 c.scale(canvas.width/420,canvas.height/420);c.lineCap='round';c.lineJoin='round';
 const b=brush(c,studies[index],index);forestFloor(b,index);
 c.save();c.translate(210,250);c.rotate(Math.sin(t*.45+index)*.003);c.translate(-210,-250);studies[index].draw(b,index);c.restore();
},
info(index){return {id:studies[index].id,kind:studies[index].kind,color:studies[index].color};}
};
})();
const spectatorCache = new Map();
function drawSpectators(){
 const unit=forestUnit(),spacing=226*unit,speed=46*unit,offset=time*speed,margin=255*unit;
 const start=Math.floor((-offset-margin)/spacing),end=Math.ceil((w-offset+margin)/spacing),used=new Set(),objects=[];
 for(let i=start;i<=end;i++){
  const id=i*8191+71339,index=positiveMod(i+4,8),info=neonAudience.info(index);
  const x=i*spacing+offset+spacing*.32+nrand(id+1)*spacing*.08;
  const size=(.56+rand(id+2)*.14)*unit,y=pathHeight(x)-42*Math.min(h/850,1.2)-rand(id+3)*14*unit;
  const half=210*size;if(x+half<0||x-half>w)continue;
  const key=seed+':'+w+':'+h+':audience:'+i;used.add(key);
  let art=spectatorCache.get(key);if(!art){const canvas=document.createElement('canvas');canvas.width=canvas.height=360;art={canvas,phase:-1};spectatorCache.set(key,art);}
  // Only the chalk drawing is held at 12 Hz. World travel stays smooth.
  const look=Math.tanh((w*.5-x)/(135*unit));
  if(art.phase!==boil){const phaseTime=boil/12,phaseX=x+(phaseTime-time)*speed,phaseLook=Math.tanh((w*.5-phaseX)/(135*unit));neonAudience.paint(art.canvas,index,(seed^id)|0,phaseTime,phaseLook);art.phase=boil;}
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.88;
  ctx.shadowColor=info.color;ctx.shadowBlur=6*unit;
  ctx.drawImage(art.canvas,-210*size,-355*size,420*size,420*size);
  ctx.shadowBlur=0;ctx.restore();
  objects.push({id:'audience:'+i,study:info.id,kind:info.kind,x,y,size,lookX:look,objectSeed:(seed^id)|0});
 }
 for(const key of spectatorCache.keys())if(!used.has(key))spectatorCache.delete(key);
 return objects;
}
