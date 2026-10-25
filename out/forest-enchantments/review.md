# Review — forest enchantments

## Scope and baseline

Derived from `out/forest-spectators/` at
`0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`. The same source files are already
present, unchanged, on the main branch used as this PR's base. The old attempt
and the root release are untouched. New source and standalone output are in
`out/forest-enchantments/`.

## Implementation

- Rolling fog uses a small reusable procedural texture and two world-space
  depth layers. It does not require full-screen blur filters.
- Mushroom emissions are derived from each mushroom's analytical crossing time,
  with 22 bounded points and short sampled curves per active burst. Pause,
  seeking and dropped render frames cannot change their identity or age.
- Ferns use seven opening fronds with repeated folded leaves and sub-leaflets.
  Their numerical geometry cache includes the world seed and is retired when
  the full plant leaves the viewport. There is no history-dependent simulation.
- Three native, labeled bottom checkboxes allow direct comparison against the
  original. They sit above playback controls at every tested size.

## Validation

`verify.cjs` passed in headless Chromium 153.0.8010.0 with network access disabled.
The machine had no preinstalled browser; an external serverless Chromium binary
was used through `BROWSER_EXECUTABLE`. No verification dependency is committed.

The check covers:

- 120 simulated seconds of the original world and 180 seconds of effects;
- all eight recurring spectator studies and stable forest object identities;
- bounded caches and world population, including seeking to one hour;
- all three effects present in the first 30 seconds;
- pause, each effect toggle, reseeding, and identical rendering across seek paths;
- exact original canvas pixels when all three effects are disabled;
- real-time playback, five viewport sizes and no external network requests;
- 430x932, 320x568, 844x390, 1440x900 and 2048x1000 screenshots.

Canvas comparisons use the canvas's actual PNG data, rather than element
screenshots: an element screenshot also captures the overlaid HTML controls.
The complete measured values are in `verification.json`.

## Visual inspection and limits

Reviewed phone, narrow phone, landscape and desktop screenshots. The walker
remains the focal point and is painted above every new effect. The mist stays
subtle; the plants use muted gold, lavender and mint to accompany the neon
spectators. The spore event remains small rather than filling the whole frame.

Inspected the frame 32 to frame 0 transition and a 36-frame motion capture.
The source gait has a visible pose discontinuity at its existing loop seam;
this effects-only change preserves that footage and does not repair the seam.
The atlas payload is byte-identical to the baseline in this build. No duplicate
walker or replacement poses were introduced.

This was desktop Chromium at phone viewport sizes, not a physical-phone test.
Physical-phone frame rate, touch behavior and file-opening behavior remain
unmeasured. No mobile acceptance claim is made.

## Follow-up verification: checkboxes and HEAD stamp

Each of the three effects was toggled alone on a fixed paused frame. The actual
canvas pixels changed when checked and returned exactly when unchecked. Native
Space-key operation also updates the drawing. Layout checks assert that labels
stay inside the viewport, sit near the bottom and do not overlap playback.

The normal build embeds the checked-out `git rev-parse HEAD`, abbreviated to 12
characters on screen and linked to the full commit. The verifier compares the
embedded value to Git. On narrow screens, the branch name is hidden so the hash
stays clear of the edition text. The committed snapshot explicitly requests a
rebuild rather than mislabeling its parent commit as its own current HEAD.

The supplied user screenshot is the separate root "Into the woods" scene.
The README now serves this attempt's directory directly at `/` to prevent that
entry-point mix-up.
