# The Ashen Nave integration

The user selected The Ashen Nave from the dark interior studies. Apply its soot-black Gothic architecture, neutral grey material, cold window light, torn curtains and abandoned domestic furnishings to all seven Hungry House rooms in PR #32.

## Scope

- Own the architecture in `src/ashen_nave.js`, inlined by the existing builder. Keep one active house implementation.
- Adapt the selected visual language to the existing horizontal cutaway and persistent scrolling room IDs. Do not replace traversal with a stationary perspective hallway or an eight-second study loop.
- Redraw the room shells, lancet windows, ribs, lighting, doors and furniture. Preserve recognizable foyer, wardrobe, dining, mirror, nursery, ink-wall and stomach scenes.
- Make the final throat a grey-black living architectural void with moving ribs and teeth, consistent with the selected interior. Preserve the living-house story.
- Preserve Undertow, Ink Thief and Little Usher drawings, the approved walk sprites and cadence, encounter positions, timing, foreground layer order, audio profiles and controls.
- Keep colour restrained to dark blue illumination and the already approved creature drawings. Do not add the rejected colourful material palettes or a new fog effect.
- Keep forest rendering and the default forest mode unchanged. Limit UI styling changes to house-active rules.

## Verification

- Inspect all seven rooms on desktop and representative portrait/landscape viewports, including the hand emerging under the table, doll chest contact and the final mouth.
- Verify deterministic drawing, finite geometry, Canvas state isolation and visible architectural motion with unit browser checks. Check stable room identities and bounded traversal with the existing house suite.
- Run existing forest, effect and house suites. Compare forest pixels and walking-frame identity with the previous build. Inspect the original frame-32-to-0 seam.
- Rebuild both committed standalone snapshots and the versioned local preview; no runtime network requests or new assets.
- Check changed files for credentials and machine-specific paths before committing. Keep local captures under ignored `dist/` and user-facing previews in the chat outputs folder.
- Physical-phone performance and audio loudness remain unverified by desktop emulation.

## Verified result

- `verify_house.cjs`, `verify_forest.cjs` and `verify_effects.cjs` passed offline.
- The house suite captured all seven rooms at 1440x900, 390x844 and 844x390. Architecture pixels move deterministically, preserve inherited Canvas state and respect zero alpha.
- The unchanged forest matched the previous build pixel-for-pixel at four sampled times, including the walk seam. Original walking assets, approved creature drawing and audio source were preserved.
- The local headless house draw check measured a 13.7 ms p95 over 120 samples; this is not a physical-phone performance claim.
- Both committed standalone snapshots were rebuilt identically. No runtime asset or network dependency was added.
