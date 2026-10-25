# Project Guidance

- Read `tasks/procedural_runway_spec.md` before changing the animation or artwork.
- Keep all repository source code, documentation, file names, and user-facing page text in English. Use lowercase names for directories and ordinary files; retain conventional `README.md` and `AGENTS.md` names.
- Use a dedicated `codex/` branch for changes. Preserve unrelated work and keep commits scoped to this project.
- Keep the selected transparent walk frames in `assets/walk/`. Treat them as footage-derived source assets; do not invent replacement gait poses or silently change the selected frame range.
- Put task briefs and acceptance criteria in `tasks/`. Keep accepted drawing and animation source in `src/`, build utilities in `scripts/`, and the accepted self-contained browser deliverable at `index.html`.
- Keep one active website implementation in `src/`, its builder in `scripts/`, and browser checks in `tests/`. Write disposable builds, captures and reports under Git-ignored `dist/`; do not recreate parallel archived site implementations.
- The target forest preview draws scenery at runtime. Do not substitute a prerecorded background video or generated background frame sequence for the procedural scene.
- Keep `index.html` self-contained: embed required sprites and code, avoid runtime network requests, and verify offline phone playback before claiming mobile acceptance.
- Rebuild generated output after source or asset changes. Inspect the rendered result and the 32-to-0 walk seam; verify that any repeating world objects remain stable until they leave the viewport.
- Do not add local absolute paths, credentials, or the original source video to the repository.
