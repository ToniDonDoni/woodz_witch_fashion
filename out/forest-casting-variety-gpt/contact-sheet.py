"""Create review sheets for the complete cast and visibly different owl forms."""
from pathlib import Path
from PIL import Image, ImageDraw

attempt = Path(__file__).resolve().parent
names = ['leshy', 'owlbuyer', 'moonwalker', 'doorsnail', 'rainfish', 'jellycap', 'wind', 'ribbon',
         'boartailor', 'hareporter', 'walkingmirror', 'heron', 'badgerbuyer', 'roothand', 'stumporgan', 'lanternfox']
sheet = Image.new('RGB', (1600, 1100), '#0a0c13')
draw = ImageDraw.Draw(sheet)
for i, name in enumerate(names):
    with Image.open(attempt / 'captures' / f'{name}.png') as source:
        source = source.convert('RGB')
        source.thumbnail((400, 250))
        x, y = (i % 4) * 400, (i // 4) * 275
        sheet.paste(source, (x, y + 24))
        draw.text((x + 12, y + 6), name.upper(), fill='#eee6d3')
sheet.save(attempt / 'captures' / 'contact-sheet.jpg', quality=88)
owls = Image.new('RGB', (1200, 310), '#0a0c13')
for form in range(4):
    with Image.open(attempt / 'captures' / f'owl-form-{form}.png') as source:
        source = source.convert('RGB')
        source.thumbnail((300, 290))
        owls.paste(source, (form * 300, 20))
ImageDraw.Draw(owls).text((12, 5), 'FOUR DISTINCT OWL SILHOUETTES', fill='#eee6d3')
owls.save(attempt / 'captures' / 'owl-forms.jpg', quality=91)
