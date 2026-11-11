"""Fournée for Qt and tkinter (build phase 6): a recipe's type and colours in Python toolkits that have no CSS.

Make the export once per look (Node, in the Fournée repo):
    node delivery/scripts/desktop.mjs my-recipe.json my_app/mise
That writes my_app/mise/mise-desktop.json and my_app/mise/fonts/*.ttf (one static TTF per face and weight).

Qt (PyQt5/6, PySide2/6):
    from mise_desktop import MiseDesktop
    mise = MiseDesktop("my_app/mise")
    mise.register_qt()                       # after the QApplication exists
    label.setFont(mise.qfont("heading-xl"))
    label.setStyleSheet(f"color: {mise.color('text')}")

tkinter:
    root = tk.Tk()
    mise = MiseDesktop("my_app/mise")
    mise.register_tk()                        # Windows: private to this process, gone when it exits
    tk.Label(root, text="Hello", font=mise.tk_font("heading-xl"), fg=mise.color("text"), bg=mise.color("bg"))

What carries over (proposal §7): face, size and weight per role, the fit (pixelSize gives the same cap height as the
web), the case transform via mise.text(role, s), and the colours (Plain greys when Sprinkles is off). What does not:
tracking and line height in tkinter (Qt gets letter spacing), font features, the mode switch at runtime (export each
mode you need). No macOS story for tkinter fonts yet (Windows registers privately; Linux needs fontconfig).
"""
import json
import os
import sys

__all__ = ["MiseDesktop"]


class MiseDesktop:
    def __init__(self, folder):
        self.folder = os.path.abspath(folder)
        with open(os.path.join(self.folder, "mise-desktop.json"), encoding="utf-8") as f:
            self.data = json.load(f)
        if self.data.get("format") != "mise-desktop/1":
            raise ValueError("not a mise-desktop/1 export: " + self.folder)
        self.roles = self.data["roles"]
        self.colors = self.data["colors"]
        self._registered_tk = []

    # ── shared ──
    def role(self, name):
        if name not in self.roles:
            raise KeyError(f"no style {name!r} (have: {', '.join(sorted(self.roles))})")
        return self.roles[name]

    def color(self, name):
        """A frosting role colour as #RRGGBB (the Plain grey when the recipe has Sprinkles off)."""
        return self.colors[name]

    def text(self, role, s):
        """Apply the role's case (eyebrows are often upper case)."""
        c = self.role(role).get("case")
        return s.upper() if c == "upper" else s.lower() if c == "lower" else s

    def font_files(self):
        return [os.path.join(self.folder, f["file"]) for f in self.data["fonts"]]

    # ── Qt ──
    def register_qt(self):
        """Register the fonts with Qt (app-local, no install). Needs a QGuiApplication. Returns {file: [families]}."""
        QFontDatabase = _qt("QtGui").QFontDatabase
        out = {}
        for path in self.font_files():
            fid = QFontDatabase.addApplicationFont(path)
            if fid < 0:
                raise RuntimeError("Qt could not load " + path)
            out[path] = list(QFontDatabase.applicationFontFamilies(fid))
        return out

    def qfont(self, role):
        """A QFont for a role: its family (one weight per family), the fitted pixel size, its weight and letter spacing."""
        QtGui = _qt("QtGui")
        r = self.role(role)
        f = QtGui.QFont(r["family"])
        f.setPixelSize(max(1, round(r["pixelSize"])))
        f.setItalic(bool(r.get("italic")))
        f.setStyleStrategy(QtGui.QFont.StyleStrategy.PreferAntialias if hasattr(QtGui.QFont, "StyleStrategy") else QtGui.QFont.PreferAntialias)
        em = r.get("letterSpacingEm") or 0
        if em:
            spacing = QtGui.QFont.SpacingType.AbsoluteSpacing if hasattr(QtGui.QFont, "SpacingType") else QtGui.QFont.AbsoluteSpacing
            f.setLetterSpacing(spacing, em * r["pixelSize"])
        return f

    # ── tkinter ──
    def register_tk(self):
        """Make the fonts usable by tkinter. Windows: AddFontResourceExW with FR_PRIVATE (this process only, removed
        at exit, never installed). Elsewhere: raises; install the files with the system's font tool instead."""
        if sys.platform != "win32":
            raise NotImplementedError("tkinter font registration is Windows-only here; install the TTFs on this system")
        import ctypes
        from ctypes import wintypes
        gdi = ctypes.WinDLL("gdi32", use_last_error=True)
        add = gdi.AddFontResourceExW
        add.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.LPVOID]
        add.restype = ctypes.c_int
        FR_PRIVATE = 0x10
        for path in self.font_files():
            if add(path, FR_PRIVATE, None) <= 0:
                raise RuntimeError("Windows could not load " + path)
            self._registered_tk.append(path)
        return list(self._registered_tk)

    def unregister_tk(self):
        if sys.platform != "win32" or not self._registered_tk:
            return
        import ctypes
        from ctypes import wintypes
        gdi = ctypes.WinDLL("gdi32", use_last_error=True)
        rem = gdi.RemoveFontResourceExW
        rem.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.LPVOID]
        for path in self._registered_tk:
            rem(path, 0x10, None)
        self._registered_tk = []

    def tk_font(self, role, root=None):
        """A tkinter.font.Font for a role: family (its weight is baked in), fitted pixel size (negative = pixels)."""
        import tkinter.font as tkfont
        r = self.role(role)
        return tkfont.Font(root=root, family=r["family"], size=-max(1, round(r["pixelSize"])), weight="normal",
                           slant="roman")


def _qt(module):
    for pkg in ("PySide6", "PyQt6", "PyQt5", "PySide2"):
        if pkg in sys.modules or _importable(pkg):
            return __import__(f"{pkg}.{module}", fromlist=[module])
    raise ImportError("no Qt binding found (PySide6, PyQt6, PyQt5 or PySide2)")


def _importable(pkg):
    import importlib.util
    return importlib.util.find_spec(pkg) is not None
