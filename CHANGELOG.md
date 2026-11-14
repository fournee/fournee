# Changelog

## v1.5.0 · 14 Nov 2026

Additive only: four new colour roles and ten new readability contracts; no existing role, contract, preset look or
library entry changes value.

- **Frosting: the tint ladder.** Four new roles for the accent as a fill, built the way the other calculated roles are:
  `accent-hover`, `accent-selected` and `accent-pressed` (each a stronger tint of the accent over the background, for hover,
  selected and pressed rows) and `accent-tint-text` (accent text that stays readable on the page, on cards and on every
  tint in the ladder). Each tint is fitted so ordinary text reads on it at 4.5:1; if a look cannot manage that, the tint
  matches the one below it rather than jumping out of order. The two lighter tints you already had (`accent-faint`, `accent-soft`)
  are unchanged. That is 43 roles and 70 readability contracts (ten new). At the default looks the tints are #DEEAE3 /
  #D1E2D8 / #C4DBCE (light) and #26223A / #2E2848 / #372F57 (dark), and `accent-tint-text` equals `accent-text`. Additive only:
  no existing role or contract changes. The readability checks can now name `accent-faint` and `accent-soft` as backgrounds.
- **Spec: comparing two standards now says what it means.** "Compare side by side" opens with a plain verdict ("Nearly
  the same for your page", "NASA is stricter: 2 things on your page would change") and each differing rule in plain
  words ("the keyboard focus ring must be stronger"). Below it, a sample card you drag across: your page now on the
  left, fitted to the other standard on the right. The full rules table is folded under "Show all 12 rules".
- **Fontdant: font names show in full.** Card names and the names under Headings / Body / Code now wrap onto a
  second line instead of being cut off with "…" ("Schibsted Gr…"). A test checks every tab at four panel widths.
- **Fontdant: the Mode switch is readable and fits.** The selected segment was dark text on a dark fill in dark mode and the
  switch was clipped by the live preview in the narrow controls column. It now uses the surface fill with an accent ring
  (as the "Choosing for" switch does) and drops below its label so the whole switch shows.
- **Fontdant: one Faces picker, four tabs across the top.** The three per-slot pickers (a narrow column beside the live
  preview, tabs wrapping, one tiny card per row) are replaced by one full-width picker: "Choosing for" Headings / Body /
  Code, one never-wrapping row of Sans, Serif, Decorative and Mono tabs with the 🎲 at its right end, and a grid of
  "Aa Gg" cards (several per row at the steps page panel width, two on a phone). Tabs a slot cannot use are disabled
  with a reason instead of hidden. Public API, the store and the draft are unchanged.

## v1.4.0 · 14 Nov 2026

Additive only: no existing role, preset look or library entry changes value, apart from the new `tab` field and the
mono families' extra `display` slot.

- **Fontdant: the face picker is four tabs**, Sans, Serif, Decorative and Mono, over a grid of compact preview cards (a
  small "Aa" and the name, set in that face; two or more per row even in a narrow panel). Tabs are a real ARIA tablist. The text slot sees Sans and Serif, the display slot
  sees all four, the mono slot sees Mono.
- **Fontdant: per-tab dice.** 🎲 inside the picker picks any font from the current tab for the slot being picked,
  ignoring the `lucky` flag but still respecting the licence filter. The whole-pairing lucky card is unchanged.
- **Fontdant: curated `tab` field** on every library family in `library-source.json`, separate from `category`.
  Mono families gain the `display` slot (code fonts may set headings, not body text). Fonts a user adds appear in a
  "Your fonts" group in the matching tab.
- **Fontdant: 24 new library families** (63 in all: Sans 25, Serif 17, Decorative 16, Mono 5). Sans: DM Sans, Work
  Sans, Figtree, IBM Plex Sans, Rubik, Lexend. Serif: Lora, Merriweather, Literata, Crimson Pro, IBM Plex Serif,
  Gelasio, Bodoni Moda, DM Serif Display. Decorative: Oswald, Archivo Black, Abril Fatface, Alfa Slab One, Pacifico,
  Caveat, Permanent Marker, Fredoka, Lilita One, Bungee. All OFL-1.1 except Permanent Marker (Apache-2.0).
- **Catalog: the font library page** has the same four tabs.
- **Security: development dependencies patched.** undici (frosting, via wrangler), svelte, esbuild, glob/minimatch
  (delivery) and esbuild (fontdant) moved to patched versions. None ship in Fournée's outputs. deepmerge (low, pulled
  in by style-dictionary) has no patched release yet and stays open.

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
