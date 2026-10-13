import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const base = (process.env.PREVIEW_URL || 'http://localhost:4117').replace(/\/$/, '');
const published = process.env.PUBLISHED_PREVIEW === '1';
const local = await readFile(dir + 'index.html', 'utf8');
const routeChecks = [];
for (const path of ['/', '/?runway=3', '/?seed=1847', '/index.html?seed=1847']) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `Preview failed at ${path}`);
  assert.equal(await response.text(), local, 'Server delivered stale or different HTML');
  routeChecks.push(path);
}
if (!published) assert.equal((await fetch(base + '/favicon.ico')).status, 204);
assert.equal((await fetch(base + '/missing-file')).status, 404);
const browser = await chromium.launch({headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
const errors = [], failedRequests = [], httpFailures = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('requestfailed', r => failedRequests.push(r.url()));
page.on('response', r => { if (r.status() >= 400) httpFailures.push({url: r.url(), status: r.status()}); });
const samples = [];
const captureDirectory = published ? 'captures/published' : 'captures/live';
await mkdir(dir + captureDirectory, {recursive: true});
try {
  const response = await page.goto(base + '/?runway=3');
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => window.theatre?.ready);
  const initial = await page.evaluate(() => theatre.state());
  await page.waitForTimeout(4000);
  // Observe real playback through three natural identity changes. No seeks.
  for (let i = 0; i < 4; i++) {
    if (i) await page.waitForTimeout(12000);
    const state = await page.evaluate(() => theatre.state()); samples.push(state);
    assert(state.running && state.ready);
    assert.equal(state.activeCreatures, 1);
    assert.equal(state.walkFrames, 33);
    await page.screenshot({path: dir + `${captureDirectory}/visitor-${i}.png`});
  }
  assert(samples[3].time - initial.time > 37, 'Animation did not advance over the live run');
  assert.equal(new Set(samples.map(s => s.specimen.id)).size, 4);
  assert.equal(new Set(samples.map(s => s.specimen.family)).size, 3);
  await page.getByRole('button', {name: 'Pause animation', exact: true}).click();
  const paused = await page.evaluate(() => theatre.state().time);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => theatre.state().time), paused);
  await page.getByRole('button', {name: 'Next creature'}).click();
  assert.equal(await page.evaluate(() => theatre.state().specimen.index), Math.floor(paused / 12) + 1);
  const seed = await page.evaluate(() => theatre.state().seed);
  await page.getByRole('button', {name: 'New seed'}).click();
  assert.notEqual(await page.evaluate(() => theatre.state().seed), seed);
  await page.getByRole('button', {name: 'Play animation', exact: true}).click();
  const resumed = await page.evaluate(() => theatre.state().time);
  await page.waitForTimeout(400);
  assert((await page.evaluate(() => theatre.state().time)) > resumed + .2);
  assert.deepEqual(errors, []); assert.deepEqual(failedRequests, []); assert.deepEqual(httpFailures, []);
  const report = {url: base + '/?runway=3', deliveredHtmlMatchesBuild: true, routeChecks,
    realPlaybackSeconds: samples[3].time - initial.time, naturalVisitors: samples.map(s => s.specimen),
    originalWalkFrames: 33, controlsPassed: true, errors, failedRequests, httpFailures,
    browser: await browser.version()};
  await writeFile(dir + (published ? 'published-verification.json' : 'live-verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
