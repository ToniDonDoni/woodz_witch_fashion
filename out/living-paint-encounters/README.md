# Living Paint V2 — isolated procedural runway attempt

**Source of truth:** `tasks/living_paint_encounters_v2.md`.

## Components

- `grammar.js` — finite construction rules combined into an indefinitely indexable seeded stream. Six bodies, six possible appendage algorithms (four compatible alternatives per body), six gesture timelines, six palettes, and continuous morphology.
- `paint_renderer.js` — one WebGL2 fragment shader for procedurally drawn silhouette, colored flowing pigment, rim light and fine contour boil. Scissor bounds fragment execution; Canvas 2D fallback.
- `template.html` — black stage, two compositing layers for creature and walking sprite, controls for pause, next encounter and new random dream, debugging API.
- `build.py` — offline self-contained HTML builder embedding the repository's 33 original walk frames as WebP.
- `verify.cjs` — automated browser checks with artifacts for visual review.
- `../../site/living-paint-v2/index.html` — committed, standalone release candidate.

## Build

From repository root:

```sh
python -m pip install pillow
python out/living-paint-encounters/build.py
npm install --no-save playwright
npx playwright install chromium
node out/living-paint-encounters/verify.cjs
```

The browser can open `site/living-paint-v2/index.html` without network access.

## Manual debug hooks

`window.runway.state()` reports the current backend, current event composition and original walker frame.
`window.runway.spec(slot)` builds a deterministic event genome without simulating earlier slots.
`window.runway.inspect(time)` checks how many events are active without rendering.
`window.runway.seek(time)`, `seekSlot(n)`, `seekEvent(n)`, `setSeed(seed)`, and `play(boolean)` support screenshot comparisons.

## Limitations

The WebGL2 appearance is more painterly than the Canvas fallback and may vary across GPUs. The grammar creates many combinations but does not guarantee every being is perceived as wholly different. The existing gait loop discontinuity is unchanged. CI browser test success does not substitute for physical mobile visual/performance acceptance.
