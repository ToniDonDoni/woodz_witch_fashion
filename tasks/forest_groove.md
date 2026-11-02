# Forest groove integration

## Goal
Port VibeCat's endless synthesized instrumental hip-hop into the original
forest walking scene. Keep the haunted-house audio independent.

## Acceptance criteria
- The forest shows START GROOVE and a volume slider at the lower left.
- Play and pause work after a user gesture without a network request.
- The music defaults to 88 BPM at 1.0x walking pace.
- PACE changes both walking speed and music tempo proportionally.
- A temporary TEMPO slider under the groove lets us calibrate BPM independently.
- Numeric readouts display PACE (e.g. 1.2x) and actual TEMPO (e.g. 106 BPM).
- After START GROOVE, only the runway PAUSE/PLAY stops and resumes music.
- Play never starts music before START GROOVE has been pressed.
- Volume changes take effect while music plays and are saved locally.
- Entering the house stops the groove and hides its controls.
- Leaving the house does not automatically start the groove.
- House-specific horror audio, walking pace, forest effects and artwork stay intact.
- The single-file offline HTML snapshots and CI checks include the new groove.

## Implementation
- Port the VibeCat synthesizer into src/forest_groove_core.js.
- Bind forest-only playback, audio scheduling, pace-linked BPM calibration, and volume in src/forest_groove.js.
- Embed both files with scripts/build_forest_page.py.
- Check browser behavior and scene switching in tests/verify_groove.cjs.
