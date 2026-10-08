# Moonlight and Living Fog: Research and Rendering Proposal

Status: research proposal / design review only (no renderer changes in this pull request)
Date: 2026-10-08
Target: procedural enchanted-forest runway, one offline HTML file, mobile-first Canvas 2D

## Decision in brief

Prototype stylized moonbeams and drifting illuminated fog with **Canvas 2D gradients, seeded world-space geometry, lightweight occlusion by draw order, and precomputed low-resolution noise tiles**. Do **not** implement real-time ray tracing for this 2D scene.

Keep three independent clocks:
- World translation, sprite playback, light-layer translations and fog advection: advance every requestAnimationFrame (as fast as the device can sustain).
- Expensive appearance updates (contour boil and any dynamic light texture generation): at most 12 Hz, keyed to floor(simulationTime * 12).
- Slow weather/light parameters (beam angle, density and intensity): evaluated analytically from simulation time and interpolated continuously; they do not need a new texture every animation frame.

A 12 Hz *generation rate* is not the same as delivering only 12 visible frames per second. The latter would stutter during side-scrolling. Rendering/caching costs and real device frame rates remain to be measured, not assumed.

## Existing project constraints and integration target

- Requirements: tasks/procedural_runway_spec.md, especially 12 Hz line boil, independent movement rhythms, stable object identities, deterministic seeded world, phone/offline playback, and uninterrupted world generation.
- Published preview: https://tonidondoni.github.io/woodz-witch-fashion-preview/
- **Exact published private source revision**: 0e6cf29d4059e305a975a77fade10cb3f7a1ecb2
- Source files at that revision: out/forest-spectators/template.html, forest.js, spectators.js, build.py, review.md, verify.cjs.
- Published output: https://github.com/ToniDonDoni/woodz-witch-fashion-preview/blob/main/index.html
- Public release provenance: https://github.com/ToniDonDoni/woodz-witch-fashion-preview/blob/main/changelog.md

Important: private main currently has an earlier stage as its accepted site, while the deployed audience study is archived on a separate private source branch. This document goes onto a new branch from main. A later implementation must explicitly select/port the published audience source into its own new branch before adding lights; do not quietly treat private main as the current deployed audience code.

The published audience renderer draws layered trees at speeds [9, 22], other vegetation at [53, 82], neon spectators at 46 (all multiplied by forestUnit()), and paths at 82 (times path unit). It uses Canvas 2D, persistent world IDs, caches with eviction, 12 Hz phase art, and an image atlas containing 33 walk frames. The centered walker is drawn last. Existing frame 32 -> 0 discontinuity remains and is out of scope.

## What the research supports

### 1. Low-cost native Canvas 2D techniques

Canvas linear/radial gradients and compositing operations ("screen", "lighter", "destination-out", "destination-in") are broadly supported and can create soft, translucent lighting, combine glow layers and cut occluders without external libraries. Offscreen pre-rendering of repeated imagery is an explicit Canvas performance optimization in MDN.

Refs:
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createLinearGradient
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient
- https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

### 2. God rays without physically based volumetrics

GPU Gems 3, Chapter 13, describes a screen-space volumetric-scattering approximation using light visibility / an occlusion pass, directional sampling (radial blur), and additive composition. The chapter also discusses downsampling to reduce bandwidth. It provides a technically sound fallback if hand-authored light shafts are not convincing; it does not imply that full ray tracing is necessary.

Ref: https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process

### 3. Off-main-thread rendering is optional, not the first step

OffscreenCanvas can move Canvas work to a worker, but it adds complexity to a self-contained single-file deliverable, where source would need to be embedded (e.g. via Blob URL) and tested offline. A plain in-memory scratch canvas is sufficient for the first experiment; measure before considering a worker.

Refs:
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen

## Technique comparison

| Option | Visual result | Relative cost / risks | Decision |
| --- | --- | --- | --- |
| A: seeded soft shaft meshes + gradients, draw-order occlusion, scrollable fog tiles | Painterly moonbeams, atmospheric depth | Low; cheap Canvas primitives and cached textures; directional consistency is approximate | **Prototype first** |
| B: half/third-resolution light/occluder mask + directional radial accumulation | More scene-dependent silhouettes and beam breakup | Medium; extra passes, buffers, sampling; quality needs mobile testing | Only if A looks pasted on |
| C: WebGL fragment shader for masked radial blur / light scattering | More realistic moving shafts from canopy silhouettes | Medium to high integration effort; WebGL state, GPU fill, context-loss/fallback tests | Optional measured later |
| D: 2D ray casting per emitter against scene silhouettes | Directional hard/soft shadows, not automatically volumetric shafts | Extra geometric queries, light-by-light work, dynamic tree geometry | Not needed for v1 |
| E: full 3D ray tracing / volumetric ray marching | Physically motivated 3D scattering | High and mismatched to the hand-drawn 2D scene | Reject |

