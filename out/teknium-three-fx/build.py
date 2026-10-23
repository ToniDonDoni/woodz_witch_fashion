"""Build an offline three-effect runway; do not alter approved footage frames."""
from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ATTEMPT = Path(__file__).resolve().parent
FW, FH, COLS, FRAMES = 420, 790, 6, 33

def build() -> Path:
    atlas = Image.new("RGBA", (COLS * FW, ((FRAMES + COLS - 1) // COLS) * FH))
    for index in range(FRAMES):
        source = ROOT / "assets" / "walk" / f"sprite_{index:03d}.png"
        with Image.open(source) as frame:
            if frame.size != (FW, FH):
                raise ValueError(f"Unexpected original walk dimensions: {source} {frame.size}")
            atlas.alpha_composite(frame.convert("RGBA"),
                                  ((index % COLS) * FW, (index // COLS) * FH))
    data = BytesIO()
    atlas.save(data, format="WEBP", quality=90, method=6)
    payload = base64.b64encode(data.getvalue()).decode("ascii")

    html = (ATTEMPT / "template.html").read_text(encoding="utf-8")
    substitutions = {
        "__DIRECTOR_CODE__": (ATTEMPT / "director.js").read_text(encoding="utf-8"),
        "__RENDERER_CODE__": (ATTEMPT / "renderer.js").read_text(encoding="utf-8"),
        "__ATLAS_DATA__": payload,
    }
    for marker, value in substitutions.items():
        if html.count(marker) != 1:
            raise ValueError(f"Template expected one occurrence of {marker}")
        html = html.replace(marker, value)

    output = ROOT / "site" / "teknium-three-fx" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
    print(f"Built {output.relative_to(ROOT)} from {FRAMES} original PNGs: {len(html)} chars")
    return output

if __name__ == "__main__":
    build()
