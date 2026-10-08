# Living acts — runway study 03

The runway keeps the approved 33-frame walk, the night sky, the moon and the existing woodland, and now stages the forest as a sequence of seeded acts. Every act announces itself with a title card, changes the weather of the whole woodland, and sends one signature set piece across the stage. Rare unannounced cameos interrupt the programme.

## What the acts add

- **Act director.** Act length (30–62 s, and different for every act), act order, weather, and the set piece derive from the world seed. The next act never repeats any of the previous three themes, a piece that is still crossing when its act ends keeps travelling until it leaves the stage, and `NEW DREAM` reshuffles the whole programme, the woodland layout and the colour mood.
- **Signature set pieces.** A constellation-antlered stag, a lantern procession, a moth wake, a fairy ring rising from the path, a leshy choir on a fallen log, a wisp fountain, a moonflower in the foreground.
- **Unannounced cameos.** A star fall in the sky (about 45% of acts) and an owl sweeping overhead (about 22%).
- **Weather per act.** Spores, dust motes, embers, drifting petals, and low fog ribbons, all with a second pass in front of the walker.
- **Dream colour mood.** One flat blend pass re-hues the drawn world per seed; the walker is composited afterwards, so her own colours stay true. The foreground row and the front-layer bloom, which are drawn after that pass, take the same tint inside their own palettes so the whole frame shares one mood.
- **Foreground row.** A new, faster, sparser layer of dark blades and fronds is drawn *after* the walker, so foreground vegetation genuinely passes in front of her sneakers (issue #7).
- **Seeded woodland layout.** Each block of four ground objects still contains all four categories, but the order inside the block now comes from the seed, so `NEW DREAM` changes the woodland instead of redrawing it (issue #8).

## Reproduce

Run `python out/runway-acts/build.py` with Pillow available. Sources are `template.html`, `forest.js` and `acts.js`; the generated deliverable is `out/runway-acts/index.html`.

Run `node out/runway-acts/verify.cjs` with Playwright and Chromium. `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE` optionally select local installations. The verifier writes `verification.json`, per-event captures, viewport captures, the act card, the foreground on/off pair and 48 motion frames beside this source.

## Review controls

The page exposes `window.runway` for deterministic review: `seek(seconds)`, `play()`, `state()`, `act()`, `plan(index)`, `programme(count)`, and `setForeground(false)` which removes the foreground row so its occlusion of the walker can be measured. `programme(count)` returns the act tiles with their lengths and cumulative starts. None of them load assets or alter the selected walk cycle.
