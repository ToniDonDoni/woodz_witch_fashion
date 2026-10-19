# Forest Casting / GPT — cast variety revision

The first study varied details on eight mostly fixed silhouettes and only prevented adjacent repeats. That allowed a recognizably identical owl to return too soon. This revision adds eight distinct body plans and a stronger spacing rule, and replaces the owl with four deliberately different drawings.

[Open the updated preview](https://tonidondoni.github.io/woodz-witch-fashion-preview/strange-passing-gpt/).

## Visible changes

The cast has sixteen families: leshy buyer, owl buyer, moon deer, door snail, umbrella fish, mushroom jellyfish, leaf gust, ribbon creature, boar tailor, hare porter, walking mirror, heron, badger buyer, offering root hand, stump accordionist and lantern fox. The added guests perform their own gestures instead of sharing one flying silhouette.

Four owl body plans change the face, body proportions, furniture and accessories: a tall heart-faced barn owl on a round stool, a squat spectacled owl on a suitcase opening a canopy, a long-eared owl spreading its cape on a perch, and a collared snow owl with an asymmetric hat. Forms rotate on each return. Selected buyer gestures include a fan, camera and measuring scarf. Leshy returns cycle through a root elder, birch-mask critic, moss hood and original tracksuit buyer. The other existing flying families gain botanical crowns, long trailing scarves or broad wings in their form cycle. The eight added families retain their own authored body plan, with family-specific detail and accessory variation.

The director shuffles within four-position bands in a seeded sixteen-family order. No family returns until at least twelve other guests have appeared: the minimum index gap is 13, or 5 minutes 12 seconds at default pace. This holds across block boundaries and arbitrary seeks without an ever-growing history cache. Each block still includes all sixteen families. It is a larger procedural vocabulary with explicit spacing, not unlimited newly authored species. Reload and New Dream start a new programme; the spacing guarantee applies inside a programme.

## Reproduce

```sh
python out/forest-casting-variety-gpt/build.py
node out/forest-casting-variety-gpt/verify.cjs
node out/forest-casting-variety-gpt/live-check.cjs
python out/forest-casting-variety-gpt/contact-sheet.py
```

Use Pillow 12.3.0, Node 22 and Playwright 1.62.1 with Chromium. Optional environment variables `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` select an existing installation. The builder produces `site/strange-passing-gpt/index.html`, preserving the existing public suffix. The original attempt remains in `out/strange-passing-gpt/` for comparison. No original sprite, accepted root HTML or shared forest drawing source is modified.

## Evidence and limits

`verification.json` records eight seeds × 1000 planned encounters, all sixteen rendered families, four viewport sizes, exact pixel replay after a ten-hour seek, bounded caches, controls and offline loading. Review captures include every family in portrait and all four owl forms. `live-verification.json` records uninterrupted offline playback. `review.md` records visual findings. Full-resolution PNGs are reproducible and ignored; compact review sheets are retained.

The original 32-to-0 sprite pose discontinuity remains. Physical-phone opening, thermal performance and sustained device FPS remain unverified. Linework changes at 12 Hz while the original sprite and smooth travel clocks stay independent.
