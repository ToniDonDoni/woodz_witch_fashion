# Main forest effects integration

Integrate Fog, Spore trails and Fractal ferns, their bottom checkboxes and an
upper-left exact build HEAD stamp into the main source implementation.

- Preserve the accepted main forest at commit
  `95ebb572944ad91eccd1c824568296af8e17814a`: sky, moon, stars, acts, colour
  moods, foreground occlusion, world movement and the 33 original walk frames.
- Keep the effects in `src/forest_enchantments.js`; use the existing
  `src/forest_runway_template.html` for composition and controls.
- Use `scripts/build_forest_page.py` as the main builder. Generate one standalone
  `dist/index.html` with the checked-out Git HEAD, never a synthetic PR merge.
- Keep checkboxes independent and keyboard-accessible; redraw paused frames.
- Remove the experimental directory and all code, docs and CI dependencies on it.
- Keep source in `src/`, utilities in `scripts/`, checks in `tests/`, and generated
  captures/reports in Git-ignored `dist/`.
- Compare all-effects-off pixels with the immutable accepted main page. Verify
  acts and foreground, each effect's actual pixel change, bounded caches,
  pause/reseed/seek behaviour, offline playback and five layouts.
- Keep the reference repository and individual examples in the root README.

Visual references: https://github.com/yihui-dev/awesome-opus5-5-videos
