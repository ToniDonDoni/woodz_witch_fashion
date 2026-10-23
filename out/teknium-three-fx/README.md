# Three effects from the dark

This is an independent scene preview inspired by the *effect categories* the user selected from Teknium's gallery, not an imported Teknium library implementation. See [design/acceptance brief](../../tasks/teknium_three_fx_brief.md).

## Files

- `director.js` — deterministic per-slot three-way shuffle and appearance parameters.
- `renderer.js` — WebGL2 signed-distance shapes and distinct liquid glass, spectral smoke, and pixel-dissolve shaders; Canvas 2D fallback.
- `template.html` — layered original walker, black stage, controls and deterministic debug API.
- `build.py` — embed original 33 walk frames, inlined drawing code and styles into one offline HTML file.
- `verify.cjs` — inspect frame pixels, event overlap, time seeking, mobile geometry and generated screenshots.
- `../../site/teknium-three-fx/index.html` — built stand-alone review artifact.

## Rebuild and verify

From the repository root:

```sh
python -m pip install pillow
python out/teknium-three-fx/build.py
npm install --no-save playwright
npx playwright install chromium
node out/teknium-three-fx/verify.cjs
```

Open `site/teknium-three-fx/index.html` offline in any modern WebGL2-enabled browser. The artistic outcome is experimental; actual phone GPU profiling and source walk-frame seam review remain necessary. The forest main page is intentionally unmodified.
