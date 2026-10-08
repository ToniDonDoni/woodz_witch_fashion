# Moonlight and Living Fog: Research and Rendering Proposal

Status: reviewed/revised research proposal (no renderer changes in this pull request)
Revision: 2026-10-08, incorporating six Codex inline findings and the separate in-PR source review.
Date: 2026-10-08
Target: procedural enchanted-forest runway, one offline HTML file, mobile-first Canvas 2D


## Decision in brief

**Proceed with option A, but only as a small visual study: three soft moonbeams, one slowly drifting fog band, fixed quality, and a lights-on/off switch.** Use Canvas 2D gradients, noise tiles generated once, and seeded geometry taken from actual tree/canopy layout. Real-time ray tracing, WebGL and pixel-based screen-space scattering are unnecessary for this first iteration.

The **logical world** is a pure function of (world seed, simulation time, existing tree/world definitions). Geometry, positions, identities, light direction, intensities and fog phase may **not** depend on measured FPS. Define a separate explicit `qualityTier` for raster detail, plus CSS viewport size and physical backing dimensions for rendering. V1 fixes the tier; no automatic culling of fog bands or beam identities. For strict pixel comparison, fix the same browser, tier, DPR/backing dimensions and viewport.

Use independent rhythms: (a) walker sprite 24 source FPS and world/light/fog travel are updated continuously by simulation time on requestAnimationFrame; (b) expensive hand-drawn contour/optional appearance redraw at most 12 Hz at **canonical** `t0=floor(time*12)/12`; (c) static fog-noise textures built on seed/size/tier initialization, not at 12 Hz or every display frame. Optional interpolated appearances use `t1=(floor(time*12)+1)/12` and alpha derived from simulation time. Never cache the first RAF time that happens to observe a phase.

The objective is **12 Hz costly generation with smoothly presented motion**, not a 12 FPS display. Physical-phone performance remains unmeasured.

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


## Reviewer decisions incorporated (2026-10-08)

This revision accepts all six Codex annotations and the separate in-PR review. Their points fix the original draft's contradictions:

1. **P1 determinism:** fixed explicit quality tier; no FPS-triggered removal of logical beams/fog. A/B switch alters rendering only, not world identities, simulation time or seed. Future quality adaptation must be an explicit tier transition and separately tested.
2. **P1 bounded caches:** no persistent map keyed by unbounded absolute boil phase. Reuse static tiles and buffers; keep at most current/next canonical phase per currently visible chunk, prune invisible entries each draw and clear old viewport generations on resize.
3. **P1 frame delivery:** numeric p95/p99 RAF interval and missed-frame limits, hot-device A/B tests, and separate appearance-regeneration-frame statistics. Canvas call time alone cannot measure deferred raster/GPU work.
4. **P2 canopy geometry:** openings must be derived from real seeded tree/crown positions, not independent randomly placed slots with merely matching speed.
5. **P2 compositing:** fog + shafts belong before the near-tree pass. A second light pass over fog drawn later would undo tree occlusion.
6. **P2 walker:** foot-level pools/glows must be painted before walker shadow and sprite, never after the final subject pass.

The separate source review adds these v1 choices:
- Existing near trees are painted at `globalAlpha=.91`, so draw order gives **partial stylized occlusion**, not opaque blocking or realistic projected shadows. V1 explicitly accepts slight transmission; if the visual result is wrong, use an opaque near-tree silhouette or low-resolution mask and *measure* cost.
- Use one common moonlight direction with small deterministic variations to avoid stage-spotlight geometry.
- Freeze quality and actual backing pixels during deterministic comparisons; buffers scale as **DPR squared** if DPI is blindly multiplied.
- Ship **three beams and one band first**; expand only based on visual and measured device evidence.

Review references:
- https://github.com/ToniDonDoni/woodz_witch_fashion/pull/6#pullrequestreview-5460064946
- https://github.com/ToniDonDoni/woodz_witch_fashion/pull/6#issuecomment-6064794762

## Technique comparison

