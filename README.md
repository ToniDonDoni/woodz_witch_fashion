# Woodz Witch Fashion

An interactive fashion runway in a hand-drawn enchanted forest. The subject walks in place using cutout sprites from user-supplied footage; the planned forest will be drawn and animated by code in the browser.

## Current status

This first repository upload contains the project brief, instructions, and browser-preview source code. The walking PNGs and built `index.html` have not been uploaded yet. The requirements and acceptance criteria for the procedural forest preview are in [`tasks/procedural_runway_spec.md`](tasks/procedural_runway_spec.md).

## Repository layout

| Path | Purpose |
| --- | --- |
| [`assets/walk/`](assets/walk/) | Destination for the 33 aligned transparent PNG walk sprites; see its README. |
| [`tasks/procedural_runway_spec.md`](tasks/procedural_runway_spec.md) | Project brief, acceptance criteria, and research notes. |
| [`src/walk_page_template.html`](src/walk_page_template.html) | Source HTML and JavaScript for the current preview. |
| [`scripts/build_walk_page.py`](scripts/build_walk_page.py) | Packs sprites into a one-file `index.html` when the PNGs are present. |
| [`out/`](out/) | Separate named directories for each implementation and visual attempt. |

## Rebuild the preview

After the sprite PNGs are added, with Python 3 and Pillow installed:

```sh
python3 scripts/build_walk_page.py
```

The resulting `index.html` contains its own sprite atlas and JavaScript. The walk poses come from the supplied footage; no new poses were generated. The original video is not included in this repository.

The future single-file page is intended for phone use. Phone-browser and offline acceptance checks remain open in the task specification.
