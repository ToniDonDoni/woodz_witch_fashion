# Woodz Witch Fashion

An interactive fashion runway in a hand-drawn enchanted forest. The subject walks in place using cutout sprites from user-supplied footage; the planned forest will be drawn and animated by code in the browser.

## First scene preview

The initial visual study pairs the approved walking sprites with a procedural chalk runway and butterflies on a black stage. The forest background is still to come. The standalone page is stored at `site/index.html` and is published through GitHub Pages after changes are merged into `main`.

Once deployed, the project page is available at `https://tonidondoni.github.io/woodz_witch_fashion/`. GitHub Pages serves this page publicly even though the source repository is private, when the account plan permits Pages for private repositories. The page embeds its sprites and scripts and makes no runtime network requests.

## Requirements and project structure

The requirements and acceptance criteria are in [`tasks/procedural_runway_spec.md`](tasks/procedural_runway_spec.md). Keep implementation attempts under named subdirectories in `out/`, as described in [`AGENTS.md`](AGENTS.md).

| Path | Purpose |
| --- | --- |
| `assets/walk/` | The 33 aligned transparent PNG walk sprites. |
| `site/index.html` | The one-file public first scene preview. |
| `tasks/procedural_runway_spec.md` | Project brief, acceptance criteria, and research notes. |
| `src/walk_page_template.html` | Sprite-only technical preview source. |
| `scripts/build_walk_page.py` | Packs sprites into a one-file technical preview. |
| `out/` | Separate named directories for each implementation and visual attempt. |
| `.github/workflows/publish-pages.yml` | Deploys the `site/` folder to GitHub Pages after a merge to `main`. |

The first scene study still has a visible discontinuity at the selected sprite loop seam (32 to 0). A reviewer report and local verification record are in `out/butterfly-runway/`.
