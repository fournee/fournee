"""Phase 6 Python checks, run by delivery/test/python.mjs (prints one JSON line starting MISE-RESULT).

    python python_check.py <work dir> <recipe.json> <desktop dir> [pywebview] [qt] [tk]

pywebview: the page is built in Python with mise_web (head + assets), served by pywebview's own http server, opened in
a hidden window (never shown), measured with the same in-page function as the browser tests.
qt: PyQt offscreen; registers the exported TTFs, checks every role's family is the real face (not a substitute) and
its cap height matches the web's within a pixel.
tk: a withdrawn Tk root; registers the TTFs privately, checks every role's actual family.
"""
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "python"))
import mise_web  # noqa: E402
from mise_desktop import MiseDesktop  # noqa: E402

work, recipe_path, desktop_dir = sys.argv[1:4]
what = set(sys.argv[4:]) or {"pywebview", "qt", "tk"}
with open(recipe_path, encoding="utf-8") as f:
    RECIPE = json.load(f)
out = {}


def check_pywebview():
    import webview
    web = os.path.join(work, "pyweb")
    os.makedirs(web, exist_ok=True)
    copied = mise_web.copy_assets(web, RECIPE)
    with open(os.path.join(work, "body.html"), encoding="utf-8") as f:
        body = f.read()
    with open(os.path.join(work, "measure.js"), encoding="utf-8") as f:
        measure_src = f.read()
    # read the moment the specimen is inserted (stricter than first paint; a hidden window runs no animation frames)
    probe = ("<script>window.__firstSeen=null;new MutationObserver(function(m,o){var s=document.getElementById('spec');"
             "if(s&&window.__firstSeen===null){o.disconnect();"
             "window.__firstSeen=getComputedStyle(document.documentElement).getPropertyValue('--fd-face-display');}})"
             ".observe(document.documentElement,{childList:true,subtree:true});</script>")
    html = ('<!doctype html><html lang="en"><head><meta charset="utf-8">' + probe + mise_web.head(RECIPE) +
            '<style>body { margin: 16px; width: 900px; background: var(--fr-bg); color: var(--fr-text); }</style>'
            '</head><body>' + body + '</body></html>')
    with open(os.path.join(web, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    res = {"copied": copied}
    win = webview.create_window("mise check", url=os.path.join(web, "index.html"), hidden=True, width=1000, height=900)

    def run():
        try:
            win.events.loaded.wait(30)
            t0 = time.time()
            while time.time() - t0 < 20:
                ready = win.evaluate_js("!!(document.querySelector('#spec [data-style]') && window.__firstSeen && document.fonts.status === 'loaded')")
                if ready:
                    break
                time.sleep(0.1)
            win.evaluate_js("for (const el of document.querySelectorAll('#spec [data-style]')) el.offsetHeight; 1")
            time.sleep(0.3)
            m = win.evaluate_js("(" + measure_src + ")()")
            m["firstSeen"] = win.evaluate_js("window.__firstSeen")
            m["url"] = win.evaluate_js("location.href")
            res["measure"] = m
        except Exception as e:  # noqa: BLE001
            res["error"] = f"{type(e).__name__}: {e}"
        finally:
            win.destroy()

    webview.start(run, http_server=True, private_mode=True)
    return res


def check_qt():
    os.environ["QT_QPA_PLATFORM"] = "offscreen"
    from PyQt5.QtGui import QGuiApplication, QFontInfo, QFontMetricsF
    app = QGuiApplication.instance() or QGuiApplication([])
    mise = MiseDesktop(desktop_dir)
    reg = mise.register_qt()
    roles = {}
    for name, r in mise.roles.items():
        f = mise.qfont(name)
        info = QFontInfo(f)
        fm = QFontMetricsF(f)
        roles[name] = {"family": info.family(), "expected": r["family"], "pixelSize": info.pixelSize(),
                       "capHeight": round(fm.capHeight(), 2), "capExpected": r["capHeightPx"],
                       "italic": info.italic()}
    del app
    return {"registered": {os.path.basename(k): v for k, v in reg.items()}, "roles": roles}


def check_tk():
    if sys.platform != "win32":
        return {"skipped": "not Windows"}
    import tkinter as tk
    mise = MiseDesktop(desktop_dir)
    mise.register_tk()
    root = tk.Tk()
    root.withdraw()
    roles = {}
    try:
        for name, r in mise.roles.items():
            f = mise.tk_font(name, root)
            a = f.actual()
            roles[name] = {"family": a["family"], "expected": r["family"], "size": a["size"],
                           "linespace": f.metrics("linespace"), "text": mise.text(name, "Eyebrow")}
    finally:
        root.destroy()
        mise.unregister_tk()
    return {"roles": roles, "color": mise.color("muted")}


for name, fn in (("qt", check_qt), ("tk", check_tk), ("pywebview", check_pywebview)):
    if name in what:
        try:
            out[name] = fn()
        except Exception as e:  # noqa: BLE001
            out[name] = {"error": f"{type(e).__name__}: {e}"}
print("MISE-RESULT " + json.dumps(out), flush=True)
