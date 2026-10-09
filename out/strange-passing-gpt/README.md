# Forest Casting / GPT

An endless woodland fashion show: sportswear meets a Belarusian witch's front row. The unchanged footage-derived walker stays anchored while one improbable visitor appears, performs and leaves before the next arrives.

[Open the isolated Pages preview](https://tonidondoni.github.io/woodz-witch-fashion-preview/strange-passing-gpt/).

## Cast and timing

The eight drawing grammars are a seated leshy buyer in striped sportswear, an owl buyer on a stool, a moon-antlered deer, a door-shell snail, a mushroom jellyfish, a ribbon creature, an umbrella fish raining upward and a gust of leaves. The first guest is always one of the seated buyers. Each shuffled block contains all eight families; adjacent families never repeat across block boundaries. A visitor performs for 19–22 seconds, followed by 2–5 seconds of breathing room in a 24-second slot. Buyers settle beside the model and raise a card or curiosity. Other creatures slow down beside her, transform, and continue off screen.

Stable seeded proportions, palettes, ornament counts, markings, cargo and routes vary each appearance. This is an unending combinatorial show with eight authored families, not a promise that a finite vocabulary can never recur. Each page opening starts a fresh seed; New Dream reseeds immediately, while Next Guest advances one slot.

The art uses imperfect double pencil outlines, clipped dry-pigment flecks, hatching, desaturated moss, chalk, mauve and burgundy. Contours change at 12 Hz. World travel, secondary motions and the 24 Hz approved walk frames have independent clocks. The front hedge is smaller in this variant to preserve the runway and shoes. The accepted root page and original sprites are unchanged.

## Reproduce

Use Python with Pillow 12.3.0 and Node 22 with Playwright 1.62.1 and its Chromium browser:

```sh
python out/strange-passing-gpt/build.py
node out/strange-passing-gpt/verify.cjs
node out/strange-passing-gpt/live-check.cjs
```

The self-contained result is `site/strange-passing-gpt/index.html`. Sources remain together in this exploratory attempt: `template.html`, `passing.js`, `build.py`. The build reuses `src/forest_scene.js` and validates its single foreground-size substitution. `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing local browser installation; no machine-specific paths are stored in the source. CI rebuilds and tests the candidate, then uploads full-resolution captures.

## Verification and limits

See `verification.json`, `live-verification.json` and `review.md`. Offline desktop Chromium checks cover four viewports (1440×900, 390×844, 320×568, 844×390), all eight families, 1000 planned encounters, exact pixel replay after a ten-hour seek, one-visitor staging, bounded forest caches, controls, reduced-motion startup and the unchanged source seam. Full-resolution PNGs are reproducible and ignored; the compact contact sheet is retained for review.

The original frame 32-to-0 pose discontinuity remains. No synthetic gait poses or blends were introduced. Physical-phone offline file opening and sustained thermal performance have not been tested. Reduced-motion users start paused and can explicitly press Play.
