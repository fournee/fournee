# Changelog

## v1.2.0 — 11 Nov 2026 · first public release

Fournée goes public under the MIT licence.

- **Frosting** (colour by role): 26 ready-made looks, lucky rolls, locked backgrounds, gradients (Oklab, with a
  worst-case readability check), light and dark defaults, the colour panel.
- **Fontdant** (type by role): reading and dense modes, 21 styles, 16 type contracts, the dial fit, a library of 39
  self-hosted open-licence families with metrics, client fonts (bring your own, read in the browser).
- **Kitchen**: the recipe format and store, **the pass** (colour and type checked together), 21 standards profiles
  (WCAG 2.0 to 2.2, government and organisation rules, an APCA preview), Sprinkles, and the four-step panel
  (Frosting → Fontdant → Spec → Expo) with *Take it with you* (summary, recipe.json, instructions for Claude).
- **Delivery**: one recipe, rendered identically in plain HTML, React, Svelte, Electron, pywebview, Qt and tkinter;
  DTCG 2025.10 export (validated in Style Dictionary 5).
- **Catalog**: every part live, with one navigation bar, light/dark everywhere and a phone layout.
- Works from wherever it's cloned. Optional tests (Python, Electron) skip without their tools.
- Code-level names keep the working name's `mise` prefix (`MiseApply`, `.mise-*`, `mise.js`) for compatibility.
