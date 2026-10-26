// Two new optional forest effects positioned at opposite edges of the bottom controls.
// Canvas 2D adaptations; deterministic by seed and simulation time.

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
