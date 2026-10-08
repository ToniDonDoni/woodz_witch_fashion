// Everything below is painted by Canvas. Three ink drawings per object create
// a 12 Hz line boil; its identity and smooth world translation stay independent.
const forestCache = new Map();
const forestPalette = {
  ink: '#779279', bark: '#304538', light: '#cfb984',
  leaf: '#71946b', shadow: '#10201b', moss: '#637951'
};
function forestUnit() { return Math.min(w / 430, h / 900, 1.3); }
function positiveMod(n, m) { return ((n % m) + m) % m; }
function inkBrush(c, id, phase) {
  function offset(k) { return nrand(id * 43 + k * 907 + phase * 271) * .9; }
  return {
    stroke(points, color, width = 1, key = 0, close = false, fill = null) {
      c.beginPath();
      points.forEach((p, i) => {
        const x = p[0] + offset(key + i * 2);
        const y = p[1] + offset(key + i * 2 + 1);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      if (close) c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      c.strokeStyle = color; c.lineWidth = width; c.stroke();
    },
    oval(x, y, rx, ry, fill, stroke = null, key = 0, angle = 0) {
      c.beginPath(); c.ellipse(x + offset(key) * .4, y + offset(key + 1) * .4, rx, ry, angle, 0, TAU);
      c.fillStyle = fill; c.fill();
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = .8; c.stroke(); }
    }
  };
}
function sampledCurve(a, b, c, count = 10) {
  const points = [];
  for (let k = 0; k <= count; k++) {
    const t = k / count, q = 1 - t;
    points.push([q*q*a[0] + 2*q*t*b[0] + t*t*c[0], q*q*a[1] + 2*q*t*b[1] + t*t*c[1]]);
  }
  return points;
}
function leafCluster(brush, x, y, radius, id, far) {
  const outline = [];
  for (let k = 0; k < 48; k++) {
    const angle = k * TAU / 48;
    const r = radius * (.9 + .075 * Math.sin(angle * 5 + rand(id+2)*TAU) + .055 * Math.sin(angle * 8 + rand(id+3)*TAU));
    outline.push([x + Math.cos(angle) * r, y + Math.sin(angle) * r * .65]);
  }
  brush.stroke(outline, far ? '#2c443b' : '#405f49', 1, id, true, far ? '#11251f' : '#172c23');
  for (let k = 0; k < (far ? 8 : 24); k++) {
    const angle = rand(id + 100 + k) * TAU, r = Math.sqrt(rand(id + 200 + k)) * radius * .87;
    const lx = x + Math.cos(angle)*r, ly = y + Math.sin(angle)*r*.63;
    const tilt = nrand(id + 300 + k)*.8;
    brush.stroke([[lx-5, ly+3],[lx+2, ly-4],[lx+9, ly-6]], k%3 ? '#47664a' : '#829474', .8, id+k+400);
    if (!far && k % 6 === 0) brush.oval(lx, ly, 5, 2, '#92a176', null, id+k+500, tilt);
  }
}
function paintTree(c, id, phase, far) {
  const b = inkBrush(c, id, phase), root = [170, 681];
  const lean = nrand(id+4)*30, crown = 90+rand(id+7)*70, birch = rand(id+8)>.67;
  const stemX = y => 170 + lean * (1-y/681) + Math.sin(y/120+rand(id+5)*3)*7;
  const trunk = [];
  for(let k=0;k<14;k++){const y=681-k*(681-crown)/13,thick=3+(13-k)*1.5;trunk.push([stemX(y)-thick,y]);}
  for(let k=13;k>=0;k--){const y=681-k*(681-crown)/13,thick=2+(13-k)*1.45;trunk.push([stemX(y)+thick,y]);}
  b.stroke(trunk, far ? '#3e5347' : (birch ? '#a5aa88' : '#a29170'), 1.35, 1, true,
    far ? '#162d25' : (birch ? '#697865' : '#354333'));
  const terminals = [];
  for(let level=0;level<7;level++){
    const y=570-level*62, x=stemX(y);
    for(const side of [-1,1]){
      const length=52+rand(id+level*31+side+201)*67;
      const tip=[x+side*length, y-64-rand(id+level*43+side+301)*60];
      b.stroke(sampledCurve([x,y],[x+side*length*.28,y-26],tip),far?'#354f3c':'#7c8864',4-level*.38,level*10+side+100);
      for(let twig=0;twig<2;twig++){
        const tx=tip[0]-side*(15+twig*19),ty=tip[1]+12+twig*22;
        b.stroke(sampledCurve([tx,ty],[tx-side*13,ty-21],[tx-side*25,ty-47]),'#587052',1.2,level*53+twig+side+200);
      }
      terminals.push({x:tip[0],y:tip[1],r:35+rand(id+level*41+side+901)*28,key:id+level*109+side});
    }
  }
  terminals.push({x:stemX(crown),y:crown,r:52,key:id+811});
  // Repeated, deliberately designed foliage strokes form a recognisable crown.
  for(const tip of terminals)leafCluster(b,tip.x,tip.y,tip.r,tip.key,far);
  for(let k=0;k<(far?10:32);k++){
    const y=190+rand(id+k*13+701)*455,x=stemX(y)+nrand(id+k*17+705)*11;
    if(birch)b.stroke([[x-8,y],[x+4,y-2],[x+7,y+1]],'#172a23',1.7,k+800);
    else b.stroke([[x,y],[x-3,y-13],[x+1,y-29]],'#89907166',.75,k+800);
  }
  for(const side of [-1,1]) {
    b.stroke(sampledCurve(root,[170+side*31,677],[170+side*74,693]),'#5b7551',2.5,side+901);
    b.stroke([[170+side*25,678],[170+side*47,664],[170+side*61,663]],'#657958',1.2,side+910);
  }
  if(!far)for(let k=0;k<11;k++)b.oval(156+rand(id+k+5000)*31,639+rand(id+k+5100)*40,4+rand(id+k+5200)*6,2.5,'#69815899',null,k+1500);
}
function paintFern(b,x,y,size,id){
  for(let frond=0;frond<5;frond++){
    const angle=-Math.PI*.86+frond*.42;
    const tip=[x+Math.cos(angle)*size,y+Math.sin(angle)*size];
    const curve=sampledCurve([x,y],[x+Math.cos(angle)*size*.34,y-size*.64],tip,8);
    b.stroke(curve,'#87a878',1,id+frond*71);
    for(let k=2;k<8;k++){
      const p=curve[k],q=curve[k-1],nx=p[1]-q[1],ny=q[0]-p[0],norm=Math.hypot(nx,ny)||1;
      const breadth=(1-k/9)*size*.2;
      for(const side of [-1,1])b.stroke([[p[0],p[1]],[p[0]+nx/norm*breadth*side-2,p[1]+ny/norm*breadth*side-2]],'#618f68',1.2,id+frond*81+k*3+side);
    }
  }
}
function paintMushroom(b,x,y,size,id,color){
  // A stem, a gilled underside, and a curved cap keep every mushroom readable.
  b.stroke([[x-4*size,y],[x-3*size,y-28*size],[x+5*size,y-28*size],[x+4*size,y]],'#d8c59b',.8,id,true,'#c4b789');
  b.oval(x,y-28*size,25*size,6*size,'#9f8e67','#d2b78b',id+10);
  const cap=sampledCurve([x-27*size,y-30*size],[x,y-71*size],[x+27*size,y-30*size],18);
  cap.push([x+14*size,y-27*size],[x,y-26*size],[x-14*size,y-27*size]);
  b.stroke(cap,'#ebc998',1,id+20,true,color);
  for(let g=0;g<7;g++)b.stroke([[x+(g-3)*6*size,y-28*size],[x+(g-3)*2*size,y-23*size]],'#e2cca066',.6,id+30+g);
  for(let k=0;k<6;k++){
    const dx=nrand(id+k*9+100)*19*size;
    const yy=y-32*size-(1-Math.abs(dx/(26*size)))*13*size-rand(id+k+102)*5*size;
    b.oval(x+dx,yy,2.6*size,1.5*size,'#fff0c8bb',null,id+k+200);
  }
}
function paintStump(b,x,y,id){
  const height=63+rand(id+11)*18;
  b.stroke([[x-38,y-5],[x-33,y-height],[x-21,y-height-7],[x+29,y-height-5],[x+40,y-4],[x+54,y+2],[x+18,y+4],[x-12,y+2],[x-51,y+4]],'#a09b73',1.3,id,true,'#465442');
  b.oval(x,y-height,33,10,'#85816a','#c2b18e',id+5);
  for(let k=1;k<4;k++)b.oval(x+3,y-height,k*7,k*2.1,'#85816a','#5a634d',id+6+k);
  for(let k=0;k<7;k++)b.stroke([[x-25+k*8,y-height+14],[x-29+k*8,y-23],[x-25+k*8,y-4]],'#98a07a77',.9,id+20+k);
  for(let k=0;k<7;k++)b.oval(x-31+k*10,y-12-rand(id+k+101)*13,10,5,'#738859',null,id+100+k);
  paintMushroom(b,x+34,y-26,.34,id+311,'#d2a26b');
  paintMushroom(b,x+41,y-17,.30,id+317,'#c28c64');
}
function paintLeshy(b,x,y,id){
  // A small woodland spectator: antler branches, a gnarled trunk face,
  // moss beard, twig arms, and feet. His anatomy never changes between draws.
  const tall=113+rand(id+18)*16;
  b.stroke([[x-22,y-8],[x-28,y-tall+28],[x-18,y-tall],[x+13,y-tall-7],[x+25,y-tall+24],[x+23,y-9],[x+9,y-5],[x-3,y-12]],'#c0b493',1.5,id,true,'#435445');
  for(const side of [-1,1]){
    b.stroke([[x+side*15,y-tall+3],[x+side*29,y-tall-23],[x+side*23,y-tall-46]],'#a3a87d',2,id+20+side);
    b.stroke([[x+side*28,y-tall-24],[x+side*44,y-tall-29],[x+side*51,y-tall-42]],'#a3a87d',1.2,id+24+side);
    b.oval(x+side*27,y-tall-40,8,3,'#90a673',null,id+29+side,side*.7);
    b.stroke([[x+side*24,y-68],[x+side*42,y-51],[x+side*51,y-72]],'#a1ac81',3,id+40+side);
    b.stroke([[x+side*50,y-72],[x+side*44,y-80]],'#a1ac81',1.3,id+45+side);
    b.stroke([[x+side*12,y-11],[x+side*20,y+1],[x+side*34,y+2]],'#829670',5,id+50+side);
  }
  b.oval(x-9,y-tall+40,7,5,'#101e19','#adb88b',id+60);
  b.oval(x+10,y-tall+40,7,5,'#101e19','#adb88b',id+63);
  b.stroke([[x+1,y-tall+43],[x-3,y-tall+62],[x+4,y-tall+65]],'#c6b69b',1.2,id+70);
  b.stroke([[x-8,y-tall+71],[x,y-tall+74],[x+9,y-tall+71]],'#182922',1.4,id+75);
  for(let k=0;k<12;k++){
    const bx=x-21+k*3.9,yy=y-tall+69+Math.abs(k-5.5)*1.4;
    b.stroke([[bx,yy],[bx+nrand(id+k+100)*5,yy+19+rand(id+k+110)*24],[bx+1,yy+11]],k%2?'#71956c':'#a0ab75',1.9,id+k+120);
  }
  for(let k=0;k<5;k++)b.stroke([[x-13+k*7,y-26],[x-17+k*7,y-42]],'#90a17d77',.8,id+k+200);
}
function paintGround(c,id,phase,kind){
  const b=inkBrush(c,id,phase),x=150,y=196;
  const mound=[];
  for(let k=0;k<=24;k++){const arch=Math.sin(k/24*Math.PI);mound.push([6+k*12,y+12-arch*(23+rand(id+k+501)*3)]);}
  for(let k=24;k>=0;k--){const arch=Math.sin(k/24*Math.PI);mound.push([6+k*12,y+12+arch*(6+Math.sin(k*1.2)*2)]);}
  b.stroke(mound,'#637b55',.8,id+500,true,'#192b20');
  for(let k=0;k<35;k++){
    const xx=13+rand(id+k*17+601)*273,yy=y-6+rand(id+k*19+603)*16;
    b.stroke([[xx-3,yy+2],[xx,yy-3],[xx+4,yy]],k%3?'#54704699':'#a6a26899',.8,id+k+700);
  }
  paintFern(b,39,y,30+rand(id+41)*20,id+800);
  paintFern(b,260,y,36+rand(id+42)*18,id+900);
  if(kind==='mushroom'){
    paintMushroom(b,x-38,y,1.35,id+1000,'#bf745b');
    paintMushroom(b,x+27,y,1,id+1100,'#d2a45b');
    paintMushroom(b,x+62,y,.57,id+1200,'#d3b883');
  }else if(kind==='stump'){
    paintStump(b,x,y,id+1000);
    paintMushroom(b,x-67,y,.65,id+1100,'#b27d83');
  }else if(kind==='leshy'){
    paintLeshy(b,x,y,id+1000);
    paintMushroom(b,x-61,y,.55,id+1100,'#cfa069');
  }else{
    for(let k=0;k<4;k++)paintFern(b,84+k*37,y,38+rand(id+k+1011)*24,id+1000+k*81);
    paintMushroom(b,x-56,y,.64,id+1500,'#bba172');
  }
}
function getForestArt(key,id,type,far){
  const cached=forestCache.get(key);
  if(cached)return cached;
  const width=type==='tree'?460:300,height=type==='tree'?720:220;
  const variants=[];
  for(let phase=0;phase<3;phase++){
    const art=document.createElement('canvas'),resolution=far?.5:1;art.width=width*resolution;art.height=height*resolution;
    const c=art.getContext('2d');c.scale(resolution,resolution);if(type==='tree')c.translate(60,0);c.lineJoin='round';c.lineCap='round';
    type==='tree'?paintTree(c,id,phase,far):paintGround(c,id,phase,type);
    variants.push(art);
  }
  const entry={variants,width,height};forestCache.set(key,entry);return entry;
}
function renderForestRow(layer,objects,used){
  const unit=forestUnit(),tree=layer<2;
  const spacing=[109,201,212,239][layer]*unit;
  const speed=[9,22,53,82][layer]*unit;
  const offset=time*speed;
  const margin=(tree?345:280)*unit;
  const start=Math.floor((-offset-margin)/spacing),end=Math.ceil((w-offset+margin)/spacing);
  for(let i=start;i<=end;i++){
    const id=i*1777+layer*77113+19301;
    const x=i*spacing+offset+spacing*.31+nrand(id+1)*spacing*.12;
    const factor=tree?(layer===0?.67:.87): (layer===2?.62:.86);
    const size=factor*(.86+rand(id+2)*.29)*unit;
    const kind=tree?'tree':['mushroom','stump','leshy','fern'][positiveMod(i+layer,4)];
    const y=tree?h*(layer===0?.775:.797):pathHeight(x)+(layer===2?-46:47)*Math.min(h/850,1.2);
    const key=seed+':'+layer+':'+i,art=getForestArt(key,id,kind,layer===0);used.add(key);
    ctx.save();ctx.translate(x,y);
    if(tree)ctx.rotate(Math.sin(time*.27+rand(id+4)*TAU)*.004);
    ctx.globalAlpha=layer===0?.52:layer===1?.91:1;
    const anchor=tree?681:196;
    ctx.drawImage(art.variants[positiveMod(boil,3)],-art.width*.5*size,-anchor*size,art.width*size,art.height*size);
    if(kind==='leshy'){
      const eyeY=(-113-rand(id+1018)*16+40)*size;
      const blink=Math.sin(time*1.2+rand(id+13)*21)>.987;
      // The pupils glance toward the runway; the same spectator stays intact.
      const look=Math.tanh((w*.5-x)/120)*1.5*size;
      for(const dx of [-9,10])ellipse(dx*size+look,eyeY,blink?3*size:1.8*size,blink?.5*size:2.4*size,'#d6d4a5');
    }
    ctx.restore();
    objects.push({id:layer+':'+i,kind,x,y,size,layer});
  }
}
// A hushed night sky: a deep indigo wash, faint stars, and a barely-there moon.
// Stars drift with the slowest parallax so the sky participates in the world's
// travel without competing with the walker or the forest.
function drawNightSky(){
  const horizon=h*.785;
  const sky=ctx.createLinearGradient(0,0,0,horizon);
  sky.addColorStop(0,'#070711');sky.addColorStop(.55,'#0a0a16');sky.addColorStop(1,'#0d0d19');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon);
  // Stars: sparse, dim, seeded per world index, twinkling on the boil clock.
  const spacing=44*forestUnit(),speed=6*forestUnit(),offset=time*speed;
  const start=Math.floor((-offset-40)/spacing),end=Math.ceil((w-offset+40)/spacing);
  for(let i=start;i<=end;i++){
    const id=i*613+40009;
    const x=i*spacing+offset+nrand(id+1)*spacing*.4;
    const y=horizon*(.06+rand(id+2)*.62);
    const twinkle=.10+.13*(.5+.5*Math.sin(time*(.7+rand(id+3))+rand(id+4)*TAU));
    const size=.5+rand(id+5)*.9;
    ellipse(x,y,size,size*.8,`rgba(214,206,228,${twinkle})`);
    if(rand(id+6)>.86)ellipse(x+size*1.6,y+size*.5,size*.4,size*.35,`rgba(214,206,228,${twinkle*.5})`);
  }
  // Additional distant star-fields for depth: two seeded layers of faint dust.
  for(let j=0; j<90; j++){
    const jid=j*997+12345;
    const jx=rand(jid)*w;
    const jy=rand(jid+1)*horizon;
    const jTwinkle=.05+.08*(.5+.5*Math.sin(time*(.5+rand(jid+2))+rand(jid+3)*TAU));
    ellipse(jx, jy, .4, .4, `rgba(214,206,228,${jTwinkle})`);
  }
  for(let j=0; j<60; j++){
    const jid=j*613+77003;
    const jx=rand(jid)*w;
    const jy=horizon*(.03+rand(jid+1)*.7);
    const jTwinkle=.04+.06*(.5+.5*Math.sin(time*(.4+rand(jid+2))+rand(jid+3)*TAU));
    ellipse(jx, jy, .3, .3, `rgba(224,216,236,${jTwinkle})`);
  }
  // The moon: a pale disc sunk into the dark, haloed, and only slightly brighter
  // than the sky. It hangs high left and drifts slower than any forest layer.
  const moonR=Math.min(w,h)*.052;
  const moonX=w*.24-time*1.1*forestUnit();
  const moonY=horizon*.26;
  const halo=ctx.createRadialGradient(moonX,moonY,moonR*.4,moonX,moonY,moonR*4.6);
  halo.addColorStop(0,'rgba(226,222,214,0.12)');halo.addColorStop(.5,'rgba(226,222,214,0.04)');halo.addColorStop(1,'rgba(226,222,214,0)');
  ctx.fillStyle=halo;ctx.fillRect(moonX-moonR*4.6,moonY-moonR*4.6,moonR*9.2,moonR*9.2);
  ellipse(moonX,moonY,moonR,moonR,'rgba(228,224,216,0.18)');
  // A soft terminator shadow gives the disc a waning read without a hard edge.
  const shade=ctx.createRadialGradient(moonX+moonR*.3,moonY-moonR*.2,moonR*.1,moonX,moonY,moonR*1.2);
  shade.addColorStop(0,'rgba(7,7,17,0.65)');shade.addColorStop(.6,'rgba(7,7,17,0.25)');shade.addColorStop(1,'rgba(7,7,17,0)');
  ctx.fillStyle=shade;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,TAU);ctx.fill();
  // Realistic lunar maria: sparse, irregular, seeded patches.
  const maria = [
    {ox: -.3, oy: .1, rx: .2, ry: .15, a: .12},
    {ox: .1, oy: -.2, rx: .15, ry: .1, a: .10},
    {ox: .2, oy: .3, rx: .12, ry: .18, a: .11},
    {ox: -.1, oy: .4, rx: .1, ry: .08, a: .09}
  ];
  maria.forEach(m => {
    ellipse(moonX+m.ox*moonR, moonY+m.oy*moonR, m.rx*moonR, m.ry*moonR, `rgba(130,126,120,${m.a})`);
  });
  // Small craters: sparse, seeded, and varied in size to add surface detail.
  for(let k=0; k<12; k++){
    const id=771+k*131;
    const cx=moonX+nrand(id)*moonR*.8;
    const cy=moonY+nrand(id+1)*moonR*.8;
    if(Math.hypot(cx-moonX, cy-moonY) < moonR*.9){
      const cr=moonR*(.03+rand(id+2)*.07);
      ellipse(cx, cy, cr, cr*.8, `rgba(190,186,180,${.05+rand(id+3)*.08})`);
    }
  }
  // Two prominent craters, seeded so the moon keeps its identity across frames.
  ellipse(moonX-moonR*.34,moonY+moonR*.18,moonR*.16,moonR*.13,'rgba(190,186,180,0.10)');
  ellipse(moonX+moonR*.12,moonY+moonR*.42,moonR*.10,moonR*.08,'rgba(190,186,180,0.08)');
  // A thin cloud band crossing the moon, drifting a touch faster than the stars.
  const cloudY=moonY+moonR*.9;
  for(let k=0;k<3;k++){
    const id=907+k*331;
    const cx=w*(.06+k*.34)-time*(2.4+k*.5)*forestUnit();
    const cw=moonR*(2.6+k*.9),ch=moonR*(.16+k*.05);
    ctx.save();ctx.translate(((cx% (w+cw*2))+w+cw*2)%(w+cw*2)-cw,cloudY+k*moonR*.5);
    ctx.fillStyle=`rgba(16,16,28,${.16+k*.05})`;
    ctx.beginPath();ctx.ellipse(0,0,cw,ch,0,0,TAU);ctx.fill();ctx.restore();
  }
}
function drawForestBackground(){
  const objects=[],used=new Set();
  renderForestRow(0,objects,used);renderForestRow(1,objects,used);
  // A transparent dark opening preserves the central subject's silhouette.
  const center=ctx.createRadialGradient(w*.5,h*.54,0,w*.5,h*.54,Math.min(w*.48,h*.47));
  center.addColorStop(0,'#050507aa');center.addColorStop(.6,'#05050765');center.addColorStop(1,'#05050700');
  ctx.fillStyle=center;ctx.fillRect(0,0,w,h);
  return {objects,used};
}
function drawForestGround(state){
  renderForestRow(2,state.objects,state.used);renderForestRow(3,state.objects,state.used);
  for(const key of forestCache.keys())if(!state.used.has(key))forestCache.delete(key);
  return state.objects;
}
