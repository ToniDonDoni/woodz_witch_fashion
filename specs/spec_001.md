# Specification: The Hungry House

## 1. Problem and current state

Woodz Witch Fashion is an endless, procedural, side-scrolling runway. The approved 33 transparent walk frames keep a woman near the center while scenery translates left to right. The existing forest includes animation and ten optional Canvas effects, but it does not contain a haunted house, a coherent horror story, jump-scare staging, or scare audio. Earlier perspective hallway concepts do not match this composition.

## 2. Required state

Add a selectable **Haunted House** world while preserving the original forest and the existing walk sprites. The story is **The Hungry House**: the building is a living creature that stalks and digests its visitors. Its rooms are organs, its walls breathe, its mirrors hold stolen souls, and the final hall reveals ribs and a toothed throat. As the infinite walk continues, the story progresses through atmospheric clues, false alarms, escalating threats, and a climactic stomach reveal, then loops with stable seeded variation.

The scenery is a 2D cutaway moving **left to right** behind the screen-anchored walker. Reuse or adapt exactly these three requested effect families, not Rolling Fog or Stained Glass: **Living Ink** for animated cracks, dripping walls and shadow limbs; **Liquid Spirits** for morphing ectoplasm and mirror ghosts; **Moonlit Caustics** for unnaturally shifting light, silhouettes and reflections.