Complexity rankings are qualitative hypotheses, not benchmarks.

## Recommended first experiment: moonbeams

Art direction: cool silver-lavender beams against the existing black, moss-green forest, restrained enough that the neon creatures and the model's silhouette remain prominent. 3-6 visible shafts on a phone-sized scene are an initial **tuning hypothesis**, not a hard invariant.

Geometry:
1. Choose sparse world-space "canopy opening" slots keyed by stable chunk ID and world seed. Make each opening's x, width, slant, color and intensity reproducible. Generate with a margin before entry; retire after full exit. Avoid frame-by-frame Math.random().
2. Tie translation to the mid/back tree layer's existing world offset (the layer-1 speed is currently 22 * forestUnit()); never position each beam randomly in screen space. A shaft should move smoothly along with its apparent opening.
3. Draw each shaft as a softly feathered trapezoid or a few overlapping translucent polygons, widening downward, from an opening near the canopy into the midground. Use a horizontal-to-shaft-local linear gradient for soft sides and a vertical fade for onset/dissipation. Vary slowly (e.g. tiny sub-degree angle sway and low-frequency brightness breathing).
4. Render beams **behind the nearer tree row**. Drawing that row afterward occludes light by actual foliage silhouettes with zero new mask pass. Make beams visible under gaps and near trunks, not across opaque trunks or over the walker. Optionally add a low-alpha radial light pool at path level below the same opening.
5. Use screen blend at low alpha for moonlight and restore compositing state. Avoid additive clipping to white, per-stroke shadows and full-frame blur filters.
6. Keep an independently seeded diffuse background glow near the high-canopy opening (very subtle); avoid a fixed screen-center white spotlight masquerading as moonlight.

Draw-order modification likely needed: split the current drawForestBackground() into back-tree draw, moonbeam pass, nearer-tree draw, and final central subject-contrast wash. A fallback is to keep a beam image entirely behind both tree rows, though it will look weaker. Keep foreground forest, spectators and woman in front of the beams.

If shaft realism is weak, B can use the same known tree silhouette paths to draw black canopy masks on a *small* scratch canvas; apply the mask/light scattering there and upscale. Avoid reading pixels back to JavaScript every frame.

## Recommended first experiment: drifting illuminated fog

1. Generate small RGBA fog/noise tiles deterministically at initialization/seed change (e.g. 256x128 source pixels, value-noise or 2-3 octave fBm with seamless wrapping). This is a one-time tile construction, **not** per-pixel noise computation each display frame.
2. Draw two or three translucent fog bands, mostly below the midground canopy and near ground level. Use horizontal tile repetition, vertical gradient fades, different parallax speeds and low-amplitude sine warping or opacity changes.
3. Translate tiles continuously with subpixel offsets each RAF; treat fog advection time separately from 12 Hz artistic contour updates. Use two different tiles, resolutions and flow speeds to prevent obvious repetition. For one-file output, create tiles via drawing code; do not load external textures.
4. In the first version, fog is behind the walker and most front details; avoid opaque milky haze across her outfit. A later selective foreground pass may add wisps *only* near the margins and feet.
5. If animated density fields are needed, create/cycle snapshots at <= 12 Hz and blend adjacent snapshots with alpha interpolation. Do not visibly switch randomized fog patterns on the boil beat.
6. Use alpha gradients and cached drawImage compositing. Do not call ctx.getImageData() or ctx.filter = 'blur(...)' across the whole scene at every tick.

The fog should reveal shafts through very small intensity changes but not mandate costly per-pixel multiplication. A cheap visual trick is to draw low-opacity shafts over the fog and occlude with nearer silhouettes.

## Proposed render pipeline (after the research PR is approved)

1. Clear stage / existing dark background glow.
2. Draw far tree row (existing layer 0).
3. Draw low-cost world-anchored moonbeams and optional halo.
4. Draw near tree row (existing layer 1), obscuring light.
5. Existing central contrast wash, dust and butterflies.
6. Existing chalk runway and far ground objects.
7. Draw back/mid fog bands as composited transparent images (adjust exact placement after visual inspection).
8. Existing spectator/near-ground layers, maintaining face readability.
9. Existing walker sprite and shadow last (sprite is not modified).
10. Optional extremely faint foot-level light pool only if visual review needs it.