| Option | Visual result | Relative cost / risks | Decision |
| --- | --- | --- | --- |
| A: tree-gap-anchored soft shafts + gradients, one cached fog band | Painterly moonbeams and atmospheric depth, imperfect stylized occlusion | Small incremental Canvas work; must measure on phone | **V1: three beams, one band, fixed tier** |
| B: half/third-resolution light/occluder mask + directional radial accumulation | More scene-dependent silhouettes and beam breakup | Medium; extra passes, buffers, sampling; quality needs mobile testing | Only if A looks pasted on |
| C: WebGL fragment shader for masked radial blur / light scattering | More realistic moving shafts from canopy silhouettes | Medium to high integration effort; WebGL state, GPU fill, context-loss/fallback tests | Optional measured later |
| D: 2D ray casting per emitter against scene silhouettes | Directional hard/soft shadows, not automatically volumetric shafts | Extra geometric queries, light-by-light work, dynamic tree geometry | Not needed for v1 |
| E: full 3D ray tracing / volumetric ray marching | Physically motivated 3D scattering | High and mismatched to the hand-drawn 2D scene | Reject |

Complexity rankings are qualitative hypotheses, not benchmarks.


## Recommended first experiment: moonbeams

Art direction: **three** subtle silver-lavender shafts, near-parallel, unified moonlight vector, tiny seeded variation in tilt and slowly breathing intensity. Do not create arbitrary diverging theatrical spotlights.

1. **Find openings from existing tree geometry.** Reuse published layer-1 tree IDs, deterministic placement, size, crown and branch shapes. Candidate openings are gaps between rendered/estimated canopies linked to adjacent stable tree IDs. Since the existing crowns can overlap past trunk midpoints, **midpoint between trunks is not automatically a gap**. Where geometric extents are insufficient, consult a low-resolution cached canopy-coverage mask generated from the *same* silhouettes; alternatively reserve sparse openings in the shared procedural tree generator. If a candidate is covered, omit it rather than invent a spotlight through a solid crown.
2. Store IDs/anchors in world coordinates derived from the same layer-1 translation (currently `22*forestUnit()`); continuously transform to screen using time. Seed width, intensity and subtle direction variation from source tree IDs. Generate margin before entry and retire after full exit.
3. Soft overlapping gradient trapezoids or ribbon-like polygons create diffuse beams, with vertical fade and weak halo associated with the *same* aperture. Use a restrained common illumination direction and avoid extreme downward widening.
4. Draw far tree row (layer 0) first, then light/fog, then near tree row (layer 1). **Do not promise physical shadows**: the near row currently has `globalAlpha=.91`, so 9% of an underlying fully opaque color may show through even before considering image alpha. V1 accepts this stylized effect, subject to screenshot review. If trunks visibly glow, introduce selective opaque masks at small resolution before spending on any blur shader. Preserve the far-row illumination as an intentional art decision.
5. Use low-alpha gradients and controlled blending; restore Canvas state. Never draw light over the final model sprite. Optional footpool is ground illumination **below** the walker shadow and sprite and is omitted from the first implementation unless visual review demands it.

**Beam acceptance:** every visible beam can be traced to real seeded tree IDs/an identified canopy gap, retains identity until full exit, has coherent direction, and never spuriously appears in a solid-looking crown.


## Recommended first experiment: drifting illuminated fog

Start with **one** translucent ground/midground band, not two or three.

1. At seed/tier/viewport generation, create one *seamlessly wrapping* seeded RGBA noise tile (e.g. 2-3 octave periodic value noise), with vertical alpha fading. This is built once and re-used, not recomputed per RAF or per 12 Hz contour phase. Verify wrap boundaries on slow motion.
2. Scroll tiled samples continuously by a deterministic absolute-time advection formula at a chosen parallax rate, and apply subtle smooth opacity modulation. A repeatable mathematical time function—not fresh randomness per frame—governs the fog.
3. Render the band and any light modulation **in the single atmosphere pass before near trees**. Do not draw shafts on top of a separate fog pass placed after near-tree trunks. Foreground fog, if desired later, is a **separately designed** masked effect and out of v1.
4. Do not obscure the figure or turn the ink contours pale. Use low opacity and screen comparisons at 320x568 as well as desktop sizes.
5. If scrolling a static tile is visibly lifeless, optionally blend at most **two canonical phase snapshots** generated at `t0=floor(t*12)/12` and `t1=t0+1/12`, interpolated every RAF. Recycle surfaces, drop old phases and measure the additional draw cost; *do not* mutate noise randomly per phase.

Avoid `getImageData()`, whole-frame blur filters, texture reallocation, and JavaScript per-pixel work in the animation loop.


