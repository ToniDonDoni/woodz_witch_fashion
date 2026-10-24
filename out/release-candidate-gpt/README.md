# Release Candidate GPT — Moonlight and Living Fog

Status: exploratory release candidate, NOT a replacement for the accepted main page.

## What changes

- Starts from the published forest-audience code archived under `out/forest-spectators/`, retaining the 33 existing sprite frames and all eight neon chalk audience studies.
- Adds the moon, halo, distant stars and clouds from current `src/forest_scene.js`, which already exists on main.
- New `lighting.js`: deterministic world-anchored moonlight shafts tied to adjacent seeded layer-1 tree IDs, plus one continuously advecting periodic noise fog band.
- Atmosphere draws **after far trees and before near trees**; tree occlusion is intentionally painterly and partial because the near tree row uses `globalAlpha=.91`.
- A LIGHT ON/OFF control provides an A/B test with identical seed and simulation time.
- One self-contained HTML, no runtime fetches or external dependencies; static noise is generated once per seed, while landscape translation and light brightness change smoothly on RAF. The existing hand-drawn line boil is still 12 Hz.

## Build and delivery

Run `python out/release-candidate-gpt/build.py` from the repository root (Python 3 + Pillow). Builds `site/release-candidate-gpt/index.html` using the existing 33 PNG sprites, current moon sky, published audience forest and the new template/lighting module.

The public **GitHub Pages release candidate** is served at:
https://tonidondoni.github.io/woodz-witch-fashion-preview/release-candidate-gpt/

The original root public preview remains unchanged. The repo newly turned public, `woodz_witch_fashion`, reports `has_pages=false` at implementation time; the existing public preview repo is used for deployment without enabling Pages on main.

Run `node out/release-candidate-gpt/verify.cjs` with Playwright installed to check offline loading, deterministic re-seeking, toggle integrity, cache bounds, and four viewports. Browser smoke tests are not real-phone thermal performance tests.

## Known limitations / review notes

- The soft cone positions use true adjacent seeded tree IDs and positions, but do not yet raster-inspect the leaf alpha coverage at canopy top. **A shaft can still appear behind visually dense leaves**. Near tree silhouettes partially occlude it; use a small shared silhouette mask only if an actual screenshot shows a problem. No physically correct ray tracing or cast shadows are claimed.
- Fog movement uses a low-resolution cached looping periodic noise tile; review for repeating texture artifacts and softening on real high-DPR phones.
- Full physical-phone frame-delivery gate (p95/p99 RAF, missed-frame share, 3-minute thermal warmup, 5-minute A/B and 10-minute soak) from `tasks/moonlight_fog_research.md` has **not** been performed yet. Do not claim mobile acceptance.
- The pre-existing 32-to-0 gait discontinuity is unchanged.
- Stage markup has been modified for release-candidate title and extra controls. Runtime moon/twinkle is taken from the current main sky code, not invented sprite frames.
