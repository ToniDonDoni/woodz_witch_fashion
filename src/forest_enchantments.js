// Original Canvas adaptations of the linked references; no external runtime assets.
// Every effect is a pure function of world seed, viewport and simulation time.
const enchantments = {fog:true, spores:true, plants:true, ink:true, glass:true, sparks:true};
const plantGeometry = new Map();
const fogArt = (() => {
  const art = document.createElement('canvas'); art.width=384; art.height=128;
  const c=art.getContext('2d');
  for(let i=0;i<7;i++){
    const x=42+i*49,y=62+Math.sin(i*2.1)*12;
    const g=c.createRadialGradient(x,y,0,x,y,67);
    g.addColorStop(0,'#b7a4d254');g.addColorStop(.4,'#8899be20');g.addColorStop(1,'#8197c000');
    c.fillStyle=g;c.fillRect(0,0,384,128);
  }
  return art;
})();
function smoothstep(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function drawFog(front=false){
  if(!enchantments.fog)return 0;
  const unit=forestUnit(),spacing=310*unit,speed=(front?31:14)*unit,offset=time*speed;
  const span=560*unit,start=Math.floor((-offset-span)/spacing),end=Math.ceil((w-offset+span)/spacing);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=start;i<=end;i++){
    const id=i*997+(front?707:1201),x=i*spacing+offset;
    const breath=.86+.14*Math.sin(time*.24+rand(id)*TAU);
    const y=h*(front?.85:.64)+Math.sin(time*.17+rand(id+1)*TAU)*18*unit;
    ctx.globalAlpha=(front?.19:.34)*breath;
    ctx.drawImage(fogArt,x-span/2,y-(front?32:58)*unit,span,(front?83:138)*unit);
  }
  ctx.restore();return end-start+1;
}
function sporePosition(age,k,id,origin,unit){
  const phase=rand(id+k*17)*TAU,spread=(.4+rand(id+k*19))*(8+age*5)*unit;
  return {
    x:origin.x+Math.sin(age*1.8+phase)*spread+age*7*unit,
    y:origin.y-age*(13+rand(id+k*23)*12)*unit+Math.cos(age*1.5+phase)*5*unit
  };
}
function drawSpores(forest){
  const bursts=[];if(!enchantments.spores)return bursts;
  const unit=forestUnit();ctx.save();ctx.globalCompositeOperation='screen';
  for(const mushroom of forest){
    if(mushroom.kind!=='mushroom')continue;
    const speed=forestRows.speed[mushroom.layer]*unit;
    // A mushroom releases spores as it passes the anchored walker. Derive the
    // crossing time analytically, so seeking, pausing and frame drops agree.
    const age=(mushroom.x-w*.5)/speed;
    if(age<0||age>8)continue;
    const id=Number(mushroom.id.split(':')[1])*173+mushroom.layer*1301;
    const origin={x:mushroom.x-38*mushroom.size,y:mushroom.y-70*mushroom.size};
    const envelope=smoothstep(0,.55,age)*(1-smoothstep(5,8,age));
    const color=mushroom.layer===2?'#92f5d9':'#ffd48c';
    // A soft light in the emitting cap, then fine drawn ribbons and points.
    const glow=ctx.createRadialGradient(origin.x,origin.y,0,origin.x,origin.y,26*unit);
    glow.addColorStop(0,`rgba(170,224,180,${envelope*.17})`);glow.addColorStop(1,'#92f5d900');
    ctx.fillStyle=glow;ctx.fillRect(origin.x-26*unit,origin.y-26*unit,52*unit,52*unit);
    for(let k=0;k<22;k++){
      const t=Math.max(0,age-rand(id+k*31)*.7),p=sporePosition(t,k,id,origin,unit);
      ctx.beginPath();
      for(let j=0;j<=7;j++){
        const q=sporePosition(Math.max(0,t-j*.075),k,id,origin,unit);
        j?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);
      }
      ctx.strokeStyle=color;ctx.globalAlpha=envelope*.24;ctx.lineWidth=.65*unit;ctx.stroke();
      ctx.globalAlpha=envelope*(.55+.35*Math.sin(time*2+k)**2);
      ellipse(p.x,p.y,(k%5===0?1.8:1)*unit,(k%5===0?1.8:1)*unit,color);
      if(k%7===0){ctx.globalAlpha=envelope*.32;ellipse(p.x,p.y,3.6*unit,3.6*unit,color);}
    }
    bursts.push({id:mushroom.id,age,origin,count:22});
  }
  ctx.restore();return bursts;
}
function getPlantGeometry(id){
  const key=`${seed}:${id}`;
  if(plantGeometry.has(key))return plantGeometry.get(key);
  const fronds=[];
  for(let f=0;f<7;f++){
    const length=128+rand(id+f*31)*68,leaves=[];
    for(let k=1;k<=9;k++){
      const t=k/11,y=-length*t,bend=Math.sin(t*Math.PI*.8)*length*.13;
      const reach=length*.21*Math.sin(t*Math.PI)*(.9+rand(id+f*101+k)*.2);
      for(const side of [-1,1])leaves.push({x:bend,y,reach,side,key:f*100+k*7+side});
    }
    fronds.push({angle:(f-3)*.34,length,leaves});
  }
  plantGeometry.set(key,fronds);return fronds;
}
function drawFrond(frond,id,opening,palette){
  ctx.save();ctx.rotate(frond.angle*(1.65-opening*.65));ctx.scale(.42+.58*opening,.14+.86*opening);
  const brush=inkBrush(ctx,id,positiveMod(boil,3));
  const endX=Math.sin(Math.PI*.8)*frond.length*.13;
  ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(frond.length*.18,-frond.length*.55,endX,-frond.length);
  ctx.strokeStyle=palette.edge;ctx.lineWidth=1.25;ctx.stroke();
  for(const leaf of frond.leaves){
    const {x,y,reach,side,key}=leaf;
    const tipX=x+side*reach,tipY=y-reach*.5;
    // Folded main leaves contain smaller repeated leaflets: a two-level fern.
    brush.stroke([[x,y],[x+side*reach*.43,y-reach*.65],[tipX,tipY],[x+side*reach*.46,y-reach*.05]],palette.edge,.55,key,true,palette.fill);
    brush.stroke([[x,y],[tipX,tipY]],palette.vein,.5,key+1);
    for(let j=1;j<=3;j++){
      const q=j/4,bx=x+(tipX-x)*q,by=y+(tipY-y)*q,s=reach*(1-q)*.25;
      for(const sign of [-1,1])brush.stroke([[bx,by],[bx+side*s*.8,by+sign*s],[bx+side*s*.25,by]],palette.vein,.45,key+j*17+sign,true,palette.fold);
    }
  }
  // A curled tip continues the fern's recursive shape.
  ctx.beginPath();
  for(let k=0;k<30;k++){
    const a=k/29*Math.PI*3,r=(1-k/29)*8;
    const x=endX+Math.sin(a)*r,y=-frond.length+8-Math.cos(a)*r;
    k?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.strokeStyle=palette.edge;ctx.lineWidth=.85;ctx.stroke();ctx.restore();
}
function drawFractalPlants(){
  const plants=[],used=new Set();
  if(!enchantments.plants){plantGeometry.clear();return plants;}
  const unit=forestUnit(),spacing=680*unit,speed=22*unit,offset=time*speed,margin=220*unit;
  const start=Math.floor((-offset-margin)/spacing),end=Math.ceil((w-offset+margin)/spacing);
  const palettes=[
    {fill:'#263f42',fold:'#385957',edge:'#a5d6bd',vein:'#72a7a0'},
    {fill:'#392a4f',fold:'#57415d',edge:'#d4acd9',vein:'#a67bac'},
    {fill:'#414032',fold:'#625239',edge:'#dfc28b',vein:'#b4966a'}
  ];
  for(let i=start;i<=end;i++){
    const id=i*2017+99103,x=i*spacing+offset+rand(id)*spacing*.15;
    const size=(1.02+rand(id+2)*.32)*unit,y=h*.79;
    const radius=180*size;
    if(x+radius<0||x-radius>w)continue;
    used.add(`${seed}:${id}`);
    const opening=smoothstep(-radius*.5,w*.28,x)*(1-.8*smoothstep(w*.72,w+radius*.5,x));
    const alpha=smoothstep(-radius,-radius*.2,x)*(1-smoothstep(w+radius*.15,w+radius,x));
    const palette=palettes[positiveMod(i+seed,3)],fronds=getPlantGeometry(id);
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.rotate(Math.sin(time*.35+rand(id)*TAU)*.025);
    ctx.globalAlpha=.8*alpha;
    for(const frond of fronds)drawFrond(frond,id,opening,palette);
    ctx.restore();plants.push({id,x,y,size,opening,palette:positiveMod(i+seed,3)});
  }
  for(const id of plantGeometry.keys())if(!used.has(id))plantGeometry.delete(id);
  return plants;
}
function bindEnchantmentControls(){
  for(const name of Object.keys(enchantments)){
    const checkbox=document.querySelector(`[data-effect="${name}"]`);
    checkbox.checked=enchantments[name];
    checkbox.onchange=()=>{enchantments[name]=checkbox.checked;if(ready)draw();};
  }
}