## Proposed render pipeline (after the research PR is approved)

1. Clear and draw existing dark backdrop.
2. Draw **far** trees (forest layer 0).
3. Draw one cohesive **transparent atmosphere pass**: single cached fog band, three canopy-anchored shafts, subtle halo and fog lighting. Any shaft-over-fog illumination happens inside this pass.
4. Draw **near** trees (forest layer 1), intentionally giving partial stylized silhouette occlusion, with mask fallback if actual screenshots reveal unacceptable leakage.
5. Draw current central-contrast wash, dust and butterflies in the same relative sequence as the published version.
6. Draw existing path, ground rows and spectator layer in their present order.
7. Optional restrained *path* light pool, **before** the walker; omit this from first pass.
8. Draw the existing figure shadow and the walker sprite **last**, unchanged. No glow/light overlay after the walker.

Build a new exploratory source in `out/moonlight-fog/` on a **separate future implementation branch**, with lighting module, template, builder, tester and one offline HTML. The source baseline is the **pinned published spectator snapshot** (`0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`), even though this documentation PR was branched from private main. Explicitly port/snapshot those source files; do not silently regress to the older private-main scene or change the 33 original sprites.


## Scheduling, memory contract and frame-delivery gates (proposed, not measured)

### Determinism and cache lifetime
- Define rendering inputs `(worldSeed, simulationTime, CSSWidth, CSSHeight, qualityTier, backingWidth, backingHeight, effectsEnabled)`. Logical identities and positions are derived only from seed, time and world geometry; raster output may depend on explicit tier/size. Pixel equivalence is required for the **same browser, backing pixels, tier and seek time**, not bytewise across different GPUs.
- V1 uses a **fixed explicit qualityTier**. Do not adapt by cutting fog bands/beam count after slow frames. A future explicit tier may reduce *raster* resolution/detail while preserving logical beams/fog. Freeze tier for A/B and seek tests.
- Canonical appearance sample `phase=floor(t*12)`, `t0=phase/12`; optional second sample `t1=(phase+1)/12`. No cache keyed indefinitely by `seed + chunk + absolutePhase`. Reuse one static tile and recyclable scratch canvas(es), and if snapshots are required, retain only current/next sample for each *visible* chunk. Clear stale chunks and old viewport generations on resize/quality changes. Large seeks must not allocate all intermediate phases.
- Raw backing pixels are capped **after any DPR decision**. Initial proposed caps: <=100,000 *actual pixel cells per light/fog scratch surface* (~400 KB RGBA) and <=250,000 total scratch + tile pixel cells (~1 MB raw RGBA), excluding browser/GPU overhead and existing forest caches. A 390x844 CSS viewport at 1/3 CSS resolution is 130x282=36,660 pixels (~147 KB), but silently multiplying both axes by DPR 3 produces 390x846=329,940 pixels (~1.32 MB), already over the cap. Choose and report the real backing size; don't automatically apply stage DPR to scratch textures.
- Monitor new buffers plus existing forest/spectator caches and browser memory trends over continuous runtime, seed change and repeated resize/orientation, not merely isolated `seek(t)` calls.

### Frame delivery (numerical **acceptance targets**, not verified facts)
- Record matched lights-OFF baseline and lights-ON trial at identical seed, time interval, viewport, DPR/backing resolution, device/browser and **fixed** tier. On a real target phone, warm up at least 3 minutes per condition, then observe 5 uninterrupted minutes per condition; preferably reverse A/B order to reduce thermal-order bias. A failed baseline must be reported, not hidden by relative statistics.
- On a 60 Hz target screen use `T=16.67 ms` (otherwise explicitly measure visible screen cadence and define T). Excluding background/visibility pauses, **lights ON must meet** p95 RAF interval <= **1.10*T** (~18.34 ms), p99 <= **2.10*T** (~35.0 ms), and <= **2%** active frame intervals exceeding `1.5*T`. Missed-frame rate must increase by **no more than one percentage point** versus matched OFF baseline. Also report OFF vs ON p95/p99 side by side; a p99 regression by >1*T is a separate failure even if absolute limits pass.
- Measure normal frames and **12 Hz appearance-regeneration frames separately**; report their CPU submission times, frame-delivery interval histogram and missed-frame rates, so occasional regeneration spikes cannot hide under averages. `<=2 ms p95` incremental CPU submission time remains a **tuning goal**, not proof that the GPU completed composition on time. Include render/present traces if tooling supports them.
- For 120 Hz, choose and document whether rendering targets native cadence or is deliberately 60 Hz; do **not** apply 60 Hz RAF thresholds to uncapped 120 Hz callbacks.
- Until representative-device measurements exist, performance status is **unknown**; if targets fail, reduce declared raster detail and retest, not silent semantic content changes.

