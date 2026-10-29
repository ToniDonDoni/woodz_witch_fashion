// The Hungry House is an opt-in world sharing the approved walker and the
// original animation clock. All scenery is deterministic at a given seed/time.
const hungryRooms=['foyer','wardrobe','dining','mirror','nursery','inkwall','stomach'];
const hungry={active:false,sound:false,audio:null,lastScare:null,stingers:0,warnings:0,mixer:null,sources:new Set(),played:new Set(),audioEvents:[],lastSound:null};
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
// Undertow: the selected translucent ectoplasm study, shared by house apparitions.
function hungrySpirit(cx,cy,r,age,id,drawingContext=ctx){
 const c=drawingContext,t=age+(id%17)*.23,TAU=Math.PI*2;
 const color=(rgb,alpha)=>`rgba(${rgb},${Math.max(0,Math.min(1,alpha))})`;
 function path(c,s,fill,stroke,width=1){const p=new Path2D(s);if(fill){c.fillStyle=fill;c.fill(p)}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke(p)}return p}
 function ellipse(c,x,y,rx,ry,fill,rot=0){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,rot,0,TAU);c.fill()}
 function gradient(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [p,v]of stops)g.addColorStop(p,v);return g}
 function glow(c,x,y,r,rgb,alpha,stretch=1){c.save();c.translate(x,y);c.scale(1,stretch);const g=c.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,color(rgb,alpha));g.addColorStop(.36,color(rgb,alpha*.47));g.addColorStop(1,color(rgb,0));c.fillStyle=g;c.fillRect(-r,-r,r*2,r*2);c.restore()}

 // Preserve the approved Undertow proportions in the room's local coordinates.
 c.save();c.translate(cx,cy);c.scale(r/150,r/150);c.translate(-240,-315);
 const rgb='125,218,242',p=Math.sin(t*.78),q=Math.cos(t*.62);c.save();c.translate(p*9,Math.sin(t*.8+1)*9);
 c.save();c.globalCompositeOperation='screen';glow(c,247,282,130,rgb,.16,1.7);glow(c,240,172,49,'170,237,248',.18,1.3);c.restore();
 const shape=`M 242 100 C 200 92 185 134 192 177 C 198 207 168 220 155 253 C 141 286 154 325 117 363 C 165 353 179 328 179 296 C 196 349 170 379 159 422 C 146 464 157 503 ${183+p*25} 543 C 205 570 244 570 ${264+q*30} 552 C 218 567 193 523 211 496 C 240 454 282 431 288 385 C 295 348 272 324 292 289 C 305 322 315 332 357 343 C 323 315 338 268 317 241 C 294 211 278 210 285 173 C 293 129 278 102 242 100 Z`;
 const g=gradient(c,150,120,310,554,[[0,color(rgb,.24)],[.29,color(rgb,.18)],[.65,color(rgb,.14)],[1,color(rgb,0)]]);
 c.save();c.filter='blur(5px)';path(c,shape,color(rgb,.12));c.restore();path(c,shape,g);
 // Caustic folds occupy a continuous fluid silhouette, with open flowing tails.
 c.save();c.clip(new Path2D(shape));
 for(let j=0;j<24;j++){
  const x=142+j*8,w=Math.sin(t*.7+j*.4)*16;const sy=95+j%5*13;
  c.beginPath();c.moveTo(x,sy);c.bezierCurveTo(x+45+w,205,x-65,295,x+13,366);c.bezierCurveTo(x+60+w,425,x-70+w,494,x+22,572);
  c.strokeStyle=gradient(c,0,sy,0,580,[[0,color(rgb,.03)],[.26,color(rgb,.19)],[.6,color(rgb,.08)],[1,color(rgb,0)]]);c.lineWidth=j%5===0?4:.7;c.stroke();
 }
 c.restore();
 // Asymmetric almost-human face suspended under a curved ectoplasmic brow.
 path(c,'M 210 153 C 211 128 232 116 251 122 C 281 134 266 167 265 186 C 263 210 246 230 231 219 C 216 207 205 180 210 153 Z',gradient(c,210,130,266,230,[[0,color(rgb,.13)],[.4,'#14303d70'],[1,'#13344212']]));
 path(c,'M 209 148 C 212 124 231 115 251 121 C 267 126 273 140 273 155',null,color('196,246,250',.53),1.15);
 path(c,'M 217 169 C 221 164 230 162 236 168 C 231 180 220 184 217 169 Z M 249 167 C 254 159 262 159 267 163 C 267 176 255 180 249 167 Z',color('9,29,43',.72));
 path(c,'M 244 169 Q 235 187 240 191 M 238 204 Q 244 201 250 205',null,color(rgb,.21),1);
 // Bright edge filaments flow into dimmer curls rather than thick rigid limbs.
 for(let j=0;j<8;j++){
  const a=j/7,xx=192+a*92,yy=239+Math.sin(j)*22,w=Math.sin(t*.65+j)*28;
  const s=`M ${xx} ${yy} C ${xx+50} 345 ${xx-76+w} 369 ${xx-24} 442 C ${xx+20} 506 ${xx-10+w} 554 ${xx+75+w} ${548+j*4}`;
  path(c,s,null,gradient(c,0,yy,0,580,[[0,color(rgb,.02)],[.3,color(rgb,.29)],[.73,color(rgb,.17)],[1,color(rgb,0)]]),j%3? .85:2.2);
 }
 path(c,`M 239 101 C 197 100 187 139 193 176 C 201 211 162 228 156 260 C 150 287 155 322 126 352`,null,color(rgb,.47),1.15);
 path(c,'M 277 122 C 294 158 271 186 289 213 C 299 229 321 234 322 269',null,color(rgb,.34),.9);
 for(let j=0;j<7;j++){
  const a=t*.55+j*2.399,x=240+Math.cos(a)*(87+j*7),y=334+Math.sin(a*.7+j)*139;
  glow(c,x,y,7,rgb,.20,1.4);ellipse(c,x,y,1.3,2.6,color(rgb,.41),-.3);
 }
 c.restore();c.restore();
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
  // The selected liquid apparition surges out after the false closing.
  if(strength>0){
   ctx.save();ctx.globalAlpha=strength;
   const lunge=110*Math.sin(Math.PI*Math.min(progress/1.2,1));
   hungrySpirit(488-lunge,-292,120,time,id+5);
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
  if(strength>0)hungrySpirit(454,-238,52,time,id+29);
 }else if(kind==='inkwall'){
  hungryDoor(425,-440,145,433,0,id);
  if(progress> -3.4){
   for(let p=0;p<6;p++){
    const x=455+p*12,y=-420+p*34;
    hungryStroke([[x,y],[x-25-Math.sin(time*2+p)*19,y+64],[x+10-Math.cos(time+p)*11,y+107]],'#06070ad9',5,id+p+51);
   }
  }
  if(strength>0){hungryHand(494,-237,.4+strength*1.4,strength,id+83);hungrySpirit(515,-332,32,time,id+90);}
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
  if(strength>0)hungrySpirit(428,-236,50+strength*35,time,id+180);
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
  house:{enabled:true,sound:hungry.sound&&!!hungry.audio,rooms,phase:focal.phase,chapter:focal.kind,stingers:hungry.stingers,warnings:hungry.warnings,lastSound:hungry.lastSound,liveVoices:hungry.sources.size,audioProfiles:Object.keys(hungrySoundProfiles)},
  forest:[],foreground:[],events:[],cacheSize:0,activeCount:rooms.length};
}
// Cinema horror cues: a quiet foreshadowing texture followed by a layered,
// room-specific impact. Every sample is synthesized locally; no audio files.
const hungrySoundProfiles={
 foyer:{name:'settling timber',impact:530,noiseEnd:260,root:94,shriek:191,tail:.65},
 wardrobe:{name:'wood slam and metal hinges',impact:940,noiseEnd:390,root:143,shriek:376,tail:.86},
 dining:{name:'table strike and cutlery',impact:1480,noiseEnd:620,root:117,shriek:522,tail:.74},
 mirror:{name:'glass snap and ghost choir',impact:2900,noiseEnd:1190,root:125,shriek:690,tail:1.06},
 nursery:{name:'warped music box and shriek',impact:2350,noiseEnd:810,root:98,shriek:831,tail:.96},
 inkwall:{name:'wet ink tearing through plaster',impact:1610,noiseEnd:330,root:107,shriek:438,tail:.90},
 stomach:{name:'body pulse, bone and throat',impact:675,noiseEnd:180,root:72,shriek:206,tail:1.36}
};
function hungrySoundBus(){
 if(hungry.mixer)return hungry.mixer;
 const a=hungry.audio;
 const input=a.createGain(),compressor=a.createDynamicsCompressor(),
       softClip=a.createWaveShaper(),master=a.createGain(),
       delay=a.createDelay(.5),echo=a.createGain(),echoFilter=a.createBiquadFilter();
 compressor.threshold.value=-23;compressor.knee.value=12;compressor.ratio.value=5;
 compressor.attack.value=.004;compressor.release.value=.19;
 const curve=new Float32Array(2049);
 for(let i=0;i<curve.length;i++){
  const x=(i/(curve.length-1))*2-1;
  curve[i]=Math.tanh(1.35*x)/Math.tanh(1.35);
 }
 softClip.curve=curve;softClip.oversample='2x';
 master.gain.value=.48;
 delay.delayTime.value=.16;echo.gain.value=.16;
 echoFilter.type='lowpass';echoFilter.frequency.value=1900;
 input.connect(compressor);input.connect(delay);
 delay.connect(echoFilter);echoFilter.connect(echo);echo.connect(compressor);
 compressor.connect(softClip);softClip.connect(master);master.connect(a.destination);
 hungry.mixer={input,master,compressor};
 return hungry.mixer;
}
function hungrySource(source,at,length){
 hungry.sources.add(source);
 source.onended=()=>{hungry.sources.delete(source);try{source.disconnect();}catch(e){}};
 source.start(at);source.stop(at+length+.025);
}
function hungryEnvelope(gain,at,attack,length,peak){
 const g=gain.gain,a=Math.max(.002,Math.min(attack,length*.3));
 g.cancelScheduledValues(at);
 g.setValueAtTime(.0001,at);
 g.exponentialRampToValueAtTime(Math.max(.0002,peak),at+a);
 g.exponentialRampToValueAtTime(.0001,at+length);
}
function hungryTone(at,f0,f1,length,peak,type='sine',attack=.012,modulation=0){
 const audio=hungry.audio;
 const osc=audio.createOscillator(),amp=audio.createGain();
 osc.type=type;
 osc.frequency.setValueAtTime(Math.max(25,f0),at);
 osc.frequency.exponentialRampToValueAtTime(Math.max(25,f1),at+length);
 hungryEnvelope(amp,at,attack,length,peak);
 if(modulation){
  const trem=audio.createOscillator(),depth=audio.createGain();
  trem.frequency.value=modulation;depth.gain.value=Math.min(60,f0*.12);
  trem.connect(depth);depth.connect(osc.frequency);
  hungrySource(trem,at,length);
 }
 osc.connect(amp);amp.connect(hungrySoundBus().input);
 hungrySource(osc,at,length);
}
function hungryNoise(at,startFreq,endFreq,length,peak,seedValue,attack=.012,q=.68){
 const audio=hungry.audio,rate=audio.sampleRate,count=Math.ceil(rate*length);
 const buffer=audio.createBuffer(1,count,rate),samples=buffer.getChannelData(0);
 let state=(seedValue|0)||1;
 for(let i=0;i<count;i++){
  state^=state<<13;state^=state>>>17;state^=state<<5;
  // Remove any DC offset and taper ends before the amplitude envelope.
  samples[i]=((state>>>0)/2147483648-1)*Math.min(1,i/96,(count-i)/96);
 }
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),amp=audio.createGain();
 source.buffer=buffer;filter.type='bandpass';filter.Q.value=q;
 filter.frequency.setValueAtTime(Math.max(35,startFreq),at);
 filter.frequency.exponentialRampToValueAtTime(Math.max(35,endFreq),at+length);
 hungryEnvelope(amp,at,attack,length,peak);
 source.connect(filter);filter.connect(amp);amp.connect(hungrySoundBus().input);
 hungrySource(source,at,length);
}
function hungryStopSounds(){
 if(hungry.mixer)hungry.mixer.master.gain.setValueAtTime(0,hungry.audio.currentTime);
 for(const source of hungry.sources){
  try{source.stop(0);}catch(e){}
 }
 hungry.sources.clear();
}
// Sound-design grammar: CREEP -> BREATH / SILENCE -> CUT -> BODY -> TAIL.
// Distinct profiles avoid recycling the same generic laser-buzz for every room.
function hungryRenderSound(kind,stage,roomIndex){
 if(!hungry.sound||!hungry.audio||hungry.audio.state!=='running')return false;
 const audio=hungry.audio,p=hungrySoundProfiles[kind]||hungrySoundProfiles.foyer;
 const variation=1+((Math.abs(roomIndex)%5)-2)*.035;
 const seedValue=(roomIndex*19441+seed*73+kind.length*107)|0;
 const now=audio.currentTime+.004;
 try{
  hungrySoundBus().master.gain.setTargetAtTime(.48,now,.014);
  if(stage==='warning'){
   // Two detuned voices and a creeping filtered creak; leave a near-silent
   // gap before impact instead of continuously increasing perceived loudness.
   hungryTone(now,p.root*.85,p.root*1.1,1.39,.038,'triangle',.34,3.7);
   hungryTone(now,p.root*1.073,p.root*.93,1.28,.031,'sine',.26,2.4);
   hungryNoise(now,180,p.impact*.8,1.34,.045,seedValue,.38,1.5);
   if(kind==='nursery'){
    // Three original, dissonant music-box plinks (not a recognizable melody).
    for(let n=0;n<3;n++)hungryTone(now+n*.29,600*[1,1.414,1.059][n],430, .28,.023,'sine',.009);
   }
   if(kind==='stomach')hungryTone(now,57,79,1.24,.064,'sine',.2,4.1);
   hungry.warnings++;
  }else{
   const tail=p.tail;
   // The transient defines the strike: different materials have different
   // spectral centres, while the pitch-dropping body remains audible on phones.
   hungryNoise(now,p.impact*variation,p.noiseEnd,Math.min(.48,tail),.26,seedValue+7,.003,.72);
   hungryNoise(now,p.impact*2.15,p.impact*.7,.115,.10,seedValue+901,.002,1.6);
   hungryTone(now,Math.max(98,p.root*1.6),Math.max(48,p.root*.62),tail,.26,'sine',.006,0);
   // Clustered, unstable intervals evoke a string/brass stinger, not an arcade laser.
   hungryTone(now,p.shriek*variation,p.shriek*.71,tail*.65,.082,'sawtooth',.018,9.6);
   hungryTone(now+ .016,p.shriek*variation*1.069,p.shriek*.77,tail*.55,.063,'triangle',.014,11.3);
   if(kind==='wardrobe'){
    hungryNoise(now+.09,2500,380, .48,.19,seedValue+44,.016,3.5);
    hungryTone(now+.06,720,240,.46,.075,'square',.024);
   }else if(kind==='dining'){
    for(let n=0;n<3;n++)hungryTone(now+n*.067,1420+n*230,520,.25,.055,'triangle',.006);
   }else if(kind==='mirror'){
    hungryNoise(now+.04,4200,1050,.72,.13,seedValue+79,.018,2.4);
    hungryTone(now+.11,840,485,.63,.062,'sine',.07,12.7);
   }else if(kind==='nursery'){
    hungryTone(now+.04,1047,330,.64,.085,'sawtooth',.026,15);
    hungryNoise(now+.19,3300,710,.46,.068,seedValue+99,.045,3.1);
   }else if(kind==='inkwall'){
    hungryNoise(now+.13,450,150,.65,.19,seedValue+101,.06,.52);
    hungryTone(now+.07,205,90,.83,.088,'sawtooth',.07,5.4);
   }else if(kind==='stomach'){
    hungryTone(now+.03,78,41,1.35,.17,'sawtooth',.075,4.8);
    hungryNoise(now+.15,320,90,1.14,.14,seedValue+202,.08,.48);
    hungryTone(now+.16,178,66,1.12,.11,'triangle',.06,6.7);
   }
   hungry.stingers++;
  }
  hungry.lastSound={kind,stage,profile:p.name,variation};
  hungry.audioEvents.push({kind,stage,roomIndex});
  if(hungry.audioEvents.length>20)hungry.audioEvents.shift();
  return true;
 }catch(error){
  hungryStopSounds();hungry.sound=false;hungryUpdateControls();
  return false;
 }
}
function hungryAudioBetween(before,after){
 if(!hungry.active||!hungry.sound||!hungry.audio||hungry.audio.state!=='running'||after<=before)return;
 const m=hungryMetrics();
 const from=Math.floor((w*.5-before*m.speed-m.span*.5)/m.span);
 const to=Math.floor((w*.5-after*m.speed-m.span*.5)/m.span);
 for(let i=Math.min(from,to)-2;i<=Math.max(from,to)+2;i++){
  if(i>=0)continue;
  const trigger=hungryBeat(i,m),kind=hungryKind(i);
  for(const [stage,delta] of [['warning',-1.84],['impact',0]]){
   const eventTime=trigger+delta,key=seed+':'+i+':'+stage;
   if(before<eventTime&&after>=eventTime&&!hungry.played.has(key)){
    hungry.played.add(key);
    if(hungry.played.size>80)hungry.played.delete(hungry.played.values().next().value);
    hungryRenderSound(kind,stage,i);
   }
  }
 }
}
function hungryUpdateControls(){
 document.body.classList.toggle('house-active',hungry.active);
 const toggle=document.querySelector('#house-mode'),sound=document.querySelector('#house-sound');
 toggle.textContent=hungry.active?'LEAVE HOUSE':'ENTER HOUSE';
 toggle.setAttribute('aria-pressed',String(hungry.active));
 toggle.setAttribute('aria-label',hungry.active?'Leave the haunted house':'Enter the haunted house');
 sound.hidden=!hungry.active;
 sound.textContent=hungry.sound?'SOUND ON':'SOUND OFF';
 sound.setAttribute('aria-pressed',String(hungry.sound));
 sound.setAttribute('aria-label',hungry.sound?'Mute scary sounds':'Enable scary sounds');
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
  if(hungry.mixer)hungry.mixer.master.gain.setValueAtTime(.48,hungry.audio.currentTime);
  const res=hungry.audio.resume();
  if(res&&res.catch)res.catch(()=>{hungry.sound=false;hungryUpdateControls();});
 }catch(e){hungry.sound=false;}
 hungryUpdateControls();
}
document.querySelector('#house-mode').addEventListener('click',()=>{
 hungry.active=!hungry.active;hungry.lastScare=null;
 if(hungry.active)hungryEnableAudio();
 else if(hungry.audio){hungryStopSounds();hungry.audio.suspend().catch(()=>{});}
 hungryUpdateControls();if(ready)draw();
});
document.querySelector('#house-sound').addEventListener('click',()=>{
 if(hungry.sound){hungry.sound=false;if(hungry.audio){hungryStopSounds();hungry.audio.suspend().catch(()=>{});}hungryUpdateControls();}
 else hungryEnableAudio();
});
hungryUpdateControls();
