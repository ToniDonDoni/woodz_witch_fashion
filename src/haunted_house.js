// The Hungry House is an opt-in world sharing the approved walker and the
// original animation clock. All scenery is deterministic at a given seed/time.
const hungryRooms=['foyer','wardrobe','dining','mirror','nursery','inkwall','stomach'];
const hungry={active:false,sound:false,audio:null,lastScare:null,stingers:0};
function hungryMetrics(){
 const s=Math.min(h/900,1.2);
 return {s,span:620*s,speed:49*s,floor:h*.858};
}
function hungryKind(i){return hungryRooms[positiveMod(-i,hungryRooms.length)];}
function hungryBeat(i,m){return (w*.5-i*m.span-m.span*.5)/m.speed;}
function hungryPhase(t){return t< -3.8?'quiet':t< -1.5?'warning':t<0?'false-alarm':t<1.3?'reveal':'recovery';}
function hungryRect(x,y,width,height,color){ctx.fillStyle=color;ctx.fillRect(x,y,width,height);}
function hungryStroke(points,color='#67717a',weight=1,id=0){
 line(points,color,weight,id);
}
function hungryWindow(id,at){
 hungryRect(at,-548,116,230,'#0a0e17');
 ctx.strokeStyle='#829090';ctx.lineWidth=4;ctx.strokeRect(at,-548,116,230);
 const light=ctx.createLinearGradient(at,-548,at+116,-318);
 light.addColorStop(0,'#88939c42');light.addColorStop(1,'#7081a600');
 hungryRect(at+5,-543,106,220,light);
 hungryStroke([[at+58,-548],[at+58,-318]],'#7b8079',3,id+5);
 hungryStroke([[at,-439],[at+116,-439]],'#7b8079',2,id+6);
 const phase=time*.5+id;
 for(let p=0;p<5;p++){
  const tx=at+16+p*24;
  hungryStroke([[tx,-325],[tx-4,-362],[tx+10*Math.sin(phase+p),-387]],'#27333c',2,id+p+20);
 }
 // Light ripples are deliberately clipped to the lower wall and floor.
 ctx.save();ctx.beginPath();ctx.rect(at-20,-315,184,355);ctx.clip();
 for(let j=0;j<4;j++){
  const x=at+10+j*37+Math.sin(time*.7+j+id)*13;
  const alpha=.025+.025*(.5+.5*Math.sin(time*.8+j));
  ctx.fillStyle='rgba(171,198,232,'+alpha+')';
  ctx.beginPath();ctx.moveTo(at+15+j*17,-320);ctx.lineTo(at+46+j*14,-320);
  ctx.lineTo(x+88,35);ctx.lineTo(x-28,35);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
function hungryInk(i,intensity=1){
 // Living Ink: the same seeded wall cracks undulate without changing their roots.
 const id=i*71+412;
 for(let n=0;n<9;n++){
  const rootX=34+rand(id+n*11)*550,rootY=-140-rand(id+n*11+1)*450;
  const reach=(18+rand(id+n*11+2)*74)*intensity;
  const turn=Math.sin(time*.95+n*2+i)*reach;
  ctx.beginPath();ctx.moveTo(rootX,rootY);
  ctx.quadraticCurveTo(rootX+turn,rootY-24,rootX+turn*.55,rootY-reach*.8);
  ctx.quadraticCurveTo(rootX+turn*1.3,rootY-reach,rootX+turn*.9,rootY-reach*1.26);
  ctx.lineWidth=1.2+(n%3)*.75;ctx.strokeStyle=n%3?'#080a0ecc':'#4c47588a';ctx.stroke();
  if(n%3===0)hungryRect(rootX+turn*.8,rootY-reach*1.3,2,10+Math.sin(time+n)*6,'#09080bbb');
 }
}
function hungryRoomShell(i,kind,m){
 const id=7701+i*383,breath=.5+.5*Math.sin(time*1.24+i*.37);
 const grad=ctx.createLinearGradient(0,-690,620,0);
 grad.addColorStop(0,'#141d21');grad.addColorStop(.52,kind==='stomach'?'#2e151b':'#24282a');grad.addColorStop(1,'#0c1216');
 hungryRect(0,-685,620,695,grad);
 for(let j=0;j<20;j++){
  const x=j*34+nrand(id+j)*8;
  hungryStroke([[x,-657],[x+nrand(id+j+44)*18,-395],[x+nrand(id+j+78)*7,-40]],'#78817c12',.8,id+j);
 }
 hungryRect(0,-675,620,24,'#0b0c12');hungryRect(0,-50,620,48,'#19171a');
 hungryRect(0,0,620,67,'#161318');
 for(let p=0;p<22;p++){
  const px=p*31;
  hungryStroke([[px,0],[px-12,66]],'#74685c48',1,id+p+34);
  hungryStroke([[px,-48],[px,-7]],'#756a6240',1,id+p+141);
 }
 hungryRect(0,-330,620,11,'#131519');hungryStroke([[0,-315],[620,-315]],'#6d665d70',2,id+170);
 hungryStroke([[2,-651],[2,8]],'#56443b',12,id+171);
 hungryStroke([[618,-651],[618,8]],'#56443b',12,id+172);
 hungryStroke([[0,-649],[620,-649]],'#756f66',5,id+173);
 hungryStroke([[0,-50],[620,-50]],'#65615a',4,id+174);
 // The house starts to breathe before the stomach reveal.
 if(kind==='stomach'||Math.abs(i)>7){
  ctx.fillStyle='rgba(114,33,44,'+(.08+breath*.13)+')';ctx.fillRect(10,-640,600,593);
 }
 hungryWindow(id,68+Math.round(rand(id)*20));
 hungryInk(i,kind==='inkwall'?2.3:kind==='stomach'?1.8:1);
 // Ceiling chandelier and candles.
 hungryStroke([[310,-666],[310,-574]],'#918b83',2,id+190);
 hungryStroke([[264,-574],[282,-551],[338,-551],[357,-574]],'#9a8a71',3,id+191);
 for(const x of [274,346]){
  hungryRect(x-2,-565,4,21,'#998e75');
  ctx.fillStyle='#efd49a';ctx.beginPath();ctx.ellipse(x,-572,4,8+2*Math.sin(time*3+x),0,0,TAU);ctx.fill();
 }
}
function hungryDoor(x,y,width,height,open,id){
 hungryRect(x-9,y-9,width+18,height+10,'#171419');
 hungryRect(x,y,width,height,'#352a28');
 hungryStroke([[x,y],[x+width,y],[x+width,y+height],[x,y+height],[x,y]],'#a2917c',3,id);
 for(let j=0;j<2;j++)hungryStroke([[x+14,y+14+j*145],[x+width-14,y+14+j*145],[x+width-14,y+127+j*145],[x+14,y+127+j*145],[x+14,y+14+j*145]],'#8b7b6a',2,id+j+3);
 if(open>0){
  hungryRect(x+width*.5,y+4,width*.5*open,height-7,'#020408');
  ctx.fillStyle='#17151b';ctx.beginPath();ctx.moveTo(x+width*.5,y);ctx.lineTo(x+width*.5+width*.4*open,y+11);ctx.lineTo(x+width*.5+width*.4*open,y+height-6);ctx.lineTo(x+width*.5,y+height);ctx.fill();
 }
 hungryRect(x+width*.55,y+height*.53,5,5,'#c3a581');
}
function hungrySpirit(cx,cy,r,age,id){
 // Liquid Spirits: a morphing ectoplasm silhouette, not a static ghost sprite.
 ctx.save();ctx.globalCompositeOperation='screen';
 const pulse=.88+.12*Math.sin(time*4+id);
 const size=r*pulse;
 const outer=ctx.createRadialGradient(cx,cy,5,cx,cy,size*1.6);
 outer.addColorStop(0,'#cfebea9e');outer.addColorStop(.45,'#659dba60');outer.addColorStop(1,'#498da400');
 ctx.fillStyle=outer;ctx.beginPath();ctx.ellipse(cx,cy,size*.9,size*1.7,0,0,TAU);ctx.fill();
 ctx.beginPath();ctx.moveTo(cx,cy-size);
 ctx.bezierCurveTo(cx-size*.72,cy-size*1.4,cx-size,cy-size*.15,cx-size*.58,cy+size*.48);
 for(let p=0;p<5;p++){
  const xx=cx-size*.6+p*size*.3;
  ctx.quadraticCurveTo(xx+Math.sin(time*2+p+id)*size*.22,cy+size*(1.15+Math.sin(time*2+p)*.22),xx+size*.2,cy+size*.54);
 }
 ctx.bezierCurveTo(cx+size*.95,cy-size*.15,cx+size*.65,cy-size*1.3,cx,cy-size);
 ctx.fillStyle='#a7b9c88c';ctx.fill();
 ctx.fillStyle='#02080ecc';ctx.beginPath();ctx.ellipse(cx-size*.22,cy-size*.29,size*.08,size*.14,0,0,TAU);ctx.ellipse(cx+size*.20,cy-size*.30,size*.08,size*.14,0,0,TAU);ctx.fill();
 ctx.strokeStyle='#0a1d2ac0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy+size*.02,size*.16,0,Math.PI);ctx.stroke();
 for(let p=0;p<7;p++){
  const orbit=time*.8+p*TAU/7+id;
  const px=cx+Math.cos(orbit)*size*(.8+p*.06),py=cy+Math.sin(orbit)*size*.8;
  ctx.fillStyle='rgba(153,222,237,'+(.28+.14*Math.sin(time+p))+')';
  ctx.beginPath();ctx.arc(px,py,2.2+p%3,0,TAU);ctx.fill();
 }
 ctx.restore();
}
function hungryHand(x,y,reach,alpha,id){
 ctx.save();ctx.globalAlpha=alpha;
 hungryStroke([[x,y],[x-18*reach,y-23*reach],[x-84*reach,y-18*reach]],'#bcaca1',12,id+1);
 const fx=x-84*reach,fy=y-18*reach;
 for(let p=0;p<4;p++){
  hungryStroke([[fx,fy],[fx-(19+p*5)*reach,fy-(6+p*7)*reach],[fx-(24+p*5)*reach,fy+(3-p*3)*reach]],'#beb4a8',3,id+p+2);
 }
 ctx.restore();
}
function hungryFurniture(kind,progress,i){
 const active=Math.max(0,Math.min(1,(progress+.2)*4));
 const fade=Math.max(0,1-Math.max(0,progress-1.6)/2.5);
 const strength=active*fade,id=110+i*151;
 if(kind==='foyer'){
  hungryDoor(422,-407,158,407,0,id);
  hungryRect(225,-160,120,151,'#352923');
  hungryStroke([[212,-166],[355,-166]],'#91745b',7,id+2);
  for(let j=0;j<3;j++)hungryStroke([[242,-110+j*35],[327,-110+j*35]],'#806d5c',2,id+j+3);
  for(let j=0;j<4;j++)hungryRect(230+j*26,-174,12,8,'#a18a6c');
 }else if(kind==='wardrobe'){
  hungryRect(364,-474,214,469,'#100b12');
  hungryRect(352,-495,238,36,'#352723');
  hungryDoor(375,-458,95,440,progress> -2?Math.min(1,(progress+2)/2):0,id+2);
  hungryDoor(470,-458,95,440,progress> -1.7?Math.min(1,(progress+1.7)/1.7):0,id+3);
  // A long-limbed silhouette jumps from the black opening after a fake closing.
  if(strength>0){
   ctx.save();ctx.globalAlpha=strength;
   const lunge=110*Math.sin(Math.PI*Math.min(progress/1.2,1));
   const cx=488-lunge,cy=-292;
   ctx.fillStyle='#05070a';ctx.beginPath();ctx.ellipse(cx,cy,62,138,0,0,TAU);ctx.fill();
   ctx.beginPath();ctx.ellipse(cx-12,cy-138,39,56,.2,0,TAU);ctx.fill();
   hungryRect(cx-31,cy-151,8,8,'#ecedc4');hungryRect(cx-3,cy-151,8,8,'#ecedc4');
   hungryStroke([[cx-32,cy-38],[cx-100,cy+90],[cx-138,cy+57]],'#a7a0a0',13,id+5);
   hungryStroke([[cx+31,cy-22],[cx+96,cy+91],[cx+54,cy+176]],'#8f9296',11,id+6);
   ctx.restore();
  }
 }else if(kind==='dining'){
  for(let j=0;j<3;j++){const x=220+j*110;hungryRect(x,-166,32,154,'#332822');hungryStroke([[x-9,-177],[x+40,-177]],'#8a7267',5,id+j);}
  hungryRect(181,-238,365,32,'#665044');hungryRect(206,-205,25,193,'#362b2b');hungryRect(501,-205,25,193,'#362b2b');
  ctx.fillStyle='#b3a38b';ctx.beginPath();ctx.moveTo(178,-209);ctx.lineTo(547,-209);ctx.lineTo(532,-167);ctx.lineTo(200,-167);ctx.fill();
  for(let j=0;j<6;j++)hungryRect(236+j*47,-110,7+strength*3,5,'#d5c07a');
  if(strength>0)hungryHand(360,-132,.2+strength*1.2,strength,id+50);
 }else if(kind==='mirror'){
  hungryRect(363,-520,189,382,'#554739');
  hungryRect(376,-503,162,351,'#111924');
  ctx.strokeStyle='#b39c78';ctx.lineWidth=11;ctx.strokeRect(365,-520,183,370);
  ctx.fillStyle='#a6bfd423';ctx.beginPath();ctx.ellipse(460,-331,67,160,0,0,TAU);ctx.fill();
  if(progress> -2)hungrySpirit(466-Math.max(0,strength)*96,-320,60+strength*24,time,id+88);
  hungryRect(390,-149,134,7,'#574940');
 }else if(kind==='nursery'){
  hungryRect(388,-320,147,295,'#242024');
  hungryRect(398,-311,127,42,'#665047');
  for(let j=0;j<5;j++)hungryStroke([[406+j*27,-310],[406+j*27,-29]],'#a2917a',4,id+j);
  hungryRect(244,-150,100,117,'#413635');
  ctx.fillStyle='#baab9c';ctx.beginPath();ctx.ellipse(294,-201,24,31,0,0,TAU);ctx.fill();
  hungryStroke([[293,-170],[294,-112]],'#8e8c87',9,id+20);
  const twist=progress>-1.1?Math.min(1,(progress+1.1)*2):0;
  hungryRect(286+twist*3,-205,4+twist*5,4,'#050608');
  if(strength>0)hungrySpirit(454,-238,52,strength,id+29);
 }else if(kind==='inkwall'){
  hungryDoor(425,-440,145,433,0,id);
  if(progress> -3.4){
   for(let p=0;p<6;p++){
    const x=455+p*12,y=-420+p*34;
    hungryStroke([[x,y],[x-25-Math.sin(time*2+p)*19,y+64],[x+10-Math.cos(time+p)*11,y+107]],'#06070ad9',5,id+p+51);
   }
  }
  if(strength>0){hungryHand(494,-237,.4+strength*1.4,strength,id+83);hungrySpirit(515,-332,32,strength,id+90);}
 }else if(kind==='stomach'){
  for(let p=0;p<8;p++){
   const x=68+p*69;
   const bend=34*Math.sin(time*1.25+i+p*.2);
   ctx.beginPath();ctx.moveTo(x,-650);ctx.bezierCurveTo(x+55+bend,-550,x-67-bend,-220,x+10,0);
   ctx.strokeStyle=p%2?'#967273':'#5f353e';ctx.lineWidth=15;ctx.stroke();
   ctx.strokeStyle='#c3a1a041';ctx.lineWidth=2;ctx.stroke();
  }
  const gape=(.6+.4*Math.sin(time*1.3))*strength;
  ctx.fillStyle='#070305';ctx.beginPath();ctx.ellipse(432,-238,112+30*gape,130+80*gape,0,0,TAU);ctx.fill();
  for(let p=0;p<9;p++){
   const theta=p*Math.PI/8,xx=432+Math.cos(theta)*(107+23*gape);
   const topY=-238- Math.sin(theta)*(119+66*gape);
   hungryStroke([[xx-8,topY],[xx,topY+38+16*gape],[xx+9,topY]],'#bfb2a2',3,id+p+120);
   const botY=-238+Math.sin(theta)*(119+66*gape);
   hungryStroke([[xx-8,botY],[xx,botY-32-19*gape],[xx+9,botY]],'#bfb2a2',3,id+p+141);
  }
  if(strength>0)hungrySpirit(428,-236,50+strength*35,strength,id+180);
 }
}
function hungryDrawRooms(){
 const m=hungryMetrics(),rooms=[],offset=time*m.speed;
 const from=Math.floor((-offset-m.span)/m.span),to=Math.ceil((w-offset+m.span)/m.span);
 // All animated room geometry is deterministic and bounded to a visible margin.
 for(let i=from;i<=to;i++){
  const x=i*m.span+offset,kind=hungryKind(i),phaseTime=time-hungryBeat(i,m);
  ctx.save();ctx.translate(x,m.floor);ctx.scale(m.s,m.s);
  hungryRoomShell(i,kind,m);
  hungryFurniture(kind,i===0?-20:phaseTime,i);
  ctx.restore();
  rooms.push({id:i,kind,x,phase:hungryPhase(i===0?-20:phaseTime),progress:phaseTime});
 }
 return {rooms,metrics:m};
}
function hungryForeground(rooms,m){
 // Only a narrow grab passes in front of the walker's ankles.
 for(const room of rooms){
  if(room.id===0)continue;
  if(!['wardrobe','dining','inkwall'].includes(room.kind))continue;
  const age=room.progress;
  if(age<0||age>1.1)continue;
  const amount=Math.sin(Math.PI*age/1.1);
  ctx.save();ctx.translate(room.x,m.floor);ctx.scale(m.s,m.s);
  hungryHand(394,-85,.4+amount*.75,amount*.68,room.id*17+991);
  ctx.restore();
 }
}
function hungryScene(){
 const {rooms,metrics:m}=hungryDrawRooms();
 const figureHeight=Math.min(h*.68,w*1.42),figureWidth=figureHeight*FW/FH;
 const x=(w-figureWidth)/2,y=h*.858-figureHeight;
 ellipse(w*.5-figureWidth*.08,h*.849,figureWidth*.38,figureHeight*.012,'#00000080');
 const frame=Math.floor(time*24)%FRAME_COUNT;
 ctx.drawImage(atlas,(frame%COLS)*FW,Math.floor(frame/COLS)*FH,FW,FH,x,y,figureWidth,figureHeight);
 hungryForeground(rooms,m);
 const focal=rooms.reduce((best,item)=>Math.abs(item.x+m.span*.5-w*.5)<Math.abs(best.x+m.span*.5-w*.5)?item:best,rooms[0]);
 const chapter=focal.kind==='stomach'?'THE HOUSE IS HUNGRY':focal.kind.toUpperCase();
 const label='THE HUNGRY HOUSE / '+chapter;
 if(actCardText!==label){actCardText=label;actCard.textContent=label;}
 actCard.style.opacity='.72';
 debug={time,frame,boil,seed,viewport:{w,h},figure:{x,y,width:figureWidth,height:figureHeight},
  house:{enabled:true,sound:hungry.sound&&!!hungry.audio,rooms,phase:focal.phase,chapter:focal.kind,stingers:hungry.stingers},
  forest:[],foreground:[],events:[],cacheSize:0,activeCount:rooms.length};
}
function hungryPlaySting(kind){
 if(!hungry.sound||!hungry.audio||hungry.audio.state!=='running')return;
 const audio=hungry.audio,now=audio.currentTime,duration=.58;
 try{
  const voice=audio.createOscillator(),gain=audio.createGain();
  voice.type=kind==='stomach'?'sawtooth':'triangle';
  const high=kind==='mirror'?540:kind==='stomach'?230:410;
  voice.frequency.setValueAtTime(high,now);
  voice.frequency.exponentialRampToValueAtTime(42,now+duration);
  gain.gain.setValueAtTime(.0001,now);
  gain.gain.exponentialRampToValueAtTime(.18,now+.023);
  gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  voice.connect(gain);gain.connect(audio.destination);voice.start(now);voice.stop(now+duration+.025);
  const count=Math.max(1,Math.floor(audio.sampleRate*.36)),buffer=audio.createBuffer(1,count,audio.sampleRate);
  const data=buffer.getChannelData(0);
  // Deterministic pseudo-noise is sufficient for a short offline horror crack.
  let state=21991+kind.length*911;
  for(let i=0;i<count;i++){state=(Math.imul(state,1664525)+1013904223)|0;data[i]=((state>>>8)/8388608-1)*(.75-.6*i/count);}
  const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),volume=audio.createGain();
  noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=1250;filter.Q.value=.65;
  volume.gain.setValueAtTime(.0001,now);
  volume.gain.exponentialRampToValueAtTime(.24,now+.012);
  volume.gain.exponentialRampToValueAtTime(.0001,now+.39);
  noise.connect(filter);filter.connect(volume);volume.connect(audio.destination);
  noise.start(now);noise.stop(now+.4);
  hungry.stingers++;
 }catch(error){hungry.sound=false;hungryUpdateControls();}
}
function hungryAudioBetween(before,after){
 if(!hungry.active||!hungry.sound||!hungry.audio||after<=before)return;
 const m=hungryMetrics();
 const from=Math.floor((w*.5-before*m.speed-m.span*.5)/m.span);
 const to=Math.floor((w*.5-after*m.speed-m.span*.5)/m.span);
 for(let i=Math.min(from,to)-1;i<=Math.max(from,to)+1;i++){
  if(i>=0)continue;
  const trigger=hungryBeat(i,m);
  const key=seed+':'+i;
  if(before<trigger&&after>=trigger&&hungry.lastScare!==key){
   hungry.lastScare=key;hungryPlaySting(hungryKind(i));
  }
 }
}
function hungryUpdateControls(){
 const toggle=document.querySelector('#house-mode'),sound=document.querySelector('#house-sound');
 toggle.textContent=hungry.active?'LEAVE HOUSE':'ENTER HOUSE';
 toggle.setAttribute('aria-pressed',String(hungry.active));
 sound.hidden=!hungry.active;
 sound.textContent=hungry.sound?'SOUND ON':'SOUND OFF';
 sound.setAttribute('aria-pressed',String(hungry.sound));
 const cap=document.querySelector('.caption');
 cap.querySelector('h1').textContent=hungry.active?'The Hungry House.':'Into the woods.';
 cap.querySelector('p').textContent=hungry.active?'A house that digests its visitors':'An endless woodland procession';
 canvas.setAttribute('aria-label',hungry.active?'A woman in a sideways-scrolling haunted house with animated horror scenes':'A woman walking on an infinite illustrated forest runway while the woodland stages a new enchanted act around her');
}
function hungryEnableAudio(){
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){hungry.sound=false;hungryUpdateControls();return;}
 try{
  if(!hungry.audio)hungry.audio=new Audio();
  hungry.sound=true;
  const res=hungry.audio.resume();
  if(res&&res.catch)res.catch(()=>{hungry.sound=false;hungryUpdateControls();});
 }catch(e){hungry.sound=false;}
 hungryUpdateControls();
}
document.querySelector('#house-mode').addEventListener('click',()=>{
 hungry.active=!hungry.active;hungry.lastScare=null;
 if(hungry.active)hungryEnableAudio();
 else if(hungry.audio)hungry.audio.suspend().catch(()=>{});
 hungryUpdateControls();if(ready)draw();
});
document.querySelector('#house-sound').addEventListener('click',()=>{
 if(hungry.sound){hungry.sound=false;if(hungry.audio)hungry.audio.suspend().catch(()=>{});hungryUpdateControls();}
 else hungryEnableAudio();
});
hungryUpdateControls();
