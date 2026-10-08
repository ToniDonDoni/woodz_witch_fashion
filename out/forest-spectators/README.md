# Forest spectators — runway study 04

The eight neon chalk studies now appear as spectators behind the centered walking figure. They move left to right through the existing runtime-drawn forest, while their pupils glance toward the walker. The original 33 footage-derived sprite frames and walking cadence are unchanged.

## Reproduce

Run `python out/forest-spectators/build.py` with Pillow available. Source is `template.html`, `forest.js` and `spectators.js`. The result, `index.html`, contains the sprite atlas and all procedural drawing code and needs no network connection.

Run `node out/forest-spectators/verify.cjs` with Playwright and Chromium. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` optionally select existing local installations. The verifier writes screenshots, motion captures and `verification.json` beside this source.

## Motion and identity

The eight studies recur in a seeded world sequence with fixed identity, palette and anatomy. Their screen positions advance smoothly at the audience layer speed. Only contours and small secondary motions refresh at 12 Hz. Cached drawings use canonical phase time and phase-time gaze, so rendering is independent of earlier calls. Viewport dimensions are included in cache keys. Full drawing extents and placement offsets determine safe entry margins, and retired objects are removed immediately.

The previous small leshies are suppressed on the rear ground row to avoid duplicate faces showing through the neon silhouettes. The foreground forest row and the independently scrolling chalk path remain.

## Verification

Offline Chrome checks passed: four viewport sizes, real-time animation, two simulated minutes of object persistence and bounded caches, all eight character studies recurring, deterministic rendering across different seek histories within a drawing phase, pause, reseeding, no JavaScript errors and no network requests. The final report records 7.9996 seconds of simulation advance in an eight-second observation and 53–60 active world objects.

Desktop and phone-size screenshots were inspected. Independent review is recorded in `review.md`. Physical-phone performance remains unmeasured. The existing source gait seam is unchanged; this iteration does not claim to repair it.

Published preview: https://tonidondoni.github.io/woodz-witch-fashion-preview/
Public deployment PR: https://github.com/ToniDonDoni/woodz-witch-fashion-preview/pull/3
