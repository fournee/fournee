# 0001 · Dense pages: flat surfaces, accent dividers in two weights

- **Status:** accepted, 2026-11-10 (from a review of a dense internal dashboard prototype)
- **Applies to:** information-dense presentations: explorers, project and report pages, dashboards with many
  numbered sections, anything where cards inside cards appear.
- **Evidence:** a side-by-side comparison of flat and card layouts on the same dense page (option 2 won).

## The problem

Dense pages built from cards end up as boxes inside boxes: a hero card, stat cards, a card per section, and pills
or tinted panels inside those. Every box adds a border, a fill and padding, and the hierarchy flattens out because
everything is set off equally. Flattening (one surface, no boxes) fixes the clutter, but with plain hairline
dividers (Frosting `border`, about 1.4:1 on white) the sections run together and the page gets harder to scan.

## The decision

Flatten, then carry the structure in the divider lines, in **two weights, both in the brand accent**:

| Level | Where | Line | Contrast on white (DADS recipe) |
|---|---|---|---|
| **Section** | between numbered sections (6 → 7), under a stat strip, between steps | `2px solid var(--fr-accent)` | 4.10:1 |
| **Subsection** | between items inside a section (the alternatives in 7, projects in a step, list rows, stat cells, columns) | `1px solid color-mix(in srgb, var(--fr-accent) 35%, var(--fr-surface))` | 1.59:1 |

The rules that go with it:

1. **One surface.** The page body sits on `--fr-surface`; no section, stat or item gets its own fill, border box
   or shadow. Full-width bands that are page headers (a navy hero) stay; they are chrome, not cards.
2. **Two levels only.** Section lines and subsection lines. A third level is spacing, never another line style.
3. **Accent, not grey.** Colour (chroma) does the separating, so the lines read as part of the brand and stay
   visible without getting heavy. The section line clears 3:1 (WCAG 1.4.11's bar for meaningful non-text
   graphics); the subsection line deliberately stays quiet.
4. **Roles only.** Both lines come from Frosting roles (`accent`, `surface`), so a recipe change recolours them.
   Never a raw hex.
5. **Keep what signals interaction.** Hover tints on clickable items, focus rings and dialog shadows stay; they
   aren't containers.

```css
/* the pattern, on any flat dense page */
.dense { --sec: 2px solid var(--fr-accent);
         --sub: 1px solid color-mix(in srgb, var(--fr-accent) 35%, var(--fr-surface)); }
.dense .section + .section { border-top: var(--sec); }
.dense .item + .item       { border-top: var(--sub); }
.dense .column + .column   { border-left: var(--sub); }
```

## Options considered (same page, same recipe)

| Option | Section line | Subsection line | Verdict |
|---|---|---|---|
| Cards (before) | boxes | boxes | cluttered; boxes inside boxes |
| Flat · hairline | 1px `border`, 1.38:1 | same | clean but sections blur together |
| 1 · Darker grey | 1px muted 55%, 2.52:1 | 1px muted 40%, 1.89:1 | readable, but grey reads as unbranded |
| **2 · DADS blue** | **2px accent, 4.10:1** | **1px accent 35%, 1.59:1** | **chosen** |
| 3 · Navy, two weights | 2px text, 16.7:1 | 1px dashed text 35%, 2.19:1 | strongest; too heavy for a long page |
| 4 · Tinted gutter | 8px `progress-track` band | 1px accent 30%, 1.48:1 | closest to cards; brings the boxes back in spirit |

## Related decisions from the same review

- **Current location in navigation:** colour (`accent-text`) plus the component's own footer line under the
  active item. No text underline as well: one marker, not two. The underline exists only as an off-by-default
  option (`--q-nav-current-line`).
- **Readability pass on dense pages:** collapse ad-hoc sizes onto Fontdant steps (nothing under 13px, body 16px),
  three line-heights (1.15 / 1.35 / 1.55), one 4px-based spacing scale, links in `accent-text`. Optimise within the
  project's look and purpose; never restyle it.

## Codified as a design system

The pattern was packaged as a small, separate design system. It is deliberately narrow: it turns
cards into lines and nothing else. No rules on navigation, type, links, buttons or app structure. Tokens: `line-section`,
`line-item`, `line-section-width`, `line-item-width`, `hover-tint`, `flat-surface`, three padding tokens and `radius-flat`;
classes: `dx-flat`, `dx-section`, `dx-items`, `dx-grid`, `dx-cols`, `dx-stats`, `dx-hover`. The prototype installs it
and applies it to every screen. To reuse it on another project, install the system and map that
project's card classes onto sections (2px) and items (1px); keep floating and pressable things boxed.

## Not done yet

- The pattern is a recipe-level convention, not a Fournée switch. A `dense` layout option in Kitchen (so a recipe
  can turn it on and the pass can check the section line's 3:1) is the long-term home.
- The system's line colours are fixed hex values; a Fournée-driven version would bind them to each recipe's `accent`.