### Visual / resource goals
- V1 contains three stable canopy-anchored beams and one fog band; no extra procedural characters, no added scene video, no network dependency.
- No continuously growing cache after a fixed-size viewport reaches a stable active-world population. All noise/art/render history bounded by active world and declared tier.


## Acceptance checks for a future implementation PR

Visual:
- Every beam originates from a visible **actual** canopy aperture (tree-pair IDs or shared canopy mask), with unified moon direction, soft boundaries and no obvious spotlight. Document that near-tree `globalAlpha=.91` provides **partial** rather than hard occlusion; reject/mask the artifact if the tree visibly glows from within.
- Fog drifts continuously and wraps without seam, flicker, or 12 Hz popping; illumination occurs before the near-tree pass. The woman, clothing and legs remain fully readable down to 320x568 and the sprite is always last.
- Fixed-seed OFF/ON comparison shows a visibly more atmospheric result rather than overexposure.

Determinism and lifecycle:
- Compare direct seek, stepped playback and a different prior draw history at the same **canonical within-phase time**, viewport, seed, fixed tier, backing size and browser. Compare logical IDs across declared tiers and after ON/OFF switching; rendering quality must not alter world placement.
- Validate continuous entry to exit for a chosen canopy gap / beam, and fixed fog phase through pause, resume, background tab and resize. No screen-wide jump after background resume.
- Validate on four viewport sizes. Run **10 continuous minutes on a real phone** and **30 continuous minutes desktop/browser**, plus spot checks at t=0/120/3600 and repeated resize/rotate operations. Assert caches/buffers settle within active viewport/tier bounds; phase number must not cause cache growth.

Technical:
- One truly offline standalone HTML, no network fetches and no runtime exceptions, unchanged 33 sprite images/cadence. Document pre-existing 32->0 gait seam.
- Include actual device/OS/browser, CSS dimensions and backing sizes/DPR, steady-state memory samples, light/fog pixel counts, OFF vs ON p95/p99 RAF intervals and missed-frame share, and timings split by ordinary and 12 Hz update frames. Verify the **numerical frame-delivery gates** above before marking mobile acceptance.
- No claims of performance or acceptance from screenshots and seek-only tests alone.


## Build sequence for a later implementation

Phase 0: start a fresh branch from latest main; explicitly port the pinned **published forest-spectator source** into a new `out/moonlight-fog/` attempt; capture the same lights-OFF baseline and profiler.
Phase 1: build exactly three canopy-anchored shafts, fixed tier and simple effects on/off switch. Check actual foliage gaps and silhouettes.
Phase 2: add exactly one seeded scrolling fog band in the atmosphere pass **before** near trees. Check loop seam, contrast, determinism and fog/layer ordering.
Phase 3: perform matched A/B screenshots and thermal-soaked phone benchmarks, including phase spikes, RAF delivery and long-running memory. Only then consider a second fog layer or small occluder mask if specifically needed.
Phase 4: package offline HTML, verify browser/phone cases, preserve source-to-artifact provenance and open a **new separate implementation PR**. No renderer changes in this research PR.

## Key risks and explicit non-goals

- Do not implement path tracing or volumetric ray marching in the first attempt.
- Do not make light opacity flicker randomly at 12 FPS: 12 Hz is an **art update cadence**, not the physical movement rate.
- Do not confuse draw-order silhouettes at tree globalAlpha=.91 with physically opaque shadows or promise cheap cross-tree ray occlusion.
- Do not change deterministic world object counts as a hidden response to measured FPS; never retain unbounded per-absolute-phase cache entries.
- Do not use a giant blurred whole-screen offscreen buffer each RAF; downsample and cache before proposing expensive postprocessing.
- Do not bake a finite forest video or external GIF as a shortcut.
- Keep the current visual language: pencil/brush neon on black with magical accents, not photorealistic 3D lighting.
- Scope excludes fixing the walker seam; note it explicitly so a light change is not mistaken for gait acceptance.
