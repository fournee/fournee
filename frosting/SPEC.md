# Frosting — the standard

Frosting is how every project of ours gets re-themeable: a page never names a colour, it
names the colour's **role**, and a *look* is just a set of values for those roles. Everything
else in this repo (the gallery, the lucky button, the readability checks, the storage) only
works because of that one rule.

## 1. The rule

**Never hard-code a colour. Name its role.**

```css
/* not this */                        /* this */
.card { background: #171A21; }        .card { background: var(--fr-surface); }
.dot.up { color: #3DDC84; }           .dot.up { color: var(--fr-ok); }
```

A look can then be swapped by setting the variables once, on the root (or on any element,
for a sub-tree with its own look).

## 2. The roles

The role list lives in **`tokens.json`** and nowhere else. The CSS (`dist/frosting.css`), the
gallery's `derive()`, the readability checks, the catalog page and this document's role table
are all generated from or read from that file. To add a role you edit `tokens.json`; the
build does the rest.

| Group | Roles | Required |
|---|---|---|
| core | `bg` `surface` `border` `text` `muted` `accent` `accent-text` `button` `button-text` `progress-fill` `progress-track` | always |
| core, calculated | `text-secondary` `accent-text-hover` `button-hover` `border-strong` | always (calculated when nobody sets them) |
| status | `ok` `warn` `bad` | dashboards, monitors |
| status, calculated | `ok-soft` `ok-text` `ok-border` `warn-soft` `warn-text` `warn-border` `bad-soft` `bad-text` `bad-border` | dashboards, monitors |
| series | `series-1` … `series-4` | charts |
| tag | `tag-1` … `tag-8` | telling projects or categories apart (strips, underlines, dots) |

Each role has a light and a dark default. The dark defaults come from an early desktop
widget; the light defaults come from the first site that used Frosting.

**Variable names** are `--<prefix>-<role>`; the default prefix is `fr`
(`--fr-bg`, `--fr-ok`). A project may keep an older prefix (say `app`) by building with
`--prefix=app`.

**Derived colours** (`accent-soft`, `control-border`, `scrim`…) are `color-mix()` recipes
over the roles. They follow a look automatically and are never edited.

**Calculated roles.** Thirteen roles are worked out from other roles rather than picked: `text-secondary`
(between `text` and `muted`), `accent-text-hover`, `button-hover`, `border-strong`, and a soft, text and border
colour for each of `ok`, `warn` and `bad`. In `tokens.json` each is an ordinary role entry with a `calc` block:
the two roles it lies between, a nominal weight, the contrast rules it must keep, and for `button-hover` an
alternative direction. They sit in the colours map like any other role, so every reader of a look keeps working.

- **Fitted.** The engine's `FrostingColor.complete(colors, opts)` computes them from the base roles and moves each
  one along its line until its rules pass. It is called wherever a look is made or cleaned (the gallery, the store,
  the recipe, the panel), so a look never carries a calculated colour that fails its contract. Two options change
  what the fit holds to: `opts.contracts` is an accessibility standard's contract list (a stricter standard raises
  the minimums the calculated roles must meet), and `opts.fills` is the look's gradients (a rule against a filled
  ground holds at every sampled point of the gradient). `opts.overrides` and `opts.roles` are described below.
- **Per-recipe override.** A recipe overrides a calculated role by naming it in `frosting.overrides`, a map from
  role to `#RRGGBB` beside `colors` (a look on disk carries it as `colors.overrides`). Only calculated roles can be
  overridden. An override is held to the same contract as the calculated value, and roles that depend on it use it.
  Wearing another look or pressing Reset clears the overrides. The panel shows "calculated" under each calculated
  role, and "your pick" with a "Use calculated" link once it is overridden.
- **Plain CSS limit.** In `frosting.css` each calculated role is written as an sRGB `color-mix()` of its base roles.
  It follows the base roles with no script, and the default palettes pass. A page that sets only some base roles
  with `setProperty` gets that unfitted mix: close, but with no contrast guarantee. To get the guarantee, build the
  page from a recipe (`MiseApply`, `project.mjs`) or run the pass on the resulting colours.

## 3. Extensions

A project may add roles of its own (a fundraising site's `share`/`share-text`, a console's `air`/`screen`)
by registering an extension with the gallery: a name, a label, defaults, how to derive it
from a spec, and its contracts. Extension roles appear in the pickers and the checks like
any other role, but they are not part of the standard and other projects never see them.

## 4. Readability contracts

A look is **readable** when every contract in `tokens.json` passes. Contracts are pairs of
roles with a minimum WCAG contrast ratio:

