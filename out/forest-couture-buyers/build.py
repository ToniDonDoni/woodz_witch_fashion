from pathlib import Path
from io import BytesIO
import base64
from PIL import Image
root=Path(__file__).resolve().parents[2]
d=Path(__file__).resolve().parent
W,H,C,N=420,790,6,33
atlas=Image.new("RGBA",(C*W,((N+C-1)//C)*H))
for i in range(N):
    with Image.open(root/"assets"/"walk"/f"sprite_{i:03d}.png") as img:
        assert img.size==(W,H)
        atlas.alpha_composite(img.convert("RGBA"),((i%C)*W,(i//C)*H))
buffer=BytesIO()
atlas.save(buffer,"WEBP",quality=90,method=6)
html=(d/"template.html").read_text()
for marker,value in {
    "__AUDIENCE_CODE__":(d/"audience.js").read_text(),
    "__ATLAS_DATA__":base64.b64encode(buffer.getvalue()).decode()
}.items():
    assert html.count(marker)==1
    html=html.replace(marker,value)
dest=root/"site"/"forest-couture-buyers"/"index.html"
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(html)
print(dest,len(html))
