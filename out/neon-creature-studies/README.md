# Neon creature studies

Eight procedural drawing options for the illustrated forest. The gallery is an exploratory attempt, independent of the accepted runway page.

## Options

- A1 Root Keeper and A2 Moss Oracle: leshies with branches, moss beards and secondary motion.
- M1 Lantern Cap and M2 Midnight Choir: a glowing mushroom and a small mushroom ensemble.
- H1 Moon Hare: a seated hare with ear motion.
- W1 Violet Howl: a howling wolf with starlit fur.
- S1 Star Stag: a deer with branching constellation antlers.
- O1 Night Librarian: an owl with animated eyes.

## Preview

Open `out/neon-creature-studies/index.html` directly. Everything is inline; the gallery needs no server, assets, fonts or network requests. Tap a drawing to enlarge it. Pause, change line energy, or generate another fixed sketch seed.

The drawings use Canvas 2D. Stable anatomical paths receive bounded, deterministic perturbations at 12 drawing updates per second. Breathing, eyes and ears use separate time functions. Glow is composited once per drawing. Offscreen cards are skipped during playback.

## Verification and reproduction

Run `node out/neon-creature-studies/verify.cjs` with Playwright available. Optionally set `PLAYWRIGHT_MODULE` to a module location and `BROWSER_EXECUTABLE` to a browser executable.

The verification opens the standalone file offline and checks animation, pause/resume, deterministic time seeking, changing contours, reseeding, energy controls, enlarged views, desktop and phone layouts, JavaScript errors and network requests. It produces `verification.json`, `contact-sheet.png`, eight `variant-*.png` files, detailed screenshots and 24 frames in `motion/`.

Run `python out/neon-creature-studies/make_preview.py` with Pillow available to assemble `preview.gif`. The GIF is only a sharing preview; the HTML draws live, endlessly.

Independent review is recorded in `review.md`. Screenshots at a phone viewport were inspected; performance on a physical phone has not been measured.
