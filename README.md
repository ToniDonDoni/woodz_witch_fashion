# Woodz Witch Fashion

An endless fashion runway through an illustrated enchanted forest. A woman walks in place using the 33 existing footage-derived cutouts while a continuously generated world travels from left to right, staging one seeded act after another.

[Open the live forest preview](https://tonidondoni.github.io/woodz-witch-fashion-preview/).

## Separate study: Forest Casting / GPT

[Open Forest Casting / GPT](https://tonidondoni.github.io/woodz-witch-fashion-preview/strange-passing-gpt/): a forest fashion show with one visitor at a time, seated leshy and owl buyers, a moon-antlered deer, unusual airborne creatures, and passing gusts. Sixteen procedural families use seeded drawing details and 12 Hz boiling pencil contours; at least twelve other guests appear before a family returns. Four distinct owl silhouettes replace the original repeated owl. See `out/forest-casting-variety-gpt/README.md` for reproduction and verification. This study preserves the accepted root page and all 33 original sprites.

## Current runway: scenes in the wood

Two layers of hand-drawn trees pass behind the walker. Moss, ferns, mushrooms, stumps and small woodland spirits line the runway, and a fourth, faster row of dark blades and fronds passes in front of her, so foreground vegetation genuinely occludes her sneakers. Seeded identities preserve each object's shape and details throughout its journey. Smooth parallax and secondary movements run independently of the 12 Hz boiling pencil contours. Butterflies and drifting dust remain as accents.

On top of that the forest is staged as a sequence of seeded acts. An act lasts 30–62 seconds, a different length each time, announces itself with a title card that stays up for the whole act, and changes the weather of the whole woodland. Each act is a small scene built from three overlapping beats that tile its length, so the stage is busy for essentially the entire act: one headline set piece — a constellation-antlered stag, a lantern procession, a moth wake, a fairy ring rising from the path, a leshy choir on a fallen log, a wisp fountain, or a moonflower opening in the foreground — and two quieter support pieces drawn from the same cast. A beat can enter from the left, enter from the right and face the way it travels, arrive and hold beside her, or rise out of the ground and drift; the owl's overhead swoop is a fifth mode. A piece that is still moving when its act ends finishes its trajectory instead of being cut off. Rare unannounced cameos interrupt the programme: a star fall in the sky and an owl sweeping overhead. A per-dream colour grade re-hues the whole world, while the walker is composited afterwards so her own colours stay true. Night sky, moon, stars and the chalk runway from the previous study are unchanged.

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
| `out/runway-scenes/` | This iteration's draft sources, captures, verification and independent review. |
| `out/runway-acts/` | Previous living-acts study, preserved separately. |
| `out/forest-spectators/` | Previous neon-audience study, preserved separately. |
| `out/enchanted-forest/` | Previous procedural forest study, preserved separately. |
| `out/butterfly-runway/` | First path-and-butterfly study, preserved separately. |
| `src/walk_page_template.html` | Original sprite-only technical preview source. |

With Python and Pillow available, run `python scripts/build_forest_page.py` from the project root. This regenerates `index.html` and `site/index.html` from frames 0–32.

## Verification and limits

The scene iteration passes offline Chromium checks with no external requests or runtime errors. Desktop, landscape and two phone-sized viewports were reviewed. Every act theme and every signature event appears and reaches the stage; act lengths vary and tile the timeline exactly; the act order never repeats a theme inside three acts; staged objects keep their identity while they travel; identical simulated times render identically; and the active object count stays bounded over ten sampled minutes and a one-hour seek. The properties of this iteration are measured as well as asserted: the three beat windows tile at least 99% of every act over 40 programmed acts (an act can no longer be announced and then left empty), at least four arrival modes appear with both horizontal directions used (over 40 acts: 40 rises, 30 holds, 25 left entries, 25 right entries), and rendering six acts second by second puts a piece on screen for 90–96% of each act — a mean of 93%, with the longest blank stretch 3 seconds — against 16% for the single-fly-past version. (The first version of that occupancy measurement counted beats whose anchor was still off screen and reported 98%; it now counts only pieces inside the viewport.) Two further measurements back the claims that are easy to fake: differencing two renders of the same time with the foreground row on and off changes the pixels over her legs by 34.6 grey levels and changes nothing above them, and 120 timed draws at phone size report a 12.9 ms median (16.3 ms p95) on this machine's headless CPU. See `out/runway-scenes/verification.json` and `out/runway-scenes/review.md`.

The existing frame 32-to-0 pose discontinuity remains visible. This iteration approves the procedural act staging; it does not claim seamless gait acceptance or physical-phone performance and offline file-opening acceptance.
