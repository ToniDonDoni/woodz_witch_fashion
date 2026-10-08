"""Build one offline WebGL2/Canvas2D living-paint runway from the original 33 PNGs."""
from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = Path(__file__).resolve().parent
FW, FH, COLS, FRAMES = 420, 790, 6, 33


def build() -> Path:
    atlas = Image.new("RGBA", (COLS * FW, ((FRAMES + COLS - 1) // COLS) * FH))
    for i in range(FRAMES):
        filename = ROOT / "assets" / "walk" / f"sprite_{i:03d}.png"
        with Image.open(filename) as frame:
            if frame.size != (FW, FH):
                raise ValueError(f"Unexpected dimensions for {filename}: {frame.size}")
            atlas.alpha_composite(frame.convert("RGBA"), ((i % COLS) * FW, (i // COLS) * FH))

    output_bytes = BytesIO()
    atlas.save(output_bytes, "WEBP", quality=90, method=6)
    atlas_base64 = base64.b64encode(output_bytes.getvalue()).decode("ascii")

    page = (DIR / "template.html").read_text(encoding="utf-8")
    for marker, text in {
        "__GRAMMAR_CODE__": (DIR / "grammar.js").read_text(encoding="utf-8"),
        "__PAINT_CODE__": (DIR / "paint_renderer.js").read_text(encoding="utf-8"),
        "__ATLAS_DATA__": atlas_base64,
    }.items():
        if page.count(marker) != 1:
            raise RuntimeError(f"Expected exactly one {marker}, found {page.count(marker)}")
        page = page.replace(marker, text)

    output = ROOT / "site" / "living-paint-v2" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")
    print(f"{output.relative_to(ROOT)} ({len(page)} chars, {FRAMES} source walk frames)")
    return output


if __name__ == "__main__":
    build()
