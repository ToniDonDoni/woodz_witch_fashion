// Four original Canvas 2D interpretations of Opus 5.5 video references.
// Deterministic by world seed, viewport and simulation time. No runtime assets.

function drawMagneticCurrents(){
  const lines=[];
  if(!enchantments.magnetic)return lines;
  const unit=forestUnit();
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
  // Broad, fine magnetic flux strokes travel across the distant treeline.
  for(let i=0;i<9;i++){
    const id=51023+i*1277,phase=time*.27+i*.68;
    const baseY=h*(.26+i*.052);
    const color=i%3===0?'#a0f5d6':i%3===1?'#bda7f6':'#91d9ef';
    for(let pass=0;pass<2;pass++){
      ctx.beginPath();
      for(let j=0;j<=32;j++){
        const x=w*j/32;
        const dx=x/w*TAU*1.55;
        const y=baseY+Math.sin(dx+phase)*22*unit+
          Math.sin(dx*2.2-time*.17+i*.8)*9*unit;
        if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.globalAlpha=pass===0?.15:.60;
      ctx.strokeStyle=color;ctx.lineWidth=(pass===0?7:1.35)*unit;
      ctx.stroke();
    }
    // Magnetic filings slide along the same field, rather than random sparks.
    for(let k=0;k<13;k++){
      const x=positiveMod((k+.5)/13*w+time*(9+rand(id+k)*13)*unit+i*17,w);
      const dx=x/w*TAU*1.55;
      const y=baseY+Math.sin(dx+phase)*22*unit+Math.sin(dx*2.2-time*.17+i*.8)*9*unit;
      const length=(2+rand(id+k*11)*4)*unit;
      ctx.globalAlpha=.70;ctx.strokeStyle=color;ctx.lineWidth=1.15*unit;
      ctx.beginPath();ctx.moveTo(x-length,y);ctx.lineTo(x+length,y);ctx.stroke();
    }
    lines.push({id,y:baseY});
  }
  ctx.restore();return lines;
}

function drawAncientRuins(){
  const ruins=[];
  if(!enchantments.ruins)return ruins;
  const unit=forestUnit();
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineJoin='round';
  for(let i=0;i<3;i++){
    const id=71031+i*829,x=w*(.14+i*.36)+Math.sin(time*.14+i)*11*unit;
    const y=h*(.76+(i%2)*.018),size=(.74+rand(id)*.23)*unit;
    const left=-55*size,right=55*size,top=-168*size;
    ctx.save();ctx.translate(x,y);
    // Shadow masonry and luminous lintel are behind the real tree rows.
    const stone=ctx.createLinearGradient(0,top,0,0);
    stone.addColorStop(0,'rgba(71,85,93,.46)');stone.addColorStop(1,'rgba(24,26,42,.38)');
    ctx.fillStyle=stone;
    for(const x0 of [left-17*size,right]){
      ctx.fillRect(x0,top+43*size,17*size,117*size);
      ctx.strokeStyle='rgba(177,208,217,.42)';
      ctx.lineWidth=1.2*size;ctx.strokeRect(x0,top+43*size,17*size,117*size);
    }
    ctx.beginPath();ctx.moveTo(left-17*size,top+50*size);
    ctx.quadraticCurveTo(0,top-57*size,right+17*size,top+50*size);
    ctx.lineTo(right+9*size,top+72*size);
    ctx.quadraticCurveTo(0,top-19*size,left-9*size,top+72*size);
    ctx.closePath();ctx.fillStyle='rgba(70,81,108,.47)';ctx.fill();
    ctx.strokeStyle='rgba(176,228,211,.75)';ctx.lineWidth=2*size;ctx.stroke();
    // The core is a faint, breathing threshold, not an opaque overlay.
    const glow=ctx.createRadialGradient(0,-74*size,0,0,-74*size,62*size);
    const pulse=.15+.055*Math.sin(time*.55+i*2);
    glow.addColorStop(0,`rgba(158,225,229,${pulse})`);
    glow.addColorStop(1,'rgba(158,225,229,0)');
    ctx.fillStyle=glow;ctx.fillRect(-65*size,-143*size,130*size,138*size);
    for(let k=0;k<7;k++){
      const angle=k*TAU/7+time*.13;
      const rx=Math.cos(angle)*42*size,ry=-96*size+Math.sin(angle)*31*size;
      ctx.fillStyle='rgba(206,246,234,.75)';ctx.beginPath();
      ctx.arc(rx,ry,(1.8+.5*Math.sin(time+k))*size,0,TAU);ctx.fill();
    }
    ctx.restore();
    ruins.push({id,x,y,width:144*size,height:185*size});
  }
  ctx.restore();return ruins;
}

function drawSpectralButterflies(){
  const butterflies=[];
  if(!enchantments.spectral)return butterflies;
  const unit=forestUnit();
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<2;i++){
    const id=29017+i*3137;
    const x=w*(i===0?.26:.75)+Math.sin(time*.49+i*2.8)*40*unit;
    const y=h*(i===0?.47:.38)+Math.cos(time*.61+i*1.6)*34*unit;
    const size=(.78+rand(id)*.30)*unit;
    const flap=.34+.66*Math.abs(Math.sin(time*2.0+i*2.6));
    ctx.save();ctx.translate(x,y);
    ctx.rotate(Math.sin(time*.35+i)*.11);
    // Four broad translucent wings with bright veining, like a moving X-ray.
    for(const side of [-1,1]){
      ctx.save();ctx.scale(side*flap,1);
      for(const [upper,scale] of [[true,1],[false,.76]]){
        ctx.beginPath();ctx.moveTo(0,0);
        if(upper){
          ctx.bezierCurveTo(25*size,-75*size,101*size,-101*size,88*size,-30*size);
          ctx.bezierCurveTo(70*size,-7*size,38*size,2*size,0,0);
        }else{
          ctx.bezierCurveTo(27*size,12*size,92*size,47*size,53*size,77*size);
          ctx.bezierCurveTo(13*size,68*size,9*size,27*size,0,0);
        }
        ctx.closePath();
        const g=ctx.createLinearGradient(0,-65*size,85*size,70*size);
        g.addColorStop(0,'rgba(212,242,250,.57)');
        g.addColorStop(.55,'rgba(137,112,221,.42)');
        g.addColorStop(1,'rgba(105,245,204,.16)');
        ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(204,247,246,.86)';
        ctx.globalAlpha=.78;ctx.lineWidth=1.7*size;ctx.stroke();
        ctx.globalAlpha=.62;
        for(let k=0;k<4;k++){
          ctx.beginPath();ctx.moveTo(0,-2*size);
          ctx.quadraticCurveTo((34+k*5)*size,(upper?-45:19)*size,
            (48+k*9)*size,(upper?(-54+k*10):(35+k*9))*size);
          ctx.strokeStyle='rgba(226,252,248,.57)';
          ctx.lineWidth=.8*size;ctx.stroke();
        }
      }
      ctx.restore();
    }
    ctx.globalAlpha=.9;ctx.strokeStyle='#d5f8ef';ctx.lineWidth=3*size;
    ctx.beginPath();ctx.moveTo(0,-24*size);ctx.lineTo(0,27*size);ctx.stroke();
    ctx.lineWidth=1.2*size;ctx.beginPath();
    ctx.moveTo(0,-22*size);ctx.quadraticCurveTo(-17*size,-41*size,-19*size,-43*size);
    ctx.moveTo(0,-22*size);ctx.quadraticCurveTo(17*size,-41*size,19*size,-43*size);
    ctx.stroke();
    ctx.restore();butterflies.push({id,x,y,span:176*size});
  }
  ctx.restore();return butterflies;
}

