# 🍳 kitchen

The parts frosting and fontdant share. Plain scripts on `window`, also `require()`-able, no framework.

| File | Global | What it is |
|---|---|---|
| [`src/store.js`](src/store.js) | `KitchenStore` | the storage engine: published / draft / up to 40 favorites behind four adapters (`memoryAdapter`, `localStorageAdapter(ns)`, `httpAdapter(baseUrl)`, `pywebviewAdapter()`); `createStore(adapter, { defaults, clean, keys, favoriteKey, favoriteName })` — the caller brings validation |
| [`src/recipe.js`](src/recipe.js) | `KitchenRecipe` | the **recipe** `{ name, scheme, client, frosting: { colors }, fontdant: { … } }` with `fontdant` allowed empty; `clean`, `empty`, `fromLook`/`toLook` (frosting look bridge), `createRecipeStore(adapter, { colors, scheme })` |
| [`src/shell.js`](src/shell.js) + [`shell.css`](src/shell.css) | `KitchenShell` | the panel shell: a tab bar (Frosting, Fontdant…) and a lazily mounted body per tab; keyboard ← →; `badge(id, text, level)` on a tab; frosted with `--fr-*` roles only |
| [`src/pass.js`](src/pass.js) | `KitchenPass` | **the pass**: `run(recipe, { rendered })` → frosting's contracts unchanged + fontdant's T1–T17 + the cross-checks X1–X9, one list of `{ id, label, level, ok, pending, detail, source }`, plus one `(fg, bg, size, weight, face)` record per style and background (X9) |
| [`src/render.js`](src/render.js) + [`specimen.html`](src/specimen.html) | `KitchenRender` | the rendered check T13: every style of a look at a 320px viewport, at the look's largest scaling, with the WCAG 1.4.12 spacing overrides: no clipping, no sideways scroll, mono wraps, zoom never blocked |
| [`src/sprinkles.js`](src/sprinkles.js) | `KitchenSprinkles` | **Sprinkles** (decisions J1–J4): `plain(colors)` darkens each muted grey just enough for 7:1 (hue kept); `effective(recipe)`; `css(colors, { prefix })` for `prefers-contrast: more` and the on-page switch; `toggle(el, …)` the panel switch with a side-by-side compare; `contrastSwitch(el)` + `bootScript()` the optional High contrast button |
| [`src/passview.js`](src/passview.js) + [`passview.css`](src/passview.css) | `KitchenPassView` | the pass in the panel: failing first, then warnings, then what passed; runs T13 in a hidden specimen frame |

## How frosting uses it

