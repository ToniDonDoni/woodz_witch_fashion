# Forest groove integration

## Goal
Port VibeCat's endless synthesized instrumental hip-hop into the original
forest walking scene. Keep the haunted-house audio independent.

## Acceptance criteria
- The forest shows START GROOVE and volume centered below PACE, with PLAY to the left of PACE.
- Play and pause work after a user gesture without a network request.
- The music defaults to 87.27 BPM at 1.0x walking pace (two steps per 33 frames at 24 fps).
- PACE changes both walking speed and music tempo proportionally.
- The calibrated BPM is hardcoded and PACE is the only tempo control; no numeric readouts remain.
- Changing PACE during playback promptly restores audible music without using PAUSE / PLAY.
- The first click/tap anywhere in the forest enables groove (browser user-gesture requirement).
- Subsequent unrelated clicks do not affect music; the groove button toggles it on and off.
- The original runway PAUSE/PLAY pauses and resumes currently enabled groove with walking.
- No music starts before a user gesture; house navigation never auto-starts forest audio.
- Volume changes take effect while music plays and are saved locally.
- Entering the house stops the groove and hides its controls.
- Leaving the house does not automatically start the groove.
- House-specific horror audio, walking pace, forest effects and artwork stay intact.
- The single-file offline HTML snapshots and CI checks include the new groove.

## Implementation
- Port the VibeCat synthesizer into src/forest_groove_core.js.
- Bind forest-only playback, audio scheduling, pace-linked BPM, timely audio rescheduling, and volume in src/forest_groove.js.
- Embed both files with scripts/build_forest_page.py.
- Check browser behavior and scene switching in tests/verify_groove.cjs.
