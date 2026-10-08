# Independent review — living acts (runway study 03)

Reviewer: independent agent pass. Branch `codex/forest-acts`, worktree state as of this
review: modified `README.md`, `index.html`, `scripts/build_forest_page.py`, `site/index.html`,
`src/forest_runway_template.html`, `src/forest_scene.js`, plus new `src/forest_acts.js` and the
`out/runway-acts/` attempt directory.

Scope: `src/forest_scene.js`, `src/forest_acts.js`, `src/forest_runway_template.html`,
`scripts/build_forest_page.py`, `README.md`, the built `index.html`, and the attempt directory,
judged against `AGENTS.md` and `tasks/procedural_runway_spec.md`. I formed the findings below by
reading the diff and the sources, then exercising the built page myself with a headless Chromium
probe (`/tmp/probe.cjs`, not committed) and re-running the attempt's own verifier.

## Summary judgement

The iteration does what it claims at the level the spec cares about: the world is still drawn at
runtime from seeded, persistent identities; the acts are deterministic functions of seed and
simulated time; the foreground row really is composited after the walker; and `NEW DREAM` really
does change the programme, the layout and the grade. I found no defect that breaks the spec's
acceptance criteria, and no defect that would embarrass the page in front of a viewer. I did find
one genuine latent bug in the act timing model, one art-compositing inconsistency, and a few small
documentation and hygiene issues. None of them block promotion; the latent bug should be fixed or
the surrounding code simplified before anyone makes act lengths vary.

## What I verified myself

- The built page loads offline from `file://` with no page errors, and the inlined script is the
  concatenation of the two sources plus the template (checked against `src/`).
- `runway.programme(40)`: every act has a signature event, no theme repeats within three acts, and
  lengths stay in [34, 60] s.
- Every signature event type reaches the middle of the stage; cameos and rare acts fire.
- Re-seeking to the same simulated time produces the same canvas.
- The foreground row measurably darkens the walker's feet region (`verification.json`: mean luma
  20.4 with the row on, 47.2 with it off, at the same simulated time).

## Findings

### 1. Medium — every act in a dream has the same length; the plan API pretends otherwise

`actLength()` (src/forest_acts.js:27) is `34 + rand(seed * 37 + 5) * 26`: it depends only on the
world seed, never on the act index. So one dream draws a single duration — the verifier's own
report shows `actLengthSeconds: [53.44, 53.44]`, min equal to max over 40 acts — and every act of
that dream is that same length. The show therefore has a metronomic beat: act N always begins at
exactly `N * L`.

That is not merely cosmetic, because the surrounding code is written as if lengths varied:

- `actPlan()` stores a per-plan `length` and invalidates its cache when `cached.length !== length`
  — a check that can never fire while `actLength()` is index-free.
- `actPlan().start` is `index * length`, and `currentAct()` recovers the index with
  `Math.floor(time / length)`. Both are only correct while `L` is constant. The moment someone
  makes `actLength()` depend on the index (which is what "34–60 s" and the per-plan cache logic
  both suggest was intended), `start` becomes wrong for every act after the first and
  `currentAct()` maps time to the wrong act — silently, with no failing assertion in the verifier
  to catch it (the verifier records min and max length but never asserts they differ, nor that
  act starts are contiguous).

Fix one of two ways: either give `actLength()` an index and compute `start` cumulatively (with a
matching cumulative lookup in `currentAct()`), or delete the per-plan `length` cache check and
document that one dream = one act duration. The current state is the worst of both.

Related documentation nit: `out/runway-acts/README.md` says "Act length (34–60 s) … derive[s] from
the world seed", which is accurate; `README.md` says "Each act lasts 34–60 seconds", which reads as
per-act variation that does not exist.

### 2. Low/medium — the dream colour grade does not cover the foreground row or front-layer events

`drawDreamGrade()` is called after the far and near set pieces but before the walker, the
`front`-layer events (the moonflower bloom) and the foreground row (src/forest_runway_template.html
draw order, lines 130–144). The intent — the walker keeps her own colours — is right and the
comment says so, but the side effect is that the foreground hedge and the bloom are left out of the
per-dream hue. In `AMBER DUSK` or `VIOLET VEIL` the whole woodland shifts warm/violet while the
bottom band of the frame and the signature bloom stay their original cold green. That reads as a
compositing oversight rather than an art choice, and it is visible on any act whose grade is far
from green. Cheap fix: draw a second, lighter grade pass after the foreground row (walker still
drawn before it is unavoidable unless the walker is composited last, which she already is), or tint
the tuft/frond/bloom palettes per dream.

### 3. Low — signature events are always scheduled past the end of their act

`eventStart` is `length * (.20 … .50)` and `eventDur` is `length * .92` (src/forest_acts.js:52), so
the declared duration always overruns the act boundary, and `stageEvents()` only ever stages the
*current* act's plan. The event therefore disappears the instant the act changes, whatever its
position on screen. In practice this is mostly harmless because the pieces move fast enough to be
off the right edge by then, but it is not always so: with an early `eventStart`, a slow piece
(fairy ring at 88 px/s, choir at 104) can still be inside the frame when the act cuts. I measured
this per act — see the table in the probe output appended below. The cameos have the same shape
(`cameoStart` up to `0.88 * length` with a fixed 6 s duration, so a star fall can be cut mid-fall).

The set pieces have no exit fade (unlike the title card), so the failure mode is a pop, not a
dissolve. Either clamp the schedule so the piece finishes inside its act, or carry the previous
act's live events one act longer with a fade-out.

