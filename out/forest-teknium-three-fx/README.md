# Forest Audience with three original GLSL studies

Original Forest Audience page: `out/forest-spectators/index.html`, from
source `0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`.
Verified Git blob: `434db5a823e39df15507a87c90a73a3924c36c32`.
The builder validates that exact content. Forest, neon chalk spectators,
butterflies, path, mushrooms and **all 33 original walking sprites** stay.

The effects from PR #25 (Liquid Glass, Spectral Smoke and Pixel Dissolve)
render on top of the complete unchanged forest and behind the walking woman.
The shader canvas is transparent; WebGL2 is used when possible on desktop
and mobile (at 1x CSS-pixel resolution on touch phones). Canvas2D is a true
WebGL2-unavailable fallback, not a forced mobile downgrade.

## Exact version badge

The bottom-left badge displays the short SHA of the **exact Git branch HEAD**
which produced the deployed page, and links to the full commit. A commit cannot
contain its own SHA in its tracked file without changing the SHA. Therefore
the tracked `site/forest-teknium-three-fx/index.html` is a source-stage preview
that **deliberately** reads "SHA · UNSTAMPED BUILD". Do **not** publish it directly.
The GitHub Actions `Check Forest Three FX` workflow rebuilds from the checked-out
PR head and produces a downloadable **stamped HTML artifact** named
`forest-three-fx-<FULL_SHA>`. Publish that output through GPT Sites.

Manual reproducible build:

```bash
node out/forest-teknium-three-fx/build.cjs
npm install --no-save playwright
npx playwright install chromium
node out/forest-teknium-three-fx/verify.cjs
```

No GitHub Pages or source main change required. Review live mobile aesthetics
before calling it accepted.
