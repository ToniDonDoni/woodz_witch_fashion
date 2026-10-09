"""Build a standalone alternative without changing the accepted root preview."""
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ATTEMPT = Path(__file__).resolve().parent
atlas = Image.new('RGBA', (420 * 6, 790 * 6))
for i in range(33):
    with Image.open(ROOT / 'assets' / 'walk' / f'sprite_{i:03d}.png') as frame:
        assert frame.size == (420, 790)
        atlas.alpha_composite(frame.convert('RGBA'), ((i % 6) * 420, (i // 6) * 790))
buffer = BytesIO()
atlas.save(buffer, format='WEBP', quality=90, method=6)
page = (ATTEMPT / 'template.html').read_text()
forest = (ROOT / 'src' / 'forest_scene.js').read_text()
# Lower the front hedge for a clear runway without editing the accepted renderer.
old = 'foreground?(h/900)*(.85+rand(id+2)*.35)'
assert forest.count(old) == 1
forest = forest.replace(old, 'foreground?(h/900)*(.42+rand(id+2)*.18)')

for marker, value in {
    '__FOREST_CODE__': forest,
    '__PASSING_CODE__': (ATTEMPT / 'passing.js').read_text(),
    '__ATLAS_DATA__': base64.b64encode(buffer.getvalue()).decode('ascii'),
}.items():
    assert page.count(marker) == 1, marker
    page = page.replace(marker, value)
output = ROOT / 'site' / 'strange-passing-gpt' / 'index.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(page)
print(f'Built {output.relative_to(ROOT)}: {len(page.encode())} bytes, 33 original frames')
