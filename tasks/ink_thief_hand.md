# The Ink Thief hand integration

The user selected The Ink Thief from the three dining-room hand studies. Promote only that drawing into the existing Hungry House implementation in PR #32.

## Scope

- Keep the selected renderer in `src/ink_thief_hand.js` and inline it through the existing builder.
- Replace the shared angular hand with a connected ink-painted wrist/palm, four fingers and an opposed thumb, articulated joints, nails, dry-brush edges and fixed-count ink specks.
- Place the dining-room reach below the tablecloth and hide the root behind the near table leg. Use the same hand for the existing brief foreground and wall reaches.
- Preserve room traversal, scare/audio timing, Undertow, forest scenery, approved walk sprites and playback controls.
- Finger motion follows scene time and stable room identity. The room controls appearance and disappearance; do not introduce an independent repeating eight-second study clock.

## Verification

- Readable hand in desktop and emulated phone captures, with no detachment at the table leg.
- Five stable digits, finite geometry, time-dependent motion and identical renders at the same time.
- Drawing preserves inherited Canvas transform, clipping and alpha; zero-alpha draws do not paint.
- Existing offline house, forest and effects suites pass; unchanged forest pixels match the pre-change build.
- Rebuild both self-contained snapshots; inspect the original walk seam without replacing sprites.
- No physical-phone performance or loudness acceptance is implied by browser emulation.
