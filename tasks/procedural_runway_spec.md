# Procedural Forest Runway — Preview Specification

Status: high-level specification for the first interactive preview. This records the intended experience without locking its detailed visual design or implementation.

Current input: the transparent walking sprites in `forest_runway/walk_full/transparent/`. The existing `walk_animation/walk_infinite.html` demonstrates the sprite loop on a plain background; it is a technical starting point, not the forest preview described here.

## Vision

A woman walks as though she is on a fashion runway inside an enchanted, hand-drawn forest. The page plays indefinitely. She stays near the center of the frame while the forest moves from left to right, making the walk feel continuous. The result should feel like a living illustrated fashion show, with the woman as its focal point. A black backdrop is possible, but its use is an art-direction choice rather than a requirement.

## Experience requirements

1. **Use the existing walk sprites.** Play the cutouts extracted from the supplied footage as a repeating walk cycle. The currently selected review range is frames 0–32. The exact loop seam and cadence remain subject to visual review.
2. **Keep the walker anchored.** Her position stays approximately fixed on the screen while the drawn world passes behind and around her.
3. **Draw the magical forest at runtime.** The first preview must include recognizable forest spirits (leshies), stumps, and mushrooms, alongside trees and a path. Moss, flowers, forest animals including lions, and other details can enrich the scene; their exact selection and count are open. These elements are constructed by drawing code. The experience does not rely on a prerecorded background video or generated frame sequence.
4. **Make the world continuous.** Forest objects enter from the left, travel to the right, and remain the same recognizable objects until they have fully exited the screen. Their appearance and motion must not be randomized afresh on every frame. The scene keeps producing new world content for as long as the page runs.
5. **Use a magical hand-drawn visual language.** Pencil or brush contours should have a subtle animated "boiling line" quality, with new contour variations roughly 12 times per second. This is an artistic rhythm, not a requirement to move the whole scene or the walk sprites at 12 fps. Colors and accents should feel vivid and enchanted, while the woman remains easy to read against the forest.
6. **Support the runway idea.** The path reads as a catwalk. Forest creatures and mushrooms may behave like an audience, watching or reacting as she passes. The environment may contain small independent motions while its overall movement remains coherent.
7. **Deliver one self-contained preview page.** The interactive preview should open on a phone as one HTML file, with the existing sprite data and all drawing and animation code included. It must not require an asset directory, network fetches, or a video player to run.

## Motion model to explore

Objects have persistent identities and stable world positions. At time `t`, the scene computes their screen positions from the world's movement; different depth layers may use different speeds. Their individual animation and contour variation are computed from time and a stable per-object seed. This separates three rhythms: the woman's sprite cycle, smooth travel of the scenery, and the slower hand-drawn line boil.

Only visible objects and a small margin beyond the viewport need to remain active. An object leaves the scene after its full visible geometry has crossed the right edge. Given the same world seed, simulation time, and viewport size, rendering should yield the same scene regardless of the device's frame rate. Returning to the page after it has been in the background should resume without a multi-screen jump.

The exact path geometry, apparent walking speed, parallax strengths, object density, perspective, interactions, and loop-seam treatment are open design decisions. They should be chosen by viewing a running prototype, particularly on a phone.

## Acceptance criteria for the first preview

1. **Walking loop:** The woman remains near the center through at least five consecutive cycles. Every transition back to the first sprite must pass visual review without a noticeable discontinuity in position, scale, or pose, or a doubled figure. If the current 0–32 range cannot meet this criterion, document and apply a revised range or treatment. Documenting an unresolved seam does not satisfy acceptance.
2. **Visible magical forest:** Within the first 30 seconds, the viewer can recognize at least one leshy, one stump, and one mushroom. Each required category appears again during a two-minute run. The path is legible as a runway, the woman remains the focal point, and the required figures have intentional silhouettes rather than looking like interchangeable icons or random distortions.
3. **Persistent travel:** Track a mushroom and a leshy from their entry on the left until they have fully exited on the right. Each keeps its identity, details, and relative place in the scene while moving continuously. The forest never visibly resets, leaves a blank gap, or accumulates an ever-growing number of active objects during a two-minute run.
4. **Independent animation rhythms:** The scenery moves smoothly while small contour variations refresh at roughly 12 Hz. A tree, mushroom, or leshy may have secondary motion, but its base silhouette and part count remain stable until it exits. The woman's walking cadence is controlled separately from both effects.
5. **Phone and file check:** With the network disconnected, open or fully reload the delivered single HTML file on a target phone using the intended distribution method, then confirm that animation starts and runs. Confirm that every sprite and code dependency is embedded, no network request is needed, no runtime error appears, and the woman is not cropped by the phone viewport. Record the device, browser, and opening method used for the check.
6. **Visual review:** Inspect the running page at phone size and confirm that the woman is readable against the forest, the pencil/brush style and magical color feel are apparent, the runway remains visible, and repeated objects show noticeable variation. Measure runtime smoothness on the target phone and set a performance budget after the first prototype rather than guessing one here.

These criteria define what the preview must demonstrate. They do not prescribe the drawing library, exact colors, creature designs, camera geometry, or the technique used to improve the sprite seam.

## Research notes: code-drawn animation

- In the creator's [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase), Claude writes JavaScript that paints frames with p5.js and p5.brush. The accompanying [animation guide](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/main/ANIMATION_GUIDE.md) describes flat painted shapes, ink contours, a 12 Hz line boil, and deterministic frame rendering.
- Its [core code](https://github.com/JohnHeibel/ClaudeAnimationBase/blob/main/src/core.js) seeds contour variation by the boil frame and a stable element key. It also provides an `onTwos` timing helper that holds each drawing for two frames at 24 fps. The useful principle here is to vary a contour without changing an object's identity or position.
- [Rough.js](https://github.com/rough-stuff/rough) is an example of sketch-like Canvas/SVG primitives. [L-systems](https://natureofcode.com/fractals/) provide reusable rules for branching vegetation. [Poisson-disk sampling](https://github.com/kchapelier/poisson-disk-sampling) provides spaced, irregular placement for ground details. A [seeded character-parts example](https://github.com/juanlou1217/sketchlings) suggests how recurring creatures could vary while staying recognizable. These are references, not chosen dependencies.
- The ClaudeAnimationBase author notes that some p5.brush watercolor fills can take seconds per frame on integrated graphics. A phone prototype should therefore validate rendering cost before committing to that brush engine; a lighter Canvas 2D implementation may better fit live, infinite playback in one file.

### How these findings could fit the preview

- A time-based scene renderer can calculate the woman's current sprite, each forest object's current screen position, and its small reactions without building a finite video. Persistent object IDs and seeded world generation keep objects recognizable while they cross the stage.
- Plant grammars can supply varied branches and foliage; spaced sampling can place moss, flowers, stones, and stumps. Recognizable leshies and mushroom spectators need deliberately designed silhouettes and parameterized parts rather than unrestricted random geometry.
- The 12 Hz contour boil can change small stroke offsets while the forest's translation stays smooth. Keeping those rhythms independent should preserve the handmade look without making the entire scene judder.
- A lightweight drawing vocabulary embedded directly in the HTML is a plausible starting point for the phone preview. The final choice should follow visual and performance checks, rather than be fixed by this document.

## Decisions deliberately left open

The exact designs of the forest creatures, palette, black-backdrop treatment, drawing library, camera perspective, sound, controls, speed, and method for improving the sprite loop seam are not fixed by this brief. The first preview should demonstrate the required experience before these details are finalized.
