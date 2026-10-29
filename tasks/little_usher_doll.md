# The Little Usher nursery integration

The user selected The Little Usher marionette from the three nursery doll studies. Promote only that character into PR #32.

## Scope

- Keep the selected drawing in `src/little_usher_doll.js` and inline it through the existing builder.
- Replace the schematic nursery doll with carved wood, inset eyes, a hinged jaw, dark coat, jointed arms/legs and five taut strings attached to moving points.
- Place the doll on the toy chest beside the cot; adjust the chest horizontally for visibility beside the walker.
- Use the existing nursery encounter age: wait for the false alarm, perform one gesture, then settle. Preserve reveal/audio timing and the existing nursery spirit.
- Preserve Undertow, The Ink Thief, forest scenery, walk sprites and controls.

## Verification

- Desktop and emulated phone captures show the complete character and readable face, with correct chest contact and attached strings.
- Draws are deterministic, animate with age, preserve Canvas state and paint nothing at zero scale; five string endpoints and articulated joints remain finite.
- Existing house, forest and effect checks pass. Compare unchanged forest pixels with the previous build and inspect the walk seam.
- Rebuild both self-contained snapshots; no new runtime assets, requests or libraries.
- Physical-phone rendering performance and audio loudness remain unverified.
