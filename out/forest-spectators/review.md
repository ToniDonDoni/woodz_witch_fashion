# Forest spectators review

Scope: integrate all eight reviewed neon chalk studies behind the centered walker as a continuously moving audience. This review covers the new integration and preserves the approved sprite selection.

Verdict: approved for the spectator integration. Final source, rebuilt HTML, verification, and refreshed desktop/phone captures show no remaining scoped blocker.

## Corrections

- **Deterministic cached art corrected:** cached drawings now use the canonical time `boil / 12` and the corresponding gaze. Cache keys include viewport dimensions, preventing stale gaze after resizing. Smooth world translation continues to use live time.
- **Entry padding corrected:** the margin is now 255 units, covering the maximum positive placement plus full half-canvas bounds. Objects are generated before their visible geometry enters.

## Visual findings

- The desktop, portrait-phone, small-phone, and landscape captures show recognizable neon hares, wolves, spirits, mushrooms, deer, and owls within the established forest. The figure remains central and is rendered after the spectators, so its body consistently occludes them. The runway and controls stay legible.
- No new canvas clipping or mobile layout defect was found in the reviewed captures. The longer caption fits the 320-by-568 layout.
- Old background leshies have been replaced with ferns. Refreshed portrait and desktop captures confirm that the extra face no longer appears inside the neon hare, improving silhouette clarity. The foreground forest details remain.
- The frame 32-to-0 captures retain the known source-loop discontinuity; no new doubled figure appears. This is not a new integration defect or a request to replace the selected gait.

## Source and verification evidence

- The eight designs cycle through stable world indices. Each keeps its study, palette, size, anatomy, and object seed until exit. World translation uses continuous time, while the art cache refreshes at 12 Hz.
- Spectator canvases are retained only for the current used set and are pruned every draw. Forest and spectator caches remain separate. The source contains no history list that grows with elapsed time.
- Eye pupils shift according to the horizontal direction from the spectator toward the walker, with a small upward bias and blinking. This is source-confirmed; the pupil motion is subtle at phone size. The eye-free lantern mushroom retains its approved design.
- All drawing code, styles, and the 33-sprite atlas are embedded in one HTML. Static inspection found no external URL literals or unresolved placeholders and confirmed that the built page contains the reviewed spectator source.
- The current offline report records Chrome 154.0.8037.98, no runtime errors or HTTP(S) requests, about 8.00 seconds of advance over eight seconds, and 53–60 active objects through sampled times from 0 to 120 seconds. All eight studies appear during the test. The corrected history test resets time and visits 7.09 then 7.125 within the same boil phase; its target screenshot matches the direct render. Checks cover stable IDs/seeds/sizes, rightward travel, cache counts, retirement, controls, four viewport sizes, and a bounded seek to 3600 seconds.

## Limits

The two-minute and one-hour checks use seeks rather than continuous playback. No physical phone, mobile browser, or sustained device frame-rate test was performed. The known gait seam remains outside approval of this integration.

Reviewed project guidance, the existing runway specification, this attempt's source/build/verifier, output HTML, report, desktop and phone captures, and seam captures. Only this review document was changed.
