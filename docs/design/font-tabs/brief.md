# Font tabs: owner-approved brief (2026-11-14)

Source of choices: `decisions.json` in this folder (the owner's picks from a local choosing page).

## What changes
The face picker in the Fontdant tab (fontdant/src/panel.js, today one `<select>` per slot grouped by shelf)
becomes **four tabs: Sans, Serif, Decorative, Mono**, each a grid of preview cards (font name + "Aa" + a short
sample in that face). The catalog font library page (catalog/pages/fontdant.html) gets the same four tabs.

## Rules (owner decisions)
1. Every library family gets a curated `tab`: `sans` | `serif` | `decorative` | `mono`, set in
   `fontdant/fonts/library-source.json` (existing placements are in decisions.json `existing[].tab`; none moved).
   This is separate from the auto `category` (which drives fallbacks); do not repurpose `category`.
2. Add the 24 families in decisions.json `add[]` (family, tab, slots given there), fetched and measured by the
   existing pipeline (`npm run fetch`, `npm run build` in fontdant/).
3. Tab visibility per slot:
   - text (body) slot: Sans and Serif only.
   - display (headings) slot: Sans, Serif, Decorative, Mono.
   - mono (code) slot: Mono only.
   So mono families gain the `display` slot (owner: code fonts may be used for headings, not body).
   Decorative families are display-only.
4. 🎲 inside the picker: picks **any** font from the tab you are in, for the slot you are picking, ignoring the
   `lucky` flag but still respecting the licence filter (FontdantLicence.covers). *(assumption: licence still applies)*
5. The existing "I'm feeling lucky" whole-pairing card keeps its behaviour (lucky-marked fonts). New Sans/Serif
   families are `lucky: true`, new Decorative families `lucky: false`. *(assumption)*
6. Fonts the user adds (own files / Adobe kit) appear in a "Your fonts" group inside the tab that matches them
   (category serif → Serif, mono → Mono, else Sans). *(assumption)*
7. All additive: no existing role, preset look or library entry changes value, apart from the new `tab` field and
   mono's extra `display` slot.

## Design-system rules
Colour from --fr-* roles, type from --fd-* roles/steps/faces, nothing under 12px. Preview cards may set the
previewed family inline (that is content). Tabs are a real ARIA tablist (arrow keys, aria-selected).
