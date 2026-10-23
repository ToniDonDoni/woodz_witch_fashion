# Three Effects from the Dark — Visual Art Experiment

**Status:** isolated proposal to review; not an accepted change to the forest runway.

## Purpose

Explore three distinct visual effects inspired by the categories of web effects the user pointed out at https://webdev.teknium.io : liquid/glass, volumetric smoke/noise, and pixelization. That gallery was not accessible to our research environment; **these three shader implementations are original studies based on the named categories**, not claimed recreations or source ports of specific Teknium components.

The established walking woman (the same 33 footage-derived transparent PNG frames, index 0–32) remains in front of a completely black stage, while singular neon creatures emerge from darkness and disappear. The goal is to test visual motifs with real shader animation and deterministic inspection, not merely three CSS transitions on text.

## Chosen experiments

1. **Liquid Glass / Prism Manta** — a symmetric membrane organism, illuminated antennae and drooping filaments. The GLSL membrane has multilayer fBm refraction-like color distortion, traveling caustic lines, interference stripes, a translucent interior, and bright rim light. Glass is *simulated optically*, not real raytracing.
2. **Spectral Smoke / Antlered Wolf-Stag** — constructed as a legible profile with legs, snout, ears, tail and antlers, its body containing animated fractal smoke. The antlers and contours keep the spectral creature recognizable while vapor leaks beyond the body outline. Smoke is a 2D procedural field, **not physically correct volumetric fluid dynamics**.
3. **Pixel Dissolve / Hologram Raven** — composed from signed-distance raven geometry sampled on an explicit pixel grid. Hash-driven fragments arrive asynchronously, stabilize into the bird, then peel away as glitch fragments. No pre-rendered animal bitmaps.

The three scene kinds are a fixed art-directed trio. Unlike a hardcoded three-frame slideshow, each slot independently chooses body scale, placement, side, palette, interference strength, detail and animation phase; every three slots contain each kind once in shuffled order. The composition is infinitely indexable without accumulating state. A single active event with a quiet interval is the only persistent effect on the black stage; the female footage continues to walk.

## Constraints

- Separate `codex/` feature branch from the latest `main`.
- Source and review code under `out/teknium-three-fx/`. Standalone generated preview under `site/teknium-three-fx/index.html`.
- All three GLSL effects calculated at runtime inside scissor bounds. Renderer uses WebGL2 on capable devices and a clearly marked simpler Canvas 2D fallback otherwise.
- Do not modify `src/`, `assets/walk/`, stable `index.html`, or any prior experiment.
- Embed source walking frames as WebP, shader, controller, HTML, and CSS directly in one HTML file; no runtime dependencies, URLs, or network.
- Expose `window.runway.state()`, `spec(slot)`, `inspect(time)`, `seek(t)`, `seekSlot(n)`, `seekEffect(0|1|2)`, `setSeed(seed)`, and `play(boolean)`.
- `NEW DREAM` changes seed; `NEXT` advances to next encounter. All three specific effect buttons seek to the next occurrence of that effect.

## Verification and review gates

Build with `python out/teknium-three-fx/build.py`, then check with `node out/teknium-three-fx/verify.cjs`.

Automated browser tests must enforce: 240 deterministic slot genomes, equally balanced three effect kinds, fixed lifecycle with at least 1.1s silent tail, 2,400 independent timeline checks with never two active effects, actual WebGL2 shaders and nontransparent effect pixels for each kind, no WebGL errors, identical screenshots for identical seed/time, offline no requests, effect controls, and walker within 320px and landscape bounds. Save actual screenshots from Chromium to the workflow artifact.

Artist review is distinct from automation. Judge shape readability, liquid refraction illusion, smoke density, block-dissolve rhythm, center-stage walker priority, and mobile GPU power/performance with a physical phone. Do **not** declare physical-phone acceptance from headless Chromium only. Original 32→0 footage seam is outside the scope of this experiment.
