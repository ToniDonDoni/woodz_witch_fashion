# Undertow apparition integration

The user selected the middle blue Undertow design from three standalone ghost studies. Replace the opaque wardrobe creature in Hungry House PR #32 and use the selected drawing consistently for the mirror and stomach apparitions.

## Scope

Keep the shared procedural renderer in `src/haunted_house.js`. Preserve the selected design's transparency, hollow face, flowing highlights and curling tails. Adapt its scale to existing room coordinates. Preserve reveal timing, lunge, sound, the forest, and all approved walking sprites. Rebuild both self-contained snapshots.

## Acceptance and verification

- The wardrobe shows the selected blue ghost rather than opaque ellipses and rigid limbs.
- Mirror and stomach apparitions share that renderer at their existing scales.
- Time and room identity determine all motion; repeated draws at the same time match.
- Ghost pixels remain translucent; no fully opaque body or new runtime dependency.
- Existing offline house and forest/effect checks pass, with explicit desktop and phone visual inspection.
- Compare the unchanged forest against the pre-change build and inspect the walking seam.
- Physical-phone performance and audio remain outside this local browser verification.
