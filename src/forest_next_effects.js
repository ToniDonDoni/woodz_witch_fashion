// Four original, deterministic Canvas 2D forest adaptations.
// Visual references: lava lamp, zen garden maple, fishbowl caustics,
// and Painting the Night from awesome-opus5-5-videos.
// These are procedural reinterpretations, not copied implementations.

function drawPaintedConstellations() {
  const groups = [];
  if (!enchantments.constellations) return groups;
  const u = forestUnit();
  const shapes = [
    [[-.50,.03],[-.24,-.30],[.13,-.23],[.45,-.46],[.30,.12],[.55,.37],[.05,.34],[-.32,.36]],
    [[-.42,.26],[-.24,-.28],[.02,-.03],[.36,-.42],[.50,.16],[.18,.38],[-.18,.17]],
    [[-.53,.04],[-.22,-.39],[.08,-.18],[.40,-.22],[.53,.24],[.09,.44],[-.31,.30]]
  ];
  const colors = ['#cbb3ff','#8df1e4','#ffe2a8'];
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let g = 0; g < 3; g++) {
    const id = 550001 + g * 431;
    const cx = w * (.18 + g * .32) + Math.sin(time * .13 + g * 2.1) * 13 * u;
    const cy = h * (.15 + (g % 2) * .085);
    const rx = Math.min(w * .27, 128 * u), ry = Math.min(h * .16, 112 * u);
    const phase = Math.sin(time * .20 + g * 1.2) * .11;
    const points = shapes[g].map(([px,py]) => ({
      x: cx + (px * Math.cos(phase) - py * Math.sin(phase)) * rx * 1.95,
      y: cy + (px * Math.sin(phase) + py * Math.cos(phase)) * ry * 1.9
    }));
    const progress = (time * .055 + g * .31) % 1;
    ctx.lineWidth = 1.6 * u;
    ctx.strokeStyle = colors[g];
    // Thin screen-blended strokes avoid expensive per-segment canvas shadows.
    ctx.globalAlpha = .46;
    for (let k = 1; k < points.length; k++) {
      const p = points[k - 1], q = points[k];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    for (let k = 0; k < points.length; k++) {
      const p = points[k];
      const beat = .70 + .30 * Math.sin(time * 1.2 + k + id);
      const r = (2.0 + rand(id + k * 13) * 1.7) * u;
      ctx.globalAlpha = beat;
      ctx.fillStyle = colors[g];
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      if (k % 3 === 0) {
        ctx.strokeStyle = '#fff7ee';
        ctx.lineWidth = 1 * u;
        ctx.beginPath();
        ctx.moveTo(p.x - r * 2.5, p.y); ctx.lineTo(p.x + r * 2.5, p.y);
        ctx.moveTo(p.x, p.y - r * 2.5); ctx.lineTo(p.x, p.y + r * 2.5);
        ctx.stroke();
      }
    }
    // A traveling stroke makes this visibly alive even on a stationary frame.
    const start = Math.min(points.length - 2, Math.floor(progress * (points.length - 1)));
    const t = progress * (points.length - 1) - start;
    const a = points[start], b = points[start + 1];
    const headX = a.x + (b.x - a.x) * t, headY = a.y + (b.y - a.y) * t;
    const flare = ctx.createRadialGradient(headX, headY, 0, headX, headY, 16 * u);
    flare.addColorStop(0, 'rgba(255,245,223,.78)');
    flare.addColorStop(1, 'rgba(200,175,244,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = flare;
    ctx.fillRect(headX - 16 * u, headY - 16 * u, 32 * u, 32 * u);
    groups.push({id, x:cx, y:cy, points:points.length});
  }
  ctx.restore();
  return groups;
}

function drawLiquidSpirits() {
  const spirits = [];
  if (!enchantments.liquid) return spirits;
  const u = forestUnit();
  const palettes = [
    ['rgba(97,228,206,.70)','rgba(80,201,183,.12)','#e3fff3'],
    ['rgba(183,142,249,.72)','rgba(151,101,226,.13)','#f4e8ff'],
    ['rgba(255,186,144,.67)','rgba(235,127,128,.13)','#fff0d6']
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  // Large slow-moving silhouettes drift in the gap between background and
  // middle-distance trees. The walker and near tree layers remain in front.
  for (let i = 0; i < 5; i++) {
    const id = 62013 + i * 311;
    const x = w * (.08 + i * .21) + Math.sin(time * .28 + i * 1.7) * 23 * u;
    const y = h * (.42 + (i % 3) * .075) + Math.cos(time * .36 + i * 1.8) * 34 * u;
    const radius = (41 + rand(id) * 24) * u;
    const palette = palettes[i % palettes.length];
    const halo = ctx.createRadialGradient(x,y,radius*.2,x,y,radius*2.3);
    halo.addColorStop(0,palette[1]);
    halo.addColorStop(.4,palette[1]);
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x-radius*2.3,y-radius*2.3,radius*4.6,radius*4.6);
    const body = ctx.createRadialGradient(x-radius*.18,y-radius*.28,radius*.06,x,y,radius*1.05);
    body.addColorStop(0, palette[2]);
    body.addColorStop(.23,palette[0]);
    body.addColorStop(.70,'rgba(89,103,165,.32)');
    body.addColorStop(1,'rgba(110,98,182,.03)');
    ctx.beginPath();
    for (let k = 0; k <= 36; k++) {
      const a = k/36*TAU;
      const wobble = 1 + .13*Math.sin(a*3 + time*.9 + i) + .08*Math.cos(a*5 - time*.5 + i*2);
      const px = x+Math.cos(a)*radius*wobble;
      const py = y+Math.sin(a)*radius*1.2*wobble;
      if (k===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fillStyle = body; ctx.fill();
    ctx.strokeStyle = palette[0]; ctx.lineWidth = 1.3 * u; ctx.stroke();
    // Tiny eyes and orbiting droplets make the blob read as a forest creature.
    ctx.fillStyle = palette[2];
    for (const side of [-1,1]) {
      ctx.beginPath();ctx.arc(x+side*radius*.23,y-radius*.06,2.3*u,0,TAU);ctx.fill();
    }
    for(let d=0;d<4;d++){
      const a=time*(.35+d*.07)+d*TAU/4+i;
      const px=x+Math.cos(a)*radius*1.6,py=y+Math.sin(a)*radius*1.5;
      ctx.beginPath();ctx.arc(px,py,(2.6+rand(id+d+11)*2)*u,0,TAU);
      ctx.fillStyle=palette[0];ctx.fill();
    }
    spirits.push({id,x,y,radius});
  }
  ctx.restore();
  return spirits;
}

function drawMoonlitCaustics() {
  const bands = [];
  if (!enchantments.caustics) return bands;
  const u = forestUnit();
  const top = h*.790, bottom = h*.928;
  // Draw after the moving path wash but before the near trees and the walker.
  // Clip to the runway, so caustics never wash out faces or sky.
  ctx.save();
  ctx.beginPath();ctx.rect(0,top,w,bottom-top);ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  for(let k=0;k<8;k++){
    const id=73117+k*317;
    const cy = top + (k+.5)/8*(bottom-top);
    const breadth = (15 + rand(id)*25)*u;
    const shift = Math.sin(time*.59+k*.91)*w*.12;
    const gradient=ctx.createLinearGradient(0,cy-breadth,0,cy+breadth);
    gradient.addColorStop(0,'rgba(0,0,0,0)');
    gradient.addColorStop(.5,k%2?'rgba(119,218,245,.19)':'rgba(203,204,255,.19)');
    gradient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.strokeStyle=gradient;
    ctx.lineWidth=8*u;
    // The broad gradients already glow; avoid per-path shadow filters.
    for(let strand=0;strand<2;strand++){
      ctx.beginPath();
      for(let step=0;step<=32;step++){
        const x=(step/32)*w;
        const y=cy + Math.sin(x/w*TAU*2.6+time*.94+k+strand*.8)*8*u
          + Math.sin(x/w*TAU*4.1-time*.45+k)*4*u;
        const px=x+shift+Math.sin(time*.22+k)*15*u;
        if(step===0)ctx.moveTo(px,y);
        else ctx.lineTo(px,y);
      }
      ctx.stroke();
    }
    // Broader patches make the moonlight legible against the dark ground.
    const x=w*(.11+(k%5)*.21)+Math.sin(time*.35+k)*w*.08;
    const glow=ctx.createRadialGradient(x,cy,0,x,cy,Math.max(55,w*.15));
    glow.addColorStop(0,'rgba(161,222,246,.16)');
    glow.addColorStop(1,'rgba(161,222,246,0)');
    ctx.fillStyle=glow;
    ctx.fillRect(x-Math.max(55,w*.15),cy-24*u,Math.max(55,w*.15)*2,48*u);
    bands.push({id,x,y:cy});
  }
  ctx.restore();
  return bands;
}

function drawAutumnVortex() {
  const leaves = [];
  if (!enchantments.leaves) return leaves;
  const u = forestUnit();
  const palette=['#d7a15d','#e5b975','#b67566','#bfa3aa','#dec997','#ad7eac'];
  ctx.save();
  ctx.globalCompositeOperation='screen';
  // Three broad, looping vortices, primarily in the middle distance.
  // Their warm leaves contrast with the cold blue forest and moonlight.
  for(let v=0;v<3;v++){
    const cx=w*(.12+v*.38)+Math.sin(time*.19+v*3)*18*u;
    const cy=h*(.52+(v%2)*.065);
    const rx=Math.min(w*.25,145*u),ry=h*.20;
    for(let k=0;k<38;k++){
      const id=v*2027+k*53+81671;
      const angle=k*2.399963 + time*(.62+rand(id)*.29)*(v%2?-1:1);
      const band=.20+Math.sqrt(rand(id+7))*.8;
      const x=cx+Math.cos(angle)*rx*band;
      const y=cy+Math.sin(angle)*ry*band + Math.sin(time*.8+k)*8*u;
      const size=(3.3+rand(id+1)*4.5)*u;
      const theta=angle+time*.45;
      const dx=Math.cos(theta)*size,dy=Math.sin(theta)*size;
      const nx=-Math.sin(theta)*size*.63,ny=Math.cos(theta)*size*.63;
      const c=palette[Math.floor(rand(id+2)*palette.length)];
      ctx.globalAlpha=.58+.36*Math.sin(time*.77+k)*Math.sin(time*.77+k);
      ctx.beginPath();
      ctx.moveTo(x+dx,y+dy);
      ctx.quadraticCurveTo(x+nx,y+ny,x-dx,y-dy);
      ctx.quadraticCurveTo(x-nx*.95,y-ny*.95,x+dx,y+dy);
      ctx.closePath();
      ctx.fillStyle=c;ctx.fill();
      ctx.lineWidth=.65*u;ctx.strokeStyle='#f9dfb9';ctx.stroke();
      if(k%5===0){
        ctx.beginPath();ctx.moveTo(x-dx*.5,y-dy*.5);
        ctx.lineTo(x-dx*3-Math.sin(angle)*7*u,y-dy*3);
        ctx.strokeStyle='rgba(246,187,125,.30)';
        ctx.lineWidth=1.2*u;ctx.stroke();
      }
      leaves.push({x,y});
    }
  }
  ctx.restore();
  return leaves;
}
