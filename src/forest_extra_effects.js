// Additional original Canvas effects, inspired by the linked Opus 5.5 prompts.
// All motion derives from the world seed, viewport and simulation time.
// No wall-clock state, network requests, image assets or external libraries.

function drawLivingInk() {
  const strokes = [];
  if (!enchantments.ink) return strokes;
  const u = forestUnit();
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const id = 81711 + i * 1789;
    const x = w * (.08 + i * .17);
    const y = h * (.25 + rand(id + 1) * .42);
    const reachX = w * (.095 + rand(id + 2) * .10);
    const reachY = h * (.14 + rand(id + 3) * .15);
    const phase = time * (.13 + rand(id + 4) * .10) + rand(id + 5) * TAU;
    const points = [];
    for (let j = 0; j <= 32; j++) {
      const t = j / 32;
      points.push([
        x + Math.sin(t * 5.4 + phase) * reachX * (.35 + t * .6) + t * reachX * .32,
        y + (t - .5) * reachY + Math.cos(t * 4.5 + phase * .7) * 12 * u
      ]);
    }
    // Wide transparent pigment followed by dry-brush outlines and fine fibers.
    for (const [width, color] of [
      [20 * u, 'rgba(61,68,94,.18)'],
      [8 * u, 'rgba(113,108,151,.21)'],
      [1.5 * u, 'rgba(205,194,220,.50)']
    ]) {
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        if (j === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    for (let k = 0; k < 13; k++) {
      const t = rand(id + 71 + k * 29);
      const p = points[Math.min(32, Math.floor(t * 33))];
      const dx = (rand(id + k * 37) - .5) * 18 * u;
      const dy = (rand(id + k * 41) - .5) * 18 * u;
      ctx.beginPath();
      ctx.arc(p[0] + dx, p[1] + dy, (.6 + rand(id + k * 13) * 2.7) * u, 0, TAU);
      ctx.fillStyle = 'rgba(191,184,210,.29)';
      ctx.fill();
    }
    strokes.push({id, x, y, width: reachX * 2, height: reachY});
  }
  ctx.restore();
  return strokes;
}

function drawGlassFlowers() {
  const flowers = [];
  if (!enchantments.glass) return flowers;
  const u = forestUnit();
  const spacing = Math.max(175, 285 * u);
  const offset = time * 17 * u;
  const margin = 105 * u;
  const start = Math.floor((-offset - margin) / spacing);
  const end = Math.ceil((w - offset + margin) / spacing);
  const palettes = [
    ['rgba(117,221,222,.56)', 'rgba(75,190,215,.08)', '#b8ffef'],
    ['rgba(239,138,209,.51)', 'rgba(143,92,205,.09)', '#f9c4ef'],
    ['rgba(245,203,118,.48)', 'rgba(147,119,210,.08)', '#ffeac0']
  ];
  ctx.save();
  for (let i = start; i <= end; i++) {
    const id = i * 1877 + 92117;
    const x = i * spacing + offset + (rand(id + 1) - .5) * spacing * .22;
    const radius = (36 + rand(id + 2) * 15) * u;
    if (x < -radius * 2 || x > w + radius * 2) continue;
    const groundY = h * (.81 + rand(id + 3) * .05);
    const y = h * (.58 + rand(id + 4) * .13)
      + Math.sin(time * .45 + rand(id + 5) * TAU) * 8 * u;
    const palette = palettes[Math.floor(rand(id + 6) * palettes.length)];
    const lean = Math.sin(time * .36 + rand(id + 7) * TAU) * .08;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.lineWidth = 1.4 * u;
    ctx.strokeStyle = 'rgba(170,213,187,.56)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-12 * u, (groundY - y) * .30, 12 * u, (groundY - y) * .68, 0, groundY - y);
    ctx.stroke();
    for (let k = 0; k < 6; k++) {
      ctx.save();
      ctx.rotate(k * TAU / 6 + Math.sin(time * .22 + id) * .04);
      const g = ctx.createLinearGradient(0, 0, 0, -radius * 1.35);
      g.addColorStop(0, palette[1]);
      g.addColorStop(.55, palette[0]);
      g.addColorStop(1, 'rgba(245,242,255,.09)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-radius * .77, -radius * .35, -radius * .80, -radius * 1.20, 0, -radius * 1.35);
      ctx.bezierCurveTo(radius * .80, -radius * 1.20, radius * .77, -radius * .35, 0, 0);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = palette[2];
      ctx.globalAlpha = .74;
      ctx.lineWidth = 1 * u;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -radius * .08);
      ctx.quadraticCurveTo(radius * .09, -radius * .71, 0, -radius * 1.20);
      ctx.strokeStyle = 'rgba(255,250,255,.62)';
      ctx.lineWidth = .7 * u;
      ctx.stroke();
      for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, -radius * .62);
        ctx.lineTo(sign * radius * .30, -radius * .88);
        ctx.stroke();
      }
      ctx.restore();
    }
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * .28);
    core.addColorStop(0, '#fff8d7');
    core.addColorStop(.45, 'rgba(250,208,140,.95)');
    core.addColorStop(1, 'rgba(250,208,140,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .28, 0, TAU);
    ctx.fill();
    ctx.restore();
    flowers.push({id, x, y, radius});
  }
  ctx.restore();
  return flowers;
}

