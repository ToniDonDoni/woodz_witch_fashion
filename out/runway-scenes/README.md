# Scenes in the wood — runway study 05

The runway keeps the approved 33-frame walk, the night sky, the moon, the existing woodland and the seeded act programme. What changes is what an act *is*: a study 03 act announced itself with a title card and then sent one set piece across the stage, which left the stage empty for roughly 80% of the act and gave every piece the same entrance. An act is now a small scene.

## What the scenes add

- **Three overlapping beats per act.** Every act is built from three windows that tile its whole length, and each window carries one piece, so the stage is busy for essentially the entire act instead of for one fly-past. Rendering six acts second by second, something is on screen for 90–96% of each act (mean 93%) and the longest stretch with an empty stage is 3 seconds; the same measurement on the previous single-fly-past version gave 16% (worst act 11%). An earlier version of this measurement counted beats whose anchor was still in the off-screen margin and therefore reported 98%; the check now counts only pieces inside the viewport, and the drift of a rising beat is capped so a long beat cannot slide off the right edge before its window ends.
- **One headline, two quiet supports.** Exactly one beat per act is the act's signature piece; the other two are quieter, smaller pieces drawn from the same cast, and a piece never repeats inside its own act. Which window holds the headline comes from the seed, so some acts open with the support and save the headline for later.
- **Five arrival modes.** A beat enters from the left, enters from the right (mirrored, so it faces the way it travels), arrives and then holds its place beside her, rises out of the ground and drifts, or swoops overhead (an act beat uses the first four; the swoop belongs to the owl). The old build had exactly one mode — always from the left at a fixed speed.
- **Title card stays with its act.** The card now fades in over a second, stays for the whole act (dimmed to 55% after the opening seconds) and fades out as the act ends, instead of appearing and vanishing in four seconds and leaving an unannounced stage.
- **Unannounced cameos unchanged.** A star fall in the sky (about 45% of acts) and an owl sweeping overhead (about 22%), now as trajectories of their own rather than fixed-height crossings.

Everything from study 03 is kept: act lengths that vary per act (30–62 s), no theme repeating inside three acts, a piece finishing its trajectory past an act boundary, per-act weather, the per-dream colour mood, the foreground row composited after the walker, the seeded woodland layout, and `NEW DREAM` reshuffling the programme, the layout and the mood.

## Verification

`verify.cjs` checks, among the inherited properties: exactly one headline beat per act and it is the act's signature; three distinct pieces per act; the beat windows tile at least 60% of every act (worst case over 40 acts is asserted); at least four distinct arrival modes with both horizontal directions present; each measured act with a piece on screen for at least 70% of its length and a mean of at least 80%, with no visible gap longer than 6 seconds; pieces following their own trajectory (rightwards, leftwards, or holding within 14 px); the title card still readable at the middle of its act; and the walk frames byte-identical to the approved build.

## Reproduce

Run `python out/runway-scenes/build.py` with Pillow available. Sources are `template.html`, `forest.js` and `acts.js`; the generated deliverable is `out/runway-scenes/index.html`.

Run `node out/runway-scenes/verify.cjs` with Playwright and Chromium. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` optionally select local installations. `review-probe.cjs` is a fast self-contained probe (occupancy, arrival modes, title card) for review.

## Review controls

The page exposes `window.runway` for deterministic review: `seek(seconds)`, `play()`, `state()`, `act()`, `plan(index)`, `programme(count)`, `setForeground(false)`. `plan(index)` returns the act with its `beats` — type, kind, arrival mode, start, lifetime and size — which is the whole schedule of the act, and `programme(count)` returns the same for a run of acts. None of them load assets or alter the selected walk cycle.
