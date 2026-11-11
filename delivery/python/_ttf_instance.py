"""Static TTFs for the desktop adapters (build phase 6). Called by delivery/scripts/desktop.mjs; not imported by apps.

    python _ttf_instance.py jobs.json

jobs.json: [{"in": "x.ttf", "out": "y.ttf", "wght": 650, "family": "Fraunces Fournee 650", "italic": false}, ...]

Each job pins a variable font at one weight (other axes at their defaults) and renames it to a family of its own, so
Qt and tkinter (which pick fonts by family name, and tkinter only knows normal/bold) get exactly that weight with no
synthesis. Static fonts are only renamed. Needs fontTools.
"""
import json
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer


def rename(font, family, italic):
    sub = "Italic" if italic else "Regular"
    full = f"{family} Italic" if italic else family
    ps = (family.replace(" ", "") + "-" + sub)[:63]
    name = font["name"]
    for nid in (16, 17, 21, 22, 25):  # typographic / WWS names would regroup the families; drop them
        name.removeNames(nameID=nid)
    for nid, value in ((1, family), (2, sub), (3, f"Fournee;{ps}"), (4, full), (6, ps)):
        name.setName(value, nid, 3, 1, 0x409)  # Windows, Unicode BMP, en-US
        name.setName(value, nid, 1, 0, 0)  # Macintosh, Roman, English
    os2 = font["OS/2"]
    # fsSelection: bit 0 italic, bit 5 bold, bit 6 regular; each family here is one face
    os2.fsSelection = (os2.fsSelection & ~0b1100001) | (0b1 if italic else 0b1000000)
    font["head"].macStyle = 0b10 if italic else 0
    if "STAT" in font:
        del font["STAT"]


def run(job):
    font = TTFont(job["in"])
    if "fvar" in font:
        loc = {a.axisTag: a.defaultValue for a in font["fvar"].axes}
        if "wght" in loc:
            axis = next(a for a in font["fvar"].axes if a.axisTag == "wght")
            loc["wght"] = max(axis.minValue, min(axis.maxValue, float(job["wght"])))
        font = instancer.instantiateVariableFont(font, loc, updateFontNames=False)
    font["OS/2"].usWeightClass = int(job["wght"])
    rename(font, job["family"], bool(job.get("italic")))
    font.save(job["out"])
    return {"out": job["out"], "family": job["family"], "variable": "fvar" in TTFont(job["in"])}


if __name__ == "__main__":
    with open(sys.argv[1], encoding="utf-8") as f:
        jobs = json.load(f)
    print(json.dumps([run(j) for j in jobs]))
