# 🧁 Frosting

The colour half of Fournée: a re-theming toolkit. A page never names a colour, it names the
colour's **role**; a *look* is a set of values for the roles. This repo holds the role list,
the readability engine, the palette gallery, the storage layer, the panel UI, and a
catalog page that demos all of it.

- **Read first:** [`SPEC.md`](SPEC.md) — the rule, the roles, the contracts, the parts.
- **Source of truth:** [`tokens.json`](tokens.json) — the roles. Everything else is built from it.
- **Catalog:** what the current version looks like, with a recipe builder for picking parts.
  Build it locally with `node catalog/build.mjs` at the repo root, then open `catalog/site/index.html`.

## Use it in a project

"Standard frosting" = parts A + B + C + D:

```html
<link rel="stylesheet" href="frosting.css">   <!-- A: the roles, light + dark defaults -->
<script src="tokens.js"></script>              <!-- A: the role list as data -->
<script src="readability.js"></script>         <!-- B: contrast, fit, check -->
<script src="gallery.js"></script>             <!-- C: presets, lucky, derive -->
<script src="store.js"></script>               <!-- D: draft / published / favorites + adapters -->
<script src="panel.js"></script><link rel="stylesheet" href="panel.css">   <!-- the UI -->
```

```js
var store = FrostingStore.createStore(FrostingStore.localStorageAdapter('myapp'), FrostingTokens.dark);
FrostingPanel.mount(document.getElementById('frosting'), { store: store });
```

Then write CSS against the roles: `var(--fr-surface)`, `var(--fr-ok)`, `var(--fr-series-1)`, `var(--fr-tag-1)`…
Apply the published look before first paint (inject a `<style>` at build/serve time); see SPEC §6.

**Calculated roles.** Thirteen roles are worked out from the others and fitted to pass their contrast contracts:
`text-secondary`, `accent-text-hover`, `button-hover`, `border-strong`, and `-soft`, `-text` and `-border` for each of
`ok`, `warn` and `bad`. A recipe can override one by name (`frosting.overrides`). In plain CSS they are `color-mix()`
expressions that follow your base roles but carry no contrast guarantee; build from a recipe for the guarantee.
See SPEC §2 and §4.

**Numeric accent.** `--fr-accent-h` (a bare hue in degrees), `--fr-accent-s` and `--fr-accent-l` (with `%`) sit beside
`--fr-accent`. One line makes hue-driven CSS follow the look: `:root { --hue: var(--fr-accent-h, 210); }`. A grey
accent has hue `0` and saturation `0%`, so multiply `--fr-accent-s` into your own saturation where grey should stay
grey. See SPEC §4.

Storage adapters: `localStorageAdapter(ns)`, `httpAdapter(baseUrl)` (GET/PUT `{base}/{key}`),
`pywebviewAdapter()` (Python exposes `get_frosting`/`set_frosting`), `memoryAdapter()`.

## Develop

```
npm test        # builds dist/ from tokens.json, then checks every preset, 3000 lucky looks,
                # locked backgrounds, both default palettes, and the store; then the numeric accent,
                # the calculated roles (including a guard that fails if one is removed), and
                # back-compat against a frozen copy of v1.2.0 (no existing role value or contract moved)
npm run catalog # assembles site/ for Cloudflare Pages
```

To add a role: edit `tokens.json` (name, group, label, use, light, dark, and its contracts),
run `npm test`, and teach `derive()` in `src/gallery.js` how to make it. Nothing else. A role that is calculated from
others instead gets a `calc` block (see SPEC §2) and needs no change to `derive()`.

## Where it came from

Originally written for an earlier site's theming, with the status and series roles added for
dashboards, and an earlier console app's engine as the reference for parts E–G.
