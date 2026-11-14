# Roles, Pass suggestions and numeric accent (Fournee v1.3.0)

Design spec for four changes to Frosting and the Kitchen pass. All of them are additive: no existing role changes
value, no existing contract result changes. Three are built in v1.3.0, one is specified only.

| Deliverable | What | Built in v1.3.0 |
|---|---|---|
| A | The pass suggests a colour for a failed or warned contrast result (`suggest`) | yes |
| B | Numeric accent: `--fr-accent-h`, `--fr-accent-s`, `--fr-accent-l` | yes |
| C | Thirteen new roles: `text-secondary`, `accent-text-hover`, `button-hover`, `border-strong`, and `ok` / `warn` / `bad` each with `-soft`, `-text`, `-border` | yes |
| D | A tint ladder of job-named accent tints | no, spec only (section 6) |

Where the spec says "assumption", it is a call made without asking, flagged so it can be reversed cheaply.

## 1. Why these changes

A component library that derives its colours from a hue number (it writes `hsl(var(--hue, 210), s, l)` for most of
its colour sites) tried to run on Fournee. Three gaps kept most of its colours out of reach:

1. Frosting roles are whole colours, so CSS cannot read a hue from one. The library needs a plain numeric hue.
2. `ok`, `warn` and `bad` are shape colours, not for text. The library's banners, error blocks and badges had nothing
   readable to use, and a hand-made `color-mix()` has no contrast guarantee.
3. A handful of component states (secondary text, strong border, hover fills) have no role.

Separately, the pass says "7:1 recommended" for a quiet-text warning but not which colour would pass, so the author
fits one by hand.

## 2. Findings from the code that shape the design

Each of these was read in the repo, and each rules out an obvious alternative.

1. **A look keeps a full flat map of roles.** `KitchenRecipe.clean` and `FrostingStore.clean` start from the defaults,
   keep known roles with valid `#RRGGBB`, and fill the rest. Two existing tests depend on it:
   `kitchen/test/run.mjs` line 85 (`Object.keys(colors).length === FrostingTokens.roles.length`) and line 126 (same
   for `FrostingStore.clean`). So a new role must be a real entry in `roles`.
2. **`derived` entries never reach a colours map.** They are CSS-only `color-mix()` strings in `tokens.json`.
   `FrostingColor.check` reads `theme[role]`, so a contract on a derived colour would always fail ("a missing role
   fails"). Derived colours also cannot be overridden or fitted. That is why `accent-soft` and `control-border` have no
   contract. The new roles need contracts, fitting and overrides, so they cannot be `derived`.
3. **`color-mix()` cannot guarantee contrast.** Measured on a prototype outside the repo, over 3,030 looks (28
   presets including the two brand looks, both defaults, 3,000 lucky seeds): applying a plain mix at the weights below
   failed `button-hover` in 39% of looks, `border-strong` in 56%, `ok-border` and `warn-border` in 56%, `bad-border`
   in 16%, and `text-secondary` in 15%. `control-border` already moved
   from 50% to 80% once for this reason (comment in `kitchen/src/standards.js`). Fitting is required.
4. **The existing fit moves lightness.** `FrostingColor.fit` keeps hue and saturation and moves lightness, with
   saturation fallbacks to black or white. The new roles are mixes between two roles, so their natural fitting axis is
   the mix weight (section 3.3). Deliverable A is the lightness-only variant, kept separate in `pass.js`.
5. **Contract format.** `{ label, role, against, min }`. There is no `id` or `level` in `tokens.json`: the label is
   the id, and `pass.js` gives every frosting contract `level: 'hard'` (a standards profile may set `'warn'`).
   `pass.mjs` line 42 asserts the pass lists `FrostingTokens.contracts` unchanged and in order, so new contracts are
   appended after the existing 37.
6. **X4 only warns when Sprinkles is absent.** With `KitchenSprinkles` loaded and a Plain version available, X4's
   7:1 advice becomes an `info` note (`ok: true`). The X4 warning in the consumer report appeared because the pass ran
   without Sprinkles loaded. Deliverable A therefore attaches to failed and warned results only, and the Sprinkles
   `info` note keeps pointing at Plain.
7. **Non-role keys in a look already have a precedent.** `colors.fills` and `colors.standard` ride inside a look's
   `colors`, are validated by `FrostingStore.clean` and `KitchenRecipe.clean`, and are mapped by `toLook` / `fromLook`.
   `overrides` (section 3.5) follows the same pattern.
8. **Several consumers read every string key of `colors`.** `MiseApply` writes `--fr-<key>` for each, the DTCG export
   writes a `color.<key>` token for each, `desktop.mjs` copies the map. New roles flow through all three with no code
   change, as long as they are in the map and have a `use` string.

## 3. Deliverable C: the new roles

### 3.1 Names

All thirteen names follow the existing pattern `<base>-<variant>` (`accent-text`, `button-text`, `progress-fill`) and the
consumer's own proposal, so no name is adjusted.

| Role | Group | Job | Consumer need it covers (generic) |
|---|---|---|---|
| `text-secondary` | core | Text between `text` and `muted`: descriptions, sub-headings | a secondary-text token; a "dim foreground" token |
| `accent-text-hover` | core | Hover colour of accent-coloured text and links | a link-hover token |
| `button-hover` | core | Primary button fill while hovered | a primary-action hover fill |
| `border-strong` | core | Emphasised divider or outline, readable as a boundary | a strong-border token |
| `ok-soft` `warn-soft` `bad-soft` | status | Tinted ground for a message or badge | an error surface; an error background |
| `ok-text` `warn-text` `bad-text` | status | Text in the status hue, readable on the tint and on `bg` / `surface` | an error text; an error heading; an error body |
| `ok-border` `warn-border` `bad-border` | status | Edge of a status message or badge | an error border |

Two of the twelve consumer tokens need no new role: a "subtle foreground" folds into `muted`, and a "dim foreground"
folds into `text-secondary`.

Groups: the four core roles go in `core` and the nine status roles in `status`, both appended after the group's
existing roles (so the generated CSS, the panel and the DTCG export only gain lines). The group blurb for `core`
("Always present") stays true because the roles are always present, calculated when nobody sets them.

### 3.2 `roles`, not `derived`

All thirteen are entries in `roles`. Reasons, from section 2: they must live in the colours map (finding 1), carry
contracts (finding 2), be fitted, and accept an override. Each entry keeps `name`, `group`, `label`, `use`, `light`,
`dark` exactly like today, and gains one field, `calc`, that says how the role is calculated.

`derived` is unchanged. Anything that is only a cosmetic mix with no readability duty (a scrim, a focus ring) stays
there.

### 3.3 The `calc` block

```json
{ "name": "text-secondary", "group": "core", "label": "Secondary text", "use": "…",
  "light": "#3D3B36", "dark": "#B8BDCA",
  "calc": { "from": "text", "to": "muted", "weight": 50, "rules": [["bg", 7], ["surface", 7]] } }
```

| Field | Meaning |
|---|---|
| `from`, `to` | Two role names. The calculated colour lies on the sRGB line from `from` (weight 0) to `to` (weight 100). |
| `weight` | The nominal weight in percent: the share of `to`. |
| `rules` | `[roleName, min]` pairs. The result must reach `min`:1 contrast against that role's resolved colour. |
| `alt` | Optional, `button-hover` only: a third role (`bg`). A second line, from `from` towards `alt`, tried when the main line cannot pass. |
| `minWeight` | Optional, `button-hover` only: the smallest weight that still shows as a visible change. |

**The CSS form.** The same block gives the plain-CSS default, because sRGB `color-mix()` is the same arithmetic as
`FrostingColor.mix`:

```css
--fr-text-secondary: color-mix(in srgb, var(--fr-muted) 50%, var(--fr-text));
```

i.e. `color-mix(in srgb, var(--p-to) <weight>%, var(--p-from))`. This matches how `accent-soft` is already written.

### 3.4 The fitting algorithm

One function, `FrostingColor.complete(colors, opts)`, in `frosting/src/readability.js`. It returns a copy of `colors`
in which every role that has a `calc` is filled, in `tokens.json` order (so `ok-soft` resolves before `ok-text`).

```
complete(colors, { roles = FrostingTokens.roles, overrides = colors.overrides }):
  out = copy of colors
  for each role in roles that has calc, in order:
    if overrides[role] is #RRGGBB: out[role] = uppercase(overrides[role]); continue
    out[role] = resolve(role.calc, out)
  return out

resolve(c, col):
  if any of c.from, c.to, c.alt, or a rule's role is not a valid hex in col:
       return the static default for the scheme (isDark(col.bg) ? role.dark : role.light)
  pass(h)  = every [g, min] in c.rules has contrast(h, col[g]) >= min
  line(a,b,w) = mix(col[a], col[b], w / 100)              // FrostingColor.mix, rounds to #RRGGBB
  search(a,b,w0,lo): try w = w0, w0-1, w0+1, w0-2, w0+2 ... within [lo, 100];
                     return the first line(a,b,w) that passes, else null   // ties go to the LOWER weight
  without alt:
       h = search(from, to, weight, 0)
       if h is null: h = the weight in 0..100 maximising min over rules of contrast / min   // best effort
       return h
  with alt (button-hover):
       1. line(from, to,  weight) if it passes
       2. line(from, alt, weight) if it passes
       3. search(from, to,  weight, minWeight)
       4. search(from, alt, weight, minWeight)
       5. col[from]                                      // no visible hover is possible: keep the button colour
```

Properties this gives, all checked by tests (AC C9 to C12):

- At the default palettes every nominal weight already passes, so no search happens and the result equals the stored
  `light` / `dark` hex and the CSS expression.
- Where a rule's endpoint is guaranteed to pass (weight 0 of `text-secondary` is `text`, which passes 7:1 on `bg` and
  `surface`; weight 100 of `ok-text` is `text`; weight 0 of `ok-soft` is `bg`), the search always finds a passing
  colour. On a look whose own base contracts already fail, `complete()` returns best effort and never throws; the base
  roles' contracts report the real fault.
