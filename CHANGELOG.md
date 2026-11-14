# Changelog

## v1.3.0 · 13 Nov 2026

Additive only: no existing role value, contract or pass result changes (checked against a frozen copy of v1.2.0).

- **Kitchen: Pass suggestions.** A failed or warned contrast result now carries an optional `suggest`: the nearest
  colour of the same hue, moving lightness only, that reaches the contrast asked for on every ground the pass checks it
  on. When no colour of that hue can, `suggest` is `null` and the result carries `suggestTarget` (the ratio asked
  for). New `KitchenPass.suggest(fg, rules, opts)`. The pass view shows the swatch, hex and ratio, and a "Use this"
  button when the host passes `onSuggest`.
- **Frosting: numeric accent channels.** `--fr-accent-h` (degrees, a bare number), `--fr-accent-s` and
  `--fr-accent-l` (with `%`) beside `--fr-accent`, in `frosting.css`, `MiseApply` output, the live panel and the
  catalog. For component libraries that derive colours from a hue number: `--hue: var(--fr-accent-h, 210)` re-themes
  them. A grey accent has no hue, so it emits hue `0` and saturation `0%`; multiply `--fr-accent-s` into your own
  saturation where grey should stay grey.
- **Frosting: 13 calculated roles with 23 new contracts** (60 in all). `text-secondary`, `accent-text-hover`,
  `button-hover`, `border-strong`, and `-soft`, `-text` and `-border` for each of `ok`, `warn` and `bad`. They are
  worked out from the base roles and fitted to pass their contracts, in every ready-made, brand and lucky look. A
  recipe can override one by name with `frosting.overrides`. In plain CSS they are `color-mix()` expressions with no
  contrast guarantee; build from a recipe for the guarantee. `FrostingColor.complete()` does the fitting and takes the
  accessibility standard's contracts and the look's gradients into account. A new test fails if any of the 13 roles,
  their contracts or the accent channels is removed.
  In about 4.2% of looks (248 of 5,962 in the roles test) no visible hover colour passes both rules, so `button-hover`
  equals `button`.
- **Specified, not built: a tint ladder** (hover, selected and pressed tints of the accent, and text that stays
  readable on them). The design is written down in `docs/design/roles-v1.3/spec.md` for a later release.
- **Frosting: eight tag roles**, `--fr-tag-1` … `--fr-tag-8`, an optional group for telling projects or categories
  apart (a strip, an underline, a dot). Fixed, evenly spread hues in the same order in every look (blue, orange,
  violet, green, magenta, cyan, amber, lime), fitted as shapes to 3:1 on `bg` and `surface`. Every ready-made,
  brand and lucky look derives them.

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