Scenes: foyer (the house watches), wardrobe (door creaks, the selected blue Undertow apparition bursts out), dining room (eyes and the selected Ink Thief hand beneath the table), mirror room (the woman's reflection is replaced by a liquid ghost), nursery (a false alarm followed by the selected Little Usher marionette and a spirit reveal), inked wall (fingers and faces emerge), stomach chamber (living ribs, pulsing wall, enormous mouth). An occasional reaching hand may startle without replacing the main story.

Sudden reveals use original, **procedurally synthesized cinematic horror sound**, not a single arcade-style pitch sweep. A scare has (1) an understated warning/creak around 1.8 seconds before the reveal, (2) a brief near-silent gap, (3) a frame-aligned layered attack with material-specific noise, dissonant tonal clusters and a low impact, (4) a shaped decay and short room echo. The seven room types must have distinct sonic identities: settling wood, wardrobe slam/hinges, dining clatter, mirror/glass and spectral tone, twisted music box, wet ink/plaster tearing, and deep organic house rumble. Variation is determined by stable world identity, not uncontrolled random replay.

Sound requires an explicit user gesture, with a visible mute/unmute control. No external sound file, library or network request. Avoid intolerable volume: filter harsh bands, shape envelopes, use a compressor, soft-clipping stage, a conservative final gain and instant silence when muting, pausing or leaving the house. Verify actual peak level and perceived volume on a physical phone before acceptance.

## 3. Acceptance criteria

- [ ] The house is selectable with an obvious control; the forest still renders when selected back.
- [ ] The original 33 sprite frames and 24-fps walk sequence are unchanged; woman remains centered, at a stable floor line, on phone and desktop.
- [ ] Rooms have stable IDs and move left to right continuously; no perspective hallway, teleport, blank reset, or object identity changes during a pass.
- [ ] At least seven recognizable room designs are present, with deterministic decor variation across a repeating endless sequence.
- [ ] A deterministic scare sequence includes anticipation, at least one false alarm, a sudden reveal and a recovery window; wardrobe, dining, mirror, nursery, wall and stomach each have distinct readable events.
- [ ] The stomach reveal makes the house's true nature legible through rib-like architecture, pulsing surfaces and teeth.
- [ ] Living Ink visibly animates wall cracks/shadows, Liquid Spirits visibly morphs a ghost, and Moonlit Caustics animates moonlit highlights in the house. The selected Undertow drawing supplies the translucent blue body, flowing highlights and fading tails for house apparitions.
- [ ] At each major reveal, a scary audio sting is requested exactly once during continuous forward playback; pausing, repainting or seeking cannot retrigger it.
- [ ] The audio is synthesized offline using Web Audio, starts only after a user gesture, can be muted immediately and fails gracefully when audio is unavailable.
- [ ] A deterministic warning cue (quiet detuned drones/creak) starts before the room reveal; its envelope decays to a quiet gap before impact.
- [ ] At the visual reveal, an impact combines a quick transient, room-specific pitched texture, bass/body and a controlled echo; the seven room profiles have recognizably different spectra and envelopes.
- [ ] The master audio graph includes dynamic range compression, soft clipping and conservative output gain; no unbounded feedback or persistent oscillators.
- [ ] Muting, leaving the house, and pausing immediately stop active audio; re-enabling does not release a backlog of earlier scares.
- [ ] Browser checks verify distinct room sound profiles, exactly-once warning/impact triggers, silence on seek/pause/mute and absence of runtime/network errors.
- [ ] All house controls work by touch on a phone without a keyboard or hover; ENTER HOUSE, LEAVE HOUSE, SOUND ON/OFF, and PLAY/PAUSE have touch targets at least 44 CSS pixels tall.
- [ ] At 320x568, 390x844, 430x932, and 844x390, house buttons stay inside the viewport; the house UI does not cover the central walker's head on common portrait phone sizes.
- [ ] Forest-only effect checkboxes are hidden in house mode, so a phone screen is not crowded with irrelevant options.
- [ ] With the same seed, simulation time and viewport, the scene is visually deterministic; repeating elements do not accumulate.
- [ ] The built page remains a single offline-capable HTML with no network requests or runtime dependencies.
- [ ] A browser test verifies toggling, movement, story diversity, deterministic rendering, pause/seek-safe audio, and a phone-sized viewport.
- [ ] Physical-device playback, readable contrast and comfortable jump-scare loudness are reviewed before calling mobile experience accepted.

## 4. Analysis

Canvas 2D, already used by the project, can deliver the requested effects without Three.js. Derive each room's screen position from its stable world index and simulated time. Use relative position to the centered walker to orchestrate anticipation and reveal independently of frames per second. Draw room architecture, furniture and ink/light behind the walker; allow a controlled foreground hand/shadow pass where needed. Keep the 12-Hz ink line boil independent from the 24-fps walk cycle and continuous scrolling.

A browser cannot reliably autoplay audible sound. Instantiate/resume AudioContext from the user's click and synthesize short, event-based layers with OscillatorNode, AudioBufferSourceNode, BiquadFilterNode, GainNode, DynamicsCompressorNode, WaveShaperNode and a short nonfeedback echo. Transition sound from distant, detuned creaks to a short silence, then a distinct broadband attack, pitched cluster and low-frequency body. On phone speakers the 90-250 Hz partials and midrange transient should remain audible even when deep sub-bass is not reproduced. Use a separate profile per room. Bound each scheduled sound and clear all live sources immediately on mute/pause/exit.

Research references:
- Native Instruments, *How to make 5 scary sound effects for scoring horror films*: https://www.native-instruments.com/blogs/blog/scary-sound-effects
- A Sound Effect, *Learn from the Horror Sound Masters*: https://www.asoundeffect.com/scary-halloween-sounds/
- MDN, *Web Audio API*: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Sbravatti, *Acoustic Startles in Horror Films* (2019): https://doi.org/10.3167/proj.2019.130104

Test replay controls without sound side effects. Prefer a restrained scare cadence rather than every room firing immediately. Avoid unbounded offscreen canvases, particle lists, or persistent audio oscillators. A graphical button must expose the sound state and not claim sound is enabled if initialization fails.

The original woodland regression baseline is important. Make the new house an opt-in alternate world, not a silent rewrite of the forest, and preserve the existing output builder's self-contained contract.

## 5. Proposed solution

Create `src/haunted_house.js` with deterministic seven-room drawing, living-ink and ectoplasm shapes, moonlight caustics, a progression-based scare state machine, bounded ambient motion, a drawn foreground, and Web Audio reveal stingers. Inline it into the existing HTML builder. Add an **ENTER HOUSE / LEAVE HOUSE** world toggle and **SOUND ON / SOUND OFF** button. Add a house-specific debug state and browser checks without changing the forest's original checkboxes.

Visual story beats: introduction in the foyer -> wardrobe assault -> dining-table hand -> stolen reflection -> nursery fake-out -> hands through inked wall -> anatomical reveal. Rooms can return with seeded changes, so the house remains infinite.

## 6. ToDo

- [x] Record The Hungry House story, requested effects and measurable acceptance criteria.
- [x] Implement procedural horizontal house architecture, seven room types, scripted surprises and layer ordering.
- [x] Implement user-gesture-gated synthesized jump-scare audio and mute control.
- [x] Research cinematic horror sound layering and replace generic stinger with room-specific procedural warning, impact and echo architecture.
- [ ] Confirm updated sound tests pass in CI and inspect rendered audio on a physical phone.
- [x] Wire the house into the self-contained builder without changing forest baseline behavior.
- [x] Add browser-level regression and scene-specific tests.
- [ ] Run CI and visually inspect phone/desktop captures, revising as needed.
- [ ] Review on a physical phone, including audio loudness and performance.