function drawBigSparks() {
  const particles = [];
  const extent = {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity};
  if (!enchantments.sparks) return {count: 0, extent: null, particles};
  const palette = ['#f9e1ac', '#e4b8ff', '#8cf4f0', '#fff6ee'];
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  // Two oversized orbital fields overlap. Their full sweep spans nearly the
  // entire viewport, rather than clustering near a mushroom or the walker.
  for (let field = 0; field < 2; field++) {
    const cx = w * (field ? .66 : .34);
    const cy = h * (field ? .48 : .40);
    const rx = w * .435, ry = h * .355;
    const phase = time * (field ? -.29 : .34) + field * 2.45;
    for (let ring = 0; ring < 2; ring++) {
      ctx.beginPath();
      for (let step = 0; step <= 72; step++) {
        const t = step / 72;
        const a = phase + (t * 1.30 + ring * .45) * TAU;
        const radial = .20 + t * .76;
        const px = cx + Math.cos(a) * rx * radial;
        const py = cy + Math.sin(a) * ry * radial;
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.globalAlpha = .25;
      ctx.strokeStyle = palette[(field + ring) % palette.length];
      ctx.lineWidth = (ring ? 2.1 : 3.3) * Math.min(1.3, Math.max(.75, w / 430));
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 13;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (let k = 0; k < 64; k++) {
      const id = field * 100007 + k * 877 + 617;
      const a = k * 2.399963 + phase * (.64 + rand(id) * .65);
      const radial = .14 + Math.sqrt(rand(id + 1)) * .86;
      const x = cx + Math.cos(a) * rx * radial;
      const y = cy + Math.sin(a) * ry * radial;
      const r = (1.8 + rand(id + 2) * 3.6) * Math.min(1.5, Math.max(.85, w / 430));
      const length = (16 + rand(id + 3) * 42) * Math.min(1.6, Math.max(.8, w / 430));
      const dx = -Math.sin(a) * length, dy = Math.cos(a) * length * .85;
      const pulse = .62 + .38 * Math.sin(time * (1.4 + rand(id + 4)) + id);
      const color = palette[Math.floor(rand(id + 5) * palette.length)];
      extent.minX = Math.min(extent.minX, x - r, x + dx);
      extent.maxX = Math.max(extent.maxX, x + r, x + dx);
      extent.minY = Math.min(extent.minY, y - r, y + dy);
      extent.maxY = Math.max(extent.maxY, y + r, y + dy);
      ctx.globalAlpha = .32 * pulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, r * 1.35);
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = .18 * pulse;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = .83 * pulse;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
      if (k % 7 === 0) {
        ctx.globalAlpha = .90 * pulse;
        ctx.strokeStyle = '#fffbed';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x - r * 2.2, y);
        ctx.lineTo(x + r * 2.2, y);
        ctx.moveTo(x, y - r * 2.2);
        ctx.lineTo(x, y + r * 2.2);
        ctx.stroke();
      }
      particles.push({x, y, radius: r});
    }
  }
  ctx.restore();
  return {count: particles.length, extent, particles};
}