- Prototype result: with these weights and rules, all 23 new contracts passed on 4,630 looks (all presets including
  the two brand looks, both defaults, 3,000 lucky seeds, and lucky looks on nine locked backgrounds). `button-hover`
  equalled `button` (rule 5) in 197 of them, about 4%, when the button is already at its limit.

### 3.5 Formulas and defaults

Weights are in percent of `to`. "Rules" are the fit rules. The last two columns are the default values the prototype
produced, which are also the nominal-weight results (no search needed), and so equal the CSS expression.

| Role | from | to | Weight | Fit rules (min:1 against) | Light default | Dark default |
|---|---|---|---|---|---|---|
| `text-secondary` | `text` | `muted` | 50 | `bg` 7, `surface` 7 | `#3D3B36` | `#B8BDCA` |
| `accent-text-hover` | `accent-text` | `text` | 25 | `bg` 4.5, `surface` 4.5 | `#214F33` | `#C4B4FB` |
| `button-hover` | `button` | `text` (alt `bg`) | 12 (min 4) | `bg` 3, `button-text` 4.5 | `#2C7149` | `#A688FD` |
| `border-strong` | `border` | `muted` | 65 | `bg` 3, `surface` 3 | `#8D8881` | `#676E7F` |
| `ok-soft` | `bg` | `ok` | 12 | `text` 7 | `#E6EFEA` | `#152922` |
| `ok-text` | `ok` | `text` | 50 | `bg` 4.5, `surface` 4.5, `ok-soft` 4.5 | `#254C34` | `#92E2B9` |
| `ok-border` | `bg` | `ok` | 80 | `bg` 3 | `#589772` | `#34B36E` |
| `warn-soft` | `bg` | `warn` | 12 | `text` 7 | `#F6EAE1` | `#2C271C` |
| `warn-text` | `warn` | `text` | 50 | `bg` 4.5, `surface` 4.5, `warn-soft` 4.5 | `#683711` | `#F3DA9E` |
| `warn-border` | `bg` | `warn` | 80 | `bg` 3 | `#C3753A` | `#CFA742` |
| `bad-soft` | `bg` | `bad` | 12 | `text` 7 | `#F8E8E6` | `#2C1A1F` |
| `bad-text` | `bad` | `text` | 50 | `bg` 4.5, `surface` 4.5, `bad-soft` 4.5 | `#722E24` | `#F3A2AD` |
| `bad-border` | `bg` | `bad` | 80 | `bg` 3 | `#D36659` | `#CF4D5B` |

Why each choice:

- **Direction.** Every "text" and hover role mixes towards `text`, so contrast with `bg` can only rise: it is darker
  on a light look and lighter on a dark look, with no scheme test. Soft tints and borders mix from `bg` towards the
  status hue, the same recipe as `accent-soft` (12% of the accent into `bg`); `*-soft` uses 12% on purpose so the
  status and accent tints read as the same size of step.
- **`button-hover` direction.** Towards `text` raises contrast with `button-text` when the button text is the light
  colour on a light look, or the dark colour on a dark look. When the button text is the other way round (a light
  button with dark text on a light look, or a dark-scheme button with white text) that direction loses contrast, so the
  `alt` line (towards `bg`) is tried before searching. Plain CSS cannot make that choice, so the CSS expression is the
  main line only (section 3.7).
- **`text-secondary` at 7:1.** `text` is 7:1 and `muted` is 4.5:1. A middle tier at 4.5:1 would promise nothing
  `muted` does not, and X4 already recommends 7:1 for small quiet text. At 50% between them the defaults reach 11.2:1
  (light) and 10.1:1 (dark) on `bg`. By construction it never has less contrast than `muted` (checked in AC C11).
- **`border-strong` at 3:1.** It can edge an input (WCAG 1.4.11), which `border` cannot. It overlaps `control-border`
  (80% of `muted` into `bg`, 3.8:1 on the light default) on purpose: `control-border` is a derived mix that only the
  standards profiles check, `border-strong` is a role that is overridable and always contracted. 65% passes both
  defaults unfitted (3.52:1 / 3.17:1 light, 3.70:1 / 3.41:1 dark).
- **`*-text` at 4.5:1, `text` on `*-soft` at 7:1.** `*-text` matches `accent-text`. The 7:1 rule keeps body text
  readable inside an alert. A plain 12% mix breaks that rule in about 7% of lucky looks (205 of 3,030 for `ok`), so
  `*-soft` fits down the weight until `text` passes 7:1. Weight 0 is `bg`, which always passes.
- **`*-border` at 3:1 on `bg`.** An alert edge that fades into the page is not an edge. Fitting raises the weight
  towards the status colour; weight 100 is the `ok` / `warn` / `bad` shape colour, already contracted at 3:1.

### 3.6 Overrides

A recipe (and a look on disk) overrides a calculated role by naming it in `overrides`, a map beside `colors`:

```json
{ "name": "Harbor", "scheme": "Light",
  "frosting": { "colors": { "bg": "#F4F7FA", "…": "…" },
                "overrides": { "border-strong": "#7A766F", "bad-soft": "#FBE4E1" } } }
```

On disk, a look carries it as `colors.overrides`, following the `fills` and `standard` precedent (`toLook` /
`fromLook` map between the two shapes).

Rules:

- Only roles that have a `calc` may be overridden. Other keys, and values that are not `#RRGGBB`, are dropped (the
  existing "unknown roles are dropped" rule). Values are uppercased.
- `colors` still holds every role, calculated roles included, so every existing reader keeps working. For a
  calculated role, `colors[role]` is a cache: `clean()` recomputes it from the base roles and `overrides` on every
  call and ignores whatever the stored map says. That is why an override must be named: a stored calculated value is
  indistinguishable from a hand-picked one, and treating it as pinned would freeze a role at an old accent.