- `text` on `bg` and `surface`: **7:1**
- `muted` and `accent-text` on `bg` and `surface`: **4.5:1**
- `button-text` on `button`: **4.5:1**
- shapes (`accent`, `button`, `progress-fill`, status dots, series lines) on `bg`: **3:1**
- tags (`tag-1` … `tag-8`) on `bg` and `surface`: **3:1**
- `text-secondary` on `bg` and `surface`: **7:1**
- `accent-text-hover` on `bg` and `surface`: **4.5:1**
- `button-hover` on `bg`: **3:1**, and `button-text` on `button-hover`: **4.5:1**
- `border-strong` on `bg` and `surface`: **3:1**
- for each of `ok`, `warn` and `bad`: `<status>-text` on `bg`, `surface` and `<status>-soft` at **4.5:1**,
  `text` on `<status>-soft` at **7:1**, and `<status>-border` on `bg` at **3:1**

That is 60 contracts in all: the original 37 (unchanged, in the same order) and 23 for the calculated roles.

The engine never saves a silently unreadable look: hand edits are checked and badged;
generated looks are **fitted** (hue and saturation kept, lightness moved until every contract
passes). Status, series and tag roles are *shape* colours: for text in those colours, use the
engine's `ink()` helper to pick a readable text colour over them.

### Numeric accent: `--fr-accent-h`, `--fr-accent-s`, `--fr-accent-l`

Beside `--fr-accent`, Frosting emits its three HSL parts, from the same colour, in `frosting.css` (light, and both
dark blocks), in `MiseApply` output, in the live panel and in the catalog:

```css
--fr-accent-h: 145.1;   /* degrees, a bare number, 0 to 359.9 */
--fr-accent-s: 46.2%;   /* HSL saturation */
--fr-accent-l: 33.5%;   /* HSL lightness */
```

They exist for component libraries that derive their colours from a hue number. One line re-themes them:

```css
:root { --hue: var(--fr-accent-h, 210); }                  /* hsl(var(--hue), 40%, 92%) now follows the accent */
.chip { background: hsl(var(--fr-accent-h) calc(var(--fr-accent-s) * .8) 92%); }
```

A grey has no hue. When the accent's saturation rounds to 0, the hue is emitted as `0` and the saturation as `0%`.
So use `--fr-accent-h` alone for the hue, and multiply `--fr-accent-s` into your own saturation wherever a grey
accent should stay grey. These three are channels, not roles: they have no contracts and are never edited.

## 5. A look, on disk

```json
{
  "name": "Midnight Diner",
  "scheme": "Dark",
  "colors": { "bg": "#12141C", "surface": "#1B1E28", "text": "#F2F0EA", "…": "…" }
}
```

- `colors` is a flat map of role → uppercase `#RRGGBB`. Unknown roles are dropped; missing
  roles fall back to the defaults. That is the whole validation rule. Calculated roles are recomputed from the base
  roles on every clean, unless the look names them in `colors.overrides`.
- A project stores up to three things: the **published** look, a **draft**, and a list of
  **favorites** (max 40, names ≤ 40 chars). Where they live is the storage adapter's business
  (JSON file, localStorage, Cloudflare D1, a server) — the engine only sees `get`/`set`.

## 6. Applying a look

- **Before first paint:** inject `<style>:root{--fr-bg:…}</style>` into `<head>` at build or
  serve time (the Worker's HTMLRewriter, Python at window creation, a build step). Never
  fetch-then-apply on load; it flashes.
- **Live preview and theme switching:** `element.style.setProperty('--fr-'+role, value)`.
  Passing `null` removes the override and the defaults return.
- **Dark mode:** the dark defaults are the `[data-theme="dark"]` and
  `prefers-color-scheme: dark` block of the generated CSS; a dark *look* is just a look.

## 7. The parts

| Part | Name | What it adds | Standard? |
|---|---|---|---|
| A | Tokens | the roles, the CSS, the defaults | yes |
| B | Readability | contrast, `fit`, `check`, the badge | yes |
| C | Gallery | ready-made looks, 🎲 lucky, build-around-this-background | yes |
| D | Store | draft/published/favorites with pluggable storage | yes |
| E | Generators | image → palette, remix chips, describe-a-mood | optional |
| F | Type dials | sizes and weights as part of a look | optional |
| G | Reserved roles | roles a look may never reuse (a console app's rule that some colours mean one thing only) | optional |
| H | Motion | effect presets with a schema-driven editor (an effects editor) | optional, separate from paint |

"Standard frosting" means A + B + C + D. Say the letters for anything else.
