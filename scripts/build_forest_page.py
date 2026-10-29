"""Build the main src forest, acts and effects into one self-contained HTML."""
import argparse
import base64
import html as html_tools
import os
import subprocess
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--snapshot', action='store_true',
                    help='Write a source-revision snapshot; for an exact current commit, distribute the normal dist/index.html build.')
args = parser.parse_args()
# Always derive the SHA from the checked-out Git revision, never a manually
# supplied hash or environment variable. CI builds this after checking out the
# exact PR head SHA; dist/index.html is the authoritative versioned artifact.
# The selected source commit is always identifiable. A committed snapshot cannot
# contain its own future enclosing Git SHA: that SHA would change when stamped.
# Therefore snapshots name the checked-out *source* revision, while normal
# dist builds name the exact checked-out revision used for deployment.
revision = subprocess.check_output(['git', 'rev-parse', '--verify', 'HEAD'],
                                   cwd=ROOT, text=True).strip()
# In Actions, checking out a precise SHA leaves Git in detached HEAD mode.
# Prefer the PR's source branch as display metadata, never as the SHA source.
branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                                 cwd=ROOT, text=True).strip()
if branch == 'HEAD':
    branch = os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or 'detached'
escaped_branch = html_tools.escape(branch)
label = 'SOURCE' if args.snapshot else 'HEAD'
commit_kind = 'source' if args.snapshot else 'build'
stamp = (f'<a id="build-commit" data-head="{revision}" '
         f'data-commit-kind="{commit_kind}" '
         f'href="https://github.com/ToniDonDoni/woodz_witch_fashion/commit/{revision}" '
         f'target="_blank" rel="noopener" title="{revision}">{label} {revision[:12]}</a>'
         f'<span class="branch-meta"> · <span id="build-branch" '
         f'title="{escaped_branch}">{escaped_branch}</span></span>')
atlas = Image.new('RGBA', (420 * 6, 790 * 6))
for index in range(33):
    with Image.open(ROOT / 'assets' / 'walk' / f'sprite_{index:03d}.png') as frame:
        assert frame.size == (420, 790)
        atlas.alpha_composite(frame.convert('RGBA'), ((index % 6) * 420, (index // 6) * 790))
buffer = BytesIO()
atlas.save(buffer, format='WEBP', quality=90, method=6)
html = (SOURCE / 'forest_runway_template.html').read_text(encoding='utf-8')
source = (SOURCE / 'forest_scene.js').read_text(encoding='utf-8') + '\n' + (SOURCE / 'forest_acts.js').read_text(encoding='utf-8')
html = html.replace('__FOREST_CODE__', source)
effects = ((SOURCE / 'forest_enchantments.js').read_text(encoding='utf-8') + '\n' +
           (SOURCE / 'forest_extra_effects.js').read_text(encoding='utf-8') + '\n' +
           (SOURCE / 'forest_next_effects.js').read_text(encoding='utf-8'))
html = html.replace('__ENCHANTMENT_CODE__', effects)
html = html.replace('__HAUNTED_CODE__', (SOURCE / 'haunted_house.js').read_text(encoding='utf-8'))
html = html.replace('__BUILD_STAMP__', stamp)
html = html.replace('__ATLAS_DATA__', base64.b64encode(buffer.getvalue()).decode('ascii'))
outputs = [ROOT / 'index.html', ROOT / 'site' / 'index.html'] if args.snapshot else [ROOT / 'dist' / 'index.html']
for output in outputs:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding='utf-8')
    print(f'Output: {output.relative_to(ROOT)}')
print(f'Built standalone HTML: {len(html.encode())} bytes; 33 embedded frames')
print(f'{label} COMMIT: {revision} ({branch})')
