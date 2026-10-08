# Living Paint V2 — Combinatorial Single-Event Runway

**Status:** independent visual experiment for review. This branch starts from current `main`; it does not modify the forest preview, walk sprites, or the existing single-event V1 branch.

## User intent

A woman walks continuously on a **completely black stage**. One striking, unexpected creature appears at a time, glows like swirling multicolor liquid paint, reacts, and disappears. The sequence can continue indefinitely without repeating a fixed three-item animation playlist. Each encounter may look insectile, mammalian, jelly-like, vegetal, aquatic, mask-like, or difficult to classify.

## Implementation decisions

1. **Generative grammar:** choose six coherent body topologies (dome, orb, quadruped, bloom, spindle, mask), then one of four compatible attachment grammars for that topology (filaments, wings, jointed limbs, petals/fins, branching feelers, ribbons). All dimensions, count, asymmetry, coloration, detail, position, motion, and timing vary continuously via a deterministic per-slot genome. Add six gesture strategies and six tri-color palettes. These are **components**, not six static creature drawings.
2. **Reproducible infinity:** `(seed, slotIndex)` independently determines each immutable event. Twelve-slot chunks balance body types; slot lookup is bounded independent of uptime. No accumulating global history, network models, or generated videos.
3. **One encounter:** a single slot owns its entire apparition lifecycle including trailing color and glow; no background fog, second creature, stars, perpetual particles or overlapping events. Each occupied slot is seven seconds with `0.3–0.8s` silent lead, `4.5–5.1s` apparition, and at least `1.1s` silent tail. Occasional empty slots give larger pauses.
4. **Living paint:** single bounded WebGL2 fragment shader generates silhouette signed-distance fields, animated anatomy, flowing color via fractal noise/domain warping, rim light, internal veins, small 12 Hz line irregularity, and a few optional eyes. CSS layers stack the shader *behind* the existing video-derived walking atlas; canvas transparency preserves the pure black background.
5. **Fallback:** a simpler Canvas 2D renderer keeps encounters visible when WebGL2 is unsupported or fails to initialize. This fallback is intentionally less sophisticated than the preferred WebGL2 appearance.
6. **Offline:** the original 33 source PNGs are packed into an inline WebP atlas; all shader, event grammar, UI and walking code is embedded in the published HTML. The root forest and older candidate Pages URLs remain untouched.
7. **Art direction:** the first goal is *many convincingly different flowing organisms*, not an arbitrary collage of unrelated limbs. The limited compatible construction rules are deliberate. Finite source code cannot guarantee endlessly distinct semantic creatures.

## Reproduction and evaluation

- `python out/living-paint-encounters/build.py` builds the offline page from existing `assets/walk/sprite_000.png` through `sprite_032.png`.
- `node out/living-paint-encounters/verify.cjs` validates WebGL2 when available, no network, seed reproducibility, 240 generated slot genomes, body/appendage/behavior/palette coverage, >50 composite signatures, zero concurrent events, direct million-second seeking, and multiple viewport screenshots.
- A rendered browser visual review is required: inspect one minute of real-time animation on a phone, six representative body variants, glow/color quality, absence of dense visual clutter, and the source walk seam at 32→0.
- Physical-phone performance, thermal stability and infinite *semantic* novelty cannot be asserted by CI. WebGL2 scissor confines fragments to the active region; actual frame cost still needs device measurement.

## Acceptance questions for review

- Does the color *flow* read as living paint rather than a flickering LED outline?
- Are the six structural families visibly different enough at phone size, and do the attachment grammar combinations remain recognizable rather than shapeless?
- Does this read as **one entity at a time** and leave comfortable black-space pauses?
- Should an organism briefly interact with the walker rather than simply appear and retreat?
- Does the variant balance feel surprising after 30 consecutive encounters?

**Publication:** a separate URL under `/living-paint-v2/` in the existing public preview repository is the intended review artifact; do not overwrite its existing root page.
