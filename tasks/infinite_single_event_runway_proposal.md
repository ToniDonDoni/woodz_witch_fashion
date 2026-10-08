# Infinite Single-Event Runway — Concept Proposal

**Status:** design-only proposal for review; no runtime, sprite, website, or release changes.

## North star

A woman walks continuously through absolute black. Occasionally **exactly one** neon chalk/pencil apparition emerges, performs a small evocative action, and vanishes. A quiet black interval follows. Every apparition should feel like a newly discovered being or phenomenon, not a preset animation replayed with a different color.

**Non-negotiables**
1. At most **one active visual event** at any instant, including entrances, exits, trails, particles, and lingering glow. The walker is the only persistent visual subject.
2. New events are deterministic functions of **(dream seed, event index)**, not frame count, rendering speed, or previous draws.
3. A single local offline self-contained HTML page, no live model calls or runtime network requests.
4. Preserve the existing 33 footage-derived walking frames, sprite cadence, scale, position and existing gait seam; do not repaint the model.
5. The stage remains black between events. No permanent moon, forest, stars, decorative dust, captions, or background scenery.
6. Style: black negative space, neon chalk/crayon/pencil contour, restrained luminous halo, 12 Hz intentional hand-drawn contour boil, smooth RAF translation/fades.

## What “infinite” means (and does not mean)

The scheduler supports an **unbounded indexed stream** of events: event 0, 1, 2, ... generated on demand, without a fixed catalog or stored sequence. Each event is composed from a parameterized **visual grammar** with continuous-valued geometry, motion, pose, timing and palette. The number of possible parameter combinations is enormous, but finite computer precision, a finite grammar and repeated motifs mean **perceptual uniqueness cannot be mathematically guaranteed**. Do not market this as infinitely many genuinely different species.

Our design goal is *high perceived novelty over long viewing sessions*, not merely different random seeds. Define a reviewable novelty metric and test it with human observers.

## Visual grammar: make creatures, not a list of stickers

Generate an event from five independent-but-constrained design layers:

1. **Silhouette topology**: closed/open contour, symmetry, body count, connected appendages, branch skeleton, negative-space cavities, occluded portions. Grammar families include winged, quadrupedal, floating, rooted, mask-like, ribbon-like, and ambiguous/non-animal forms. These are *shape construction rules*, not a fixed list of illustrated wolves/butterflies.
2. **Morphology**: ratios, joint locations, curvature, wing/ear/limb count, eye number/spacing, asymmetry, breaks, contour thickness, hatching and glowing edges. Parameters use continuous distributions with coherent constraints, not arbitrary disconnected line soup.
3. **Action / micro-story**: enter → reveal → one recognizable action → retreat → fade. Behaviors include flutter, blink, look back, crouch, listen, curl, turn, glide, stretch, split/rejoin (only if still visually one event). Actions must be compatible with the silhouette: a rooted creature cannot gallop; an eyeless shape cannot blink.
4. **Stage choreography**: one world-space entry location, one trajectory, scale, pacing, pause, facing, relation to walker, and exit. A small number of legible motion beats is preferable to random shaking. Never obscure the walker's face or entire figure.
5. **Material / rendering**: a narrow palette chosen from violet, cyan, acid green, coral and chalk white; layered pencil strokes, grain, deliberate gaps, subtle emissive halo, tiny line boil. Limit high-frequency noise and neon bloom so contours stay readable on phones.

**One example, not a preset:** a long-limbed creature made from a two-node curved spine, three jointed appendages, one asymmetric eye and a broken chalk contour appears to the left, listens for two seconds, blinks once, folds inward, and disappears. The next event is generated from new topology and choreography rather than recoloring that creature.

## Grammar with controlled coherence

Use a small number of **structural archetype constructors**, each producing many distinct topologies and compatible actions. This is a practical trade-off: unconstrained random geometry is easy to generate but usually looks meaningless.

Pseudo-interface:

```ts
type EventSpec = {
  id: number;
  seed: number;
  silhouette: ShapeGraph;
  action: ActionTimeline;
  path: MotionPath;
  material: ChalkMaterial;
  start: number;
  duration: number;
};

spec = generateEvent(dreamSeed, eventIndex); // pure, stable
renderEvent(ctx, spec, simulationTime, viewport);
```

An event is an *immutable specification* of geometry and motion. Its appearance at time `t` is derived from that spec and `t`, not from accumulated simulation frames. Geometry should be regenerated from spec for deterministic seeks; heavy raster art may be cached while active.

## Exactly-one scheduler

Timeline states:

```
BLACK_GAP -> REVEAL -> ACT -> DISAPPEAR -> BLACK_GAP -> ...
```

- Default black gap: sampled from e.g. **4–12 s** (art-direction parameter), then one event lasting **3–8 s**. These are proposal values, not validated timing.
- An event owns its full lifecycle, including glow and particles. The next event cannot start until the previous event and all its remnants are gone.
- At a fixed seed and time, **zero or one** event is active. No independent global butterflies, fog, moon, spectator layer, or always-on particles.
- The woman and her walk cycle are rendered continuously; an event can appear behind or beside her but cannot cover her face or replace her.
- When the browser is hidden or playback paused, simulation time freezes or follows the existing controlled clock; no catch-up burst of events.
- `New Dream` creates a new seed and starts a fresh sequence. For testing, expose `seekEvent(n)`, `setSeed(s)`, and `state()` only as debug hooks.

