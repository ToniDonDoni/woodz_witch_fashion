# Forest enchantments

Base: `0e6cf29d4059e305a975a77fade10cb3f7a1ecb2`, specifically
`out/forest-spectators/index.html`.

Add three complementary procedural effects to the original illustrated forest:

1. Layered rolling mist behind the walker and around the audience's feet.
2. Small luminous spore swarms with curved trails, emitted when a mushroom
   passes the anchored walker. Keep emission deterministic across seek history.
3. Slowly unfolding, folded-paper fractal ferns in the rear scenery.

Keep the original 33 walk frames, cadence, forest, audience and travel direction.
Use a separate exploratory attempt at `out/forest-enchantments/`. Build one
self-contained HTML file with no runtime dependencies. Include independent
controls for the three effects and documented build/run commands.

## Verification

- Observe all three effects within the first 30 seconds.
- Preserve original drawing pixel-for-pixel when all effects are disabled.
- Check stable world identities, bounded caches, pause, reseed and seeking.
- Exercise two simulated minutes and four viewport sizes offline in Chromium.
- Inspect the rendered phone and desktop layouts and the 32-to-0 gait seam.
- Report physical-phone testing separately; desktop emulation is not acceptance
  on a physical device. Do not claim the pre-existing gait seam is fixed.

## Visual references

These are visual inspirations; the Canvas implementations are original
adaptations, not copied demo source or downloaded videos.

- Rolling fog: https://skillry.dev/ai-videos/opus-5-5/mondemsuraj-691517
- Glowing particles and ribbon strokes:
  https://skillry.dev/ai-videos/opus-5-5/ishuagra02-678129
- Paper/cardboard fractal styling:
  https://skillry.dev/ai-videos/opus-5-5/jrayon-054015
- Reference collection: https://github.com/yihui-dev/awesome-opus5-5-videos

## Follow-up: explicit controls and build identity

- Replace the top toggle pills with three native bottom checkboxes: Fog,
  Spore trails and Fractal ferns. Verify mouse and keyboard operation.
- Put the actual build HEAD and branch at upper left. Read the checked-out Git
  HEAD during the build; do not stamp a PR merge or query a remote branch at runtime.
- Prove each effect independently changes canvas pixels on a paused frame and
  unchecking it restores the pixels. Check control layout at all five sizes.
- Document how to serve this attempt directly at `/`, since the screenshot shows
  the separate older root "Into the woods" scene.
