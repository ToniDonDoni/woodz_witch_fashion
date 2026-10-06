"""Build one offline HTML page from the approved 33 transparent walk sprites."""

from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITES = ROOT / "assets" / "walk"
TEMPLATE = ROOT / "src" / "walk_page_template.html"
OUTPUT = ROOT / "index.html"
FRAME_COUNT = 33
COLUMNS = 6


def main() -> None:
    paths = [SPRITES / f"sprite_{index:03d}.png" for index in range(FRAME_COUNT)]
    with Image.open(paths[0]) as first:
        frame_width, frame_height = first.size
    rows = (FRAME_COUNT + COLUMNS - 1) // COLUMNS
    atlas = Image.new("RGBA", (frame_width * COLUMNS, frame_height * rows))

    for index, path in enumerate(paths):
        with Image.open(path) as sprite:
            if sprite.size != (frame_width, frame_height):
                raise ValueError(f"Unexpected sprite size: {path}")
            atlas.alpha_composite(
                sprite.convert("RGBA"),
                ((index % COLUMNS) * frame_width, (index // COLUMNS) * frame_height),
            )

    data = BytesIO()
    atlas.save(data, format="WEBP", quality=90, method=6)
    encoded = base64.b64encode(data.getvalue()).decode("ascii")
    html = TEMPLATE.read_text(encoding="utf-8")
    html = html.replace("__ATLAS_DATA__", encoded)
    html = html.replace("__FRAME_WIDTH__", str(frame_width))
    html = html.replace("__FRAME_HEIGHT__", str(frame_height))
    html = html.replace("__FRAME_COUNT__", str(FRAME_COUNT))
    html = html.replace("__COLUMNS__", str(COLUMNS))
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Built {OUTPUT.name}: {FRAME_COUNT} frames, {len(data.getvalue())} atlas bytes")


if __name__ == "__main__":
    main()
