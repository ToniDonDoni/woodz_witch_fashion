import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
await mkdir(dir + 'captures', {recursive: true});
const browser = await chromium.launch({headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
const context = await browser.newContext({viewport: {width: 1280, height: 720}, offline: true});
const page = await context.newPage();
const errors = [], requests = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
const digest = s => createHash('sha256').update(s).digest('hex');
const signature = async () => digest(await page.evaluate(() => document.querySelector('canvas').toDataURL()));
const seek = t => page.evaluate(t => theatre.seek(t), t);
const capture = async name => {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({path: dir + `captures/${name}.png`});
};
try {
  await page.goto(new URL('index.html?seed=1847', import.meta.url).href);
  await page.waitForFunction(() => window.theatre?.ready);
  const initial = await page.evaluate(() => theatre.state().time);
  await page.waitForTimeout(1000);
  const advanced = (await page.evaluate(() => theatre.state().time)) - initial;
  assert(advanced > .65, 'Live clock did not advance');
  await page.getByRole('button', {name: 'Pause animation', exact: true}).click();
  const paused = await page.evaluate(() => theatre.state().time);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => theatre.state().time), paused, 'Pause changed time');
  await page.getByRole('button', {name: 'Next creature'}).click();
  assert.equal(await page.evaluate(() => theatre.state().specimen.index), Math.floor(paused / 12) + 1);
  const oldId = await page.evaluate(() => theatre.state().specimen.id);
  await page.getByRole('button', {name: 'New seed'}).click();
  assert.notEqual(await page.evaluate(() => theatre.state().specimen.id), oldId);
  await page.evaluate(() => theatre.reseed(1847));

  const identities = await page.evaluate(() => Array.from({length: 300}, (_, i) => theatre.identity(i)));
  assert.equal(new Set(identities.map(s => s.id)).size, 300);
  assert.equal(new Set(identities.map(s => s.family)).size, 3);
  assert.equal(new Set(identities.map(s => `${s.family}:${s.form}`)).size, 12);
  assert.equal(new Set(identities.map(s => s.palette)).size, 8);
  for (let i = 1; i < identities.length; i++) assert.notEqual(identities[i].palette, identities[i - 1].palette, 'Adjacent visitors reused a palette');
  assert(Math.max(...identities.map(s => s.body)) / Math.min(...identities.map(s => s.body)) > 2, 'Body variation is too subtle');
  const deterministic = [];
  for (const t of [4.5, 7.5, 17.5, 29.5, 40.5, 3604.5]) {
    await seek(t); const a = await signature();
    await seek(t + 27); await seek(.25); await seek(t);
    assert.equal(await signature(), a, `Pixels changed at time ${t} after reverse seeking`);
    deterministic.push(t);
  }
  // Seeking very far ahead must construct only the requested specimen. Dispose
  // every replaced geometry/material rather than retaining an endless cast.
  const gpu = [];
  for (let i = 0; i < 48; i++) {
    const state = await seek(i * 12 + 4.5);
    assert.equal(state.activeCreatures, 1);
    gpu.push({index: i, ...state.gpu, calls: state.calls});
  }
  const distant = await seek(36000 + 4.5);
  assert.equal(distant.specimen.index, 3000);
  assert(distant.gpu.geometries < 260 && distant.gpu.textures < 5, 'GPU resources accumulated');
  assert(Math.max(...gpu.map(s => s.geometries)) < 260);
  const afterLongSeek = await seek(4.5);
  assert.equal(afterLongSeek.gpu.geometries, gpu[0].geometries);

  const captures = [];
  for (const [name, t] of [['spirit', 4.5], ['crown', 7.5], ['moth', 17.5], ['bird', 27], ['comet', 31.8], ['spirit-002', 40.5]]) {
    await seek(t); await capture(name); captures.push(name);
  }
  const archetypes = new Map();
  for (const spec of identities) if (!archetypes.has(`${spec.family}-${spec.form}`)) archetypes.set(`${spec.family}-${spec.form}`, spec);
  for (const [name, spec] of archetypes) {
    await seek(spec.index * 12 + 4.5);
    await capture(`variant-${name}`);
  }
  const viewports = [[390, 844], [320, 568], [844, 390], [1440, 900]];
  for (const [width, height] of viewports) {
    await page.setViewportSize({width, height}); await page.waitForTimeout(120);
    for (const [family, t] of [['spirit', 4.5], ['moth', 17.5], ['bird', 27]]) {
      await seek(t);
      const boxes = await page.evaluate(() => [...document.querySelectorAll('header, footer, button')].map(el => {
        const b = el.getBoundingClientRect(); return {left: b.left, right: b.right, top: b.top, bottom: b.bottom};
      }));
      for (const b of boxes) assert(b.left >= 0 && b.right <= width + 1 && b.top >= 0 && b.bottom <= height + 1, 'Controls escaped viewport');
      if (width === 390 || width === 844) await capture(`${width}-${family}`);
    }
  }
  const frames = new Set();
  for (let i = 0; i < 33; i++) {
    const s = await seek((i + .1) / 24); frames.add(s.walkFrame);
    assert.equal(s.walkFrame, i); assert.equal(s.walkFrames, 33);
  }
  assert.equal(frames.size, 33);
  // Inspect the unchanged source seam as two adjacent captures, without
  // inventing replacement poses or claiming that the existing seam is fixed.
  await page.setViewportSize({width: 1280, height: 720});
  for (const [name, t] of [['walk-32', 32.1 / 24], ['walk-00', 33.1 / 24]]) {
    await seek(t); await capture(name);
  }
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  const html = await readFile(dir + 'index.html', 'utf8');
  assert(!/<script[^>]+src=/.test(html), 'Offline page has an external script');
  const main = await readFile(dir + '../../index.html', 'utf8');
  const atlasPattern = /data:image\/webp;base64,[A-Za-z0-9+/=]+/;
  assert.equal(html.match(atlasPattern)?.[0], main.match(atlasPattern)?.[0], 'Approved walk atlas was changed');
  const report = {browser: await browser.version(), offline: true, liveClockAdvanceSeconds: advanced,
    pauseNextReseed: true, identitiesChecked: 300, distinctFamilies: 3, deterministicSeeks: deterministic,
    anatomicalArchetypes: archetypes.size, palettes: 8, originalWalkFrames: 33, originalWalkAtlasEqual: true,
    maxGpuGeometries: Math.max(...gpu.map(s => s.geometries)), maxGpuTextures: Math.max(...gpu.map(s => s.textures)),
    maxDrawCalls: Math.max(...gpu.map(s => s.calls)), tenHourSeek: distant.specimen.index,
    viewports: viewports.map(v => v.join('x')), captures, errors, externalRequests: requests,
    physicalPhoneTested: false, originalWalkSeamPreserved: true};
  await writeFile(dir + 'verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
