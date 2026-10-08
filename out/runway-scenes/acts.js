// ── The act director ─────────────────────────────────────────────────────────
// The runway is staged as a sequence of seeded acts. Every act announces itself
// with a title card that stays up for the whole act, changes the weather of the
// whole woodland, and is built from three overlapping beats, so the stage is
// alive for almost the entire act instead of for one fly-past. Every beat has an
// explicit screen trajectory: it can enter from either side, arrive and hold
// beside her, rise out of the ground, or swoop overhead. Rare cameos (a star
// fall, an owl passing overhead) are never announced. Act order, beat cast,
// entry modes, weather, colour mood, species layout and every piece derive from
// the world seed, so New Dream reshuffles the entire programme.
const dreamMoods = [
  {name: 'EMERALD HUSH', tint: '#1d5c46', alpha: .30},
  {name: 'VIOLET VEIL', tint: '#4a2470', alpha: .30},
  {name: 'AMBER DUSK', tint: '#8a4a12', alpha: .26},
  {name: 'GLACIER BLOOM', tint: '#1f5f86', alpha: .30},
  {name: 'ROSE ASHES', tint: '#7a2f52', alpha: .28},
  {name: 'LUNAR MOSS', tint: '#4d6a2a', alpha: .24}
];
const actThemes = [
  {name: 'SPORE FALL', ambient: 'spores', event: 'fairring'},
  {name: 'THE MOTH WAKE', ambient: 'motes', event: 'moths'},
  {name: 'LANTERN PROCESSION', ambient: 'embers', event: 'lanterns'},
  {name: 'EMBER NIGHT', ambient: 'embers', event: 'wisps'},
  {name: 'THE PETAL VEIL', ambient: 'petals', event: 'bloom'},
  {name: 'THE STAR CHOIR', ambient: 'fog', event: 'choir'},
  {name: 'HOUR OF THE STAG', ambient: 'fog', event: 'stag'}
];
const actCache = new Map();
const themeMemo = new Map();
const actStarts = new Map();
let actAnchor = {index: 0, start: 0}, lastPrunedIndex = null;
const actSpan = 6;
// Every act of a dream gets its own length (30-62 s) so the show never settles into a
// metronome. Starts are cumulative and are walked from a cached anchor, which keeps a
// normal frame O(1) and a long seek O(acts spanned).
function actLength(index) { return 30 + rand(index * 7919 + seed * 37 + 5) * 32; }
function actStartFor(index) {
  const cached = actStarts.get(index);
  if (cached !== undefined) return cached;
  let cursor = actAnchor;
  while (cursor.index > index) cursor = {index: cursor.index - 1, start: cursor.start - actLength(cursor.index - 1)};
  while (cursor.index < index) cursor = {index: cursor.index + 1, start: cursor.start + actLength(cursor.index)};
  actAnchor = cursor; actStarts.set(index, cursor.start);
  return cursor.start;
}
function actIndexForTime(simulated) {
  let cursor = actAnchor;
  while (cursor.index > 0 && simulated < cursor.start) cursor = {index: cursor.index - 1, start: cursor.start - actLength(cursor.index - 1)};
  while (simulated >= cursor.start + actLength(cursor.index)) cursor = {index: cursor.index + 1, start: cursor.start + actLength(cursor.index)};
  actAnchor = cursor; actStarts.set(cursor.index, cursor.start);
  return cursor.index;
}
// The director's own tables are trimmed to a window around the live act, the same way
// the forest art cache is, so an all-night run cannot accumulate them.
function pruneActCaches(index) {
  if (lastPrunedIndex === index) return;
  lastPrunedIndex = index;
  for (const cache of [actCache, themeMemo, actStarts]) for (const key of cache.keys()) if (Math.abs(key - index) > actSpan) cache.delete(key);
}
// The next act never repeats any of the three themes that just played; the order
// still comes from the seed, so different dreams shuffle the programme differently.
function themeIndexFor(index) {
  const remembered = themeMemo.get(index);
  if (remembered !== undefined) return remembered;
  const at = k => Math.floor(rand(k * 104729 + seed * 7919 + 3) * actThemes.length);
  const here = at(index), banned = new Set();
  for (let back = 1; back <= 3; back++) if (index - back >= 0) banned.add(themeIndexFor(index - back));
  let chosen = here;
  if (banned.has(here)) {
    const pool = [];
    for (let k = 0; k < actThemes.length; k++) if (!banned.has(k)) pool.push(k);
    chosen = pool[Math.floor(rand(index * 31337 + seed + 29) * pool.length)];
  }
  themeMemo.set(index, chosen);
  return chosen;
}
// ── The cast of one act ──────────────────────────────────────────────────────
// Three overlapping windows tile an act, and every window carries one piece, so
// the stage is busy for the whole act. Only one window holds the headline set
// piece; the others hold quieter support pieces that never repeat it or each
// other. Which window holds the headline, which pieces appear and how they
// arrive all come from the seed.
const supportPool = ['moths', 'wisps', 'fairring', 'bloom', 'choir', 'lanterns', 'stag'];
const headlineEntries = ['left', 'right', 'hold'];
const supportEntries = ['left', 'right', 'hold', 'rise'];
function actBeats(id, length, signature) {
  const slots = [[0, .44], [.27, .44], [.56, .44]], beats = [], used = new Set([signature]);
  const headline = Math.floor(rand(id + 61) * slots.length);
  for (let slot = 0; slot < slots.length; slot++) {
    const [start, visible] = slots[slot], isHeadline = slot === headline;
    let type = signature;
    if (!isHeadline) {
      const pool = supportPool.filter(item => !used.has(item));
      type = pool[Math.floor(rand(id + 101 + slot * 37) * pool.length)];
      used.add(type);
    }
    const grounded = type === 'bloom' || type === 'fairring' || type === 'wisps';
    const entry = isHeadline
      ? headlineEntries[Math.floor(rand(id + 71 + slot * 13) * headlineEntries.length)]
      : (grounded && rand(id + 113 + slot * 29) < .6
        ? 'rise'
        : supportEntries[Math.floor(rand(id + 127 + slot * 31) * supportEntries.length)]);
    beats.push({
      type, kind: isHeadline ? 'signature' : 'support', slot, entry,
      id: id * 5 + slot * 977 + 11,
      start: length * start, visible: length * visible,
      size: isHeadline ? 1 : .62 + rand(id + 151 + slot * 41) * .2,
      drift: entry === 'rise' ? 9 + rand(id + 179 + slot * 43) * 7 : 0,
      at: .30 + rand(id + 163 + slot * 47) * .30
    });
  }
  // Unannounced extras: a star fall only reaches the sky layer, the owl sweeps
  // overhead. They are never part of the guaranteed coverage.
  if (rand(id + 9) < .45) beats.push({type: 'starfall', kind: 'cameo', slot: 3, entry: 'sky', id: id * 5 + 4001,
    start: length * (.30 + rand(id + 10) * .40), visible: Math.min(9, length * .18), size: 1, drift: 0, at: .5});
  if (rand(id + 11) < .22) beats.push({type: 'owl', kind: 'rare', slot: 4, entry: 'swoop', id: id * 5 + 7001,
    start: length * (.05 + rand(id + 12) * .35), visible: length * .30, size: 1, drift: 0, at: .5});
  return beats;
}
// Where a beat is on screen at a given age, as fractions of the viewport. The
// trajectories are deliberately different from each other so the show does not
// read as one conveyor belt: from the left, from the right (mirrored), arriving
// and holding beside her, rising out of the ground and drifting, or swooping.
// The crossing ones enter just off the edge rather than a screen away, so a
// window is mostly spent on screen instead of in the margins.
function beatTransform(beat, age) {
  const p = Math.max(0, Math.min(1, beat.visible > 0 ? age / beat.visible : 1));
  const base = eventStagers[beat.type].baseline();
  if (beat.entry === 'sky') return {x: w * .5, y: h * .25, scale: beat.size, flip: false};
  if (beat.entry === 'left') return {x: -.15 * w + p * 1.3 * w, y: base, scale: beat.size, flip: false};
  if (beat.entry === 'right') return {x: 1.15 * w - p * 1.3 * w, y: base, scale: beat.size, flip: true};
  if (beat.entry === 'hold') {
    const arrive = Math.min(1, p / .18), leave = p > .8 ? (p - .8) / .2 : 0;
    return {x: beat.at * w - (1 - arrive) * .62 * w + leave * 1.1 * w, y: base, scale: beat.size, flip: false};
  }
  if (beat.entry === 'rise') {
    const grow = Math.min(1, p / .22), shrink = p > .86 ? Math.max(0, (1 - p) / .14) : 1;
    // The drift is capped at a fraction of the viewport, so a long beat grows and
    // then holds its place instead of slowly sliding off the right edge.
    return {x: beat.at * w + Math.min(beat.drift * age, w * .28), y: base, scale: beat.size * grow * shrink, flip: false};
  }
  return {x: -.12 * w + p * 1.24 * w, y: base + Math.sin(p * Math.PI) * h * .12, scale: beat.size, flip: false};
}
function actPlan(index) {
  const length = actLength(index), start = actStartFor(index), cached = actCache.get(index);
  if (cached && cached.length === length) return cached;
  const id = index * 104729 + seed * 7919 + 31337, themeIndex = themeIndexFor(index), theme = actThemes[themeIndex];
  const beats = actBeats(id, length, theme.event);
  const plan = {
    index, length, start, progress: 0, themeIndex, name: theme.name,
    ambient: theme.ambient, event: theme.event, beats,
    cameo: beats.some(beat => beat.kind === 'cameo') ? 'starfall' : null,
    rare: beats.some(beat => beat.kind === 'rare') ? 'owl' : null
  };
  actCache.set(index, plan);
  return plan;
}
function currentAct() {
  const index = actIndexForTime(time), plan = actPlan(index);
  plan.progress = (time - plan.start) / plan.length;
  pruneActCaches(index);
  return plan;
}
function actLabel(plan) { return 'ACT ' + romanNumeral(plan.index + 1) + ' · ' + plan.name; }
function romanNumeral(value) {
  const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let left = Math.max(1, Math.floor(value)), out = '';
  for (const [size, glyph] of table) while (left >= size) { out += glyph; left -= size; }
  return out;
}
function dreamMood() { return dreamMoods[Math.floor(rand(seed * 613 + 11) * dreamMoods.length)]; }
// Anything composited after the dream grade (the foreground hedge, the front-layer
// bloom) takes the dream tint inside its own palette, so the whole frame shares one
// mood instead of only the part of the scene the flat blend pass covered.
function mixHex(hex, tint, amount) {
  const parse = value => [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)];
  const from = parse(hex), to = parse(tint);
  return '#' + from.map((channel, k) => Math.round(channel + (to[k] - channel) * amount).toString(16).padStart(2, '0')).join('');
}
function moodTint(hex, amount) { return mixHex(hex, dreamMood().tint, amount); }
// One flat colour pass over the drawn world re-hues the whole forest per dream.
// The walker is composited afterwards, so her own colours stay true and readable.
function drawDreamGrade() {
  const mood = dreamMood();
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  ctx.globalAlpha = mood.alpha;
  const grade = ctx.createLinearGradient(0, 0, 0, h);
  grade.addColorStop(0, mood.tint); grade.addColorStop(.72, mood.tint); grade.addColorStop(1, '#060a09');
  ctx.fillStyle = grade; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
function resetWorld() { actCache.clear(); themeMemo.clear(); actStarts.clear(); actAnchor = {index: 0, start: 0}; lastPrunedIndex = null; forestCache.clear(); }
function actProgramme(count) {
  const list = [];
  for (let index = 0; index < count; index++) {
    const plan = actPlan(index);
    list.push({index, name: plan.name, event: plan.event, ambient: plan.ambient, cameo: plan.cameo, rare: plan.rare, length: plan.length, start: plan.start,
      beats: plan.beats.map(beat => ({type: beat.type, kind: beat.kind, entry: beat.entry, start: Number(beat.start.toFixed(2)), visible: Number(beat.visible.toFixed(2)), size: Number(beat.size.toFixed(2))}))});
  }
  return list;
}
// ── Weather ──────────────────────────────────────────────────────────────────
function ambientMoteField(plan, tint, rise, drift, size) {
  const unit = forestUnit(), spacing = 54 * unit, offset = time * drift * unit;
  const start = Math.floor((-offset - 60) / spacing), end = Math.ceil((w - offset + 60) / spacing);
  for (let i = start; i <= end; i++) {
    const id = i * 431 + plan.index * 7717 + 5011;
    const x = i * spacing + offset + nrand(id + 1) * spacing * .7;
    const span = h * .84, cycle = (time * (rise + rand(id + 2) * rise) + rand(id + 3) * span) % span;
    const y = h * .93 - cycle, fade = Math.sin(cycle / span * Math.PI);
    const alpha = fade * (.22 + .30 * (.5 + .5 * Math.sin(time * 1.9 + id)));
    const radius = size * unit * (1.2 + rand(id + 4) * 1.8) * (1 - cycle / span * .3);
    ellipse(x + Math.sin(time * 1.4 + id) * 9, y, radius, radius * .85, `${tint}${alpha.toFixed(3)})`);
  }
}
function ambientFog(plan, front) {
  const unit = forestUnit(), baseline = h * (front ? .925 : .845);
  for (let k = 0; k < 5; k++) {
    const id = k * 911 + plan.index * 13 + 7001;
    const drift = time * (7 + rand(id) * 8) * unit;
    const alpha = .07 + rand(id + 1) * .08;
    const width = w * (.45 + rand(id + 2) * .55), height = h * (.022 + rand(id + 3) * .026);
    const cx = positiveMod(rand(id + 4) * w * 1.3 - drift, w + width * 2) - width;
    const cy = baseline + (rand(id + 5) - .5) * h * .035;
    const cloud = ctx.createRadialGradient(cx, cy, 0, cx, cy, width);
    cloud.addColorStop(0, `rgba(196,206,224,${alpha})`);
    cloud.addColorStop(.6, `rgba(180,192,214,${alpha * .5})`);
    cloud.addColorStop(1, 'rgba(170,182,206,0)');
    ctx.fillStyle = cloud; ctx.beginPath(); ctx.ellipse(cx, cy, width, height, 0, 0, TAU); ctx.fill();
  }
}
function ambientPetals(plan, front) {
  const unit = forestUnit(), spacing = (front ? 86 : 120) * unit, drift = (front ? 96 : 54) * unit;
  const start = Math.floor((-time * drift - 80) / spacing), end = Math.ceil((w - time * drift + 80) / spacing);
  for (let i = start; i <= end; i++) {
    const id = i * 733 + plan.index * 991 + (front ? 8009 : 6007);
    const x = i * spacing + time * drift + nrand(id + 1) * spacing * .8;
    const span = h * .9, cycle = (time * (24 + rand(id + 2) * 22) + rand(id + 3) * span) % span;
    const y = -20 + cycle, fade = Math.sin(cycle / span * Math.PI);
    const spin = time * (1.1 + rand(id + 4)) + id;
    const alpha = fade * (front ? .55 : .34) * (front ? 1 : .8);
    ctx.save(); ctx.translate(x + Math.sin(spin * .7) * 22 * unit, y);
    ctx.rotate(spin * .8);
    const petal = 5 + rand(id + 5) * 8;
    ellipse(0, 0, petal * unit, petal * .45 * unit, `rgba(214,196,244,${alpha})`);
    ellipse(2 * unit, 0, petal * .5 * unit, petal * .3 * unit, `rgba(246,232,255,${alpha * .6})`);
    ctx.restore();
  }
}
function drawAmbientBack(plan) {
  if (plan.ambient === 'spores') ambientMoteField(plan, 'rgba(176,236,196,', 13, 24, 1.5);
  else if (plan.ambient === 'motes') ambientMoteField(plan, 'rgba(226,222,200,', 7, 34, 1.1);
  else if (plan.ambient === 'embers') ambientMoteField(plan, 'rgba(255,176,96,', 30, 30, 1.3);
  else if (plan.ambient === 'petals') ambientPetals(plan, false);
  else if (plan.ambient === 'fog') ambientFog(plan, false);
  if (plan.ambient === 'embers') ambientFog(plan, false);
}
function drawAmbientFront(plan) {
  if (plan.ambient === 'petals') ambientPetals(plan, true);
  else if (plan.ambient === 'fog') ambientFog(plan, true);
  else if (plan.ambient === 'spores') ambientMoteField(plan, 'rgba(196,255,214,', 22, 40, 2.2);
}
// ── Set pieces ───────────────────────────────────────────────────────────────
// Every set piece is drawn straight from seeded parameters each frame; movement
// stays smooth while only its ink contours refresh on the 12 Hz boil clock.
function drawStagEvent(id, phase, x, y, size, t) {
  const b = inkBrush(ctx, id, phase);
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const aura = ctx.createRadialGradient(0, -190, 0, 0, -190, 260);
  aura.addColorStop(0, 'rgba(150,196,226,0.15)'); aura.addColorStop(1, 'rgba(150,196,226,0)');
  ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(0, -190, 210, 170, 0, 0, TAU); ctx.fill();
  const gait = t * 3.1 + rand(id) * TAU;
  for (const leg of [[-58, 0], [-34, .42], [34, .86], [58, .3]]) {
    const swing = Math.sin(gait + leg[1] * TAU) * 13;
    b.stroke([[leg[0], -118], [leg[0] + swing * .5, -70], [leg[0] + swing, -12]], '#2a3d33', 4.2, id + 20 + leg[0]);
  }
  // A pale rim keeps the body legible against the dark wood, as the leshies are.
  b.stroke([[-72, -124], [-92, -152], [-84, -186], [-40, -202], [26, -198], [66, -184], [76, -152], [52, -126], [8, -120]], '#a3b48d', 1.7, id, true, '#1e3128');
  b.stroke([[62, -186], [88, -226], [100, -252]], '#93a681', 9, id + 3);
  b.stroke([[96, -252], [116, -258], [128, -248], [122, -234], [104, -236]], '#a3b48d', 1.4, id + 5, true, '#1e3128');
  const nodes = [];
  for (const side of [-1, 1]) {
    const ax = 112 + side * 4, ay = -262;
    b.stroke([[ax, ay], [ax + side * 22, ay - 40], [ax + side * 14, ay - 82]], '#a6b79a', 2, id + 40 + side);
    b.stroke([[ax + side * 20, ay - 40], [ax + side * 44, ay - 56], [ax + side * 52, ay - 88]], '#a6b79a', 1.5, id + 44 + side);
    b.stroke([[ax + side * 15, ay - 80], [ax + side * 34, ay - 104]], '#a6b79a', 1.2, id + 48 + side);
    nodes.push([ax + side * 14, ay - 82], [ax + side * 52, ay - 88], [ax + side * 34, ay - 104], [ax + side * 22, ay - 40]);
  }
  b.oval(30, -176, 26, 12, '#4a6a5a66', null, id + 60, .2);
  b.oval(114, -248, 3.4, 2.6, '#f2ecc4', null, id + 70);
  ctx.strokeStyle = 'rgba(207,217,255,0.28)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(nodes[0][0], nodes[0][1]);
  for (let k = 1; k < 4; k++) ctx.lineTo(nodes[k][0], nodes[k][1]);
  ctx.moveTo(nodes[4][0], nodes[4][1]);
  for (let k = 5; k < 8; k++) ctx.lineTo(nodes[k][0], nodes[k][1]);
  ctx.stroke();
  nodes.forEach(p => {
    const twinkle = .55 + .45 * Math.sin(t * 2.2 + p[0] * .05);
    ellipse(p[0], p[1], 2.4 * twinkle, 2.1 * twinkle, `rgba(223,232,255,${.45 + .4 * twinkle})`);
  });
  ctx.restore();
}
function drawLanternBearer(id, phase, scale) {
  const b = inkBrush(ctx, id, phase);
  ctx.save(); ctx.scale(scale, scale);
  b.stroke([[0, 0], [-15, -8], [-18, -50], [-10, -74], [0, -82], [10, -74], [18, -50], [15, -8]], '#16241d', 1.4, id, true, '#0c1713');
  b.oval(-3.4, -70, 3, 2.4, '#dfe6c4', null, id + 3);
  b.oval(3.8, -70, 3, 2.4, '#dfe6c4', null, id + 5);
  b.stroke([[9, -52], [20, -64], [27, -86]], '#16231c', 3, id + 7);
  b.stroke([[27, -86], [27, -118]], '#3b3120', 1.6, id + 8);
  // A paper lantern on the staff: a bright body, a visible flame and a warm halo.
  const glow = .75 + .25 * Math.sin(time * 2.1 + id);
  const lamp = ctx.createRadialGradient(27, -136, 0, 27, -136, 72);
  lamp.addColorStop(0, `rgba(255,214,140,${.50 * glow})`);
  lamp.addColorStop(.45, `rgba(255,196,110,${.18 * glow})`);
  lamp.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = lamp; ctx.beginPath(); ctx.arc(27, -136, 72, 0, TAU); ctx.fill();
  b.stroke([[13, -118], [41, -118], [41, -154], [13, -154]], '#3a2f1e', 1.1, id + 9, true, `rgba(252,222,150,${.85 * glow})`);
  b.stroke([[13, -118], [41, -118]], '#3a2f1e', 2.2, id + 10);
  b.stroke([[27, -154], [27, -160]], '#3a2f1e', 1.4, id + 11);
  ellipse(27, -134, 4.5, 6.5, `rgba(255,240,200,${.9 * glow})`);
  ctx.restore();
}
function drawLanternEvent(id, phase, x, y, size, t) {
  for (let k = 0; k < 5; k++) {
    const lid = id + k * 97;
    const lx = x + (k - 2) * 86 + Math.sin(t * .5 + k) * 5;
    const ly = y + Math.sin(t * 1.6 + k * .7) * 4 - (k % 2) * 5;
    ctx.save(); ctx.translate(lx, ly); drawLanternBearer(lid, phase, size * (1 + k * .05)); ctx.restore();
  }
}
function drawMothEvent(id, phase, x, y, size, t) {
  for (let k = 0; k < 13; k++) {
    const mid = id + k * 61, radius = 28 + rand(mid) * 118, angle = t * (.5 + rand(mid + 1) * .5) + rand(mid + 2) * TAU;
    const mx = x + Math.cos(angle) * radius * 1.3 + (k % 2 ? 34 : -34);
    const my = y + Math.sin(angle * 1.3) * radius * .58 - rand(mid + 3) * 84;
    const scale = (.5 + rand(mid + 4) * .6) * size;
    const flap = .25 + .75 * Math.abs(Math.sin(t * (6 + rand(mid + 5) * 4) + mid));
    const halo = .30 + .30 * Math.sin(t * 3 + mid);
    ellipse(mx, my, 11 * scale, 11 * scale, `rgba(240,236,190,${.05 + halo * .06})`);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(-.25 + Math.sin(t * .8 + mid) * .3); ctx.scale(scale, scale);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side * flap, 1);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(9, -19, 24, -32, 34, -20);
      ctx.bezierCurveTo(40, -10, 20, 3, 2, 4); ctx.closePath();
      ctx.fillStyle = 'rgba(244,242,216,0.87)'; ctx.fill(); ctx.strokeStyle = '#8e86c8'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 4); ctx.bezierCurveTo(14, 4, 24, 14, 17, 21);
      ctx.bezierCurveTo(9, 26, 4, 15, 2, 4); ctx.closePath();
      ctx.fillStyle = 'rgba(207,233,226,0.8)'; ctx.fill(); ctx.restore();
    }
    ellipse(0, 2, 1.6, 7, '#e8e6c8');
    ctx.restore();
  }
}
function drawFairyRingEvent(id, phase, x, y, size, t, age) {
  const rise = Math.min(1, age / 3.2), ease = 1 - Math.pow(1 - rise, 3), pulse = .55 + .45 * Math.sin(t * 1.7);
  for (let k = 0; k < 7; k++) {
    const mid = id + k * 131, angle = k / 7 * TAU + rand(id) * TAU;
    const depth = (Math.sin(angle) + 1) / 2;
    const rx = Math.cos(angle) * (120 + rand(mid) * 40) * size;
    const my = y + (depth - .5) * 46 * size, scale = (.72 + rand(mid + 1) * .5) * size * ease * (.9 + depth * .35);
    if (scale < .04) continue;
    const b = inkBrush(ctx, mid, phase);
    ctx.save(); ctx.translate(x + rx, my); ctx.scale(scale, scale);
    const glow = ctx.createRadialGradient(0, -44, 0, 0, -44, 96);
    glow.addColorStop(0, `rgba(150,225,205,${.17 * pulse})`); glow.addColorStop(1, 'rgba(120,200,190,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -44, 96, 0, TAU); ctx.fill();
    b.stroke([[-6, 0], [-3.4, -16], [-3.6, -40], [3.6, -40], [3.4, -16], [6, 0]], '#cfe0c0', .8, mid + 3, true, '#a9c0a8');
    b.oval(0, -42, 32, 8, '#7f9a86', '#cbe2cd', mid + 6);
    const cap = sampledCurve([-38, -46], [0, -104], [38, -46], 16);
    cap.push([20, -42], [0, -40], [-20, -42]);
    b.stroke(cap, '#8ff0d6', 1.1, mid + 9, true, `rgba(140,240,215,${.45 + .35 * pulse})`);
    for (let g = 0; g < 5; g++) b.stroke([[(-2 + g) * 8, -44], [(-2 + g) * 3, -38]], '#dff8ee66', .6, mid + 20 + g);
    ctx.restore();
    for (let s = 0; s < 3; s++) {
      const ph = positiveMod(t * (.35 + rand(mid + s) * .3) + rand(mid + s + 9), 1);
      ellipse(x + rx + (rand(mid + s + 20) - .5) * 44, my - 50 - ph * 190, 2.2, 2.2, `rgba(190,255,235,${.5 * (1 - ph) * pulse})`);
    }
  }
}
function drawChoirEvent(id, phase, x, y, size, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const b = inkBrush(ctx, id, phase);
  b.stroke([[-150, 0], [-120, -34], [120, -40], [160, -6], [150, 6], [-140, 8]], '#3b4b3c', 1.6, id, true, '#22301f');
  b.oval(154, -18, 26, 20, '#6a6f52', '#b8ab84', id + 4);
  const sway = Math.sin(t * 1.4) * .06;
  for (let k = 0; k < 5; k++) {
    const kid = id + 40 + k * 211, tall = 113 + rand(kid + 18) * 16;
    const sing = Math.max(0, Math.sin(t * (1.3 + k * .07) + k));
    ctx.save(); ctx.translate(-118 + k * 62, -30); ctx.rotate(sway * (k % 2 ? 1 : -1));
    paintLeshy(inkBrush(ctx, kid, phase), 0, 0, kid);
    ellipse(0, -tall + 72, 5, 2 + sing * 5, '#0d1a14', 'rgba(200,183,155,0.9)');
    ctx.restore();
    for (let n = 0; n < 2; n++) {
      const ph = positiveMod(t * .42 + n * .5 + k * .13, 1);
      const nx = -118 + k * 62 + 6 + Math.sin(t * 1.2 + k) * 15, ny = -tall - 10 - ph * 78;
      ctx.globalAlpha = .55 * (1 - ph); ctx.fillStyle = '#dfe8c0';
      ctx.beginPath(); ctx.ellipse(nx, ny, 3.4, 2.6, -.3, 0, TAU); ctx.fill();
      ctx.fillRect(nx + 3, ny - 12, 1.2, 12);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
function drawWispEvent(id, phase, x, y, size, t) {
  const ground = ctx.createRadialGradient(x, y, 0, x, y, 150 * size);
  ground.addColorStop(0, 'rgba(150,225,255,0.15)'); ground.addColorStop(1, 'rgba(150,225,255,0)');
  ctx.fillStyle = ground; ctx.beginPath(); ctx.ellipse(x, y, 150 * size, 42 * size, 0, 0, TAU); ctx.fill();
  for (let k = 0; k < 16; k++) {
    const wid = id + k * 83, ph = positiveMod(t * (.5 + rand(wid) * .45) + rand(wid + 1), 1);
    const wx = x + nrand(wid + 2) * 150 * size + Math.sin(ph * 4 + wid) * 22;
    const wy = y - ph * 300 * size - ph * ph * 120;
    const alpha = (1 - ph) * (.5 + .35 * Math.sin(t * 4 + wid)), radius = (3.4 - ph * 2.6) * size;
    ctx.strokeStyle = `rgba(150,235,255,${alpha * .3})`; ctx.lineWidth = radius * 1.1;
    ctx.beginPath(); ctx.moveTo(wx, wy + radius * 3.4); ctx.lineTo(wx, wy); ctx.stroke();
    ellipse(wx, wy, radius * 2.6, radius * 2.6, `rgba(140,220,255,${alpha * .16})`);
    ellipse(wx, wy, radius, radius, `rgba(200,250,255,${alpha})`);
  }
}
function drawBloomEvent(id, phase, x, y, size, t, age) {
  const open = Math.min(1, age / 4.5), ease = 1 - Math.pow(1 - open, 2);
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const b = inkBrush(ctx, id, phase);
  b.stroke([[-6, 0], [-14, -120], [-4, -250], [6, -330]], moodTint('#12241b', .5), 3.4, id + 1);
  for (let k = 0; k < 3; k++) {
    const sy = -80 - k * 80;
    b.stroke([[sy * .02 - 10, sy], [sy * .02 - 54, sy - 22], [sy * .02 - 70, sy - 44]], moodTint('#16301f', .5), 3, id + 10 + k);
  }
  for (let k = 0; k < 7; k++) {
    const pk = id + k * 37, angle = -Math.PI / 2 + (k - 3) * .42 * ease, length = 110 + rand(pk) * 70;
    const tip = [Math.cos(angle) * length, -330 + Math.sin(angle) * length + 70 * ease];
    const petal = sampledCurve([0, -330], [Math.cos(angle) * length * .4, -330 + Math.sin(angle) * length * .55 - 24], tip, 8);
    const back = sampledCurve([0, -330], [Math.cos(angle) * length * .5, -330 + Math.sin(angle) * length * .5 + 26], tip, 8).reverse();
    b.stroke(petal.concat(back), k % 2 ? moodTint('#e6d7ff', .35) : moodTint('#cfe4ff', .35), 1.1, pk, true, k % 2 ? moodTint('#b9a6e0', .35) : moodTint('#a9c4e6', .35));
  }
  b.oval(0, -330, 26 * ease + 8, 22 * ease + 8, moodTint('#fdf6d6', .25), moodTint('#e8d79a', .3), id + 90);
  ctx.restore();
  for (let k = 0; k < 9; k++) {
    const pk = id + k * 53, ph = positiveMod(t * .35 + rand(pk) * 1.2, 1.4);
    if (ph > 1) continue;
    ellipse(x + (rand(pk + 1) - .5) * 120 * size + ph * 76 * size, y - 200 * size + ph * 270 * size,
      7 * size, 3.4 * size, `rgba(226,214,255,${.5 * (1 - ph)})`);
  }
}
function drawStarfallEvent(id, phase, x, y, size, t, age) {
  for (let k = 0; k < 5; k++) {
    const mid = id + k * 97, p = (age / 4.4 - rand(mid) * .55) / .42;
    if (p < 0 || p > 1) continue;
    const sx = w * (.06 + rand(mid + 1) * .72) + p * w * .30;
    const sy = h * .05 + rand(mid + 2) * h * .26 + p * h * .32;
    const length = 90 + rand(mid + 3) * 110, alpha = Math.sin(p * Math.PI);
    ctx.strokeStyle = `rgba(226,232,255,${alpha * .75})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - length * .42, sy - length); ctx.stroke();
    ctx.strokeStyle = `rgba(190,205,255,${alpha * .22})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - length * .42, sy - length); ctx.stroke();
    ellipse(sx, sy, 2.6, 2.6, `rgba(255,255,255,${alpha})`);
  }
}
function drawOwlEvent(id, phase, x, y, size, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
  const b = inkBrush(ctx, id, phase);
  b.stroke([[-300, 0], [-140, 10], [-20, 26], [140, 20], [300, 34]], '#2e4034', 9, id + 1);
  for (let k = 0; k < 5; k++) b.stroke([[-60 + k * 70, 20], [-50 + k * 70, 44], [-64 + k * 70, 72]], '#334638', 3, id + 10 + k);
  b.stroke([[-16, -26], [-26, -58], [-8, -78], [22, -80], [36, -58], [26, -24], [8, -16]], '#5d6a4d', 1.5, id + 20, true, '#3c4634');
  for (const side of [-1, 1]) {
    b.oval(side * 13, -66, 11, 11, '#c9d0a8', '#6f7a58', id + 30 + side);
    b.stroke([[side * 10, -78], [side * 16 + Math.sin(t * .7 + id) * 2, -92]], '#6f7a58', 2.4, id + 34 + side);
  }
  const look = Math.tanh((w * .5 - x) / 90) * 3.2;
  for (const side of [-1, 1]) {
    ellipse(side * 13 + look, -66, 4.6, 4.6, '#151a12');
    ellipse(side * 13 + look - 1.4, -67.4, 1.5, 1.5, '#e8ecd0');
  }
  b.stroke([[8, -62], [14, -56], [8, -52]], '#e2c27c', 1.6, id + 40);
  for (const side of [-1, 1]) b.stroke([[side * 22, -58], [side * 30, -38], [side * 20, -24]], '#4d5940', 2, id + 50 + side);
  for (const side of [-1, 1]) b.stroke([[side * 9, -16], [side * 11, -6], [side * 3, -4]], '#c9b183', 2, id + 56 + side);
  ctx.restore();
}
const eventStagers = {
  stag: {layer: 'far', speed: 92, size: 1.05, baseline: () => h * .80, draw: drawStagEvent},
  choir: {layer: 'far', speed: 104, size: 1.0, baseline: () => h * .845, draw: drawChoirEvent},
  lanterns: {layer: 'near', speed: 112, size: 1.0, baseline: () => h * .895, draw: drawLanternEvent},
  moths: {layer: 'near', speed: 124, size: 1.0, baseline: () => h * .70, draw: drawMothEvent},
  fairring: {layer: 'near', speed: 88, size: 1.0, baseline: () => h * .885, draw: drawFairyRingEvent},
  wisps: {layer: 'near', speed: 96, size: 1.0, baseline: () => h * .885, draw: drawWispEvent},
  owl: {layer: 'near', speed: 158, size: 1.0, baseline: () => h * .33, draw: drawOwlEvent},
  bloom: {layer: 'front', speed: 134, size: .62, baseline: () => h * .99, draw: drawBloomEvent},
  starfall: {layer: 'sky', speed: 0, size: 1.0, baseline: () => 0, draw: drawStarfallEvent}
};
function stageEvents(plan, layer) {
  const staged = [];
  // The previous act's beats keep playing until their trajectory is done, so a
  // set piece is never cut off mid-crossing by an act boundary.
  const sources = plan.index > 0 ? [plan, actPlan(plan.index - 1)] : [plan];
  for (const source of sources) for (const beat of source.beats) {
    const stager = eventStagers[beat.type];
    if (!stager || stager.layer !== layer) continue;
    const age = time - source.start - beat.start;
    if (age < 0 || age > beat.visible) continue;
    const {x, y, scale, flip} = beatTransform(beat, age);
    if (layer !== 'sky' && (x < -640 || x > w + 640)) continue;
    // A mirrored entry paints the piece facing the way it travels.
    if (flip) { ctx.save(); ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
    stager.draw(beat.id, positiveMod(boil, 3), x, y, scale, time, age);
    if (flip) ctx.restore();
    staged.push({id: beat.type + ':' + source.index + ':' + beat.id, type: beat.type, layer, kind: beat.kind,
      entry: beat.entry, x, y, age, size: scale});
  }
  return staged;
}
function drawSkyEvents(plan) {
  return stageEvents(plan, 'sky');
}
