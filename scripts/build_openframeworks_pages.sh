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
mkdir -p "$ROOT/dist/openframeworks/wasm" "$ROOT/dist/openframeworks/legacy"
# Preserve the generated Emscripten page under /wasm/.
test -d "$PROJECT/bin/em/forest_effects"
cp -a "$PROJECT/bin/em/forest_effects/." "$ROOT/dist/openframeworks/wasm/"
if [ ! -f "$ROOT/dist/openframeworks/wasm/index.html" ]; then
  HTML="$(find "$ROOT/dist/openframeworks/wasm" -type f -name '*.html' -print -quit)"
  test -n "$HTML"
  cp "$HTML" "$ROOT/dist/openframeworks/wasm/index.html"
fi
# Assemble the original approved 33-frame sprite atlas for the WASM layer.
python3 - "$ROOT" <<'PY'
import sys
from pathlib import Path
from PIL import Image
root = Path(sys.argv[1])
atlas = Image.new('RGBA', (420*6, 790*6))
for i in range(33):
    with Image.open(root / 'assets' / 'walk' / f'sprite_{i:03d}.png') as frame:
        assert frame.size == (420, 790)
        atlas.alpha_composite(frame.convert('RGBA'), ((i%6)*420, (i//6)*790))
atlas.save(root / 'dist/openframeworks/wasm/walk-atlas.webp', 'WEBP', quality=90)
PY
cp "$ROOT/src/wasm_walker_overlay.js" "$ROOT/dist/openframeworks/wasm/wasm_walker_overlay.js"
python3 - "$ROOT/dist/openframeworks/wasm/index.html" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
html = p.read_text()
assert '</body>' in html
p.write_text(html.replace('</body>', '<script src="wasm_walker_overlay.js"></script></body>'))
PY
# Build the original standalone JavaScript scene without changing its source.
python3 "$ROOT/scripts/build_forest_page.py"
cp "$ROOT/site/index.html" "$ROOT/dist/openframeworks/legacy/index.html"
cp "$ROOT/src/technology_selector.html" "$ROOT/dist/openframeworks/index.html"
test -n "$(find "$ROOT/dist/openframeworks/wasm" -type f -name '*.wasm' -print -quit)"
# Stamp every published page with its exact source commit, without manual version bumps.
# A new commit automatically produces a new visible version on both renderers.
VERSION="$(git -C "$ROOT" rev-parse --short=12 HEAD)"
python3 - "$ROOT/dist/openframeworks" "$VERSION" <<'PY'
import html
import sys
from pathlib import Path

site, version = Path(sys.argv[1]), sys.argv[2]
assert version and all(ch in '0123456789abcdef' for ch in version)
for page in (site / 'index.html', site / 'legacy/index.html', site / 'wasm/index.html'):
    source = page.read_text()
    assert '</body>' in source, f'Missing body in {page}'
    badge = (
        '<div id="build-version" data-version="' + html.escape(version) + '" '
        'style="position:fixed!important;top:8px!important;left:8px!important;'
        'z-index:2147483647!important;pointer-events:none!important;'
        'background:#15121dee!important;color:#f2d7ff!important;'
        'border:1px solid #ae82d9!important;border-radius:6px!important;'
        'padding:5px 9px!important;font:12px monospace!important;'
        'letter-spacing:.04em!important">BUILD ' + html.escape(version) + '</div>'
    )
    page.write_text(source.replace('</body>', badge + '</body>', 1))
    assert page.read_text().count('id="build-version"') == 1
print(f'Visible build version on all three pages: {version}')
PY
printf 'Static site prepared at %s\n' "$ROOT/dist/openframeworks"
