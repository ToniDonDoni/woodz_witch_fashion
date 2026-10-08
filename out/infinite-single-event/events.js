// An indexed procedural stream: exactly one apparition at a time.
// Pure generation is independent of RAF cadence, session history, and previous slots.
const dreamEvents = (() => {
  const SLOT = 7.0;
  const CHUNK = 12;
  const families = ['wing', 'watcher', 'ribbon'];
  const palettes = [
    ['#b6e9ff', '#79bceb'],
    ['#efc4ff', '#b374ed'],
    ['#b8ffa9', '#74da9f'],
    ['#ffc6d9', '#ee89ad'],
    ['#fce7ab', '#dbb96e']
  ];

  function hash(a, b, c=0) {
    let x = (a ^ Math.imul(b, 0x9e3779b9) ^ Math.imul(c, 0x85ebca6b)) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    return (x ^ (x >>> 16)) >>> 0;
  }
  function random(a,b,c=0) { return hash(a,b,c) / 4294967296; }
  function shuffleChunk(worldSeed,chunk) {
    const list = [];
    for (let i=0;i<CHUNK;i++) list.push(i%families.length);
    for (let i=CHUNK-1;i>0;i--) {
      const j = Math.floor(random(worldSeed,chunk*43+i,88)*(i+1));
      [list[i],list[j]] = [list[j],list[i]];
    }
    // Only adjacent slots are constrained; no recursion into other chunks.
    for(let i=1;i<list.length;i++) {
      if(list[i]===list[i-1]) {
        for(let j=i+1;j<list.length;j++) {
          if(list[j]!==list[i-1] && (i+1===list.length || list[j]!==list[i+1])) {
            [list[i],list[j]]=[list[j],list[i]];
            break;
          }
        }
      }
    }
    return list;
  }
  function specForSlot(worldSeed,index) {
    index = Math.max(0,Math.floor(index));
    const chunk = Math.floor(index/CHUNK), within = index % CHUNK;
    const code = shuffleChunk(worldSeed,chunk)[within];
    const eventSeed = hash(worldSeed,index,96311);
    const a = n => random(eventSeed,n,7919);
    const leading = .35 + a(1)*.60;
    const duration = 4.4 + a(2)*.5;
    const empty = within === Math.floor(random(worldSeed,chunk,611)*CHUNK);
    const colorIndex = Math.floor(a(3)*palettes.length);
    const morph = {
      breadth: .70 + a(4)*.72,
      height: .80 + a(5)*.40,
      curl: .15 + a(6)*.90,
      eyeScale: .75 + a(7)*.65,
      detail: 2 + Math.floor(a(8)*5),
      asymmetry: (a(9)-.5)*.34,
      bend: (a(10)-.5)*.7,
      taper: .45 + a(11)*.45,
      crest: 1 + Math.floor(a(12)*4)
    };
    return Object.freeze({
      id:index, seed:eventSeed, family:families[code],
      empty, leading, duration, trailing:SLOT-leading-duration,
      side:a(14)<.5?-1:1, height:.43+a(15)*.27,
      size:.80+a(16)*.36, palette:palettes[colorIndex],
      enter:a(17)<.5?'rise':'glide', action:a(18),
      blinkAt:1.7+a(19)*1.3, morph:Object.freeze(morph)
    });
  }
  function at(worldSeed,t) {
    const index = Math.max(0,Math.floor(t/SLOT));
    const local = Math.max(0,t-index*SLOT);
    const spec = specForSlot(worldSeed,index);
    const eventTime = local-spec.leading;
    const active = !spec.empty && eventTime>=0 && eventTime<spec.duration;
    return {index,local,spec,active,eventTime,slotLength:SLOT};
  }
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const smooth = x => {const q=clamp(x);return q*q*(3-2*q);};
  const unit = () => Math.min(w/430,h/900,1.2);

  // Phase is canonical and independent of which RAF first encounters it.
  let phaseSeed=0,phase=0;
  function jitter(n) {
    return (random(phaseSeed,phase,n)*2-1)*.62;
  }
  function point(x,y,n) {return [x+jitter(n*2),y+jitter(n*2+1)];}
  function line(points,color,width,key=1) {
    if(points.length<2)return;
    ctx.beginPath();
    for(let i=0;i<points.length;i++){
      const p=point(points[i][0],points[i][1],key+i*11);
      if(!i)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
    }
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function ellipse(x,y,rx,ry,color,weight=1) {
    ctx.beginPath();ctx.ellipse(x+jitter(415)*.1,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);
    ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.stroke();
  }
  function glowStroke(color){
    ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.shadowColor=color;ctx.shadowBlur=3.3;
  }
  function drawWing(s,t) {
    const m=s.morph, k=Math.sin(t*9+s.action*5.2);
    const flap = .78+.14*k;
    const upper = 43*m.breadth, lower = 33*m.height;
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side*flap,1);
      ctx.beginPath();ctx.moveTo(0,-3);
      ctx.bezierCurveTo(upper*.44,-upper*.78,upper*1.25,-upper*.72,upper,-7);
      ctx.bezierCurveTo(upper*.92,1,upper*.35,-3,0,2);
      ctx.moveTo(0,4);
      ctx.bezierCurveTo(upper*.88,2,lower*1.45,lower*.98,upper*.38,lower);
      ctx.bezierCurveTo(upper*.18,lower*.87,6,lower*.35,0,6);
      ctx.fillStyle='rgba(6,8,12,.72)';ctx.fill();
      ctx.strokeStyle=s.palette[0];ctx.lineWidth=1.45;ctx.stroke();
      const detail=m.detail;
      for(let n=1;n<=detail;n++){
        const fract=n/(detail+1);
        line([[3,0],[upper*(.34+fract*.60),-upper*(.57-.22*fract)],
              [upper*(.86+fract*.10),-8+fract*7]],s.palette[1],.60,n*13);
      }
      line([[2,5],[upper*.22,lower*.25],[upper*.38,lower*.68]],s.palette[1],.6,131);
      ctx.restore();
    }
    line([[0,-17],[0,-3],[1,16]],s.palette[0],2.0,37);
    line([[0,-14],[-6,-24],[-10-m.asymmetry*10,-23]],s.palette[1],.85,52);
    line([[0,-14],[5,-25],[11,-26]],s.palette[1],.85,61);
    ellipse(0,-11,2.8,4,s.palette[0],1);
    for(let n=0;n<4;n++)ellipse((n%2?1:-1)*(7+n*2),15+n*3,1.4,1.2,s.palette[1],.7);
  }
  function drawWatcher(s,t){
    const m=s.morph;
    const breathe=Math.sin(t*2.5+s.action*6.283)*1.5;
    const walkBeat=Math.sin(time*Math.PI*2.25);
    const gaze=Math.min(1,Math.max(-1,Math.sin(t*.7+s.action*4)))*1.2;
    const wBody=48*m.breadth, hBody=37*m.height;
    ctx.save();
    ctx.scale(s.side<0?1:-1,1); // snout points toward the walker
    // A coherent single-body creature, not independently scattered limbs.
    ctx.beginPath();ctx.moveTo(-wBody*.85,-4);
    ctx.quadraticCurveTo(-wBody*1.18,-hBody*.5,-wBody*1.23,-hBody*.15);
    ctx.lineTo(-wBody*.86,hBody*.18);
    ctx.quadraticCurveTo(-wBody*.40,-hBody*.72,2,-hBody*.68+breathe);
    ctx.lineTo(12,-hBody*.99+breathe);
    ctx.lineTo(17,-hBody*1.35-m.crest*1.2+breathe);
    ctx.lineTo(24,-hBody*.99+breathe);
    ctx.lineTo(33,-hBody*1.32+breathe);
    ctx.lineTo(34,-hBody*.91+breathe);
    ctx.lineTo(49*m.breadth,-hBody*.74+breathe);
    ctx.quadraticCurveTo(64*m.breadth,-hBody*.5,46*m.breadth,-hBody*.39+breathe);
    ctx.lineTo(35,-hBody*.3);
    ctx.quadraticCurveTo(37,hBody*.30,27,hBody*.50);
    ctx.lineTo(27,hBody*.94);
    ctx.lineTo(18,hBody*.95);
    ctx.lineTo(15,hBody*.28);
    ctx.lineTo(-18,hBody*.35);
    ctx.lineTo(-21,hBody*.97);
    ctx.lineTo(-31,hBody*.99);
    ctx.lineTo(-27,hBody*.18);
    ctx.quadraticCurveTo(-38,0,-wBody*.85,-4);
    ctx.closePath();
    ctx.fillStyle='rgba(4,5,10,.83)';ctx.fill();
    ctx.strokeStyle=s.palette[0];ctx.lineWidth=1.65;ctx.stroke();
    line([[-wBody*.68,-3],[-wBody*.46,hBody*.11],[-15,hBody*.29]],s.palette[1],.65,90);
    line([[18,hBody*.95],[17+Math.max(0,walkBeat)*5,hBody*.99]],s.palette[1],1.3,142);
    line([[33,-hBody*.43],[46*m.breadth,-hBody*.43]],s.palette[1],.85,105);
    // Eye blinks briefly once per encounter, distinct from 12 Hz line boil.
    const blinkTime=Math.abs(t-s.blinkAt);
    const eyeH=blinkTime<.13 ? Math.max(.17,blinkTime/.13)*2.8*m.eyeScale : 2.8*m.eyeScale;
    const eyeX=31+gaze;
    ellipse(eyeX,-hBody*.76,3.7*m.eyeScale,eyeH,s.palette[0],1.15);
    if(eyeH>1.7)ellipse(eyeX+1.2,-hBody*.76,1.15,1.2,s.palette[0],.6);
    ctx.restore();
  }
  function drawRibbon(s,t){
    const m=s.morph, segs=26;
    const points=[],secondary=[];
    for(let i=0;i<=segs;i++){
      const u=i/segs;
      const x = (u-.5)*(81*m.breadth);
      const amplitude=(17+12*m.curl)*Math.sin(Math.PI*u);
      const wave=Math.sin(u*Math.PI*(1.5+m.crest*.25)-t*(1.7+m.bend*.3)+s.action*8);
      const y=(.5-u)*60*m.height+amplitude*wave;
      points.push([x,y]);
      secondary.push([x,y+6*m.taper*(.5+.5*Math.sin(u*Math.PI))]);
    }
    line(points,s.palette[0],2.0,81);
    line(secondary,s.palette[1],.62,211);
    const head=points[points.length-1];
    ellipse(head[0]+m.asymmetry*7,head[1],3.6*m.eyeScale,4*m.eyeScale,s.palette[0],1);
    for(let i=5;i<segs-1;i+=4){
      const p=points[i];
      line([[p[0],p[1]],[p[0]+Math.sin(t+i)*2,p[1]-7*m.curl]],s.palette[1],.75,300+i);
    }
  }
  function drawOne(state) {
    if(!state.active) return;
    const {spec:s,eventTime:t}=state;
    const fade=smooth(t/.80)*smooth((s.duration-t)/.90);
    if(fade<=0)return;
    const u=unit();
    const side=s.side;
    const x=w*(side<0?.145:.855);
    const y=h*s.height;
    const arrival = (1-smooth(t/.94))*side*w*.16;
    const leave = smooth((t-(s.duration-1.1))/1.1)*side*w*.15;
    const movement = s.family==='wing'
      ? Math.sin(t*2.9+s.action*2)*6*u
      : s.family==='ribbon' ? Math.sin(t*1.1+s.action*2)*4*u : 0;
    ctx.save();
    // The model is painted afterward, so no apparition can cover her outfit.
    ctx.translate(x+arrival+leave,y+movement);
    ctx.scale(u*s.size,u*s.size);
    ctx.globalAlpha=.90*fade;
    glowStroke(s.palette[0]);
    phaseSeed=s.seed;
    phase=Math.floor(time*12);
    if(s.family==='wing') drawWing(s,t);
    else if(s.family==='watcher')drawWatcher(s,t);
    else drawRibbon(s,t);
    ctx.restore();
  }

  function render(worldSeed,t){
    const state=at(worldSeed,t);
    drawOne(state);
    return {
      activeEventCount: state.active?1:0,
      slot:state.index,
      event:state.active ? {
        id:state.spec.id, family:state.spec.family, color:state.spec.palette[0],
        side:state.spec.side, seed:state.spec.seed, eventTime:state.eventTime
      }:null,
      slotEmpty:state.spec.empty,
      phase:Math.floor(t*12), slotLength:SLOT
    };
  }
  return {SLOT,at,specForSlot,render};
})();