const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const PHONE = {width: 430, height: 932};
// Wait for the compositor to present the frame a seek just drew, so two captures of
// the same simulated time are compared as pixels rather than as a paint race.
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
// A hash of the canvas backing store: the walker, woodland, weather and staged acts
// without the DOM chrome, so a paint race in the surrounding page cannot mask a
// genuine difference between two renders of the same simulated time.
const canvasSignature = page => page.evaluate(() => {
  const canvas = document.querySelector('#scene');
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < data.length; i += 4) {
    hash ^= data[i]; hash = Math.imul(hash, 16777619) >>> 0;
    hash ^= data[i + 1]; hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
});
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
  const context = await browser.newContext({viewport: PHONE, deviceScaleFactor: 1, offline: true});
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForFunction(() => window.runway?.ready);
  const capture = async (name, opts) => { await settle(page); await page.screenshot({path: path.join(__dirname, name), ...opts}); };
  // 1 — offline, error-free, real-time animation and pause.
  const initial = await page.evaluate(() => runway.state().time);
  await page.waitForTimeout(8000);
  const after = await page.evaluate(() => runway.state().time);
  assert(after - initial > 7, 'Animation did not advance in real time');
  await page.getByRole('button', {name: 'Pause animation'}).click();
  const paused = await page.evaluate(() => runway.state().time);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => runway.state().time), paused, 'Pause did not hold the clock');
  // 2 — the act programme itself.
  const programme = await page.evaluate(() => runway.programme(40));
  const names = programme.map(a => a.name), uniqueNames = new Set(names);
  assert(uniqueNames.size >= 6, 'The act programme does not vary enough');
  for (let k = 0; k < names.length; k++) for (let back = 1; back <= 3; back++) if (k - back >= 0) assert.notEqual(names[k], names[k - back], 'A theme repeated inside three acts');
  for (const act of programme) { assert(act.length >= 30 && act.length <= 62, 'Act length out of range'); assert(act.event, 'Act without a signature event'); }
  // Acts must tile the timeline exactly, and their lengths must really vary: an
  // index-free length would make the show metronomic and hide a wrong act start.
  for (let k = 1; k < programme.length; k++) assert(Math.abs(programme[k].start - (programme[k - 1].start + programme[k - 1].length)) < 1e-6, 'Act starts are not contiguous');
  assert(Math.max(...programme.map(a => a.length)) - Math.min(...programme.map(a => a.length)) > 2, 'Act lengths do not vary');
  // Every act is built from three overlapping beats: exactly one headline piece
  // plus two quieter supports, all distinct. Their windows must tile the act, so
  // an act can never announce itself and then leave the stage empty.
  const entryCounts = {};
  let worstCoverage = 1;
  for (const act of programme) {
    const cast = act.beats.filter(beat => beat.kind === 'signature' || beat.kind === 'support');
    const headline = cast.filter(beat => beat.kind === 'signature');
    assert.equal(headline.length, 1, 'An act without exactly one headline piece');
    assert.equal(headline[0].type, act.event, 'The headline piece is not the act signature');
    assert.equal(cast.length, 3, 'An act without three beats');
    assert.equal(new Set(cast.map(beat => beat.type)).size, cast.length, 'An act repeated one of its pieces');
    for (const beat of cast) {
      assert(beat.visible > 0 && beat.visible <= act.length, 'A beat has an impossible lifetime');
      assert(['left', 'right', 'hold', 'rise'].includes(beat.entry), 'A beat has an unknown entry mode');
      entryCounts[beat.entry] = (entryCounts[beat.entry] || 0) + 1;
    }
    const windows = cast.map(beat => [beat.start, beat.start + beat.visible]).sort((a, b) => a[0] - b[0]);
    let covered = 0, cursor = 0;
    for (const [from, to] of windows) { const begins = Math.max(from, cursor); if (to > begins) { covered += to - begins; cursor = to; } }
    worstCoverage = Math.min(worstCoverage, covered / act.length);
  }
  assert(worstCoverage >= .6, `A beat schedule left the stage empty (${worstCoverage.toFixed(2)})`);
  assert(Object.keys(entryCounts).length >= 4, 'Too few distinct entry modes across the programme');
  assert((entryCounts.right || 0) > 0 && (entryCounts.left || 0) > 0, 'Pieces only ever enter from one side');
  const eventTypes = new Set(programme.map(a => a.event)), cameoActs = programme.filter(a => a.cameo), rareActs = programme.filter(a => a.rare);
  assert(eventTypes.size >= 6, 'Too few distinct signature events in the programme');
  // 3 — every staged event type is actually drawn while it crosses the viewport.
  const staged = {}, stagedAges = {};
  const seekToStaged = async (type, actIndex, kind) => {
    const plan = await page.evaluate(i => runway.plan(i), actIndex);
    const beat = plan.beats.find(item => item.type === type && item.kind === kind);
    if (!beat) return null;
    for (let age = 0; age <= beat.visible; age += .5) {
      const state = await page.evaluate(t => runway.seek(t), plan.start + beat.start + age);
      // Mid-stage is what the viewer sees: the piece is inside the frame, not
      // sliding in or out at an edge.
      const hit = state.events.find(e => e.type === type && e.kind === kind && e.x > PHONE.width * .2 && e.x < PHONE.width * .8);
      if (hit) return {state, plan, beat, age, hit};
    }
    return null;
  };
  for (let index = 0; index < 12; index++) {
    const plan = await page.evaluate(i => runway.plan(i), index);
    const found = await seekToStaged(plan.event, index, 'signature');
    assert(found, `Signature event ${plan.event} never reached the viewport in act ${index}`);
    staged[plan.event] = (staged[plan.event] || 0) + 1;
    stagedAges[plan.event] = found.age;
    if (found.age != null && index < 8) await capture(`event-${plan.event}.png`);
  }
  let cameoSeen = 0, rareSeen = 0;
  for (const act of cameoActs.slice(0, 6)) {
    const found = await seekToStaged('starfall', act.index, 'cameo');
    if (found) { cameoSeen++; if (cameoSeen === 1) await capture('event-starfall.png'); }
  }
  for (const act of rareActs.slice(0, 6)) {
    const found = await seekToStaged('owl', act.index, 'rare');
    if (found) { rareSeen++; if (rareSeen === 1) await capture('event-owl.png'); }
  }
  assert(cameoSeen > 0, 'No star fall cameo reached the viewport');
  assert(rareSeen > 0, 'No owl cameo reached the viewport');
  // 4 — a staged object keeps its identity and follows its own trajectory.
  const trackBeat = (await page.evaluate(i => runway.plan(i), 1)).beats.find(beat => beat.kind === 'signature');
  const tracked = await seekToStaged(trackBeat.type, 1, 'signature');
  assert(tracked, 'No staged event to track');
  const before = tracked.state, trackTime = tracked.state.time;
  const afterState = await page.evaluate(t => runway.seek(t), trackTime + .25);
  const moving = before.events.find(e => e.type === trackBeat.type && e.kind === 'signature');
  const same = afterState.events.find(e => e.id === moving.id);
  assert(same, 'A staged event lost its identity while travelling');
  assert.equal(same.type, moving.type);
  if (trackBeat.entry === 'left') assert(same.x > moving.x, 'A left-entry piece did not travel rightwards');
  else if (trackBeat.entry === 'right') assert(same.x < moving.x, 'A right-entry piece did not travel leftwards');
  else assert(Math.abs(same.x - moving.x) < 14, 'A grounded piece did not hold its place');
  // 5 — the walk cycle, the woodland categories and the world bounds survive.
  const early = new Set(), later = new Set(), counts = [];
  for (let t = 0; t <= 600; t += 2) {
    const state = await page.evaluate(tt => runway.seek(tt), t);
    counts.push(state.activeCount);
    assert(state.figure.x >= 0 && state.figure.y >= 0 && state.figure.x + state.figure.width <= PHONE.width && state.figure.y + state.figure.height <= PHONE.height, 'The walker left the viewport');
    assert(state.cacheSize <= state.forest.length + state.foreground.length + 8, 'Cached art outgrew the active objects');
    for (const object of state.forest) if (object.x + 65 * object.size >= 0 && object.x - 65 * object.size <= PHONE.width) (t <= 30 ? early : later).add(object.kind);
  }
  for (const kind of ['tree', 'mushroom', 'stump', 'leshy']) { assert(early.has(kind), 'Missing early ' + kind); assert(later.has(kind), 'Missing recurring ' + kind); }
  assert(Math.max(...counts) - Math.min(...counts) < 40, 'Active objects accumulated');
  const distant = await page.evaluate(() => runway.seek(3600));
  assert(distant.activeCount < 120, 'The long-run world accumulated objects');
  assert(distant.cacheSize <= distant.forest.length + distant.foreground.length + 8, 'Stale cached art survived retirement');
  // 6 — identical time renders identically.
  const stageClip = {x: 0, y: 0, width: PHONE.width, height: 780};
  await page.evaluate(() => runway.seek(7.125)); await settle(page);
  const signatureOne = await canvasSignature(page), clipOne = await page.screenshot({clip: stageClip});
  await page.evaluate(() => runway.seek(7.125)); await settle(page);
  assert.equal(await canvasSignature(page), signatureOne, 'The same time produced two different worlds');
  assert(clipOne.equals(await page.screenshot({clip: stageClip})), 'The same time produced two different frames');
  // 7 — the foreground row is genuinely composited in front of the walker. Verified by
  // differencing two renders of the same simulated time with the row on and off: the
  // pixels over her legs must change, and the pixels over her torso must not.
  let overlayTime = null;
  for (let t = 0; t <= 240 && overlayTime === null; t += .25) {
    const state = await page.evaluate(tt => runway.seek(tt), t);
    if (state.foreground.some(o => o.kind === 'tuft' && Math.abs(o.x - PHONE.width / 2) < 36 && o.size > 1)) overlayTime = t;
  }
  assert(overlayTime !== null, 'No foreground blade ever crossed the walker');
  const legsBox = {x: Math.round(PHONE.width * .3), y: Math.round(PHONE.height * .74), w: Math.round(PHONE.width * .4), h: Math.round(PHONE.height * .13)};
  const torsoBox = {x: Math.round(PHONE.width * .3), y: Math.round(PHONE.height * .32), w: Math.round(PHONE.width * .4), h: Math.round(PHONE.height * .13)};
  const occlusion = await page.evaluate(({t, legs, torso}) => {
    const canvas = document.querySelector('#scene'), g = canvas.getContext('2d');
    const grab = box => g.getImageData(box.x, box.y, box.w, box.h).data;
    const meanDelta = (a, b) => { let sum = 0; for (let i = 0; i < a.length; i += 4) sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return sum / (a.length / 4) / 3; };
    runway.setForeground(true); runway.seek(t);
    const legsOn = grab(legs), torsoOn = grab(torso);
    runway.setForeground(false); runway.seek(t);
    const legsOff = grab(legs), torsoOff = grab(torso);
    runway.setForeground(true); runway.seek(t);
    return {legs: Number(meanDelta(legsOn, legsOff).toFixed(3)), torso: Number(meanDelta(torsoOn, torsoOff).toFixed(3))};
  }, {t: overlayTime, legs: legsBox, torso: torsoBox});
  assert(occlusion.legs > 6, 'Removing the foreground row did not change the walker\'s legs');
  assert(occlusion.torso < 2, 'The foreground row reached the walker\'s torso');
  await capture('foreground-on.png');
  await page.evaluate(() => runway.setForeground(false));
  await page.evaluate(t => runway.seek(t), overlayTime);
  await capture('foreground-off.png');
  await page.evaluate(() => runway.setForeground(true));
  // 8 — New Dream reshuffles the world instead of redrawing the same one.
  await page.evaluate(() => runway.seek(7.125)); await settle(page);
  const dreamSignature = await canvasSignature(page);
  const programmeBefore = JSON.stringify(await page.evaluate(() => runway.programme(10)));
  await page.getByRole('button', {name: 'NEW DREAM'}).click();
  await page.evaluate(() => runway.seek(7.125)); await settle(page);
  assert.notEqual(await canvasSignature(page), dreamSignature, 'New Dream redrew the same world');
  assert.notEqual(programmeBefore, JSON.stringify(await page.evaluate(() => runway.programme(10))), 'New Dream kept the same act programme');
  // 9 — the embedded walk frames are byte-identical to the approved source build.
  const digest = text => crypto.createHash('sha256').update(text.match(/data:image\/webp;base64,([^']+)/)[1]).digest('hex');
  const built = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const accepted = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
  assert.equal(digest(built), digest(accepted), 'The embedded walk frames changed');
  // 10 — review captures across viewports, plus the act card and the walk seam.
  await page.evaluate(t => runway.seek(t), (await page.evaluate(() => runway.plan(0))).start + 1.6);
  await capture('act-card.png');
  const card = await page.evaluate(() => {
    const element = document.querySelector('#actcard'), box = element.getBoundingClientRect();
    return {x: Math.floor(box.left), y: Math.floor(box.top), width: Math.ceil(box.width), height: Math.ceil(box.height),
      opacity: getComputedStyle(element).opacity, text: element.textContent};
  });
  assert.equal(card.opacity, '1', 'The act card is not shown at the start of an act');
  assert(/^ACT \S+ · .+/.test(card.text), 'The act card does not name the act');
  const cardClip = {x: card.x, y: card.y, width: card.width, height: card.height};
  const withCard = await page.screenshot({clip: cardClip});
  await page.evaluate(() => { document.querySelector('#actcard').style.visibility = 'hidden'; });
  assert(!withCard.equals(await page.screenshot({clip: cardClip})), 'The act card is not painted');
  await page.evaluate(() => { document.querySelector('#actcard').style.visibility = ''; });
  const viewports = [[PHONE.width, PHONE.height, 'phone'], [320, 568, 'small-phone'], [844, 390, 'landscape'], [1440, 900, 'desktop']];
  for (const [width, height, name] of viewports) {
    await page.setViewportSize({width, height});
    await page.waitForTimeout(250);
    for (const t of [1, 20]) { await page.evaluate(tt => runway.seek(tt), t); await capture(`${name}-${t}.png`); }
  }
  await page.setViewportSize(PHONE);
  await page.waitForTimeout(200);
  // 11 — the stage is busy, measured on what is actually on screen: a beat counts
  // only while its piece is inside the viewport, never while its anchor is still
  // travelling through the off-screen margin. (An earlier version of this check
  // counted off-screen anchors and overstated the occupancy.)
  const occupancy = [];
  let worstVisibleGap = 0;
  for (let index = 0; index < 6; index++) {
    const plan = await page.evaluate(i => runway.plan(i), index);
    let busy = 0, samples = 0, gap = 0, maxGap = 0;
    for (let age = 0; age < plan.length; age += .5) {
      const state = await page.evaluate(t => runway.seek(t), plan.start + age);
      samples++;
      const visible = state.events.some(e => (e.kind === 'signature' || e.kind === 'support')
        && e.x > 0 && e.x < PHONE.width && e.size > .05);
      if (visible) { busy++; maxGap = Math.max(maxGap, gap); gap = 0; } else gap += .5;
    }
    maxGap = Math.max(maxGap, gap);
    worstVisibleGap = Math.max(worstVisibleGap, maxGap);
    occupancy.push({index, act: plan.name, length: Number(plan.length.toFixed(1)), samples,
      visibleSeconds: Number((busy / 2).toFixed(1)), occupancy: Number((busy / samples).toFixed(3)), longestVisibleGapSeconds: maxGap});
  }
  const meanOccupancy = occupancy.reduce((sum, row) => sum + row.occupancy, 0) / occupancy.length;
  for (const row of occupancy) assert(row.occupancy >= .7, `Act ${row.index} was mostly empty on screen (${row.occupancy})`);
  assert(meanOccupancy >= .8, `The stage was empty too often on screen (${meanOccupancy.toFixed(2)})`);
  assert(worstVisibleGap <= 6, `The stage went blank for ${worstVisibleGap} seconds`);
  // 12 — the title card stays with its act instead of announcing it and vanishing.
  const midAct = await page.evaluate(() => {
    const plan = runway.act();
    runway.seek(plan.start + plan.length / 2);
    const element = document.querySelector('#actcard');
    return {text: element.textContent, opacity: Number(getComputedStyle(element).opacity)};
  });
  assert(midAct.opacity >= .4, 'The act card faded away in the middle of its act');
  assert(/^ACT \S+ · \S/.test(midAct.text), 'The act card lost its act name mid-act');
  // A frame-time sanity check on this machine (headless desktop CPU, not a phone):
  // 120 simulated seconds sampled across five acts, timing each synchronous draw.
  const drawTimes = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 120; i++) { const began = performance.now(); runway.seek(40 + i * .37); out.push(performance.now() - began); }
    return out.sort((a, b) => a - b);
  });
  const drawMilliseconds = {mean: Number((drawTimes.reduce((sum, v) => sum + v, 0) / drawTimes.length).toFixed(3)),
    median: Number(drawTimes[Math.floor(drawTimes.length / 2)].toFixed(3)), p95: Number(drawTimes[Math.floor(drawTimes.length * .95)].toFixed(3)),
    worst: Number(drawTimes[drawTimes.length - 1].toFixed(3)), samples: drawTimes.length, physicalPhoneTested: false};
  assert(drawMilliseconds.p95 < 60, 'A single draw exceeded the review budget on this machine');
  fs.mkdirSync(path.join(__dirname, 'motion'), {recursive: true});
  for (let i = 0; i < 48; i++) { await page.evaluate(t => runway.seek(t), i / 12); await settle(page); await page.locator('canvas').screenshot({path: path.join(__dirname, 'motion', `${String(i).padStart(3, '0')}.png`)}); }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  const report = {
    browser: await browser.version(), offline: true, realTimeAdvance: Number((after - initial).toFixed(4)),
    viewports: viewports.map(v => `${v[0]}x${v[1]}`), actLengthSeconds: [Math.min(...programme.map(a => a.length)), Math.max(...programme.map(a => a.length))],
 actStartsContiguous: true, drawMilliseconds,
    actNames: Array.from(uniqueNames), signatureEvents: topology(programme), distinctSignatureEvents: eventTypes.size,
    firstSeenAgeSeconds: stagedAges, cameoActsSeen: cameoSeen, rareActsSeen: rareSeen,
    activeCountRange: [Math.min(...counts), Math.max(...counts)], simulatedSeconds: 600,
    foregroundOcclusionDelta: {...occlusion, atTime: overlayTime, legsBox, torsoBox},
    beatsPerAct: 3, worstBeatCoverage: Number(worstCoverage.toFixed(3)), entryModes: entryCounts,
    stageOccupancyVisible: occupancy, meanStageOccupancyVisible: Number(meanOccupancy.toFixed(3)), worstVisibleGapSeconds: worstVisibleGap,
    actCardAtMidAct: midAct,
    walkFramesDigest: digest(built), errors, networkRequests: requests, physicalPhoneTested: false
  };
  function topology(list) { const out = {}; for (const act of list) out[act.event] = (out[act.event] || 0) + 1; return out; }
  fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
