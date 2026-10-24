// Headless smoke checks; not a substitute for physical-phone FPS measurements.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    offline: true
  });
  const page = await context.newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (/^https?:/i.test(r.url())) requests.push(r.url()); });
  const output = path.join(__dirname, 'captures');
  fs.mkdirSync(output, { recursive: true });
  const candidate = path.resolve(__dirname, '../../site/release-candidate-gpt/index.html');
  await page.goto('file://' + candidate);
  await page.waitForFunction(() => window.runway && runway.ready, null, {timeout:30000});

  assert.equal(await page.title(), 'Woodz — Release Candidate GPT · Moonlight and Fog');
  const s = await page.evaluate(() => runway.seek(7.125));
  assert.equal(s.atmosphere.qualityTier, 'fixed-v1');
  assert(s.atmosphere.texturePixels > 0 && s.atmosphere.texturePixels <= 250000);
  assert(s.atmosphere.beams.length > 0, 'No visible canopy-anchored beams in initial view');
  assert(s.spectators.length > 0, 'Published audience lost');
  const lightOn = await page.locator('#scene').screenshot();
  await page.evaluate(() => runway.seek(0));
  await page.evaluate(() => runway.seek(7.09));
  await page.evaluate(() => runway.seek(7.125));
  assert(lightOn.equals(await page.locator('#scene').screenshot()),
         'Direct seek and stepped playback disagree');

  const hidden = await page.evaluate(() => runway.setEffects(false));
  assert.equal(hidden.atmosphere.effectsEnabled, false);
  assert.deepEqual(hidden.atmosphere.beams, s.atmosphere.beams);
  const lightOff = await page.locator('#scene').screenshot();
  assert(!lightOn.equals(lightOff), 'Lighting toggle did not change the canvas');
  await page.screenshot({path:path.join(output, 'phone-light-off.png')});
  const enabled = await page.evaluate(() => runway.setEffects(true));
  assert.deepEqual(enabled.atmosphere.beams, s.atmosphere.beams);
  assert(lightOn.equals(await page.locator('#scene').screenshot()),
         'Lighting toggle should reproduce the same image at the same timestamp');
  await page.screenshot({path:path.join(output, 'phone-light-on.png')});

  let maxActive = 0, maxForestCache = 0, maxAudienceCache = 0, maxTileRebuilds = 0;
  for(let t=0; t<=120; t+=.5){
    const st = await page.evaluate(time => runway.seek(time), t);
    maxActive = Math.max(maxActive, st.activeCount);
    maxForestCache = Math.max(maxForestCache, st.cacheSize);
    maxAudienceCache = Math.max(maxAudienceCache, st.spectatorCacheSize);
    maxTileRebuilds = Math.max(maxTileRebuilds, st.atmosphere.tileRebuilds);
    assert(st.activeCount < 120 && st.cacheSize < 100 && st.spectatorCacheSize < 12);
  }
  assert.equal(maxTileRebuilds, 1, 'Fog texture rebuilt during animation');
  const distant = await page.evaluate(() => runway.seek(3600));
  assert(distant.activeCount < 120 && distant.cacheSize < 100);
  const paused = await page.evaluate(() => runway.seek(18));
  await page.waitForTimeout(120);
  assert.equal((await page.evaluate(() => runway.state())).time, paused.time);

  for(const viewport of [{width:320,height:568},{width:844,height:390},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    // Viewport resize events are asynchronous; wait for the scene canvas to resize.
    await page.waitForFunction(v => runway.state().viewport.w === v.width && runway.state().viewport.h === v.height, viewport);
    const st = await page.evaluate(() => runway.seek(12));
    assert(st.figure.x >= 0 && st.figure.y >= 0);
    assert(st.figure.x + st.figure.width <= viewport.width + .1);
    assert(st.figure.y + st.figure.height <= viewport.height + .1);
    await page.screenshot({path:path.join(output, 'scene-'+viewport.width+'x'+viewport.height+'.png')});
  }
  const beforeSeed = (await page.evaluate(() => runway.state())).seed;
  await page.locator('#dream').click();
  const afterSeed = (await page.evaluate(() => runway.state())).seed;
  assert.notEqual(beforeSeed, afterSeed);
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  const report = {browser:await browser.version(),offline:true,source:'release-candidate-gpt',
      viewportSamples:['390x844','320x568','844x390','1440x900'],simulatedSeconds:3600,
      maxActive,maxForestCache,maxAudienceCache,maxTileRebuilds,
      noNetworkRequests:true,noRuntimeErrors:true,physicalPhoneTested:false};
  fs.writeFileSync(path.join(__dirname, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
