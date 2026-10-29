# Winchester Haunted House - Experience Specification

Status: proposed task / declarative experience brief. No implementation is included in this change.

## Vision

Transform the endless illustrated forest runway into an endless haunted-house journey inspired by the Winchester Mystery House. The existing woman continues walking in the foreground, but her world is now an eerie, sprawling, architecturally impossible mansion. Rooms, corridors, staircases, doors and paranormal encounters unfold around her without a visible end. The result should retain the project's original hand-drawn, animated visual language while building genuine suspense and delivering occasional surprising scares.

This is a horror-themed branch of the existing experience, not a separate game, a literal architectural reconstruction, or a prerecorded animation.

## Experience requirements

1. **Keep the walking protagonist.** Retain the existing 33 approved transparent walk frames, the repeating gait and the approximately anchored on-screen position of the woman. The house moves around her in the established endless-walk presentation. She remains recognizable and is never permanently concealed by scenery.
2. **Replace the forest with a haunted mansion.** The visible world is a recognizable Winchester-inspired house with interconnected hallways, grand but decaying rooms, doors, windows, portraits, banisters and staircases, including stairs that lead nowhere and doors in impossible places. Vary scale and composition so the environment feels large and mysterious, rather than like one repeated corridor.
3. **Generate the house indefinitely.** New rooms and architectural segments continually appear as the walk progresses. Objects and room details preserve their identity while in view, with coherent entrances, exits, depth and parallax. The world must not visibly reset, expose empty gaps, abruptly teleport, or grow memory usage without bound.
4. **Preserve the established illustration style.** Paint the haunted house and its phenomena at runtime using the same expressive Canvas-based visual family as the existing scene: textured ink or brush contours, subtle approximately 12 Hz line boil, layered depth, selective glow and atmospheric motion. Keep smooth travel separate from line boil and the sprite cycle. Aim for an unsettling illustrated house, not generic flat geometric boxes or a new photorealistic 3D aesthetic.
5. **Create a living, hostile-feeling environment.** Doors slowly creak open, abruptly slam, or reveal darkness; lights flicker; portraits subtly change or watch the walker; shadows move independently; curtains stir in still air; and distant silhouettes appear and disappear. The house should remain visibly alive even between major scares.
6. **Include ghosts and unexpected horror events.** Ghostly figures, fleeting apparitions and uncanny movements emerge in varied positions and depth layers. Some encounters are subtle and easy to miss; rarer events are deliberately sudden and frightening. The experience should alternate uneasy quiet with meaningful surprises rather than repeat a predictable jump scare on every loop. The exact artwork and event choreography remain creative decisions.
7. **Use procedural but coherent event variety.** Different world seeds produce different layouts, atmosphere and encounter timing. Individual rooms and events remain stable for the duration of their appearance; their timing and motion derive from world seed and simulation time rather than frame-by-frame randomness. Repeated encounters should not create obvious mechanical patterns.
8. **Add a horror soundscape.** The intended experience includes ambient room tone and distinct cues such as floorboard creaks, doors opening or slamming, footsteps or knocks, whispers, distant movement and occasional scare accents. Sounds should align with visible events where appropriate, and quiet intervals are an intentional part of the mood. Audio must work without network requests and must require an explicit user action to enable; provide a simple, accessible mute/unmute control. The visual experience remains complete and usable while muted. Avoid excessive volume spikes.
9. **Remove forest configuration from the horror experience.** All existing forest, animals, master and optional-effect checkboxes (the current 13-switch panel) are hidden from the UI on this branch. Existing woodland scenery, creatures, staged forest acts and forest-specific visual effects are not visible or active merely because their controls have been hidden. Any visual technique reused for the haunted house must serve the new theme rather than reproduce forest scenery.
10. **Keep the core interaction simple.** Preserve meaningful play/pause, walking-pace and re-seed/new-world behavior. Forest-themed labels, descriptions, act titles and accessibility copy are replaced with haunted-house language. Re-seeding changes the generated mansion and hauntings without changing the approved walk frames.
11. **Maintain the standalone browser experience.** Deliver through the existing repository's single-page build and source structure, with bundled sprites, artwork code and audio dependencies; no runtime network fetches or external game engine. The experience must remain usable in a phone browser and offline.

## Atmosphere and art direction

The guiding reference is the *Winchester Mystery House*: a mansion of impossible circulation, dead ends, misleading doors and a sense that the architecture is hiding something. It should feel handmade, layered and imaginative rather than attempt a one-to-one model of the real building.

The artistic direction favors deep shadows, cold moonlight, warm isolated lamps, aged wood, wallpaper, stained glass, dust, fog and unstable reflections. These are mood references, not a fixed asset list or a mandate to display every effect simultaneously. Foreground railings, doorframes or shadows may briefly occlude the walker to establish depth, but must not obscure her continuously.

Suspense matters as much as spectacle. Silence, empty doorways and small impossible details should prepare the viewer for rare, surprising interruptions. Avoid reliance on rapid full-screen flashes or harsh strobing.

## Scope boundaries

- This task records the desired product behavior and visual outcome only. It does not prescribe file-level implementation, a drawing algorithm, an audio synthesis method or exact encounter probabilities.
- The current forest experience remains intact on `main`; the haunted-house transformation belongs to this dedicated branch.
- Do not replace the selected walking assets or introduce a parallel prerecorded-video version of the environment.
- Do not retain the forest/effect checkbox panel as a visible control surface in the haunted-house branch.
- A new configurable horror-effects panel, combat, navigation puzzles and game progression are **not** part of this initial brief.

## Acceptance criteria for a future implementation

1. **Visible transformation:** On load, the woman is walking through a clearly recognizable illustrated haunted mansion. No forest foliage, woodland animals, forest act cards or 13-checkbox effects panel is visible.
2. **Continuous world:** Over at least two minutes, several distinct architectural spaces transition smoothly without empty gaps or visible world resets. Doors, furnishings and other tracked objects retain their shapes and identities until they leave view.
3. **Paranormal encounters:** During a two-minute inspection of a representative seed, viewers encounter multiple distinct haunting behaviors, including a moving/opening door and a ghostly apparition, with at least one intentionally surprising event. Other seeds change their arrangement and timing rather than replay the same sequence unaltered.
4. **Sound behavior:** The scene initially works in silence. Explicitly enabling sound produces atmospheric audio and event-related cues; muting stops them. Pause stops simulated motion and currently playing scene audio. No audible output begins without the user's action, and no network is needed.
5. **Visual consistency:** The scene retains smooth scenery travel, layered occlusion and the established hand-drawn contour animation while the existing woman remains legible. It should look like the same illustrated project, transformed into horror.
6. **Controls and restart:** Play/pause, pace and new-world actions still work. A new seed changes both the mansion layout and the haunting programme. No stale forest UI or hidden active forest effects leak into the horror scene.
7. **Build and verification:** The existing standalone build succeeds; animation works offline on desktop and a real phone; no browser errors or unbounded visible-object/cache growth occur. Add or adapt automated checks for the new world and controls when implementation begins. Do not claim phone or sound acceptance from desktop-only tests.

## Open creative decisions

Exact house silhouettes, room grammar, scare frequency and severity, audio assets versus procedural audio, naming of the re-seed action, and any optional safety/accessibility settings are left for implementation and visual review. These choices must not weaken the requirements above.
