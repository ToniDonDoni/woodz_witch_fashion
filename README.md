# Woodz Witch Fashion

An endless fashion runway through an illustrated enchanted forest. A woman walks in place using the 33 existing footage-derived cutouts while a continuously generated world travels from left to right.

[Open the live forest preview](https://tonidondoni.github.io/woodz-witch-fashion-preview/).

## Current forest preview

Two layers of hand-drawn trees pass behind the walker. Moss, ferns, mushrooms, stumps and small woodland spirits line the runway. Seeded identities preserve each object's shape and details throughout its journey. Smooth parallax and secondary movements run independently of the 12 Hz boiling pencil contours. Butterflies remain as occasional accents.

The deliverable is one self-contained `index.html`: its sprite atlas, styles and drawing code are embedded. It opens offline without adjacent assets or external dependencies. Pause, walking pace and New Dream controls are included.

The source repository is private. The public preview repository contains only the standalone page and hosting files, and publishes its `main` branch through GitHub Pages. Changes to this private repository do not automatically update that public preview.

## Source and reproduction

The requirements are in [`tasks/procedural_runway_spec.md`](tasks/procedural_runway_spec.md). Follow [`AGENTS.md`](AGENTS.md), and keep each exploratory attempt in its own `out/<attempt-name>/` directory.

| Path | Purpose |
| --- | --- |
| `assets/walk/` | The 33 approved transparent PNG walk frames. |
| `src/forest_scene.js` | Procedural trees, ground vegetation, mushrooms, stumps and woodland spirits. |
| `src/forest_runway_template.html` | Inline animation, composition and controls. |
| `scripts/build_forest_page.py` | Builds the standalone forest page from the existing sprites and drawing source. |
| `index.html` | Current standalone forest preview. |
| `site/index.html` | Identical copy of the standalone preview for static hosting. |
| `tasks/procedural_runway_spec.md` | Full experience brief and acceptance criteria. |
| `out/enchanted-forest/` | This iteration's draft sources, captures, verification and independent review. |
| `out/butterfly-runway/` | Previous path-and-butterfly study, preserved separately. |
| `src/walk_page_template.html` | Original sprite-only technical preview source. |

With Python and Pillow available, run `python scripts/build_forest_page.py` from the project root. This regenerates `index.html` and `site/index.html` from frames 0–32.

## Verification and limits

The forest iteration passes offline Chromium checks with no external requests or runtime errors. Desktop, landscape and two phone-sized viewports were visually reviewed. Objects retain their identities, enter and retire outside the viewport, and remain bounded during two minutes of sampled simulation and a one-hour seek. See `out/enchanted-forest/verification.json` and `out/enchanted-forest/review.md`.

The existing frame 32-to-0 pose discontinuity remains visible. This iteration approves the procedural forest artwork; it does not claim seamless gait acceptance or physical-phone performance and offline file-opening acceptance.