To support direct seeking without iterating millions of previous events, define **fixed-duration time slots** (e.g. 16 s per slot), and derive the gap, start offset and duration independently from `hash(seed, slotIndex)`. Each slot contains at most one event and a mandatory silent tail; event activity is fully confined to its own slot. This allows O(1) event lookup for arbitrary time and avoids overlapping lifetimes by construction. Vary duration/spacing *inside* the slot; if fixed rhythm becomes audible, consider deterministic chunk-indexed prefix sums with bounded checkpoints later. The v1 should favor seekability and simplicity.

## Perceived novelty engine

Blind randomization is insufficient. Make a **design grammar with constraints**, and a bounded local novelty filter:

- Describe each candidate by coarse visual features: archetype/topology signature, appendage count, size, screen zone, dominant action, silhouette occupancy, palette and temporal beat.
- Reject near-duplicates of the **last 8–16 accepted events**, using a deterministic distance metric. Retry with `hash(seed, eventIndex, attempt)`, up to a small fixed attempt cap; fall back to the most different candidate.
- **Important determinism caveat:** comparing against previous accepted events requires reconstructing a finite lookback history on direct seek. Use a fixed-size, deterministic window and generate prior specs from seed/index in a canonical order; no mutable session-only memory may affect selection. Alternative v1: use a deterministic archetype permutation schedule per chunk, plus independent continuous parameters, avoiding a history dependency altogether.
- Avoid “rare event” becoming a permanently repeated motif: make frequency weights adaptable **only through explicit, seed-derived index epochs**, not runtime FPS or mutable taste scores.
- Curate negative examples (incoherent limb soup, unrecognizable shapes, over-bright noise, obvious recolors, character overlap) as regression screenshots.

Novelty is not a claim that every individual event is a different species. A recurring archetype may be acceptable if its geometry, behavior and staging tell a distinct little story.

## Rendering and budget

Use the current Canvas 2D and existing walk atlas. No ray tracing, WebGL or network inference in v1.

- **Event generation**: once when its slot becomes relevant; generate shape graph, action timeline and path from seeded PRNG. Optionally precompute the next event offscreen during the preceding black interval, within a small fixed work budget.
- **Chalk artwork**: prepare 2–3 deterministic line-boil variants per active event at canonical 12 Hz phase times; rotate/interpolate variants as an artistic choice, not regenerate every RAF. Avoid unbounded `(eventIndex, absolutePhase)` caches.
- **Motion**: smooth RAF transforms, blinking, appearance and fade computed from absolute simulation time. Keep 12 Hz texture boil separate from presentation cadence.
- **Glow**: tiny cached stroke halos or a limited number of extra contour strokes. No full-screen blur, full-screen readback, or per-frame noise generation.
- **Memory**: retain at most current event + one prefetched event, with bounded reusable canvases. Invalidate size-dependent rasters on resize; logical event identity stays stable.
- **Performance**: benchmark on target phone with fixed seed, viewport, DPR and tier. Use the numeric frame-delivery and cache checks from `tasks/moonlight_fog_research.md` as a starting benchmark, then set event-specific limits based on measurements. Never claim phone acceptance from mocked or desktop-only tests.

## Proposed implementation boundaries

This PR is **documentation only**. A separate implementation PR should branch freshly from latest main.

```text
src/
  runway/              # shared accepted walker/stage renderer (future promotion)
    walker.js
    event_scheduler.js
    event_grammar.js
    chalk_renderer.js
out/
  infinite-single-event/
    template.html
    build.py
    verify.cjs
    review.md
    captures/
site/
  infinite-single-event-rc/
    index.html
```

Start in `out/infinite-single-event/` as an isolated experiment, as required by `AGENTS.md`. Only **promote reusable scheduler/grammar/renderer modules into `src/` after acceptance**. Do not prematurely duplicate a monolithic template into every release.

## Validation and acceptance

**Invariant tests**
- At every sampled simulation time, `activeEventCount <= 1` including all trails, glow and exit effects.
- At the same seed, event index, viewport and time, specs and pixels match after direct seek, stepped playback and pause/resume in the same browser/render tier.
- No visible permanent background effect and no overlap between event lifecycles; black gaps genuinely contain only the walker.
- `seek(0)`, `seek(120)`, `seek(3600)`, `seek(1e6)` do not iterate all earlier slots or allocate growing history.
- No cache growth with event index, no visible jump across 12 Hz phase boundaries beyond intentional chalk boil, and no network requests.

**Visual study**
- Generate **at least 200 consecutive events** and contact sheets; classify silhouettes and actions. Flag near-duplicates, visually illegible shapes, unwanted similarities and events that compete with the walker.
- Review at least 30 consecutive events at actual animation speed on phone; the black interval must feel deliberate rather than a broken renderer.
- Test 320x568, 390x844, 844x390 and desktop; ensure events stay visible and do not obscure the model.
- Blind viewer review: compare perceived variety against a baseline of five fixed motifs with random color/scale. Target **>=80%** of sampled events rated visually distinct from their immediate predecessors by reviewers (proposed threshold, not measured).
- Measure 5-minute warmed phone RAF intervals, 12 Hz regeneration spikes, memory, and 10-minute continuous playback before marking mobile acceptance.

## Suggested milestone

**First prototype:** black stage + unchanged walker + three grammar families (winged, watchful/eyed, abstract ribbon), each with generated shape graphs and compatible action timelines; one event per slot; no permanently visible elements. Then review the 200-event contact sheet. Expand grammar *only if the evidence shows the first families feel repetitive*.

## Explicit non-goals

- Do not render a permanent forest, fog, moon, decorative border, or audience.
- Do not stack events, even if they are of different types.
- Do not call an LLM to invent a creature at runtime.
- Do not promise mathematically guaranteed perpetual semantic uniqueness from finite code.
- Do not publish over the existing GitHub Pages root preview.
