#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${RUNNER_TEMP:-/tmp}/woodz-of-build"
OF="$WORK/openFrameworks"
PROJECT="$OF/apps/myApps/forest_effects"
mkdir -p "$WORK"
# The upstream master branch contains the most recent Emscripten fixes.
# Record its exact SHA in the CI log for build provenance.
git clone --depth 1 https://github.com/openframeworks/openFrameworks.git "$OF"
git -C "$OF" rev-parse HEAD
bash "$OF/scripts/emscripten/download_libs.sh"
mkdir -p "$PROJECT/src"
cp "$ROOT/out/openframeworks-wasm-prototype/src/main.cpp" "$PROJECT/src/main.cpp"
cp "$ROOT/out/openframeworks-wasm-prototype/Makefile" "$PROJECT/Makefile"
(
  cd "$PROJECT"
  emmake make -j2 PLATFORM=emscripten
)
mkdir -p "$ROOT/dist/openframeworks"
# Keep generated relative paths intact; fail if the compiler emitted no site.
test -d "$PROJECT/bin/em/forest_effects"
cp -a "$PROJECT/bin/em/forest_effects/." "$ROOT/dist/openframeworks/"
if [ ! -f "$ROOT/dist/openframeworks/index.html" ]; then
  HTML="$(find "$ROOT/dist/openframeworks" -type f -name '*.html' -print -quit)"
  test -n "$HTML"
  cp "$HTML" "$ROOT/dist/openframeworks/index.html"
fi
test -n "$(find "$ROOT/dist/openframeworks" -type f -name '*.wasm' -print -quit)"
printf 'Static site prepared at %s\n' "$ROOT/dist/openframeworks"
