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
| `src/forest_enchantments.js` | Three optional procedural effects. |
| `assets/walk/` | The 33 approved transparent walk frames. |
| `scripts/build_forest_page.py` | The main website builder. |
| `tests/verify_forest.cjs` | Acts, foreground, walk and world regression checks. |
| `tests/verify_effects.cjs` | Effect pixels, checkboxes, HEAD and layout checks. |
| `dist/` | Local generated site, screenshots and reports; ignored by Git. |
| `index.html`, `site/index.html` | Identical version-neutral snapshots made with `--snapshot`. |
| `tasks/` | Specification and implementation requirements. |

All active website source is in `src/`. The experimental directory has been
removed. Normal builds read `git rev-parse HEAD` and embed that SHA in the page,
with a link to the full commit. They never use a remote tip or a synthetic PR
merge. The committed snapshots explicitly request a rebuild rather than falsely
claiming to contain their own enclosing commit hash.

## Effect checkboxes and references

Three bottom checkboxes enable original Canvas adaptations of examples from
[yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos):

- **Fog** — layered rolling mist ([reference](https://skillry.dev/ai-videos/opus-5-5/mondemsuraj-691517)).
- **Spore trails** — glowing mushroom spores with curved trails ([reference](https://skillry.dev/ai-videos/opus-5-5/ishuagra02-678129)).
- **Fractal ferns** — unfolding folded-paper plants ([reference](https://skillry.dev/ai-videos/opus-5-5/jrayon-054015)).

The references are visual inspiration, not runtime dependencies. Each checkbox
works independently, including while paused. Disabling all three restores the
accepted main forest's canvas pixels, including its acts and foreground.

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
are saved to `dist/verification/`. The immutable pixel-regression baseline is
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
