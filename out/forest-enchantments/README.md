# Forest enchantments — study 05

The forest audience runway from commit
`0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`, with three live Canvas effects:

- **MIST:** slow translucent banks at two depths, drawn behind the walker.
- **SPORES:** warm gold and mint-green swarms with curved trails. Each mushroom
  releases a swarm when it crosses the walker's position.
- **FERNS:** recursively detailed folded-paper plants that unfold, sway and curl
  closed as they travel through the rear forest layer.

Each effect has a labeled native checkbox at the bottom, above playback controls. The original 33 footage-derived walk frames,
24 fps sprite cadence, 12 Hz contour boil, forest and neon audience are reused.
Turning all three effects off restores the original canvas exactly.

## Run the correct preview

A built, standalone `index.html` is committed here. Rebuild first for an exact
HEAD stamp (see below). From the repository root:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory out/forest-enchantments
```

Open http://localhost:8000/ . This serves the correct effect preview directly;
the repository root `index.html` is a different, older "Into the woods" scene. On another device, replace
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
python -m http.server 8000 --bind 0.0.0.0 --directory dist/forest-enchantments
```

The builder reads the 33 PNGs from `assets/walk/`, the original forest and
spectator drawing code from `out/forest-spectators/`, and this attempt's
`template.html` and `enchantments.js`. Normal builds write
`dist/forest-enchantments/index.html`, which is ignored by Git so rebuilding with
a new HEAD does not create tracked changes or block the next `git pull`.
Node.js, Three.js, bundlers and an internet connection are not needed to play it.

## Build identity

A normal build runs `git rev-parse --verify HEAD` in this repository and embeds
that exact checked-out commit. The upper-left stamp shows the first 12 hex
characters, links to the full commit, and includes the checked-out branch name.
It does not query the live remote branch and does not read `GITHUB_SHA`, which
can identify a synthetic PR merge. Always rebuild after switching or updating
branches. Detached checkouts show the exact commit and `HEAD` as the branch.

The committed preview is generated with `python out/forest-enchantments/build.py
--snapshot` and explicitly says **HEAD · rebuild to identify**. A file cannot
contain its own enclosing commit hash; recording a parent hash as if it were the
current HEAD would be misleading. Normal local/CI builds replace this message
with the actual build HEAD. The result remains one offline-capable HTML file in `dist/forest-enchantments/`.

The **Check Forest Enchantments** workflow checks out the PR head SHA explicitly,
builds, verifies, and uploads an HTML artifact named after that same commit. It
never stamps the synthetic merge commit created by GitHub for PR checks.

## Verify

The optional browser checks need Node.js, Playwright and Chromium. Install the
verification dependencies outside the repository:

```sh
npm install --prefix /tmp/woodz-browser-check playwright
node /tmp/woodz-browser-check/node_modules/playwright/cli.js install chromium
PLAYWRIGHT_MODULE=/tmp/woodz-browser-check/node_modules/playwright \
  node out/forest-enchantments/verify.cjs
```

Run a normal build before verification; the version check requires a stamped page.

`BROWSER_EXECUTABLE` may select an existing Chromium binary. The verifier writes
screenshots, motion frames and `verification.json` beside the sources. It checks
three simulated minutes of effects, original scene regression checks, exact
restoration when effects are disabled, cache bounds, seek/reseed determinism,
pause, five viewports and offline operation. See `review.md` for observed results.

## References

The following are visual references from
[awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos), not
runtime dependencies. All three effects here are original Canvas adaptations:

- [Rolling fog](https://skillry.dev/ai-videos/opus-5-5/mondemsuraj-691517)
- [Particle illustration and ribbon trails](https://skillry.dev/ai-videos/opus-5-5/ishuagra02-678129)
- [Paper and cardboard fractals](https://skillry.dev/ai-videos/opus-5-5/jrayon-054015)