function drawGoldenSandfall(){
  const curtains=[];
  if(!enchantments.sandfall)return curtains;
  const unit=forestUnit();
  ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
  for(let group=0;group<5;group++){
    const id=80119+group*1913;
    const x=w*(.08+group*.21)+Math.sin(time*.2+group)*12*unit;
    const top=h*(.24+(group%2)*.04),height=h*.42;
    const width=(35+rand(id)*32)*unit;
    // Gold falls in fine overlapping curtains, with animated scalloped strands.
    const gradient=ctx.createLinearGradient(0,top,0,top+height);
    gradient.addColorStop(0,'rgba(255,237,172,.02)');
    gradient.addColorStop(.22,'rgba(255,218,126,.43)');
    gradient.addColorStop(.76,'rgba(243,169,104,.36)');
    gradient.addColorStop(1,'rgba(243,169,104,0)');
    ctx.strokeStyle=gradient;ctx.lineWidth=1.6*unit;ctx.globalAlpha=.75;
    for(let strand=0;strand<17;strand++){
      const frac=strand/16,xx=x+(frac-.5)*width;
      ctx.beginPath();
      for(let segment=0;segment<=9;segment++){
        const fy=segment/9,py=top+fy*height;
        const px=xx+Math.sin(fy*10+time*.65+strand*.77+group)*6*unit;
        if(segment===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    for(let grain=0;grain<18;grain++){
      const age=positiveMod(time*(.15+rand(id+grain)*.12)+rand(id+grain*97),1);
      const px=x+(rand(id+grain*17)-.5)*width+Math.sin(time+grain)*4*unit;
      const py=top+age*height;
      ctx.globalAlpha=.45+.40*(1-age);
      ctx.fillStyle=grain%4===0?'#fff2c5':'#ffd08a';
      ctx.beginPath();ctx.arc(px,py,(1.2+rand(id+grain*23)*1.3)*unit,0,TAU);ctx.fill();
    }
    curtains.push({id,x,top,height});
  }
  ctx.restore();return curtains;
}
