# Woodz Witch Fashion

**[Open the live site on GitHub Pages](https://tonidondoni.github.io/woodz_witch_fashion/)**

An endless procedural forest runway. The original 33 walk frames play in front
of hand-drawn trees, a moonlit sky and a changing programme of woodland acts.
Foreground plants pass in front of the walker. New Dream reshuffles the acts,
world layout and colour mood.

## Build and run

From the repository root, with Python 3 and Pillow:

```sh
python3 -m venv /tmp/woodz-build-venv
. /tmp/woodz-build-venv/bin/activate
python -m pip install Pillow
python scripts/build_forest_page.py
python -m http.server 18789 --bind 0.0.0.0 --directory dist
```

Open http://localhost:18789/ . In Docker, publish port `18789:18789`.
The result is **`dist/index.html`**, one offline-capable HTML with all sprites
and code embedded. Rebuild after updating the branch to show its exact Git HEAD
at upper left. No runtime libraries or network requests are required.

## Source layout

| Path | Purpose |
| --- | --- |
| `src/forest_runway_template.html` | Page, composition, playback, effect checkboxes and HEAD position. |
| `src/forest_scene.js` | Trees, moon, stars, ground objects and foreground vegetation. |
| `src/forest_acts.js` | Act programme, events, weather and colour moods. |
| `src/forest_enchantments.js` | Original fog, spore and fern effects plus all ten switch states. |
| `src/forest_extra_effects.js` | Living ink, translucent stained-glass flowers and large spark fields. |
| `src/forest_next_effects.js` | Liquid spirits, autumn leaves, moonlit path caustics and painted constellations. |
| `src/forest_corner_effects.js` | Four original Canvas effects drawn behind the walking figure. |
| `assets/walk/` | The 33 approved transparent walk frames. |
| `scripts/build_forest_page.py` | The main website builder. |
| `tests/verify_forest.cjs` | Acts, foreground, walk and world regression checks. |
| `tests/verify_effects.cjs` | Effect pixels, 13 checkboxes, global toggle, native scene restoration, HEAD and layout checks. |
| `dist/` | Local generated site, screenshots and reports; ignored by Git. |
| `index.html`, `site/index.html` | Identical version-neutral snapshots made with `--snapshot`. |
| `tasks/` | Specification and implementation requirements. |

All active website source is in `src/`. The experimental directory has been
removed. Normal builds read `git rev-parse HEAD` and embed that SHA in the page,
with a link to the full commit. They never use a remote tip or a synthetic PR
merge. The committed snapshots explicitly request a rebuild rather than falsely
claiming to contain their own enclosing commit hash.

## Scene and effect checkboxes

The bottom panel retains its **13 existing checkboxes**: two native scene toggles,
ten earlier optional Canvas effects and the **All on/off** master.
**Four more effect checkboxes are deliberately separated from that panel** and
fixed at the four extreme sides/corners: upper left, lower left, upper right,
and lower right. All four are checked on initial load.

- **Forest & foliage** hides or restores native environmental drawing:
  trees, mushrooms, stumps, ferns, foreground leaves and path-edge plants,
  **plus the moon, stars, clouds, floating dust, ambient rising motes, mist,
  petals, embers and non-animal staged acts** (including the giant animated
  *bloom* flower, lanterns, wisps, choir, fairy ring and starfall).
  The plain night gradient, walking path and walking woman remain visible.
  Independently checked optional Canvas effects can still draw above them.
- **Animals** hides or restores original creatures: leshies, butterflies
  and animal acts (stag, moths, owl). *Liquid spirits* is an independently
  checked optional effect, not part of the original creature layer.
- **All on/off** switches both scene categories **and all fourteen optional**
  Canvas effects together. With all unchecked, **only the background wash,
  walking path and woman remain**: no moon, twinkling stars, drifting
  particles, blooming flowers or staged events. When controls are mixed,
  the master checkbox displays a native indeterminate state.
  All elements restore at the same paused timestamp.

All original scenery and creatures are ON by default, so opening the page
preserves the accepted forest. No artwork or animation assets were removed.

### Four new corner effects

| Corner | Checkbox | Original Canvas adaptation | Source |
| --- | --- | --- | --- |
| **Upper left** | **Magnetic Currents** | Nine broad mint, violet and cyan magnetic field ribbons with gently drifting luminous filings behind the trees. | [Magnetic-monument kinetic typography](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/gdgtify-130294.md) |
| **Lower left** | **Spectral Butterfly** | Two large translucent X-ray-inspired butterflies with animated wingbeats and glowing skeletal veins, behind the walker. | [Deterministic X-ray butterfly](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/0xkarmi-129839.md) |
| **Upper right** | **Golden Sandfall** | Five falling sand curtains with fine golden strands and animated grains behind midground trees. | [Browser sand, water and particle physics](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/cyrilxbt-149036.md) |
| **Lower right** | **Ancient Ruins** | Three mysterious pale stone arches with animated luminous markings in the distant woods. | [Surreal browser-world ruins](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/lexnlin-241739.md) |

As with the existing ten, these are **original lightweight Canvas 2D
reinterpretations** of visual ideas from the linked collection, not copied
code or external dependencies. Each can be toggled independently while paused,
is restored deterministically on the same frame, and obeys **All on/off**.
With all controls off, only the plain background, path and walker remain.
The latest Git HEAD is still displayed on screen after a local rebuild.
On small screens the four labels stay in the corners clear of the bottom
effect grid and playback controls. The automated browser test saves isolated
`corner-*.png` previews and checks their positions at five viewport sizes.

### Optional effect references

Ten bottom effect checkboxes and four separate corner switches enable independent
original Canvas adaptations of examples from
[yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos):

- **Fog** — layered rolling mist ([reference](https://skillry.dev/ai-videos/opus-5-5/mondemsuraj-691517)).
- **Spore trails** — six continuously active, viewport-spanning clusters (96 luminous particles) with curved comet tails, soft halos and bright cores. Unlike the former mushroom-crossing-only trigger, they remain visibly active even when the original forest scenery is unchecked; the character and foreground scenery still occlude them. ([reference](https://skillry.dev/ai-videos/opus-5-5/ishuagra02-678129)).
- **Fractal ferns** — unfolding folded-paper plants ([reference](https://skillry.dev/ai-videos/opus-5-5/jrayon-054015)).
- **Living ink** — drifting wide dry-brush ribbons, pigment edges and fibers inspired by [interactive ink painting](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/youwareai-259061.md) ([original](https://x.com/YouWareAI/status/2105656935622259061)).
- **Glass flowers** — large translucent hibiscus-inspired petals, colored glass gradients and vein details inspired by [stained-glass hibiscus](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/ivanainai-245918.md) ([original](https://x.com/ivanainai/status/2106481339193245918)).
- **Big sparks** — **128 luminous particles** with thick comet trails in two oversized orbital fields. They are deliberately drawn in the distant sky **behind all tree layers, staged events and the walker**, so foliage and the silhouette occlude them rather than being obscured by them. The wide particle trajectories remain unchanged. Inspired by [wizard spell particles](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/zacxbt-944604.md) ([live remake](https://skillry.dev/ai-videos/opus-5-5/zacxbt-944604)).

- **Liquid spirits** — five gently morphing and drifting luminous creatures, with orbiting droplets, **drawn between forest tree layers** so the walker is never obscured. Adapted from the [realistic lava lamp WebGL animation](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/juancarlos17626-382690.md) ([original](https://x.com/juancarlos17626/status/2108301453907382690)).
- **Leaf vortex** — 114 distinct autumn leaves in three large orbiting currents, drawn behind the walking sprite. Inspired by the maple-tree foliage in [Interactive Zen Garden HTML Animation](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/arixxbt-292438.md) ([original](https://x.com/arixxbt/status/2108541814718292438)).
- **Moonlit caustics** — eight moving bands of pale blue moonlight, clipped to the runway and drawn before trees and the walker. Inspired by [fishbowl reflection, refraction and water caustics](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/nicolamanzini-156628.md) ([remake](https://skillry.dev/ai-videos/opus-5-5/nicolamanzini-156628)).
- **Constellations** — three hand-drawn star figures with glowing connected lines, twinkling points and traveling highlights **in the distant night sky**. Inspired by [Painting the Night](https://github.com/yihui-dev/awesome-opus5-5-videos/blob/main/prompts/obydulme-052905.md) ([original](https://x.com/obydulme/status/2104802322518052905)).

The references are visual inspiration, not runtime dependencies. Each checkbox
works independently, including while paused. Disabling all ten restores the
accepted main forest's canvas pixels, including its acts and foreground.
All effects, including the four added here, are original Canvas 2D
reinterpretations in the existing self-contained page: no WebGL dependency,
3D engine, image download or network requests. On desktop the ten checkboxes
form two rows; on narrow screens they form five compact rows. The build stamp
still shows the exact checked-out Git HEAD after rebuilding.
The big-sparks test compares real pixels with the switch off at phone and desktop
sizes, and requires visible changes spanning over 70% of the viewport width and
48% of its height.

## Verification and publication

Optional browser checks require Node.js, Playwright and Chromium:

```sh
npm install --prefix /tmp/woodz-browser-check playwright
node /tmp/woodz-browser-check/node_modules/playwright/cli.js install chromium
python scripts/build_forest_page.py
PLAYWRIGHT_MODULE=/tmp/woodz-browser-check/node_modules/playwright node tests/verify_forest.cjs
PLAYWRIGHT_MODULE=/tmp/woodz-browser-check/node_modules/playwright node tests/verify_effects.cjs
```

`BROWSER_EXECUTABLE` can select an existing Chromium. Reports and screenshots
are saved to `dist/verification/`, including separate `preview-liquid.png`,
`preview-leaves.png`, `preview-caustics.png`, `preview-constellations.png`,
and `preview-all-ten.png` screenshots to inspect the new effects. The immutable pixel-regression baseline is
commit `95ebb572944ad91eccd1c824568296af8e17814a`; shallow clones must fetch it.
CI checks out the exact branch commit, builds, verifies and uploads the stamped
HTML and reports. The manual Pages workflow builds the selected branch from `src/` and publishes `dist/`. The separate public preview repository is not auto-updated.

## Manual GitHub Pages deployment

**[Open the published site](https://tonidondoni.github.io/woodz_witch_fashion/)**

Publication is manual. Pushing commits or merging a pull request does not
publish the site automatically.

1. Open [Actions → Publish Forest](https://github.com/ToniDonDoni/woodz_witch_fashion/actions/workflows/publish-pages.yml).
2. Click **Run workflow** and select the branch in **Use workflow from**.
3. Click **Run workflow** to build and publish that selected branch.

The workflow checks out the exact commit selected for the run, builds the site
from `src/` using `scripts/build_forest_page.py`, uploads `dist/`, and deploys to
this repository's GitHub Pages. The displayed HEAD identifies the published
commit. Every run updates the same site URL; branches do not get separate URLs.
The selected branch must contain this workflow and the site's build sources.

The manual button requires the workflow to exist on the default branch
([GitHub documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)).
In **Settings → Pages**, use **GitHub Actions** as the publishing source.
To permit any branch, check **Settings → Environments → github-pages →
Deployment branches and tags** and choose **No restriction**
([GitHub documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).
This repository setting is separate from the workflow; the connected GitHub
tool cannot inspect or change environment administration settings.

The original frame 32-to-0 gait discontinuity remains. Desktop checks at phone
viewport sizes are not physical-phone performance or offline-opening acceptance.
See `tasks/procedural_runway_spec.md` for the full experience specification.
