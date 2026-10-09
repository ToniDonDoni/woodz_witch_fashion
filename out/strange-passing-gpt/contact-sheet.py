"""Collect reproducible rendered review captures into one compact sheet."""
from pathlib import Path
from PIL import Image, ImageDraw

attempt = Path(__file__).resolve().parent
names = ['leshy', 'owlbuyer', 'moonwalker', 'doorsnail', 'rainfish', 'jellycap', 'wind', 'ribbon']
sheet = Image.new('RGB', (1440, 1000), '#0a0c13')
draw = ImageDraw.Draw(sheet)
for i, name in enumerate(names):
    with Image.open(attempt / 'captures' / f'{name}.png') as source:
        source = source.convert('RGB')
        source.thumbnail((480, 300))
        x, y = (i % 3) * 480, (i // 3) * 330
        sheet.paste(source, (x, y + 24))
        draw.text((x + 14, y + 6), name.upper(), fill='#eee6d3')
with Image.open(attempt / 'captures' / 'leshy-390.png') as source:
    source = source.convert('RGB')
    source.thumbnail((140, 310))
    sheet.paste(source, (1120, 680))
sheet.save(attempt / 'captures' / 'contact-sheet.jpg', quality=88)
