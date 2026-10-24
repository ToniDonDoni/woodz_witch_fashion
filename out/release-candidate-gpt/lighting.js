// Release Candidate GPT: light transport is a deliberate 2D illustrated approximation.
// Scene identities and positions depend on world seed + simulation time, never RAF cadence.
// Static periodic noise is generated once per seed; the one fog band scrolls smoothly.
const atmosphere = (() => {
  const TILE_W = 256, TILE_H = 96;
  let tile = null, tileSeed = null;
  let effectsEnabled = true;
  let lastInfo = { beams: [], fogOffset: 0, texturePixels: 0, effectsEnabled: true };
  let rebuilds = 0;

  function hash2(x, y, worldSeed) {
    let v = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + worldSeed) | 0;
    v = Math.imul(v ^ (v >>> 13), 1274126177);
    v ^= v >>> 16;
    return (v >>> 0) / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function noise(x, y, nx, ny, worldSeed) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const tx = smooth(x - ix), ty = smooth(y - iy);
    const sample = (a, b) => hash2(((a % nx) + nx) % nx, ((b % ny) + ny) % ny, worldSeed);
    const top = sample(ix, iy) * (1 - tx) + sample(ix + 1, iy) * tx;
    const bottom = sample(ix, iy + 1) * (1 - tx) + sample(ix + 1, iy + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  }
  function ensureTile() {
    if (tile && tileSeed === seed) return;
    tileSeed = seed;
    const art = document.createElement('canvas');
    art.width = TILE_W; art.height = TILE_H;
    const c = art.getContext('2d');
    const pixels = c.createImageData(TILE_W, TILE_H);
    for (let y = 0; y < TILE_H; y++) {
      const fy = y / TILE_H;
      // Periodic samples on both axes avoid visible seams during infinite scrolling.
      const taper = Math.pow(Math.max(0, Math.sin(Math.PI * fy)), .8);
      for (let x = 0; x < TILE_W; x++) {
        const fx = x / TILE_W;
        const a = noise(fx * 5, fy * 2, 5, 2, seed + 11);
        const b = noise(fx * 11, fy * 4, 11, 4, seed + 29);
        const d = noise(fx * 23, fy * 8, 23, 8, seed + 47);
        const density = Math.max(0, (a * .58 + b * .29 + d * .13 - .31) * 1.9);
        const alpha = Math.min(125, Math.round(density * taper * 98));
        const p = (y * TILE_W + x) * 4;
        pixels.data[p] = 180;
        pixels.data[p+1] = 198;
        pixels.data[p+2] = 230;
        pixels.data[p+3] = alpha;
      }
    }
    c.putImageData(pixels, 0, 0);
    tile = art;
    rebuilds++;
  }

  // Mirror the positions of actual trees in near row 1 of forest.js.
  // These adjacent tree identities are the sources of the illustrated apertures.
  function treeAt(i, unit, spacing, offset) {
    const id = i * 1777 + 77113 + 19301;
    return {
      id, index: i,
      x: i * spacing + offset + spacing * .31 + nrand(id + 1) * spacing * .12,
      size: .87 * (.86 + rand(id + 2) * .29) * unit
    };
  }
  function beamCandidates() {
    const unit = forestUnit();
    const spacing = 201 * unit;
    const travel = time * 22 * unit;
    const start = Math.floor((-travel - 460 * unit) / spacing);
    const end = Math.ceil((w - travel + 460 * unit) / spacing);
    const beams = [];
    for (let i = start; i <= end; i++) {
      // 3 slim shafts clustered at each stable tree-pair opening.
      // Sparsity is seeded and spatial, never driven by measured frame time.
      if (hash2(i, 23, seed) < .32) continue;
      const left = treeAt(i, unit, spacing, travel);
      const right = treeAt(i + 1, unit, spacing, travel);
      const gap = (left.x + right.x) * .5;
      const width = Math.max(9, Math.min(44, (right.x - left.x) * .24));
      const x = gap + (hash2(i, 29, seed) - .5) * width * .22;
      if (x < -210 * unit || x > w + 210 * unit) continue;
      const identity = 'gap:' + i + ':' + left.id + ':' + right.id;
      beams.push({ identity, leftTreeId:left.id, rightTreeId:right.id,
                   x, width, top: h * .24, bottom: h * .82 });
    }
    return beams;
  }
  function drawFog() {
    ensureTile();
    const scale = Math.max(.5, Math.min(1.3, forestUnit()));
    const width = TILE_W * scale * 1.55;
    const top = h * .43, height = Math.min(h * .45, 320 * scale + h * .12);
    const offset = ((time * 11 * scale) % width + width) % width;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .50 + .05 * Math.sin(time * .24 + seed);
    for (let x = -offset - width; x < w + width; x += width) {
      ctx.drawImage(tile, x, top, width + .5, height);
    }
    ctx.restore();
    return offset;
  }
  function shaft(x, yTop, yBottom, width, opacity, slant) {
    const dy = yBottom - yTop, xEnd = x + slant * dy;
    const upper = width * .38, lower = width * 1.55;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - upper, yTop);
    ctx.lineTo(x + upper, yTop);
    ctx.lineTo(xEnd + lower, yBottom);
    ctx.lineTo(xEnd - lower, yBottom);
    ctx.closePath();
    ctx.clip();
    // Vertical fade and sideways feathering are applied through two light washes.
    const vertical = ctx.createLinearGradient(0, yTop, 0, yBottom);
    vertical.addColorStop(0, 'rgba(185,204,244,0)');
    vertical.addColorStop(.16, 'rgba(185,204,244,' + (opacity * .60) + ')');
    vertical.addColorStop(.64, 'rgba(195,207,249,' + opacity + ')');
    vertical.addColorStop(1, 'rgba(200,215,250,0)');
    ctx.fillStyle = vertical;
    ctx.fillRect(Math.min(x, xEnd) - lower, yTop, Math.abs(xEnd - x) + lower * 2, dy);
    const feather = ctx.createLinearGradient(xEnd - lower, 0, xEnd + lower, 0);
    feather.addColorStop(0, 'rgba(160,183,236,0)');
    feather.addColorStop(.36, 'rgba(171,198,251,' + (opacity * .16) + ')');
    feather.addColorStop(.5, 'rgba(190,213,255,' + (opacity * .29) + ')');
    feather.addColorStop(.64, 'rgba(171,198,251,' + (opacity * .16) + ')');
    feather.addColorStop(1, 'rgba(160,183,236,0)');
    ctx.fillStyle = feather;
    ctx.fillRect(Math.min(x, xEnd) - lower, yTop, Math.abs(xEnd - x) + lower * 2, dy);
    ctx.restore();
  }
  function drawBeams(beams) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const beam of beams) {
      const id = beam.leftTreeId;
      const breath = .87 + .13 * Math.sin(time * .37 + hash2(id, 103, seed) * 6.283);
      const baseSlant = -.12; // common moonlight direction, not random spotlights
      const localSlant = (hash2(id, 19, seed) - .5) * .032;
      const slant = baseSlant + localSlant + Math.sin(time * .12 + id) * .006;
      // Three related ribbons make one soft, hand-drawn shaft cluster.
      for (let part = 0; part < 3; part++) {
        const drift = (part - 1) * beam.width * .43;
        shaft(beam.x + drift, beam.top + part * 7, beam.bottom,
              beam.width * (.55 + part * .15),
              (.070 + part * .011) * breath, slant);
      }
    }
    ctx.restore();
  }
  function draw() {
    const beams = beamCandidates();
    // Compute state even when hidden: toggling never changes world identities.
    let fogOffset = ((time * 11 * Math.max(.5, Math.min(1.3, forestUnit()))) %
      (TILE_W * Math.max(.5, Math.min(1.3, forestUnit())) * 1.55));
    if (effectsEnabled) {
      // Both passes happen behind near trees, so no later shafts wash across trunks.
      fogOffset = drawFog();
      drawBeams(beams);
    }
    lastInfo = { beams, fogOffset, effectsEnabled, texturePixels:tile?tile.width*tile.height:0,
                 tileRebuilds:rebuilds, qualityTier:'fixed-v1', lightDirection:-.12 };
    return lastInfo;
  }
  return {
    draw,
    setEnabled(v) { effectsEnabled = !!v; },
    get enabled() { return effectsEnabled; },
    get state() { return lastInfo; }
  };
})();