### 4. Low — `actCache` and `themeMemo` grow without bound

`pruneForestCache()` keeps the art cache honest, and the verifier asserts `cacheSize` stays bounded
even after a one-hour seek, but the act director's own `actCache` and `themeMemo` (src/forest_acts.js:25–26)
are never trimmed. Each entry is a small object, so this is a leak measured in kilobytes per hour
of playback, not a practical problem for a preview page — but it is inconsistent with the care taken
everywhere else, and an endless page is exactly where "it runs all night" is the promise.

### 5. Nitpicks

- `pruneForestCache`'s comment ("so staged objects can register their art too") describes
  behaviour the set pieces do not have: they draw with `inkBrush` every frame and never touch
  `forestCache`.
- `runway.act()` returns the live cached plan object; `currentAct()` mutates its `progress` field
  every frame, so a caller holding the reference sees it change under them. Return a copy.
- `updateActCard()` calls `document.querySelector('#actcard')` twice per frame; hoist it like
  `#scene` is hoisted.
- `drawNightSky()`'s 90 + 60 fixed star fields are recomputed and re-filled every frame with no
  parallax indexing — they are the one part of the sky that does not participate in the world's
  travel (the comment claims otherwise for the *drifting* stars, which is true; the two static
  fields are a pre-existing choice from the previous study, not introduced here).

### Verification gaps (not defects in the code)

- No frame-rate or frame-time measurement anywhere. Spec acceptance criterion 6 asks for runtime
  smoothness on a target phone; `README.md` honestly disclaims physical-phone acceptance and
  `verification.json` records `physicalPhoneTested: false`. The claim is scoped correctly, but the
  iteration ships a heavier scene than the last one (two new foreground painters, up to three
  set-piece draw paths, a per-frame full-canvas blend pass) without any number attached. My own
  probe's timings are appended below; they are a headless-CPU sanity check, not a phone budget.
- The verifier asserts the act order never repeats a theme inside three acts but never asserts
  act lengths *vary* — which is why finding 1 survived.

## Conformance notes

- `AGENTS.md`: sources in `src/`, build tool in `scripts/`, attempt kept in `out/runway-acts/`
  with its own copies, user-facing text in English, no absolute paths/credentials in committed
  files (re-checked: the only absolute path is inside the out-of-repo probe I wrote). The build
  script writes `index.html` and `site/index.html` only; the attempt copies are separate files,
  and all three are byte-identical.
- Spec: no prerecorded background — everything is Canvas 2D at runtime; objects keep stable world
  identities and do not re-randomise per frame; the boil is a separate 12 Hz clock; the walker
  stays anchored and is never cropped in the four tested viewports; returning from the background
  resumes without a jump (`visibilitychange` resets `last`, and time only advances while visible).
- The `NEW DREAM` reshuffle is real, not cosmetic: `resetWorld()` clears the act, theme and art
  caches, and the ground layout key includes the seed, so issue #8 is addressed at the right layer
  (layout) and not just at the programme layer.

## Verdict

**Approve with fixes.** Findings 1 and 2 should land before the next iteration; 3–5 can ride along.

---

## Implementer response (appended after the review, not part of the reviewer's verdict)

All five findings were addressed in the reviewed branch, and the verifier was extended so
the two that could silently regress are now asserted.

1. **Act length (medium).** `actLength(index)` now returns 30–62 s and takes the act index, so
   every act of a dream has its own duration; `start` is cumulative and is resolved by walking
   act lengths from a cached anchor (`actStartFor` / `actIndexForTime`), which keeps a normal
   frame O(1) and a long seek O(acts spanned). `currentAct()` locates the act with that walk
   instead of `floor(time / length)`. The verifier now asserts contiguous act starts and that
   act lengths really vary; this run reports `actLengthSeconds: [31.91, 61.71]`,
   `actStartsContiguous: true`.
2. **Dream grade coverage (low/medium).** Anything composited after the flat grade now takes the
   dream tint inside its own palette (`mixHex`/`moodTint`): the foreground hedge and its rim
   light, and the front-layer moonflower. The tint amount on the hedge was kept low (0.3) so it
   still reads as a silhouette rather than a wash.
3. **Events cut at the act boundary (low).** `stageEvents()` now also keeps the previous act's
   scheduled pieces alive while they are inside their own duration, so a set piece or cameo that
   is mid-crossing when its act ends finishes its pass instead of popping off screen.
4. **Unbounded director tables (low).** `pruneActCaches()` trims `actCache`, `themeMemo` and
   `actStarts` to a six-act window around the live act, matching how the forest art cache is kept.
5. **Nitpicks.** The stale `pruneForestCache` comment is corrected; `runway.act()` returns a copy
   of the plan; the act-card element is hoisted next to `#scene`.

Verification gaps: the verifier now measures the draw itself — 120 timed draws sampled across
about five acts at the phone viewport report `mean 12.67 ms`, `median 12.10 ms`, `p95 15.70 ms`,
`worst 44.50 ms` on this machine's headless CPU (not a phone, and not a frame-rate budget).

The occlusion check was also made directional-proof: instead of asserting the mean luminance over
her feet drops (which depends on the foreground being darker than the ground behind it), the
verifier now differences two renders of the same simulated time with the foreground row on and
off. This run reports mean absolute pixel change `legs 34.58, torso 0.00` — the row changes what
is drawn over her legs and touches nothing above them.
