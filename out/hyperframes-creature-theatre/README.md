# Nocturne — Endless Creature Runway

The original woman walks continuously on pure black. New procedural creatures approach her one at a time, inspect or display themselves, transform and leave. The final deliverable is an endless self-contained HTML page. HyperFrames is only a graphics and motion reference.

## Reproduce

From this attempt directory, with Node.js 22 or newer:

```sh
npm ci
npm run build
npm start
```

Open the URL printed by the server, or open `index.html` directly. Three.js, the exact original walk atlas and all drawing code are embedded. No adjacent assets, fonts or network requests are required. The browser needs WebGL2. The build reuses the approved atlas embedded in the accepted project-root page.

```sh
npm run check
npm run verify
```

Verification uses Playwright Chromium. Install it with `npx playwright install chromium`, or set `BROWSER_EXECUTABLE` to your local Chromium executable.

## Stochastic anatomy

The page chooses a fresh cryptographic seed once on opening or New Seed. Immutable hashed identities then fix each visitor's anatomy throughout its journey. Use `?seed=1847` for reproducible inspection.

Three drawing grammars combine twelve anatomical archetypes: long-necked deer, compact coiled cats, branch-horn drakes, foxes, ribbon-wing spirits, rounded petal moths, serrated moths, needle-wing swifts, fan-tailed phoenixes and other forms. Eight contrasting palettes include mineral green, acid yellow, cobalt, violet, copper and dark pearl. Body length, bulk, muzzle, ears, limbs, horns, tail, feathers and wings vary over broad ranges. Independently chosen spines, mantle plates, feather appendages and filament tails create hybrids. Entrance posture can crawl, dart or hop. The grammar order varies within a twelve-visit roster.

Palette block rotations are stochastic, and adjacent visitors never use the same palette. Optional `python3 contact-sheet.py` (with Pillow installed) assembles the twelve anatomy captures into `captures/anatomy-grid.jpg`.

This generates indefinitely many parameter combinations within a designed anatomical vocabulary; it does not invent arbitrary new drawing grammars. No visitor comes from an image library.

## Files

| File | Purpose |
| --- | --- |
| `theatre.js` | Anatomy, shaders, fur, feathers, original sprite plane and absolute-time choreography. |
| `template.html.in` | Black stage, captions and controls. |
| `build.mjs` | Bundles code and the exact atlas from the accepted page. |
| `index.html` | Endless offline deliverable. |
| `preview.mjs` | Local preview bound to loopback. |
| `verify.mjs` | Offline, identity, controls, pixel, resource and viewport checks. |
| `captures/` | Desktop, phone-size, gait-seam and twelve-archetype review captures. |
| `verification.json` | Measured verification results. |

One WebGL canvas renders the central walker and procedural visitors. The woman cycles the original frames 0–32 at 24 fps. A ten-hour direct seek constructs only the current visitor. Replaced geometry/materials are disposed. Hidden tabs pause progression, and background-return deltas are capped.

## Verification and limits

The recorded checks cover offline loading without external requests, all 33 original walk frames and identical atlas data, 300 distinct identities, twelve anatomical archetypes, eight palettes, equal pixels after reverse seeks, controls, bounded resources across 48 visits and a ten-hour seek, and four viewport sizes. The original 32-to-0 pose discontinuity remains visible; it was not repaired by substituting frames. Physical-phone performance and file opening are untested. The accepted forest page remains unchanged.

## Primary graphics references

- [Motion Doctrine](https://github.com/heygen-com/hyperframes/blob/main/.agents/skills/motion-doctrine/SKILL.md): causal actions instead of idle wobble.
- [Three.js adapter](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-animation/adapters/three.md): code-built geometry and absolute-time poses.
- [Determinism rules](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes-core/references/determinism-rules.md): immutable seeded details and local assets.
