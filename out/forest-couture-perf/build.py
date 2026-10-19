"""Build the cached Forest Couture runway without changing original walk footage."""
from pathlib import Path
from io import BytesIO
import base64

from PIL import Image

root = Path(__file__).resolve().parents[2]
attempt = Path(__file__).resolve().parent
W, H, C, N = 420, 790, 6, 33
atlas = Image.new("RGBA", (C * W, ((N + C - 1) // C) * H))
for i in range(N):
    with Image.open(root / "assets" / "walk" / f"sprite_{i:03d}.png") as img:
        if img.size != (W, H):
            raise ValueError(f"Invalid original walk sprite: {i}")
        atlas.alpha_composite(img.convert("RGBA"), ((i % C) * W, (i // C) * H))
buffer = BytesIO()
atlas.save(buffer, "WEBP", quality=90, method=6)
html = (attempt / "template.html").read_text(encoding="utf-8")
for marker, value in {
    "__AUDIENCE_CODE__": (attempt / "audience.js").read_text(encoding="utf-8"),
    "__ATLAS_DATA__": base64.b64encode(buffer.getvalue()).decode("ascii"),
}.items():
    if html.count(marker) != 1:
        raise RuntimeError(f"Expected one {marker}")
    html = html.replace(marker, value)
destination = root / "site" / "forest-couture-buyers-optimized" / "index.html"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html, encoding="utf-8")
print(f"Generated {destination.relative_to(root)} ({len(html)} characters)")