- An override is held to the same contract as a calculated value. A failing override is a normal hard failure, with a
  `suggest` (deliverable A).
- Roles that depend on an overridden role use the override. Overriding `bad-soft` re-fits `bad-text` against it.
- Wearing a ready-made look, a favourite or a lucky roll clears `overrides` (it is a new look). Reset clears it.

### 3.7 Where fitting happens, and what a plain-CSS consumer gets

| Place | Calculated roles |
|---|---|
| **Build time** (`frosting/scripts/build.mjs`) | No fitting. The build writes each calculated role as the sRGB `color-mix()` expression above in `:root` (light), and writes no dark line for it, because the expression follows the dark base roles. The stored `light` / `dark` hex are checked against `complete()` by a test (drift guard), not computed by the build. |
| **Kitchen, live** (the panel, `KitchenRecipe.clean`, `FrostingGallery.derive`, `FrostingStore.clean`) | Fitted: `complete()` runs after every change to a base role. |
| **`MiseApply.css` / `head` / `apply`, and anything built from a recipe** | Fitted: `MiseApply.clean` calls `KitchenRecipe.clean`, so the emitted `:root:root:root` block carries an explicit hex for every role, which beats the file's expressions. |
| **Plain CSS, no script** | The default palettes: passing, because the expressions equal the checked defaults. A page that sets only some base roles with `setProperty` gets the unfitted mix for the calculated roles: close, always following the base roles, **no contrast guarantee**. To get the guarantee, build the page from a recipe (`MiseApply`, `project.mjs`) or run the pass on the resulting colours. `SPEC.md` and the README say this in one sentence. |

This mirrors how Sprinkles already works: the default CSS is a safe baseline, and the guarantee comes from the engine.

### 3.8 Pass contracts

Appended after the existing 37 contracts, in this order, so the first 37 are untouched. Same format as today.
Twenty-three new contracts take the list to 60. All use the default level (`hard`).

| # | Label | role | against | min |
|---|---|---|---|---|
| 38 | Secondary text | `text-secondary` | `bg` | 7 |
| 39 | Secondary text on surfaces | `text-secondary` | `surface` | 7 |
| 40 | Accent text hover | `accent-text-hover` | `bg` | 4.5 |
| 41 | Accent text hover on surfaces | `accent-text-hover` | `surface` | 4.5 |
| 42 | Button hover shape | `button-hover` | `bg` | 3 |
| 43 | Button hover text | `button-text` | `button-hover` | 4.5 |
| 44 | Strong border | `border-strong` | `bg` | 3 |
| 45 | Strong border on surfaces | `border-strong` | `surface` | 3 |
| 46 | OK text | `ok-text` | `bg` | 4.5 |
| 47 | OK text on surfaces | `ok-text` | `surface` | 4.5 |
| 48 | OK text on tint | `ok-text` | `ok-soft` | 4.5 |
| 49 | Text on OK tint | `ok-soft` | `text` | 7 |
| 50 | OK border | `ok-border` | `bg` | 3 |
| 51 to 55 | the same five with `warn`: "Warning text", "Warning text on surfaces", "Warning text on tint", "Text on warning tint", "Warning border" | | | 4.5, 4.5, 4.5, 7, 3 |
| 56 to 60 | the same five with `bad`: "Bad text", "Bad text on surfaces", "Bad text on tint", "Text on bad tint", "Bad border" | | | 4.5, 4.5, 4.5, 7, 3 |

Design notes:

- "Text on OK tint" is written with the tint as `role` and `text` as `against`, so the pass and a standards fit move
  the tint, never the reading text (a failing override of a tint gets its `suggest` on the tint).
- "Button hover text" mirrors the existing "Button text" (`button-text` on `button`).
- Every row has `bg` or a calculated ground as `against`. No existing contract is edited.
- **Standards profiles.** `kitchen/src/standards.js` `TEXT_ROLES` gains `text-secondary`, `accent-text-hover`,
  `ok-text`, `warn-text`, `bad-text`, so a profile's text minimum applies to them and shape roles take the profile's
  shape minimum. `standards.fit()` must not fit a calculated role individually: it fits base roles only, then calls
  `complete()`, then re-checks.
- The catalog's `spec.html` house table filters contracts by a label map and `against` of `bg` or `button`. Its output
  does not change (none of the new roles are in the label map). Adding labels there is a non-goal.

### 3.9 Other consumers of the role list

| Consumer | Change |
|---|---|
| `FrostingGallery.derive` | Calls `complete()` on the theme before the extension hook. Existing roles are computed by the same code, in the same order, so their values do not change. |
| Brand looks (`NASA Horizon`, `CERN`) | Pass through `complete()` too, so `presets()` returns every role. |
| `FrostingGallery.spread` | Per-card overrides also carry `accent-text-hover`, computed with `complete()` over the page plus the card's `accent` and `accent-text`, so a card's hover follows its own accent. |
| `FrostingStore.clean` | After filling from defaults, calls `complete()` (when `FrostingColor` is loaded, as it does for `FrostingFills`) and keeps a valid `overrides` map. Without this a stored look from before v1.3.0 would get the static default for each new role, unrelated to its accent. |
| `KitchenRecipe.clean`, `fromLook`, `toLook` | Same, for the recipe. Recipe shape gains optional `frosting.overrides`. |
| Panel (`frosting/src/panel.js`, `panel.css`) | The "Every role" grid lists the new roles. A calculated role shows a "calculated" caption; editing its swatch records an override; a "Use calculated" link clears it; every edit of a base role re-runs `complete()` and re-applies the CSS properties. |
| DTCG export, desktop JSON, `MiseApply` | No code change. The roles arrive through the colours map. |

## 4. Deliverable A: Pass `suggest`

### 4.1 Shape

A result gets an optional `suggest`. It is absent when not applicable, `null` when a search ran and found nothing, and
an object when it found a colour:

```js
suggest: {
  role: 'muted',          // the role that moves; null when the ink is a literal hex
  from: '#455768',
  to: '#445566',          // uppercase #RRGGBB
  direction: 'darker',    // 'darker' | 'lighter'
  deltaL: 0.6,            // HSL lightness points between from and to, 1 decimal
  target: 7,              // the ratio asked for
  ratio: 7.01,            // the worst ratio of `to` over every ground, floored to 2 decimals
  against: [ { role: 'bg', hex: '#F2F5F8', ratio: 7.01, min: 7 }, { role: 'surface', hex: '#FBFCFD', ratio: 7.46, min: 7 } ]
}
```

The ratio is floored, not rounded, so a displayed `7.00` never hides a real 6.996. A new pure function is exported:

`KitchenPass.suggest(fg, rules, opts) -> object | null`, where `rules` is `[[groundHex, min], …]` (the shape
`FrostingColor.fit` already takes) and `opts.scheme` is `'Light' | 'Dark'` (tie-break only). It returns `null` when no
lightness passes. If `fg` already passes, it returns an object with `to === from`, `direction: 'none'`, `deltaL: 0`.

### 4.2 Which results get it

A result gets `suggest` when it is not `ok`, not `pending`, has level `hard` or `warn`, and is one of:

| Source | Moving role | Target |
|---|---|---|
| Frosting contracts (`source: 'frosting'`) | the contract's `role` | the contract's `min` |
| X2 (small roles keep full contrast) | the first failing row's ink | that row's minimum |
| X3 (thin small text) | the first failing row's ink | 7 |
| X4 (quiet text) | `muted` (first failing row's ink) | 4.5 when hard, 7 when warn |
| X5 (accent text as reading text) | `accent-text` | 7 |
| X6 (button text), colour part only | `button-text` | 4.5 |
| X8 (disabled, placeholder) | the first colour found | 3 |

Not included, on purpose: `info` results (the Sprinkles X4 note already carries Plain); gradient-fill results (no
single colour); licence, type and standards-profile checks (S1 to S5); `pending` results.

### 4.3 Algorithm

Lightness only: hue and saturation of the colour stay as they are. Never a saturation fallback, never black or white
as a fallback (that is what `fit` does; `suggest` returns `null` instead).

1. **Rules.** For the moving role F, take every ground the pass checks F against in this run: every frosting contract
   with `role === F` and every row with `fgRole === F`. The required ratio on each ground is the larger of the
   result's target and that ground's contract minimum. This is what stops a fix that clears `bg` from breaking
   `surface`, and a 7:1 advisory from dropping below the hard 4.5:1.
2. **Start.** `o = FrostingColor.hsl(from)`.
3. **Allowed directions.** Compare the luminance of `from` with each ground. If every ground is lighter than `from`,
   search darker only. If every ground is darker, lighter only. If the grounds straddle `from`, search both.
4. **Search.** For each allowed direction, step `L = o.l ± k * 0.05` (k = 1, 2, …) up to the 0 or 100 bound. At each
   step build `h = FrostingColor.hex({ h: o.h, s: o.s, l: L })` and stop at the first `h` that passes every rule. The
   hex is tested after rounding to 8 bits, so what is reported is what is displayed.
5. **Opposite side.** If the allowed directions found nothing and only one was allowed, search the other side once.
6. **Pick.** Of the candidates, take the smallest `|L - o.l|`. A tie goes to darker on a `Light` scheme and lighter on a
   `Dark` scheme.
7. **None.** If no candidate passes, return `null`. This happens when neither black nor white reaches the target on
   some ground, or when two grounds cannot be satisfied together. The pass shows "No colour of this hue reaches
   N:1 here. Change the background or the hue." and no swatch.
8. **Report.** `ratio` is the worst ratio over the rules, floored to 2 decimals. `deltaL` is the HSL lightness
   difference between `from` and `to`, 1 decimal.

The cost is at most 2,000 steps per direction, a few milliseconds.

Test vectors, all computed from this algorithm (default scheme `Light` unless noted):

| # | Colour | Grounds and minimum | Result |
|---|---|---|---|
| V1 | `#455768` | `#F2F5F8` 7 | `#445566`, darker, deltaL 0.6, ratio 7.01 |
| V2 | `#455768` | `#F2F5F8` 7, `#FBFCFD` 7 | `#445566` (the first ground binds), ratio 7.01 |
| V3 | `#4A4F5C` (Dark) | `#0F1115` 4.5, `#171A21` 4.5 | `#7A8294`, lighter, deltaL 20.4, ratio 4.51 |
| V4 | `#8A92A6` (Dark) | `#0F1115` 7, `#171A21` 7 | `#9EA5B5`, lighter, deltaL 6.9, ratio 7.04 |
| V5 | `#9C9C9C` | `#FFFFFF` 4.5, `#F5F3EF` 4.5 | `#6F6F6F`, darker, deltaL 17.6, ratio 4.53 |
| V6 | `#808080` | `#777777` 7 | `null` (no lightness reaches 7:1 on a mid-tone) |

V1 is the consumer's case. The hand-picked `#435465` (7.12:1) also passes, but `#445566` (7.01:1) is a smaller move
(0.6 lightness points against 1.0), which is what "nearest" asks for. `FrostingColor.fit` returns `#435565` for the same
input because it steps by 0.5.

### 4.4 How the Pass view shows it

Inside the result's list item, after the detail line, when `suggest` is an object:

```
Try #445566 · 7.01:1 on bg (7:1 asked)          [swatch]
```

- A small swatch (`mise-pass__swatch`, a box in the suggested colour with a `--fr-border` outline, `aria-hidden`),
  then the text. The hex and ratio are text, so colour is never the only signal.
- With `opts.samples`, a second sample in the suggested colours, built like the existing sample (`where.fg` replaced by
  `suggest.to`).
- With `opts.onSuggest(result, suggest)` supplied, a button "Use this" that calls it. Without the hook, no button. (The
  shell does not wire the hook in v1.3.0; it is for hosts.)
- `suggest === null`: one line of plain text, the sentence in 4.3 step 7.
- New CSS in `passview.css` uses `--fr-*` roles only, sizes `inherit` or `.9em` of a size that is already 12px or more,
  and nothing under 12px.

## 5. Deliverable B: numeric accent

### 5.1 What is emitted

Three custom properties beside `--fr-accent`, derived from the same `accent` colour:

```css
--fr-accent-h: 145.1;    /* degrees, unitless, 0 to 359.9 */
--fr-accent-s: 46.2%;    /* HSL saturation, with the percent sign */
--fr-accent-l: 33.5%;    /* HSL lightness, with the percent sign */
```

- **Colour space.** HSL of the sRGB hex of `accent`, using `FrostingColor.hsl` (the function the rest of Frosting
  already uses). Not OKLCH: the consumer writes `hsl()`, and hue 145 means the same thing in both places.
- **Units.** Hue is a bare number so it can drop into `hsl(var(--hue), …)` and `calc()`. Saturation and lightness carry
  `%` so `hsl(var(--fr-accent-h) var(--fr-accent-s) var(--fr-accent-l))` is valid as written.
- **Precision.** One decimal, with a trailing `.0` dropped (`145`, not `145.0`). A hue rounded to a whole degree can
  move a channel by one level; with one decimal, `#2E7D4F` round-trips exactly. Hue is taken modulo 360, so `359.96`
  becomes `0`.
- **Defaults.** Light `#2E7D4F`: `145.1`, `46.2%`, `33.5%`. Dark `#9D7BFF`: `255.5`, `100%`, `74.1%`.

### 5.2 The grey-accent rule

A grey has no hue. When the saturation rounds to 0, the hue is emitted as `0` and the saturation as `0%` (for example
`#808080`: `0`, `0%`, `50.2%`). Hue-driven code should use the saturation too:

```css
:root { --hue: var(--fr-accent-h, 210); }                 /* one line re-themes hsl(var(--hue), s, l) sites */
.chip { background: hsl(var(--hue), 40%, 92%); }           /* follows the hue; a grey accent gives a red-tinted chip */
.chip { background: hsl(var(--fr-accent-h) calc(var(--fr-accent-s) * .8) 92%); }   /* follows hue and greyness */
```

This is the documented line for README, SPEC and the CHANGELOG: use `--fr-accent-h` alone for hue; multiply
`--fr-accent-s` into your own saturation where a grey accent should stay grey. The owner accepted this.

### 5.3 Where it is defined and every output that emits it

`tokens.json` gains a top-level `channels` section, so the build and the tests read one definition:

```json
"channels": {
  "about": "Numeric parts of a role, for CSS that builds its own hsl(). Not roles: no contracts, never edited.",
  "accent-h": { "from": "accent", "channel": "h", "unit": "",  "light": "145.1", "dark": "255.5" },
  "accent-s": { "from": "accent", "channel": "s", "unit": "%", "light": "46.2",  "dark": "100" },
  "accent-l": { "from": "accent", "channel": "l", "unit": "%", "light": "33.5",  "dark": "74.1" }
}
```

The stored `light` / `dark` values are checked against `FrostingColor.hsl` of the default accents by a test.

`FrostingColor` gains `accentParts(hex) -> { h, s, l }` (numbers, rounded as above) and `channelVars(colors, prefix) ->
{ '--fr-accent-h': '145.1', '--fr-accent-s': '46.2%', '--fr-accent-l': '33.5%' }`, returning `{}` when `colors.accent`
is not a valid hex. `fills.declarations` is the precedent for returning a variable map.

| Output | Emits | How |
|---|---|---|
| `frosting/dist/frosting.css` | yes | `build.mjs` writes the three in `:root` (light defaults) and in both dark blocks (`prefers-color-scheme: dark` and `[data-theme="dark"]`), with the `--prefix=` prefix. |
| `frosting/dist/tokens.js` | the `channels` definition | so `channelVars` and tests can read it |
| `delivery/dist/mise.css` | yes | it is `frosting.css` plus `fontdant.css` |
| `delivery/dist/mise.js`, `mise.mjs` | yes | `MiseApply.css`, `head` and `apply` (all go through `colorCss`) add `channelVars(colors)` into the `:root:root:root` block, from the recipe's effective colours. Python, Electron, React and Svelte wrappers all call `MiseApply`, so they follow. |
| Kitchen and the Frosting panel, live | yes | `panel.js` `apply()` sets the three properties on the panel's target whenever the draft's `accent` changes (any edit, a ready-made look, Build around a colour, reset). |
| `frosting/catalog/index.html` | yes | its live preview and its reset path (`removeProperty`) cover the three. |
| DTCG export, desktop JSON | no | They carry the accent as a colour; a consumer has the hex. Non-goal. |

Plain-CSS limit: `setProperty('--fr-accent', …)` by hand does not update the three (CSS cannot compute a hue from a
colour). The README says so and points at `FrostingColor.channelVars` and `MiseApply`.

## 6. Deliverable D: tint ladder (SPEC ONLY, not built in v1.3.0)

Nothing in this section is implemented, added to `tokens.json`, or tested in v1.3.0. It is written so that a later
change is a `tokens.json` edit plus tests, using the same `calc` schema and `complete()`.

### 6.1 The ladder

`accent-faint` (8%) and `accent-soft` (12%) are the bottom two rungs and stay `derived`, unchanged. Four calculated
roles would extend them, named by job:

| Role | Job | from → to @ weight | Fit rule |
|---|---|---|---|
| `accent-hover` | hover on a faint or soft row, or a ghost control | `bg` → `accent` @ 16 | `text` 4.5 |
| `accent-selected` | selected row, current nav item, selected pill | `bg` → `accent` @ 22 | `text` 4.5 |
| `accent-pressed` | pressed or active | `bg` → `accent` @ 28 | `text` 4.5 |
| `accent-tint-text` | text sitting on any rung | `accent-text` → `text` @ 0 | 4.5 against `bg`, `surface`, `accent-faint`, `accent-soft`, `accent-hover`, `accent-selected`, `accent-pressed` |

Fitting is the weight search of section 3.4 with one extra rule: weights must rise with each rung. Each rung searches
downwards from its nominal weight, and a rung may not use a weight at or below the previous rung's weight plus 2; if no
weight clears the text rule, the rung equals the previous rung (the ladder collapses rather than reorders). Prototype
over 4,630 looks: `accent-tint-text` always found a passing colour; the defaults keep all three rungs (light
`#DEEAE3`, `#D1E2D8`, `#C4DBCE`; dark `#26223A`, `#2E2848`, `#372F57`); `accent-tint-text` equals `accent-text` at the
defaults.

Contracts would be, in the same format: `text` on each of `accent-hover`, `accent-selected`, `accent-pressed` at 4.5
(role written as the tint, `against` `text`, as in 3.8), and `accent-tint-text` on `bg`, `surface`, `accent-faint`,
`accent-soft`, `accent-hover`, `accent-selected`, `accent-pressed` at 4.5. Why 4.5 and not 7 as for the status tints:
a selected row is a stronger fill than an alert wash, and the heavier tints cannot hold 7:1 for saturated mid-tones.

### 6.2 Mix against `bg` only, not per ground

Recommendation: mix against `bg` only, as `accent-soft` and `accent-faint` do. Reasons:

1. A tint is an opaque fill. What readers need from it is text contrast on it, and that depends on the tint and the
   text, not on what lies behind the fill.
2. It keeps the ladder the same size as the existing one. Per ground would double it (a `-on-surface` twin for each rung
   and each contract).
3. `surface` is already a small step from `bg` (at most 4.5% towards `text` in `derive()`), so a `bg`-mixed tint stays
   distinguishable on a card.
4. A semi-transparent mix (`accent 12%, transparent`) composes over any ground but cannot be checked, because the
   ground is unknown when the colour is chosen. Rejected for the same reason as plain `color-mix()` for status text.

If a consumer later shows a tint that must follow a card colour, add `<rung>-on-surface` roles then. The `-on-surface`
suffix is reserved and unused.

## 7. Backward compatibility

"No existing role value and no existing contract result changes" is a claim about outputs, so it is proven by a test
against a frozen copy, not by reading the diff.

### 7.1 Why nothing existing moves

1. **Roles.** The 26 existing entries in `tokens.json` are not edited. The 13 new entries are appended at the end of
   their groups.
2. **Contracts.** The 37 existing contracts keep their text and order; 23 are appended. `pass.mjs` line 42 still
   holds: the pass lists `FrostingTokens.contracts` unchanged and in order.
3. **Derivation.** `derive()` computes the 26 existing roles with unchanged code, then calls `complete()`, which only
   writes roles that have a `calc`. It never reads a calculated role to compute an existing one.
4. **Recipes and looks.** `clean()` keeps every existing key and value for old input. An old recipe (no `overrides`)
   gets every new role calculated from its own base roles. Old stored looks (`FrostingStore`) are completed the same
   way, not given the static defaults.
5. **Pass.** Existing results (frosting contracts, X1 to X9, T-checks, S-checks, L-checks) are computed from the same
   colours with the same code, and keep their id, label, level, `ok` and `detail`. Two additive changes: new results
   for the new contracts, and the optional `suggest` field. `summary.passed` rises by the number of new passing
   contracts; it counts checks, not contract results, and no test pins it.
6. **CSS.** Every existing `--fr-*` declaration is unchanged in `frosting.css` and in `MiseApply.css(recipe)`. New
   declarations are added: the new roles, the three accent properties, and the new roles' `-fill: none` lines in the
   existing forced-colours block (the block loops over `tokens.roles`).
7. **Sprinkles.** `mutedRoles` matches `muted` or `*-muted`; none of the new names do, so Plain changes the same roles
   as before. Calculated roles are computed from the designed colours, before Plain.

### 7.2 Frozen-copy tests

Captured from the unchanged tree before any edit (first step of the first leaf to start; recommended .3):

- `frosting/test/fixtures/roles-v1.2.json`: for every preset, brand look and lucky seeds 0 to 299, the 26 role values;
  the 37 contracts; `light` and `dark` maps; the existing 26 role entries.
- `delivery/test/fixtures/css-v1.2.css`: `MiseApply.css(recipe)` for `delivery/test/fixtures/recipe.json`, light and dark.

`frosting/test/backcompat.mjs` and `delivery/test/backcompat.mjs` assert: the 26 values per look equal the fixture; the
first 37 contracts deep-equal the fixture; `check()` over the 37 gives the same results; after deleting the lines of
the new roles and the three accent properties, the generated CSS equals the fixture. If a leaf runs after another has
already changed the tree, capture from `git show 64c7d72:<path>` copies in a temp folder.

### 7.3 Every generated file that changes

All are regenerated by `npm run build` or by the test runs, never edited by hand. Only these change:

| File | Why |
|---|---|
| `frosting/dist/frosting.css` | new role lines (expressions), accent properties, new `-fill: none` lines |
| `frosting/dist/tokens.js` | new roles with `calc`, new contracts, `channels` |
| `frosting/dist/store.js` | bundles `frosting/src/store.js`, which gains `complete()` and `overrides` |
| `delivery/dist/mise.css` | `frosting.css` plus `fontdant.css` |
| `delivery/dist/mise.js`, `delivery/dist/mise.mjs` | bundle `tokens.js`, `readability.js`, `recipe.js`, `apply.js` |
| `catalog/site/**` | gitignored; rebuilt by `npm run test:catalog`; its copied assets change |

Unchanged on purpose: `delivery/dist/library-index.json` (no fonts change), everything under `fontdant/dist`.
No source file is added to the bundles, so `delivery/scripts/build.mjs` `PARTS`, `catalog/build.mjs` and
`frosting/scripts/catalog.mjs` file lists are untouched.

Note on the working tree: `delivery/dist/mise.js` and `mise.mjs` already show as modified before this work, but
`git diff` reports only CRLF warnings for them (no content difference, `core.autocrlf` is on). Rebuilding rewrites them
with the generator's line endings. Leaves do not commit anything; the owner approves commits.

### 7.4 The removal guard

`frosting/test/roles.mjs` (new). It must fail if any new role, its contract or the accent properties is removed, even
when every other test still passes. It hard-codes the lists; it does not derive them from `tokens.json`.

```js
const ROLES = ['text-secondary','accent-text-hover','button-hover','border-strong',
  'ok-soft','ok-text','ok-border','warn-soft','warn-text','warn-border','bad-soft','bad-text','bad-border'];
const CONTRACTS = [ /* all 23: [role, against, min] triples from section 3.8 */ ];
const CHANNELS = ['accent-h','accent-s','accent-l'];
```

It asserts, for each name: present in `tokens.json` `roles` with a `calc`, `light` and `dark`, a non-empty `label` and
`use`; present in `FrostingTokens.light`, `.dark`, `FrostingGallery.defaults()`, every preset (brand looks included)
and 300 lucky looks; a `--fr-<name>:` line in `dist/frosting.css` and in `delivery/dist/mise.css`; every one of the
23 triples present in `FrostingTokens.contracts` with at least that `min`; the three channels in `tokens.json`
`channels` and as `--fr-accent-h|s|l:` lines in `dist/frosting.css`. It also asserts that stored defaults equal
`complete()` of the default bases (the drift guard), and a count floor: 39 roles, 60 contracts.

`.5` wires the file into `frosting/package.json` `test`, so `npm test` runs it. QA (.6) proves the guard by removing
one role from a scratch copy and confirming the test fails.

## 8. Acceptance criteria

Numbered per deliverable. Tests listed under each leaf in section 9 own them.

### Deliverable A: Pass suggest

- **A1** Given `#455768` and a single ground `#F2F5F8` at 7, when `KitchenPass.suggest` runs, then it returns
  `to: '#445566'`, `direction: 'darker'`, `deltaL: 0.6`, `ratio: 7.01`, `target: 7`.
- **A2** Given V2 to V5 from section 4.3, when `suggest` runs with the stated scheme, then each returns exactly the
  stated `to`, `direction`, `deltaL` and `ratio`.
- **A3** Given V6 (`#808080` on `#777777` at 7), when `suggest` runs, then it returns `null`.
- **A4** Given any suggestion with a non-null result, when its `to` is measured against every ground in its rules,
  then each ratio is at least its minimum, using the unrounded ratio.
- **A5** Given a suggestion for a colour with saturation at least 10% and lightness between 5 and 95, when `to` is
  compared with `from`, then the hue differs by at most 2 degrees and the saturation by at most 3 points.
- **A6** Given the consumer recipe (light defaults with `bg #F2F5F8`, `surface #FBFCFD`, `muted #455768`, Sprinkles not
  loaded), when `KitchenPass.run` runs, then the X4 result has `ok: false`, `level: 'warn'` and
  `suggest.to === '#445566'`, `suggest.role === 'muted'`, `suggest.target === 7`.
- **A7** Given a recipe whose `muted` fails the 4.5:1 contract "Quiet text" on a dark `bg`, when the pass runs, then
  that frosting result has a `suggest` moving `muted` lighter, and the suggestion also passes "Quiet text on surfaces".
- **A8** Given a passing result, an `info` result, a `pending` result or a gradient-fill result, when the pass runs,
  then none of them has a `suggest` property.
- **A9** Given `KitchenSprinkles` loaded and a Plain version available, when the pass runs on the A6 recipe, then X4 is
  the `info` note (`ok: true`) and has no `suggest`.
- **A10** Given the default light and dark recipes, all presets and 3,000 lucky looks, when the pass runs, then no
  result has a `suggest` (nothing fails, with Sprinkles loaded; without it X4 warns at 7:1 as before and that warning now carries a suggestion), and the results are otherwise identical to before.
- **A11** Given any result list, when each existing result is compared with its pre-change value ignoring `suggest`,
  then `id`, `label`, `level`, `ok`, `pending`, `detail`, `source` and `where` are equal.
- **A12** Given a result with `suggest: { to: '#445566', ratio: 7.01, target: 7, role: 'muted' }`, when the Pass view
  renders it, then its list item contains the text `#445566`, `7.01:1` and `7:1`, and a swatch element whose
  background is `#445566` and which has `aria-hidden="true"`.
- **A13** Given a result with `suggest: null`, when the Pass view renders it, then its list item contains the sentence
  "No colour of this hue reaches" and no swatch.
- **A14** Given `onSuggest` supplied, when the Pass view renders a result with a suggestion and the "Use this" button
  is clicked, then `onSuggest` is called once with that result and its `suggest`; given no `onSuggest`, then no such
  button exists.
- **A15** Given the Pass view in a browser, when `passview.css` is read, then it contains no literal colour and no
  `font-size` below 12px, and the computed font size of the suggestion line is at least 12px.

### Deliverable B: numeric accent

- **B1** Given `#2E7D4F`, when `FrostingColor.accentParts` runs, then it returns `{ h: 145.1, s: 46.2, l: 33.5 }`; given
  `#9D7BFF`, `{ h: 255.5, s: 100, l: 74.1 }`.
- **B2** Given a grey `#808080`, when `accentParts` runs, then `h` is `0` and `s` is `0`.
- **B3** Given any accent whose hue rounds to `360`, when `accentParts` runs, then `h` is `0`, never `360`.
- **B4** Given 1,000 random hex accents, when `hex({ h, s, l })` is built from `accentParts` of each, then every channel
  of the result is within 1 of the original.
- **B5** Given `colors.accent = '#2E7D4F'`, when `channelVars(colors, 'fr')` runs, then it returns exactly
  `{ '--fr-accent-h': '145.1', '--fr-accent-s': '46.2%', '--fr-accent-l': '33.5%' }`; given a `prefix` of `app`, the
  keys start `--app-`; given an invalid accent, `{}`.
- **B6** Given a build with the default prefix, when `frosting/dist/frosting.css` is read, then `:root` declares
  `--fr-accent-h: 145.1`, `--fr-accent-s: 46.2%`, `--fr-accent-l: 33.5%`, and both dark blocks declare `255.5`, `100%`,
  `74.1%`.
- **B7** Given a build with `--prefix=app`, when the CSS is read, then the three are named `--app-accent-h|s|l`.
- **B8** Given `delivery/dist/mise.css`, when read, then it contains the same three declarations as `frosting.css`.
- **B9** Given a recipe with `accent: '#FF0000'`, when `MiseApply.css(recipe)` runs, then the `:root:root:root` block
  contains `--fr-accent-h: 0;`, `--fr-accent-s: 100%;`, `--fr-accent-l: 50%;`; `head(recipe).css` and
  `apply(recipe)` (into a document's `<style>`) contain the same.
- **B10** Given a recipe with a grey accent, when `MiseApply.css` runs, then it emits `--fr-accent-h: 0;` and
  `--fr-accent-s: 0%;`.
- **B11** Given the Frosting panel mounted in a browser, when the user sets the accent to `#FF0000` (and again after
  picking a ready-made look), then `getComputedStyle(document.documentElement)` reports the new hue, saturation and
  lightness for the three properties, matching `channelVars` of the draft; and after Reset they match the defaults.
- **B12** Given a page that sets `--hue: var(--fr-accent-h, 210)` and a rule `hsl(var(--hue), 40%, 92%)`, when the
  recipe's accent hue changes, then the computed colour's hue follows it with no script.
- **B13** Given `delivery/test/accent.mjs` and the Python, Electron, React and Svelte test apps that already render a
  recipe, when they run, then they still pass (they call `MiseApply`).

### Deliverable C: new roles

Roles and contracts

- **C1** Given `tokens.json`, when read, then it has 39 roles and 60 contracts, and the first 26 roles and first 37
  contracts are deep-equal to the frozen copy.
- **C2** Given each of the 13 new roles, when read from `tokens.json`, then it has a `calc` block, `light`, `dark`, a
  non-empty `label` and `use`, and its group is `core` (the four) or `status` (the nine).
- **C3** Given the 23 contracts in section 3.8, when `FrostingTokens.contracts` is read, then each triple of role,
  against and min is present, with labels as listed.
- **C4** Given `FrostingTokens.light` and `.dark`, when `FrostingColor.check` runs, then all 60 contracts pass.
- **C5** Given the 13 role names, when `FrostingGallery.defaults('light')` and `('dark')` run, then each is a key, and
  every preset (brand looks included) has all 39 role keys.

Calculation and fitting

- **C6** Given the default light and dark base roles, when `complete()` runs, then each new role equals the `light` /
  `dark` hex in `tokens.json` (drift guard), with no weight search used.
- **C7** Given the build, when `dist/frosting.css` is read, then each calculated role is declared in `:root` as
  `color-mix(in srgb, var(--fr-<to>) <weight>%, var(--fr-<from>))` per its `calc`, and is not declared in either dark
  block.
- **C8** Given every preset, 3,000 lucky looks, and lucky looks on locked backgrounds of at least 7:1 headroom, when
  `FrostingGallery.derive` runs, then all 23 new contracts pass.
- **C9** Given a look whose accent is changed, when `complete()` runs again, then every calculated role that depends on
  `accent` (`accent-text-hover`) and on `ok` / `warn` / `bad` changes accordingly, and still passes its contracts.
- **C10** Given `text-secondary` for each look in C8, then its contrast with `bg` is at least `muted`'s and at most
  `text`'s; given `accent-text-hover`, its contrast with `bg` is at least `accent-text`'s.
- **C11** Given `button-hover` for each look in C8, then it passes both its rules, and it differs from `button` unless
  rule 5 applied (no visible hover reachable); the test counts rule-5 cases and fails above 8% of looks.
- **C12** Given a look whose base roles already fail their contracts (for example `bg` and `text` equal), when
  `complete()` runs, then it returns a full map without throwing.
- **C13** Given a map missing a base role that a `calc` needs, when `complete()` runs, then that role gets the static
  default for the scheme and the others are unaffected.

Overrides, stores and recipes

- **C14** Given `overrides: { 'border-strong': '#7A766F' }`, when `KitchenRecipe.clean` runs, then
  `frosting.colors['border-strong'] === '#7A766F'`, `frosting.overrides` has exactly that entry, and roles that depend
  on it are recomputed from it.
- **C15** Given `overrides` with an unknown role, a non-calculated role (`bg`) or an invalid hex, when `clean` runs,
  then those entries are dropped and the rest are kept; hex is uppercased.
- **C16** Given a recipe from before v1.3.0 (no new roles, no `overrides`) with `accent` changed, when `clean` runs,
  then every new role is calculated from the recipe's own roles, not the static default.
- **C17** Given a stored recipe whose cached calculated values are stale (accent changed after saving) and no
  `overrides`, when `clean` runs, then the calculated roles are recomputed, not kept.
- **C18** Given an override that fails its contract (`border-strong` at `#E3DED6` on `bg`), when the pass runs, then
  "Strong border" fails at level `hard` and carries a `suggest`.
- **C19** Given `toLook` then `fromLook` of a recipe with overrides, then the overrides survive; given
  `FrostingStore.clean` on a look with `colors.overrides`, then they are kept, and a look without them is completed from
  its own base roles.
- **C20** Given a look worn from the gallery, a favourite or a lucky roll, when it replaces the draft, then
  `overrides` is cleared.
- **C21** Given `FrostingGallery.spread(80, page)`, when the cards are applied over the page and `complete()` runs, then
  each card's `accent-text-hover` passes its two contracts against the page's `bg` and `surface`.

Standards, panel and delivery

- **C22** Given a standards profile with text 7 or shape 4.5, when `KitchenStandards.contracts` and `fit` run, then
  the text minimum applies to `text-secondary`, `accent-text-hover` and the three `*-text` roles, `fit` leaves the
  result passing every new contract, and it never changes a calculated role except by re-running `complete()`.
- **C23** Given the Frosting panel in a browser, when the "Every role" grid renders, then the 13 roles appear, calculated
  ones captioned "calculated"; when a base role is edited, then the calculated roles' CSS properties on the target
  update to the new `complete()` values; when a calculated swatch is edited, then an override is recorded and survives
  a later accent change; when "Use calculated" is clicked, then the override is removed.
- **C24** Given a recipe, when `MiseApply.css(recipe)` runs, then the `:root:root:root` block declares `--fr-<role>` for
  all 39 roles, each as `#RRGGBB`, and the DTCG export has a `color.<role>` token with a `$description` for each.
- **C25** Given Sprinkles off, when the colours are emitted, then the 13 roles are computed from the designed colours
  (not from the Plain greys), and `muted` is the only role Plain changes.

### Cross-cutting: compatibility and guard

- **X1** Given the frozen fixtures (section 7.2), when `backcompat.mjs` runs in `frosting/test` and `delivery/test`, then
  every existing role value, the first 37 contracts, their results and the pre-existing CSS lines are identical.
- **X2** Given the removal guard `frosting/test/roles.mjs`, when any one of the 13 roles, any of the 23 contract
  triples, or any of the three channels is removed from `tokens.json` (checked on a scratch copy), then that test fails
  and names the missing item.
- **X3** Given `npm test` and `npm run test:catalog`, when both run at the end of v1.3.0, then both pass, and `npm test`
  runs `accent.mjs`, `roles.mjs`, `backcompat.mjs`, `suggest.mjs` and the three new browser tests.
- **X4** Given `package.json`, when read, then `version` is `1.3.0`.

### Deliverable D: tint ladder (spec only)

- **D1** Given this section 6, when reviewed, then it names the four roles, formulas, contracts and the bg-only decision
  with reasons, and states that nothing is built.
- **D2** Given the v1.3.0 tree, when `tokens.json` is read, then it contains no `accent-hover`, `accent-selected`,
  `accent-pressed` or `accent-tint-text`.
- **D3** Given the CHANGELOG, when read, then the tint ladder is listed as specified and not shipped.

## 9. Files per downstream leaf

Paths are repo-relative. "Generated" files are produced by running the build or tests, never hand-edited.

### .2 Pass suggest (deliverable A)

Modify:
- `kitchen/src/pass.js` (add `suggest()`, attach to results, export)
- `kitchen/src/passview.js` (render the suggestion, `onSuggest` hook)
- `kitchen/src/passview.css` (swatch and suggestion line)

Create:
- `kitchen/test/suggest.mjs` (A1 to A11; unit, loads the same sandbox files as `pass.mjs` with and without `sprinkles.js`)
- `kitchen/test/suggest-browser.mjs` (A12 to A15; same pattern as `pass-browser.mjs`)

Read only: `frosting/src/readability.js` (`hsl`, `hex`, `lum`, `contrast`), `kitchen/src/sprinkles.js`. No frosting or
delivery file is touched, no build is needed. Run `node kitchen/test/suggest.mjs`, `pass.mjs`, `suggest-browser.mjs`,
`pass-browser.mjs`.

### .3 Numeric accent (deliverable B)

First, before any edit: create `frosting/test/backcompat.mjs`, `frosting/test/fixtures/roles-v1.2.json`,
`delivery/test/backcompat.mjs`, `delivery/test/fixtures/css-v1.2.css` and capture the fixtures (section 7.2).

Modify:
- `frosting/tokens.json` (add `channels`)
- `frosting/scripts/build.mjs` (emit the three in `:root` and both dark blocks; add `channels` to `tokens.js`)
- `frosting/src/readability.js` (`accentParts`, `channelVars`, export)
- `frosting/src/panel.js` (`apply()` sets the three; reset clears them)
- `frosting/catalog/index.html` (live preview and reset path)
- `delivery/src/apply.js` (`colorCss` adds `channelVars`)

Create: `frosting/test/accent.mjs` (B1 to B7), `delivery/test/accent.mjs` (B8 to B10, B13), `kitchen/test/accent-browser.mjs`
(B11, B12).

Generated: `frosting/dist/frosting.css`, `frosting/dist/tokens.js`, `delivery/dist/mise.css`, `mise.js`, `mise.mjs`.

### .4 New roles (deliverable C)

Modify:
- `frosting/tokens.json` (13 roles with `calc`, 23 contracts)
- `frosting/scripts/build.mjs` (write calculated roles as `color-mix()`, no dark line)
- `frosting/src/readability.js` (`complete()` and its search)
- `frosting/src/gallery.js` (`derive`, brand looks, `spread`)
- `frosting/src/store.js` (`clean`: complete, keep `overrides`)
- `frosting/src/panel.js` (override UI, re-complete on edit, clear on new look)
- `frosting/src/panel.css` ("calculated" caption, "Use calculated" link; `--fr-*` roles only, nothing under 12px)
- `kitchen/src/recipe.js` (`clean`, `fromLook`, `toLook`: overrides and `complete()`)
- `kitchen/src/standards.js` (`TEXT_ROLES`; `fit()` fits base roles then calls `complete()`)

Create: `frosting/test/roles.mjs` (the removal guard and C1 to C13, C20, C21), `kitchen/test/roles.mjs` (C14 to C19, C22,
C25, A10-style pass check), `delivery/test/roles.mjs` (C24, X1 delivery half), `kitchen/test/roles-browser.mjs` (C23).

Generated: `frosting/dist/frosting.css`, `tokens.js`, `store.js`; `delivery/dist/mise.css`, `mise.js`, `mise.mjs`.

Not touched: `delivery/src/apply.js` and `delivery/src/dtcg.js` need no change (new roles arrive through the colours
map); `frosting/test/run.mjs` and `kitchen/test/pass.mjs` need no edit and must keep passing as they are.

### .5 Integrate and release prep

Modify:
- `package.json` (`version` 1.3.0)
- `frosting/tokens.json` (`version` 1.3.0, so the generated banner and the catalog header read v1.3.0; assumption)
- `frosting/package.json` (`test`: add `node test/accent.mjs && node test/roles.mjs && node test/backcompat.mjs`)
- `kitchen/package.json` (`test:unit` += `suggest.mjs`, `roles.mjs`; `test:browser` += `suggest-browser.mjs`,
  `accent-browser.mjs`, `roles-browser.mjs`)
- `delivery/test/run.mjs` (suite list += `accent.mjs`, `roles.mjs`, `backcompat.mjs`)
- `README.md`, `frosting/README.md`, `kitchen/README.md`, `frosting/SPEC.md` (role table, groups, contracts, section 2
  "calculated roles", section 4 contracts, a numeric-accent usage section with the grey-accent line, the plain-CSS
  limit), `CHANGELOG.md` (Unreleased becomes v1.3.0: A, B, C, D specified)
- `docs/NOW.md` (state)

Run: `npm run build`, `npm test`, `npm run test:catalog`. Review `git diff` of generated files against the list in 7.3.

Outside the repo, update the Fournee skill copy: `~/.claude/skills/fournee/SKILL.md` (token list: 13 roles, three
accent properties, the grey-accent line), `~/.claude/skills/fournee/tokens/frosting__dist__frosting.css` (copy of the
new `frosting.css`), `~/.claude/skills/fournee/reference/frosting-README.md` and `kitchen-README.md` (copies).

`.5` is the only leaf that edits `package.json` scripts, `delivery/test/run.mjs`, the READMEs, SPEC and CHANGELOG, so
those never conflict.

### .6 QA

Review against sections 3 to 8. Specific checks: the removal guard on a scratch copy (X2); fixtures untouched since
capture; no hand edits in generated files; only the files in 7.3 changed among generated ones; design-system rules in
`passview.css` and `panel.css` (roles only, 12px floor); `git status` shows no push and no commit by leaves.

### Do .2, .3 and .4 overlap?

- **.2 is disjoint from .3 and .4.** It touches only `kitchen/src/pass.js`, `passview.js`, `passview.css` and two new
  kitchen tests. None of those is in the .3 or .4 lists. It can run in parallel with either, or both.
- **.3 and .4 overlap**, in four source files and two generated sets:
  `frosting/tokens.json`, `frosting/scripts/build.mjs`, `frosting/src/readability.js`, `frosting/src/panel.js`;
  generated `frosting/dist/*` and `delivery/dist/*`. They must not run in parallel. Their tests also each run the
  frosting build, which rewrites `dist/`.
- **Recommended order: .3 then .4.** .3 is small and does the fixture capture from the unchanged tree, which .4's
  backcompat checks depend on. .4 then adds roles on top. Parallel plan: start .2 and .3 together; start .4 when .3
  closes. If .2 is still running when .4 lands, re-run `suggest.mjs`, `pass.mjs` and the two pass browser tests after
  .4 (the preset sweep depends on the contract list). .5 re-runs everything.
- .5 waits for all three, as the task graph already says.

## 10. Decisions and rationale

| Decision | Choice | Why | Cost of reversing |
|---|---|---|---|
| Role or derived | All 13 in `roles` with a `calc` block | Needs contracts, fitting, override, a place in the colours map (section 2) | Low before release; a name is public once shipped |
| Fitting axis | Mix weight along a two-role line, integer percent | Same arithmetic as the CSS expression, so defaults equal CSS; endpoints guarantee a pass | Low |
| Override shape | Named `overrides` map beside `colors` | A stored calculated value cannot be told from a pick; follows `fills` precedent | Medium: on-disk shape |
| Build-time CSS | `color-mix()` expressions, no dark lines | Roles follow base roles in plain CSS; same as `accent-soft` | Low |
| Contract for `text-secondary` | 7:1 | A 4.5:1 tier adds nothing over `muted` *(assumption)* | Low: change two numbers |
| Contract for `border-strong` | 3:1 on `bg` and `surface` | Usable as a control edge *(assumption)*; overlaps `control-border` knowingly | Low |
| `*-soft` weight and rule | 12%, `text` 7:1, fitted down | Same step as `accent-soft`; alert body stays AAA | Low |
| `suggest` search | Lightness only, 0.05 steps, same side first, `null` if none | The ask; never silently changes hue or reaches for black | Low |
| `suggest` on Sprinkles `info` | Not attached | Sprinkles already offers Plain | Low |
| Accent parts source | HSL of sRGB `accent`, 1 decimal | One function already in use; round-trips exactly | Low |
| Grey accent | `h` 0, `s` 0%, documented | Owner accepted | n/a |
| Tint ladder | Spec only, `bg`-only mixing | Section 6.2 | n/a |
| `tokens.json` version | 1.3.0 in .5 *(assumption)* | The banner and catalog header read it; the package versions elsewhere are separate numbers | Trivial |

No decision in this spec needed the owner, so no `tally human` was raised.

## 11. Non-goals

- Building the tint ladder (section 6).
- Hue or saturation tokens for any role other than `accent`, a `--fr-accent-chroma`, OKLCH channels.
- Emitting the accent parts into the DTCG export or the desktop JSON.
- Updating `--fr-accent-h|s|l` when a plain-CSS page sets `--fr-accent` by hand (CSS cannot compute it).
- Wiring `onSuggest` into the Kitchen shell, or a "Use this" action in the steps UI.
- A suggestion for gradient fills, licence, type or standards-profile checks, or for Sprinkles `info` notes.
- Suggestions that change hue or saturation, or move the ground.
- Changing any existing role, contract, derived colour, preset, or the Sprinkles rules.
- Using the new roles in Fontdant's `INK` map or X-checks (`caption` stays on `muted`).
- Contracts or `calc` for `derived` entries (`accent-soft`, `control-border`, `scrim`, `tip-*`, `focus-ring`).
- Syntax-highlighting or `code-*` roles.
- Adding labels for the new roles to the catalog's `spec.html` house table.
- Publishing the npm package, or any change on the consumer's side.
