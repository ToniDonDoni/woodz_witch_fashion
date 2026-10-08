# Infinite Single-Event Runway — Working Prototype

**Status:** experimental, independent black-stage edition, not promoted into the accepted forest.
**Concept:** [tasks/infinite_single_event_runway_proposal.md](../../tasks/infinite_single_event_runway_proposal.md)

## Visual contract

The original woman walks continuously on pure black. Each 7-second independently addressable slot contains either exactly one creature or an intentional empty slot. An apparition's entire lifecycle—including glow and disappearance—is contained inside the slot, followed by a mandatory black interval. A rare empty slot creates a longer pause. There are no background trees, moon, stars, fog, crowds, or persistent particles.

The creatures are generated, **not chosen from a fixed list of finished animations**: winged apparitions, watchful animal-like presences and ribbon spirits vary in geometry, detail, color, entrance side, positioning, blinking, movement, and timing. Family allocations are deterministically shuffled in 12-slot chunks. The stream is unbounded in its **indexing**; finite procedural grammar cannot guarantee infinite semantically unique species.

The 12 Hz hand-drawn contour jitter is keyed to absolute `floor(time*12)` and thus does not depend on render history. Canvas movement and fades are continuous on `requestAnimationFrame`.

## Files

- `events.js`: immutable indexed slot/event generation, morphology, one-at-a-time scheduling and chalk Canvas 2D rendering.
- `template.html`: pure black single-file HTML template and walker interaction controls.
- `build.py`: reproducible Python/Pillow builder using **all 33 existing source sprites** without changing them.
- `verify.cjs`: offline headless Chromium/Playwright checks of 200 slots, large seeks, no overlapping events, deterministic screenshots, seed changes and four viewport sizes.
- `../../site/infinite-single-event-rc/index.html`: generated offline page for release-candidate publication.

## Build and tests

From the repository root:

```sh
python out/infinite-single-event/build.py
node out/infinite-single-event/verify.cjs
```

The repository workflow `.github/workflows/check-infinite-single-event.yml` installs Python Pillow and Playwright for CI, rebuilds from source, and runs the verification. It also uploads screenshots for visual review.

GitHub Pages target: https://tonidondoni.github.io/woodz-witch-fashion-preview/infinite-single-event-rc/ (isolated page in the existing preview repository, **not** the root page).

## Limitations / next art review

- Real-world phonelike animation is still a *first artistic iteration*. Silhouettes are parameterized inside three deliberately constructed families; there can be perceptual repetition. Review continuous full-minute playback and 200 generated encounters before claiming satisfactory variety.
- The source code creates no more than one event at a time, but some events may be too subtle/brief on certain sizes. Judge captures and tune their position/scale/brightness before considering a new family.
- Benchmarks on a real warmed phone, thermal-soak memory and objective smoothness have **not** been established.
- The pre-existing 32→0 walking sprite seam remains; this project does not alter the footage-derived poses.
