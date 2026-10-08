// A fast, self-contained probe for independent review. It re-measures the three
// claims this iteration makes — the stage is busy for most of every act, the
// pieces arrive in visibly different ways, and the title card stays up for its
// whole act — without running the full verifier. Usage:
//   BROWSER_EXECUTABLE=<chrome> node review-probe.cjs
const path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const PHONE = {width: 430, height: 932};
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {})});
  const page = await (await browser.newContext({viewport: PHONE, deviceScaleFactor: 1, offline: true})).newPage();
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.waitForFunction(() => window.runway?.ready);
  const rows = [];
  for (let index = 0; index < 4; index++) {
    const plan = await page.evaluate(i => runway.plan(i), index);
    let busy = 0, samples = 0;
    for (let age = 0; age < plan.length; age += 1) {
      const state = await page.evaluate(t => runway.seek(t), plan.start + age);
      samples++;
      if (state.events.some(e => e.kind === 'signature' || e.kind === 'support')) busy++;
    }
    rows.push({act: plan.name, length: Number(plan.length.toFixed(1)), samples, busySeconds: busy, occupancy: Number((busy / samples).toFixed(3)),
      cast: plan.beats.map(beat => `${beat.kind}:${beat.type}@${beat.entry}`)});
  }
  const card = await page.evaluate(() => {
    const plan = runway.act();
    runway.seek(plan.start + plan.length / 2);
    const element = document.querySelector('#actcard');
    return {text: element.textContent, opacity: Number(getComputedStyle(element).opacity)};
  });
  await page.evaluate(() => runway.seek(runway.act().start + runway.act().length * .45));
  await page.waitForTimeout(250);
  await page.screenshot({path: path.join(__dirname, 'shots', 'review-mid-act.png')});
  console.log(JSON.stringify({acts: rows, meanOccupancy: Number((rows.reduce((sum, r) => sum + r.occupancy, 0) / rows.length).toFixed(3)),
    cardMidAct: card, errors, networkRequests: requests}, null, 1));
  await browser.close();
})().catch(e => { console.error('PROBE FAILED', e.message); process.exit(1); });
