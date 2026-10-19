"""Build the independent black-stage runway without changing any approved sprites."""
from __future__ import annotations
import base64
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ATTEMPT = Path(__file__).resolve().parent
ATLAS_WIDTH, ATLAS_HEIGHT, COLS, FRAMES = 420, 790, 6, 33

def build() -> Path:
    rows = (FRAMES + COLS - 1) // COLS
    atlas = Image.new("RGBA", (ATLAS_WIDTH * COLS, ATLAS_HEIGHT * rows))
    for index in range(FRAMES):
        filename = ROOT / "assets" / "walk" / f"sprite_{index:03d}.png"
        with Image.open(filename) as frame:
            if frame.size != (ATLAS_WIDTH, ATLAS_HEIGHT):
                raise ValueError(f"Incorrect source image dimensions: {filename}")
            atlas.alpha_composite(frame.convert("RGBA"),
                                  ((index % COLS) * ATLAS_WIDTH,
                                   (index // COLS) * ATLAS_HEIGHT))
    data = BytesIO()
    atlas.save(data, "WEBP", quality=90, method=6)
    page = (ATTEMPT / "template.html").read_text(encoding="utf-8")
    substitutions = {
        "__EVENT_CODE__": (ATTEMPT / "events.js").read_text(encoding="utf-8"),
        "__ATLAS_DATA__": base64.b64encode(data.getvalue()).decode("ascii"),
    }
    for key, value in substitutions.items():
        if page.count(key) != 1:
            raise ValueError(f"Expected exactly one {key}")
        page = page.replace(key, value)
    output = ROOT / "site" / "infinite-single-event-rc" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")
    print(f"Built {output.relative_to(ROOT)}: {len(page)} characters")
    return output

if __name__ == "__main__":
    build()
