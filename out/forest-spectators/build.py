"""Build the standalone draft from the approved sprite frames."""
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

ATTEMPT = Path(__file__).resolve().parent
ROOT = ATTEMPT.parents[1]
atlas = Image.new('RGBA', (420 * 6, 790 * 6))
for index in range(33):
    with Image.open(ROOT / 'assets' / 'walk' / f'sprite_{index:03d}.png') as frame:
        assert frame.size == (420, 790)
        atlas.alpha_composite(frame.convert('RGBA'), ((index % 6) * 420, (index // 6) * 790))
buffer = BytesIO()
atlas.save(buffer, format='WEBP', quality=90, method=6)
html = (ATTEMPT / 'template.html').read_text()
html = html.replace('__SPECTATOR_CODE__', (ATTEMPT / 'spectators.js').read_text())
html = html.replace('__FOREST_CODE__', (ATTEMPT / 'forest.js').read_text())
html = html.replace('__ATLAS_DATA__', base64.b64encode(buffer.getvalue()).decode('ascii'))
(ATTEMPT / 'index.html').write_text(html)
print(f'Built standalone HTML: {len(html.encode())} bytes; 33 embedded frames')
