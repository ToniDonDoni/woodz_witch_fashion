"""Build an anatomy review grid from reproducible browser screenshots."""
from pathlib import Path
from PIL import Image, ImageDraw

folder = Path(__file__).resolve().parent / 'captures'
files = sorted(folder.glob('variant-*.png'))
assert len(files) == 12, 'Run verify.mjs to capture all twelve archetypes first.'
sheet = Image.new('RGB', (1280, 3 * 205), '#161616')
draw = ImageDraw.Draw(sheet)
for index, path in enumerate(files):
    x, y = (index % 4) * 320, (index // 4) * 205
    with Image.open(path) as image:
        image = image.convert('RGB').resize((320, 180), Image.Resampling.LANCZOS)
        sheet.paste(image, (x, y + 25))
    draw.text((x + 10, y + 7), path.stem.replace('variant-', 'Anatomy '), fill='#ece5d4')
sheet.save(folder / 'anatomy-grid.jpg', quality=93)
print('Saved captures/anatomy-grid.jpg')
