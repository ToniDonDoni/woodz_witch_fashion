# Woodz Witch Fashion

An endless fashion runway through an illustrated enchanted forest. A woman walks in place using the 33 existing footage-derived cutouts while a continuously generated world travels from left to right, staging one seeded act after another.

[Open the live forest preview](https://tonidondoni.github.io/woodz-witch-fashion-preview/).

## Current runway: living acts

Two layers of hand-drawn trees pass behind the walker. Moss, ferns, mushrooms, stumps and small woodland spirits line the runway, and a fourth, faster row of dark blades and fronds passes in front of her, so foreground vegetation genuinely occludes her sneakers. Seeded identities preserve each object's shape and details throughout its journey. Smooth parallax and secondary movements run independently of the 12 Hz boiling pencil contours. Butterflies and drifting dust remain as accents.

On top of that the forest is staged as a sequence of seeded acts. Each act lasts 30–62 seconds and a different length each time, announces itself with a title card, changes the weather of the whole woodland, and sends one signature set piece across the stage: a constellation-antlered stag, a lantern procession, a moth wake, a fairy ring rising from the path, a leshy choir on a fallen log, a wisp fountain, or a moonflower opening in the foreground. A piece that is still crossing the stage when its act ends keeps travelling until it leaves. Rare unannounced cameos interrupt the programme: a star fall in the sky and an owl sweeping overhead. A per-dream colour grade re-hues the whole world, while the walker is composited afterwards so her own colours stay true. Night sky, moon, stars and the chalk runway from the previous study are unchanged.

The deliverable is one self-contained `index.html`: its sprite atlas, styles and drawing code are embedded. It opens offline without adjacent assets or external dependencies. Pause, walking pace and New Dream controls are included. `NEW DREAM` reshuffles the act programme, the woodland layout and the colour mood instead of redrawing the same world.

The source repository is private. The public preview repository contains only the standalone page and hosting files, and publishes its `main` branch through GitHub Pages. Changes to this private repository do not automatically update that public preview.

## Source and reproduction

The requirements are in [`tasks/procedural_runway_spec.md`](tasks/procedural_runway_spec.md). Follow [`AGENTS.md`](AGENTS.md), and keep each exploratory attempt in its own `out/<attempt-name>/` directory.

| Path | Purpose |
| --- | --- |
| `assets/walk/` | The 33 approved transparent PNG walk frames. |
| `src/forest_scene.js` | Procedural trees, ground vegetation, mushrooms, stumps, woodland spirits and the foreground row. |
| `src/forest_acts.js` | The act director, the per-act weather, the dream colour mood and every staged set piece. |
| `src/forest_runway_template.html` | Inline animation, composition, act card and controls. |
| `scripts/build_forest_page.py` | Builds the standalone forest page from the existing sprites and drawing source. |
| `index.html` | Current standalone forest preview. |
| `site/index.html` | Identical copy of the standalone preview for static hosting. |
| `tasks/procedural_runway_spec.md` | Full experience brief and acceptance criteria. |
| `out/runway-acts/` | This iteration's draft sources, captures, verification and independent review. |
| `out/forest-spectators/` | Previous neon-audience study, preserved separately. |
| `out/enchanted-forest/` | Previous procedural forest study, preserved separately. |
| `out/butterfly-runway/` | First path-and-butterfly study, preserved separately. |
| `src/walk_page_template.html` | Original sprite-only technical preview source. |

With Python and Pillow available, run `python scripts/build_forest_page.py` from the project root. This regenerates `index.html` and `site/index.html` from frames 0–32.

## Verification and limits

The act iteration passes offline Chromium checks with no external requests or runtime errors. Desktop, landscape and two phone-sized viewports were reviewed. Every act theme and every signature event appears and reaches the stage; act lengths vary and tile the timeline exactly; the act order never repeats a theme inside three acts; staged objects keep their identity while they travel; identical simulated times render identically; and the active object count stays bounded over ten sampled minutes and a one-hour seek. Two measurements back the two claims that are easy to fake: differencing two renders of the same time with the foreground row on and off changes the pixels over her legs by 34.6 grey levels and changes nothing above them, and 120 timed draws at phone size report a 12.1 ms median (15.7 ms p95) on this machine's headless CPU. See `out/runway-acts/verification.json` and `out/runway-acts/review.md`.

The existing frame 32-to-0 pose discontinuity remains visible. This iteration approves the procedural act staging; it does not claim seamless gait acceptance or physical-phone performance and offline file-opening acceptance.
