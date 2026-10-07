# Enchanted Forest — Second Scene Study

This attempt extends the existing walking-sprite page with two parallax layers of trees and two rows of moss, ferns, mushrooms, stumps and woodland spirits. The black night stage, chalk runway and a smaller number of butterflies remain.

All scenery is painted at runtime. Stable world IDs control anatomy, palette and variation. Three cached ink drawings per object cycle at 12 Hz while world travel remains smooth. Art caches are pruned on every draw; invisible entry and retirement margins include the full drawing bounds and placement offsets. The page embeds the existing 33-frame WebP atlas and makes no external requests.

## Reproduction

Run `python out/enchanted-forest/build.py` with Pillow installed. The editable draft is `template.html` plus `forest.js`; generated output is `index.html`.

Run `node out/enchanted-forest/verify.cjs` with Playwright and Chromium available. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` can select local installations. The verifier captures desktop, landscape and two phone-sized viewports and checks offline loading, animation advance, pause, New Dream, deterministic rendering, recurring categories, persistent forest identities, bounded caches, and a one-hour simulation seek.

## Verified scope

`verification.json` records no errors or network requests, 8.0164 seconds of real-time animation advance in an eight-second observation, and 50–56 active objects across two minutes of half-second samples. Visual review caught and corrected wide-crown clipping and rectangular ground bases. The independent reviewer approved this forest iteration; see `review.md`.

The original 32-to-0 walk seam is unchanged, and no physical phone was tested. The screenshots and offline desktop phone-size checks do not establish full phone acceptance.
