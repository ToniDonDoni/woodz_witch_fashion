# Forest enchantments — study 05

The forest audience runway from commit
`0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`, with three live Canvas effects:

- **MIST:** slow translucent banks at two depths, drawn behind the walker.
- **SPORES:** warm gold and mint-green swarms with curved trails. Each mushroom
  releases a swarm when it crosses the walker's position.
- **FERNS:** recursively detailed folded-paper plants that unfold, sway and curl
  closed as they travel through the rear forest layer.

Each effect has its own toggle. The original 33 footage-derived walk frames,
24 fps sprite cadence, 12 Hz contour boil, forest and neon audience are reused.
Turning all three effects off restores the original canvas exactly.

## Run immediately

A built, standalone `index.html` is committed here. From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open http://localhost:8000/out/forest-enchantments/ . On another device, replace
`localhost` with the serving computer's LAN address. In Docker, publish port
8000 (for example `-p 8000:8000`). You can also open this HTML directly as a file;
it embeds the atlas and all code and makes no runtime network requests.

## Rebuild

From the repository root, with Python 3 installed:

```sh
python3 -m venv /tmp/woodz-build-venv
. /tmp/woodz-build-venv/bin/activate
python -m pip install Pillow
python out/forest-enchantments/build.py
python -m http.server 8000 --bind 0.0.0.0
```

The builder reads the 33 PNGs from `assets/walk/`, the original forest and
spectator drawing code from `out/forest-spectators/`, and this attempt's
`template.html` and `enchantments.js`. It writes only this attempt's `index.html`.
Node.js, Three.js, bundlers and an internet connection are not needed to play it.

## Verify

The optional browser checks need Node.js, Playwright and Chromium. Install the
verification dependencies outside the repository:

```sh
npm install --prefix /tmp/woodz-browser-check playwright
node /tmp/woodz-browser-check/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_MODULE=/tmp/woodz-browser-check/node_modules/playwright \
  node out/forest-enchantments/verify.cjs
```

`BROWSER_EXECUTABLE` may select an existing Chromium binary. The verifier writes
screenshots, motion frames and `verification.json` beside the sources. It checks
three simulated minutes of effects, original scene regression checks, exact
restoration when effects are disabled, cache bounds, seek/reseed determinism,
pause, four viewports and offline operation. See `review.md` for observed results.

## References

The following are visual references from
[awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos), not
runtime dependencies. All three effects here are original Canvas adaptations:

- [Rolling fog](https://skillry.dev/ai-videos/opus-5-5/mondemsuraj-691517)
- [Particle illustration and ribbon trails](https://skillry.dev/ai-videos/opus-5-5/ishuagra02-678129)
- [Paper and cardboard fractals](https://skillry.dev/ai-videos/opus-5-5/jrayon-054015)
