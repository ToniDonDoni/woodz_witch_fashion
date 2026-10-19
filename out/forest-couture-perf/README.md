# Forest Couture: cached buyer row and frame-budget investigation

## Provenance

This is a fresh branch from `main`. It intentionally does **not** merge the unaccepted original experiment into `main`.

- **Original art and scene source:** [woodz_witch_fashion PR #16](https://github.com/ToniDonDoni/woodz_witch_fashion/pull/16) (`codex/forest-couture-buyers-row`)
- **Original public publication:** [woodz-witch-fashion-preview PR #13](https://github.com/ToniDonDoni/woodz-witch-fashion-preview/pull/13)
- **Original published URL:** https://tonidondoni.github.io/woodz-witch-fashion-preview/forest-couture-buyers/
- **Performance benchmark and optimized source:** [woodz_witch_fashion PR #17](https://github.com/ToniDonDoni/woodz_witch_fashion/pull/17)
- **Previous Chromium frame-budget run:** https://github.com/ToniDonDoni/woodz_witch_fashion/actions/runs/37988122566

## Confirmed problem

The original Forest Couture renders all 9–11 stationary buyer illustrations from scratch on each animation frame: more than 1,000 Canvas strokes per frame, including fur, lines, gradients and blur. However, the only essential continuous change is the woman's walking sprite. Repeated full re-rasterization of the audience is unnecessary work.

The earlier diagnostic run compared original main, couture and a test cached variant with fourfold Chromium CPU throttling. The measured median JS frame-dispatch cost at 390×844 was 5.2 ms for couture and 2.7 ms for cached. These are **not real-device FPS measurements**, and JS timing cannot alone attribute GPU or Canvas raster/composition costs. Main contains a much more complicated forest scene and is not an art-content-matched performance baseline.

## Actual optimization

- `audience.js`: original PR #16 art code copied **unchanged**.
- `template.html`: preserve original HTML/CSS, render the entire buyer row to its existing Canvas **only on initial load, window resize and New Cast / setSeed**. The static Canvas becomes the cached background itself, without a per-frame offscreen copy. Keep `model` Canvas and original 33-frame walker sprite exactly as before.
- Minor change in motion: the original ±1.4 px vertical bob of each seated buyer is intentionally frozen at time=0 because the buyers are the static audience. This preserves the pixel-identical time-zero source reference and removes nearly all unnecessary Canvas calls during walking. Animated eyes/gestures may be added later as cheap overlays rather than re-rendering detailed fur.
- `build.py`: recreate one self-contained offline HTML using the same 33 original PNG frames and WebP atlas settings.
- `verify.cjs`: offline automated pixel-image comparison against original at time=0, 120 subsequent steps with **zero audience re-renders**, repeatable seed change, and desktop/phone viewport screenshots.
- `benchmark.cjs`: actual main/original/cached CPU experiment with canvas operation counters.

This separate source deliverable lives in `site/forest-couture-buyers-optimized/index.html`. The previous main-root forest page and the source of PR #16 are unchanged. The public preview should be updated *after CI verification* and its publication PR should link back to PR #16, original publication PR #13, and this PR #17.

## Verification

```sh
python -m pip install pillow
python out/forest-couture-perf/build.py
npm install --no-save playwright
npx playwright install chromium
node out/forest-couture-perf/verify.cjs
node out/forest-couture-perf/benchmark.cjs
```

`verify.cjs` expects a copy of the original PR #16 compiled HTML in `out/forest-couture-perf/original.html` (the CI workflow obtains it using `git show`). The performance benchmark also uses an equivalent `couture.html`.

A physical phone FPS/GPU/thermal check is required before making quantitative mobile-FPS claims.
