"""Fournée for Python-built web pages and pywebview (build phase 6).

The page gets the full pipeline, the same as any browser: frosting's colours, fontdant's fitted @font-face aliases and
role variables, the mode, Sprinkles. Python writes the <head>; the look is applied by a synchronous script in <head>,
so it is in place before the first paint (no fetch-then-apply).

    import mise_web
    mise_web.copy_assets("ui", recipe)                       # ui/mise/mise.js, mise.css and ui/mise/fonts/<used>
    html = f"<!doctype html><html><head>{mise_web.head(recipe)}</head><body>...</body></html>"

pywebview: serve the folder (pywebview's built-in server does it when you pass a relative path), never file://:
    open("ui/index.html", "w", encoding="utf-8").write(html)
    webview.create_window("App", "ui/index.html")            # served over http://127.0.0.1, fonts load normally
    webview.start(http_server=True)

A page opened straight from disk (file://, as a Python progress window might) also worked in Chromium when the mise/
folder sits beside the page (measured in the phase 6 Python trial). Serving is still the recommended way: pywebview's
docs advise against file://, and other engines are stricter about file:// fonts.

The panel inside pywebview stores recipes through kitchen's pywebview adapter, which calls get_frosting / set_frosting
on js_api; MiseStore below is a ready js_api that keeps them in a JSON file.
"""
import json
import os
import shutil

__all__ = ["head", "copy_assets", "font_ids", "MiseStore", "DIST", "FONTS"]

_HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.normpath(os.path.join(_HERE, "..", "dist"))
FONTS = os.path.normpath(os.path.join(_HERE, "..", "..", "fontdant", "fonts"))


def _index():
    with open(os.path.join(DIST, "library-index.json"), encoding="utf-8") as f:
        return json.load(f)


def head(recipe, assets_url="mise", fonts_url=None, element_id="mise"):
    """The <head> markup that applies a recipe before first paint. assets_url: where mise.js and mise.css are served
    (relative to the page); fonts_url: where the font folders are (default <assets_url>/fonts)."""
    fonts_url = fonts_url or assets_url.rstrip("/") + "/fonts"
    data = json.dumps(recipe or {}, ensure_ascii=False).replace("</", "<\\/")
    opts = json.dumps({"baseUrl": fonts_url, "id": element_id})
    a = assets_url.rstrip("/")
    return (f'<link rel="stylesheet" href="{a}/mise.css">'
            f'<script src="{a}/mise.js"></script>'
            f'<script>MiseApply.apply({data}, {opts});</script>')


def font_ids(recipe):
    """The library font ids a recipe's three faces use (missing slots fall back to the default look)."""
    idx = _index()
    faces = dict(idx["defaultLook"])
    faces.update(((recipe or {}).get("fontdant") or {}).get("faces") or {})
    return sorted({v for v in faces.values() if v in idx["fonts"]})


def copy_assets(dest, recipe=None, fonts_dir=None):
    """Copy mise.js, mise.css and the font folders the recipe uses (all library fonts if recipe is None) into
    <dest>/mise/. Returns the list of font ids copied. A client's own fonts with inline (data:) files need nothing."""
    out = os.path.join(dest, "mise")
    os.makedirs(os.path.join(out, "fonts"), exist_ok=True)
    for name in ("mise.js", "mise.css"):
        shutil.copyfile(os.path.join(DIST, name), os.path.join(out, name))
    src = fonts_dir or FONTS
    ids = font_ids(recipe) if recipe is not None else sorted(_index()["fonts"])
    for fid in ids:
        d = os.path.join(src, fid)
        if not os.path.isdir(d):
            continue
        os.makedirs(os.path.join(out, "fonts", fid), exist_ok=True)
        for f in os.listdir(d):
            if f.lower().endswith((".woff2", ".woff", ".ttf", ".otf", ".txt")):
                shutil.copyfile(os.path.join(d, f), os.path.join(out, "fonts", fid, f))
    return ids


class MiseStore:
    """A pywebview js_api for kitchen's pywebview adapter: get_frosting(key) / set_frosting(key, value), kept in a
    JSON file. webview.create_window(..., js_api=MiseStore("settings.json"))."""

    def __init__(self, path):
        self._path = path

    def _load(self):
        try:
            with open(self._path, encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return {}

    def get_frosting(self, key):
        return self._load().get(str(key))

    def set_frosting(self, key, value):
        data = self._load()
        data[str(key)] = value
        tmp = self._path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f)
        os.replace(tmp, self._path)
        return True