Lighting implementation suggestion for the next attempt: out/moonlight-fog/lighting.js and template.html, with a new build.py and verify.cjs. Keep all exploratory source and generated assets inside this dedicated attempt directory, then promote accepted code. Build one offline HTML; no runtime network requests or external libraries.

## Scheduling and numerical budget (proposed, not measured)

- Heavy appearance generation upper limit: 12 Hz. Cache keyed by seed + world chunk + boil phase + viewport-dependent parameters when necessary.
- Existing 33-frame sprite cadence: unchanged at 24 source frames per second.
- Continuous movement/composition: use rAF and real elapsed simulated time; aim for a stable 60 FPS on a 60 Hz reference device, falling back gracefully on slower phones.
- Fog/light offscreen surfaces: initially at <= 1/3 viewport dimensions each, with a cap on total pixels; upscale using Canvas drawImage. At 390x844, a 130x282 RGBA buffer is about 147 KB (before implementation overhead).
- Proposed initial effect-specific profiling target: <= 2 ms p95 added render time on the actual target phone, and no significant sustained frame-rate regression compared with a lights-off baseline. This is a gate to measure, not a claim already passed.
- No growing arrays of past light/weather events; at most a bounded number of visible world chunks and reusable scratch buffers.
- Adaptive quality: disable finest fog detail / reduce fog layers first, then cut beam count or resolution. Keep the walker and smooth scene translation intact.

Instrumentation:
- expose optional debug timings for lighting pass and fog pass with performance.now(), plus active beam count, cache sizes and rolling rAF delta samples;
- A/B switch to disable the entire new lighting stack without changing seed/time;
- measure desktop and actual target phone (including Safari/iOS if applicable), at different devicePixelRatio settings and after 5 minutes of continuous playback.

## Acceptance checks for a future implementation PR

Visual:
- Clearly visible soft, cool moonlight emanates through coherent forest openings, with plausible occlusion by nearby trees; no sharp transparent wedges, overexposed trunks or screen-stuck beams.
- Fog has visible depth and continuous drift. Nothing abruptly jumps on the 12 Hz update or when the world enters a new chunk.
- The model's face, clothes, legs and walk silhouette remain readable, including at a 320x568 viewport.
- A/B lights-on is materially richer without hiding the hand-drawn line art or turning the forest into constant flashing neon.

Determinism:
- Same seed + simulation time + viewport => same beam identities, layout, opacity and fog phase, independent of previous seeks or device frame rate.
- Pausing freezes weather animation; resuming/returning from a background tab does not jump several screens.
- Beam entry/exit and caches remain bounded at t=0, 120s and 3600s and through real-time playback.

Technical:
- No new runtime network requests; all generation code is embedded in the offline HTML.
- Original 33 sprite files and selected gait range are left intact; record the pre-existing 32->0 loop seam separately.
- Verify four viewport sizes and sustained phone performance against the *same* scene with lighting disabled; report p50/p95 render costs, rAF intervals, memory trend and observed FPS.
- The proposed limits are not considered met until the actual browser/phone measurements are recorded.

## Build sequence for a later implementation

Phase 0: archive baseline images, and get a reliable lights-off profiler on the published audience source.
Phase 1: add only 3-6 seeded beams with near-tree draw-order occlusion and A/B toggle.
Phase 2: add precomputed/no-network drifting noise fog tiles, benchmark both effects together.
Phase 3: art tune colors, placement and transitions, then optionally add canopy masks if obvious fake-beam artifacts remain.
Phase 4: build a single HTML, run deterministic/offline/phone checks, review screenshots and open an implementation PR. Never merge a heavy shader pipeline without comparable mobile evidence.

## Key risks and explicit non-goals

- Do not implement path tracing or volumetric ray marching in the first attempt.
- Do not make light opacity flicker randomly at 12 FPS: 12 Hz is an **art update cadence**, not the physical movement rate.
- Do not use a giant blurred whole-screen offscreen buffer each RAF; downsample and cache before proposing expensive postprocessing.
- Do not bake a finite forest video or external GIF as a shortcut.
- Keep the current visual language: pencil/brush neon on black with magical accents, not photorealistic 3D lighting.
- Scope excludes fixing the walker seam; note it explicitly so a light change is not mistaken for gait acceptance.
