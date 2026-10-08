"""Build the standalone draft from the approved sprite frames."""
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src'
atlas = Image.new('RGBA', (420 * 6, 790 * 6))
for index in range(33):
    with Image.open(ROOT / 'assets' / 'walk' / f'sprite_{index:03d}.png') as frame:
        assert frame.size == (420, 790)
        atlas.alpha_composite(frame.convert('RGBA'), ((index % 6) * 420, (index // 6) * 790))
buffer = BytesIO()
atlas.save(buffer, format='WEBP', quality=90, method=6)
html = (SOURCE / 'forest_runway_template.html').read_text()
html = html.replace('__FOREST_CODE__', (SOURCE / 'forest_scene.js').read_text())
html = html.replace('__ATLAS_DATA__', base64.b64encode(buffer.getvalue()).decode('ascii'))
(ROOT / 'index.html').write_text(html)
(ROOT / 'site').mkdir(exist_ok=True)
(ROOT / 'site' / 'index.html').write_text(html)
print(f'Built standalone HTML: {len(html.encode())} bytes; 33 embedded frames')
