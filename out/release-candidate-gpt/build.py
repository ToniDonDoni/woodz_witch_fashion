"""Build the self-contained Release Candidate GPT HTML from approved PNG sprites.

Uses the released spectator scene, new lighting module and the current moonlit
night sky. Never alters the footage-derived 33-frame walk atlas.
"""
from __future__ import annotations
import base64
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ATTEMPT = Path(__file__).resolve().parent
FRAME_COUNT = 33
COLUMNS = 6

def build() -> None:
    sprites = [ROOT / "assets" / "walk" / f"sprite_{i:03d}.png" for i in range(FRAME_COUNT)]
    with Image.open(sprites[0]) as first:
        fw, fh = first.size
    atlas = Image.new("RGBA", (fw * COLUMNS, fh * ((FRAME_COUNT + COLUMNS - 1)//COLUMNS)))
    for i, file in enumerate(sprites):
        with Image.open(file) as source:
            if source.size != (fw, fh):
                raise ValueError(f"Invalid frame dimensions: {file}")
            atlas.alpha_composite(source.convert("RGBA"), ((i % COLUMNS)*fw, (i // COLUMNS)*fh))
    encoded_data = BytesIO()
    atlas.save(encoded_data, "WEBP", quality=90, method=6)
    encoded = base64.b64encode(encoded_data.getvalue()).decode("ascii")

    forest = (ROOT / "out" / "forest-spectators" / "forest.js").read_text()
    original = "  renderForestRow(0,objects,used);renderForestRow(1,objects,used);"
    revised = ("  renderForestRow(0,objects,used);\n"
               "  const atmosphereState=atmosphere.draw();\n"
               "  renderForestRow(1,objects,used);")
    if forest.count(original) != 1 or forest.count("return {objects,used};") != 1:
        raise ValueError("Unexpected forest renderer; review integration manually.")
    forest = forest.replace(original, revised)
    forest = forest.replace("return {objects,used};",
                            "return {objects,used,atmosphere:atmosphereState};")

    sky_source = (ROOT / "src" / "forest_scene.js").read_text()
    sky_start = sky_source.index("function drawNightSky(){")
    sky_end = sky_source.index("function drawForestBackground(){", sky_start)
    sky = sky_source[sky_start:sky_end].strip()

    page = (ATTEMPT / "template.html").read_text()
    substitutions = {
        "__FOREST_CODE__": forest,
        "__NIGHT_SKY_CODE__": sky,
        "__LIGHTING_CODE__": (ATTEMPT / "lighting.js").read_text(),
        "__SPECTATOR_CODE__": (ROOT / "out" / "forest-spectators" / "spectators.js").read_text(),
        "__ATLAS_DATA__": encoded,
    }
    for marker, content in substitutions.items():
        if page.count(marker) != 1:
            raise ValueError(f"Unexpected marker count: {marker}")
        page = page.replace(marker, content)
    output = ROOT / "site" / "release-candidate-gpt" / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page, encoding="utf-8")
    print(f"Built {output.relative_to(ROOT)} ({len(page)} chars, {len(encoded_data.getvalue())} WEBP bytes)")

if __name__ == "__main__":
    build()
