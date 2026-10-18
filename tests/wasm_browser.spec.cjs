// Browser-level smoke test: real mouse gestures and non-silent Web Audio output.
// Run against the locally built site; never mock the synthesizer.
const { test, expect } = require('@playwright/test');

test('WASM controls drag and music produces an audible signal', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));

  // Tap the signal feeding the actual AudioDestinationNode without changing
  // the application or depending on the OS sound device in headless CI.
  await page.addInitScript(() => {
    window.__audioProbe = { contexts: [], analysers: [] };
    const NativeContext = window.AudioContext || window.webkitAudioContext;
    if (!NativeContext) return;
    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (destination, ...args) {
      const result = originalConnect.call(this, destination, ...args);
      if (destination instanceof AudioDestinationNode) {
        const analyser = this.context.createAnalyser();
        analyser.fftSize = 2048;
        originalConnect.call(this, analyser);
        window.__audioProbe.analysers.push(analyser);
      }
      return result;
    };
    class ObservedAudioContext extends NativeContext {
      constructor(...args) {
        super(...args);
        window.__audioProbe.contexts.push(this);
      }
    }
    window.AudioContext = ObservedAudioContext;
    window.webkitAudioContext = ObservedAudioContext;
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'openFrameworks / WebAssembly' }).click();
  const frame = page.frameLocator('#scene');
  const speed = frame.locator('#gravity-speed-slider');
  const gravity = frame.locator('#gravity-strength-slider');
  const music = frame.locator('#music-toggle');
  await expect(speed).toBeVisible();
  await expect(gravity).toBeVisible();
  await expect(music).toBeVisible();

  async function drag(slider, ratio) {
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ratio, box.y + box.height * 0.5, { steps: 12 });
    await page.mouse.up();
  }

  await drag(speed, 0.95);
  await expect.poll(async () => Number(await speed.inputValue())).toBeGreaterThan(1.5);
  await drag(gravity, 0.05);
  await expect.poll(async () => Number(await gravity.inputValue())).toBeLessThan(0.5);

  const parameters = await frame.locator('body').evaluate(() => ({
    speed: window.gravitySpeedFactor,
    gravity: window.gravityStrengthFactor
  }));
  expect(parameters.speed).toBeGreaterThan(1.25);
  expect(parameters.gravity).toBeLessThan(2.1);

  // Music is enabled by default; the first pointer gesture unlocks browser audio.
  await expect(music).toHaveText('■ Stop music');
  // The analyser is connected to the actual master gain feeding the speakers.
  // Nonzero RMS demonstrates synthesized samples, not merely a running timer.
  await expect.poll(async () => frame.locator('body').evaluate(() => {
    const probe = window.__audioProbe;
    if (!probe || !probe.analysers.length || !probe.contexts.some(c => c.state === 'running')) return 0;
    return Math.max(...probe.analysers.map(analyser => {
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
    }));
  }), { timeout: 15000, intervals: [100, 200, 300] }).toBeGreaterThan(0.0001);

  expect(browserErrors).toEqual([]);
});
