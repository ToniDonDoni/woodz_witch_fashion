"""Assemble a shareable GIF from the deterministic browser captures."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent
frames = []
for source in sorted((root / 'motion').glob('*.png')):
    im = Image.open(source).convert('RGB')
    im = im.resize((1040, round(im.height * 1040 / im.width)), Image.Resampling.LANCZOS)
    frames.append(im.quantize(colors=128, method=Image.Quantize.MEDIANCUT))
frames[0].save(root / 'preview.gif', save_all=True, append_images=frames[1:], duration=[80,80,90]*8, loop=0, optimize=False, disposal=2)
print(f'{len(frames)} frames; {(root / "preview.gif").stat().st_size} bytes')