`frosting/src/store.js` is now frosting's face on `KitchenStore`, with the API it always had
(`FrostingStore.createStore(adapter, defaults)`, `clean`, `cleanFavorites`, the adapters, `HEX`) and the same
storage keys (`theme`, `draft`, `favorites`). `frosting/dist/store.js` bundles kitchen's engine ahead of it, so
a page that loads one `store.js` (the catalog, or a project's vendored copy) keeps working with no change.

## The recipe

```js
var recipes = KitchenRecipe.createRecipeStore(KitchenStore.localStorageAdapter('myapp'), { colors: FrostingTokens.light });
recipes.load().then(function (s) { /* s.theme, s.draft, s.favorites are recipes */ });
recipes.saveDraft({ name: 'Corner Bakery', client: 'Corner Bakery Ltd', frosting: { colors: { accent: '#B4532A' } }, fontdant: {} });
```

A recipe may override a calculated colour role by name: `frosting: { colors: {…}, overrides: { 'border-strong': '#7A766F' } }`.
Only calculated roles (see frosting's SPEC §2) are accepted; other keys and non-hex values are dropped. `clean` fits every
calculated role from the base roles (under the recipe's accessibility standard and its gradients) and keeps the overrides.
`fromLook` and `toLook` carry them as the look's `colors.overrides`.

Recipes live under their own keys (`recipe`, `recipe.draft`, `recipe.favorites`), beside a project's old frosting
look. If no recipe is saved yet but a published frosting look is, `load()` starts from that look
(`adoptedFrostingLook: true`). The fontdant half keeps only `mode scaling faces dials roles styles fonts`;
deeper checks (floors, weights, fit) belong to fontdant and the pass.

## The shell

```js
KitchenShell.mount(el, { tabs: [
  { id: 'frosting', label: 'Frosting', mount: function (body) { return FrostingPanel.mount(body, { store: store }); } },
  { id: 'fontdant', label: 'Fontdant', disabled: true, note: 'Arrives in build phase 5.' },
] });
```

## Sprinkles

A recipe carries `sprinkles` (on unless turned off). On: the designed greys (all ≥ 4.5:1), and the pass shows X4's 7:1
advice as an info note, "Plain version available". Off ("Plain"): the greys visitors see, and the pass checks, are
`KitchenSprinkles.plain()`'s. Either way, put `KitchenSprinkles.css(colors)` in the page so visitors with
`prefers-contrast: more` get Plain; a project may also add `contrastSwitch()`. Plain greys are computed, never stored.

## The pass

```js
var res = KitchenPass.run(recipe);          // res.ok is false when any hard check fails
KitchenPass.failing(res, 'hard');           // e.g. ['T5', 'X4']
```

Which colour a type role is painted in decides its cross-checks. Defaults: display, heading, body, ui, mono and
metric use `text`; caption and eyebrow use `muted`; `ui-button` uses `button-text` on `button`. A recipe overrides
this per role (`fontdant.roles.caption.color = 'accent-text'`, or a hex). Text is checked on `bg` and `surface`.

**Suggestions.** A failed or warned contrast result (a frosting contract, X2, X3, X4, X5, X6's colour part, X8) carries an
optional `suggest` field: the nearest colour of the same hue, moving lightness only, that reaches the contrast asked for
on every ground the pass checks that colour on. It is absent when not applicable, `null` when no lightness works, or

```js
{ role: 'muted', from: '#455768', to: '#445566', direction: 'darker', deltaL: 0.6, target: 7, ratio: 7.01,
  against: [{ role: 'bg', hex: '#F2F5F8', ratio: 7.01, min: 7 }, …] }   // illustrative values
```

`role` is the role that moves (`null` for a literal hex), `deltaL` the lightness change in HSL points, `ratio` the worst
ratio over `against`, floored so `7.00` never hides 6.996. When `suggest` is `null` the result also has `suggestTarget`,
the strictest ratio it was judged against, so a view can say "no colour of this hue reaches 7:1 here".
`KitchenPass.suggest(fg, rules, opts)` is the pure function behind it (`rules` is `[[groundHex, min, groundRole?], …]`; the optional third element names the ground role and fills `against[].role`). The pass view
shows the swatch, the hex and the ratio, and a "Use this" button when you give `KitchenPassView` an `onSuggest` hook.

Hard checks fail a recipe; warnings badge it; info notes (level `info`) only advise. Licence checks L1–L6 join
when `FontdantLicence` is loaded: `run(recipe, { domain, injection, traffic, subset })`. A project's own roles go in `fontdant.extensions.roles` (standard
role schema plus `base`, the core role whose job it does). They are checked like core roles, and **the 12px floor
holds for them too** (decided at phase 4 on a HUD gauge: no floor exceptions).

`test/fixtures/hud-gauge.recipe.json` is a real desktop HUD gauge read into a recipe, kept as a test fixture.

## Develop

```
npm test   # unit: recipe round-trips through all four adapters, FrostingStore alias, look adoption,
           #       a replay of a workbench app's store calls
           # unit: the pass (defaults, 26 presets, 3,000 lucky, the 300@10px-on-muted case, X1–X9, T13 input,
           #       extensions, the HUD gauge fixture)
           # unit: suggestions (suggest.mjs), calculated roles and overrides in recipes and fitting (roles.mjs)
           # browser (Chromium): the shell with frosting's real panel, preset → draft → publish → reload
           # browser (Chromium + Firefox): T13 at 320px; the pass tab in the panel
           # browser (Chromium): the suggestion in the pass view, the live numeric accent, the override UI
```
