# Fournée delivery

One recipe (frosting colours + fontdant type + Sprinkles) applied the same way everywhere a project runs. Built in phase 6.

| Target | Use | How the look arrives | Fonts |
|---|---|---|---|
| Any server or build step | `MiseApply.head(recipe, { baseUrl }).html` into `<head>`, `.htmlAttrs` onto `<html>` | in the first bytes | served `fonts/` folder |
| A page built as a string (Python, templates) | `<script src="mise.js">` + `MiseApply.apply(recipe, { baseUrl })` in `<head>` (`python/mise_web.py` writes it) | synchronous, before first paint | served folder |
| React | `react/`: `<MiseProvider recipe baseUrl>` and `useMise().classes`; `miseHead()` for SSR | `useLayoutEffect`, before paint | served folder |
| Svelte | `svelte/`: `use:mise={{ recipe, baseUrl }}` or `<Mise>`; `miseHead()` for SSR | the action, before paint | served folder |
| Electron | `electron/`: `registerSchemes()` before ready, `serveFonts({ dir })` after | as a page above | `mise-fonts://fonts/…` (privileged scheme, folder-confined, never `file://`) |
| pywebview | `python/mise_web.py`: `copy_assets()`, `head()`, `MiseStore` (the panel's js_api) | as a string-built page | pywebview's own http server |
| Qt, tkinter | `node scripts/desktop.mjs recipe.json out/` then `python/mise_desktop.py` | `qfont(role)`, `tk_font(role)`, `color(role)` | one static TTF per face and weight, registered app-locally |
| Design tools | `node scripts/dtcg.mjs recipe.json out.tokens.json` | W3C DTCG 2025.10 (export only, F3) | — |

`dist/mise.js` (plain script, `require()` returns `MiseApply`), `dist/mise.mjs` (ES module) and `dist/mise.css` (the base stylesheet) are built by `npm run build` from frosting, fontdant and kitchen. Class names come from `MiseApply.classes(recipe)` (`fd-heading-xl`, `fd-ui--button`, …).

**Honest scope.** Qt and tkinter get face, size, weight, case and colours. The fit carries over as a pixel size: Qt measured within 0.3px of the web's cap height. Qt also gets letter spacing; tkinter gets no tracking or line height. tkinter font registration is Windows-only (`AddFontResourceExW`, private to the process). An Adobe Fonts kit can't be exported for desktop.

**Tests** (`npm test`, ~15 s; needs Playwright's Chromium and Firefox; optionally an Electron (`ELECTRON_PATH`) and Python with pywebview, PyQt5, and fontTools):
- `test/web.mjs`: plain HTML, the head boot script, React and Svelte render the same recipe. Every style's computed font, size, weight, leading, tracking, case and height match, plus colours, mode and fonts. Checked in Chromium and Firefox, light and dark system, with no flash and no jump.
- `test/electron.mjs`: the same pages in Electron (set `ELECTRON_PATH` in the repo's `.env`; skipped without it) match Chromium. Fonts come only over `mise-fonts://`, and the handler refuses paths outside its folder and non-font files.
- `test/python.mjs`: pywebview, with the page served by pywebview, matches Chromium. Qt and tkinter use the real faces, and Qt matches the web's cap height.
- `test/dtcg.mjs`: the export follows the 2025.10 shapes and builds in Style Dictionary 5.7.1 (CSS and JS) with warnings treated as errors. In Style Dictionary, expand only typography: `expand: { include: ['typography'] }`.
