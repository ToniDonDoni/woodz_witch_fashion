"""Build the offline procedural effects preview from the repository's 33 walk sprites."""
from pathlib import Path
from io import BytesIO
import base64
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
atlas = Image.new("RGBA", (2520, 4740))
for i in range(33):
    with Image.open(ROOT / "assets" / "walk" / f"sprite_{i:03d}.png") as im:
        if im.size != (420, 790):
            raise ValueError(f"Unexpected sprite size {i}: {im.size}")
        atlas.alpha_composite(im.convert("RGBA"), ((i % 6) * 420, (i // 6) * 790))
data = BytesIO()
atlas.save(data, "WEBP", quality=90, method=6)
b64 = base64.b64encode(data.getvalue()).decode("ascii")
script = (HERE / "effects.js").read_text(encoding="utf-8")
page = (HERE / "template.html").read_text(encoding="utf-8")
assert script.count("__ATLAS__") == 1
assert page.count('<script src="./effects.js"></script>') == 1
page = page.replace('<script src="./effects.js"></script>',
                    '<script>' + script.replace("__ATLAS__", b64) + '</script>')
out = ROOT / "site" / "teknium-three-effects" / "index.html"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding="utf-8")
print(f"Built {out.relative_to(ROOT)}: {len(page)} characters")
