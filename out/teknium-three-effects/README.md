# Three procedural effect studies

Isolated experiment inspired by the **categories** at https://webdev.teknium.io/ (noise, liquid, pixelation, glass/smoke). The site could not be inspected reliably from the authoring environment, so **these are original implementations**, not copied library components or claims about the site's specific algorithms.

- **Liquid noise** — animated 4-octave noise/domain-warped glowing contour ribbons.
- **Pixel dissolve** — seed-driven pixelated silhouette, materialization and scattering.
- **Smoke / glass** — additive translucent particles and thin glass-like contour lines.

All three effects are procedural Canvas 2D, with a seeded four-topology creature mask and continuous parameters. The original 33-frame woman walks on an empty black stage, with only one effect event active in each seven-second slot. Buttons choose one effect, rotate through all three, pause, skip, and reseed. The standalone HTML is offline, without runtime requests.

Build: `python -m pip install pillow && python out/teknium-three-effects/build.py`. Open `site/teknium-three-effects/index.html` in a browser.

**Review caveats:** no WebGL acceleration; pixel mode may be CPU-heavy on mobile. The procedural effects are intentionally exploratory, not naturalistic animals. These three effects are *three render treatments*, not the only possible creature forms. Existing previews and main release remain unchanged.
