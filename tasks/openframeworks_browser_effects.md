# OpenFrameworks Browser Effects Migration

Status: planned; implementation and acceptance pending.
Branch: `codex/openframeworks-effects`.
Base: latest `main` at branch creation.

## Goal

Migrate the procedurally rendered forest, creature, and magical effects to **openFrameworks (C++)**, compiled with Emscripten to WebAssembly and rendered in the browser. Preserve the original woman walking endlessly from the existing 33 approved transparent PNG frames. The experience must remain an endless, surprising, responsive runway against a predominantly **black background**.

This is a real openFrameworks runtime migration, not a JavaScript recreation marketed as openFrameworks. Preserve the current accepted experience on `main`; implement and validate on this feature branch only.

## Non-negotiable product requirements

1. Keep the woman's existing approved 33-frame walk animation, center anchoring, and independent pace. Do not synthesize replacement poses or silently change frame selection. The known frame-32-to-frame-0 seam is a separate issue to verify and document.
2. Use a black background with readable, high-contrast imagery. Retain the woman as the visual focal point.
3. Generate surprising, varied, sometimes uncanny animals, forest spirits, abstract entities, and visual effects at runtime. Each creature must have a coherent identity and silhouette for its full lifetime, not randomize each frame.
4. Creatures may emerge from either side, appear behind or in front of the walker, pause and look toward her, transform, dissolve into particles, or leave. Avoid a repetitive fixed parade.
5. Add appropriate atmospheric music and sound design. Audio must be opt-in through an explicit user gesture, with mute and volume controls; never autoplay audible sound.
6. Keep endless runtime generation, seeded replay, bounded active object counts, pause, pace, and New Dream controls.
7. Target desktop and mobile browsers, including offline use after loading the complete delivered artifact. No runtime network dependency.
8. All source, comments, task documents, and user-facing copy must be in English.

## Technical direction

- Review the current `src/forest_scene.js`, `src/forest_acts.js`, `src/forest_runway_template.html`, and `scripts/build_forest_page.py` before modifying anything.
- Build an openFrameworks application in a new isolated source directory, e.g. `src/openframeworks/`. Use its C++ drawing/geometry/particle systems for scene content and Emscripten for WebAssembly. Document exact framework version and license.
- Bridge a thin JavaScript host to the C++ scene through a minimal explicit API: `resize`, `setSeed`, `setTime`, `setPace`, `setPaused`, and `render`. Prefer time-derived, seeded states to frame-order-dependent RNG.
- Keep the existing walk sprite atlas and browser-side sprite composition unless testing demonstrates a superior equivalent; coordinate compositing so both foreground and background creatures can occlude correctly.
- Create an initial small C++ proof of concept: black scene, one seeded creature, particle transformation, sprite walker overlay, and sound enabled only by gesture. Validate this before porting the full existing scene.
- Use a checked-in reproducible build script and pinned Emscripten/openFrameworks versions. If local C++ compilation is unavailable, create a GitHub Actions workflow to build and test the WebAssembly bundle on hosted runners. Do not claim a successful build until a real workflow passes.
- The current project expects a self-contained `index.html`. Assess WebAssembly packaging carefully: embed WASM bytes and assets or document a deliberate packaging change requiring acceptance. Do not silently break file:// offline opening.

## Implementation tasks

- [ ] Inventory current scene, actor layering, audio state, runtime controls, performance constraints, and build pipeline.
- [ ] Pin and bootstrap openFrameworks + Emscripten; verify upstream browser support and third-party license obligations.
- [ ] Add minimal C++ openFrameworks scene and JS/WASM integration, with a visible black background.
- [ ] Preserve and integrate the 33-frame sprite walker and its pace/pause controls.
- [ ] Implement seeded procedural creature archetypes and persistent behavioral states, including a look-at-walker reaction.
- [ ] Implement at least two visually distinct generative effects (e.g. particle dissolution and fluid/noise-driven morphing) using openFrameworks rendering.
- [ ] Add a seeded event director with variable intervals, entrance directions, dwell times, rare surprises, and bounded object lifetimes.
- [ ] Add atmospheric procedural or properly licensed bundled audio with opt-in start, mute, volume, and mobile-safe suspension.
- [ ] Integrate foreground/background occlusion, resize, high-DPI scaling, and mobile-friendly GPU resource limits.
- [ ] Add reproducible build commands and GitHub Actions WASM build + smoke-test workflow.
- [ ] Run Chromium browser E2E tests against the **built WASM artifact** (not a JS-only mock), including errors, animation, seed replay, pause, controls, sound gesture, and offline behavior.
- [ ] Capture desktop/mobile screenshots and a short review clip; document visual review and performance.
- [ ] Promote accepted generated artifacts only after verification, and update README with exact build and preview instructions.

## Acceptance criteria

1. Browser runtime demonstrably loads and executes **openFrameworks-compiled WebAssembly**; build provenance and version are recorded.
2. The original woman walks continuously with all approved sprite frames; no missing textures or duplicated character.
3. Against a black background, at least three distinct creature archetypes and two generative effects appear during a deterministic accelerated ten-minute simulation; at least one creature visibly reacts to the walker.
4. A fixed seed and time reproduce equivalent scene states; different seeds yield visibly different sequences. Object counts and memory do not grow without bound.
5. Sound is silent until the viewer explicitly enables it; mute and volume controls work. No unlicensed third-party audio.
6. The actual WASM build passes Chromium desktop and mobile viewport smoke/E2E tests with no uncaught errors or missing resources.
7. Offline packaging and target-phone behavior are measured and documented. If the single-file constraint cannot be met, request explicit acceptance before changing it.
8. Existing `main` and the current published preview remain untouched until the migration is accepted.

## Milestones

- M0: This task brief committed on a new branch.
- M1: Reproducible openFrameworks/Emscripten hello-world and CI WASM build.
- M2: Sprite walker plus first procedural creature and particle effect.
- M3: Rich randomized scene director, multiple creature types, and gesture-gated music.
- M4: Browser E2E, visual review, offline/mobile acceptance, and documentation.

## References

- openFrameworks: https://github.com/openframeworks/openFrameworks
- openFrameworks Emscripten setup: https://openframeworks.cc/setup/emscripten/
- Existing specification: `tasks/procedural_runway_spec.md`
- Existing accepted source: `src/forest_scene.js`, `src/forest_acts.js`
