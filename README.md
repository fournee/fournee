# 🥖 Fournée

*Une fournée*: a batch fresh from the oven. One recipe, many batches.

Fournée is a theming toolkit for web and desktop apps. A page never names a colour or a font: it names the
**role** ("surface", "accent", "heading", "body"), and a saved **recipe** supplies the values for every role. Change
the recipe and every page that uses it changes with it, and stays readable, because every look is checked against
accessibility rules before it ships.

[![Test](https://github.com/fournee/fournee/actions/workflows/test.yml/badge.svg)](https://github.com/fournee/fournee/actions/workflows/test.yml)
[![MIT licence](https://img.shields.io/badge/licence-MIT-informational)](LICENSE)

## What's in the box

| Part | What it does |
|---|---|
| [**Frosting**](frosting/) | Colour by role (`--fr-*`): roles with light and dark defaults, readability contracts, ready-made looks, gradients, a colour panel |
| [**Fontdant**](fontdant/) | Type by role (`--fd-*`, `.fd-*` classes): a size ladder per mode, type contracts, the fit, and a library of 39 self-hosted open-licence font families |
| [**Kitchen**](kitchen/) | The shared parts: the recipe format, the store, **the pass** (checks a look against WCAG 2.2 and 20 other standards), Sprinkles, and the four-step panel |
| [**Delivery**](delivery/) | The same recipe in plain HTML, React, Svelte, Electron, pywebview, Qt and tkinter, plus a [DTCG](https://www.designtokens.org/) 2025.10 export |

The **catalog** shows all of it live, including a playground where you build a look in four steps (Frosting →
Fontdant → Spec → Expo) and take the recipe with you.

## Try it

You need [Node.js](https://nodejs.org) 20 or later.

```
git clone https://github.com/fournee/fournee.git
cd fournee
npm run install:frosting && npm run install:fontdant
npm run playground        # the whole panel on a sample page, in your browser
```

On Windows you can also double-click `scripts/try-the-panel.cmd`.

## Use it in a project

1. **Make a recipe.** Build a look in the playground or the catalog's four-step page, then *Download recipe.json*.
   Save it in your project, for example as `type/recipe.json`.
2. **Build the files your project commits:**
   ```
   node path/to/fournee/delivery/scripts/project.mjs type/recipe.json src/theme
   ```
   This writes `fontdant.css`, the recipe's type (`mise-type.css`), the fonts the look uses and the recipe itself.
   Copy `frosting/dist/frosting.css` alongside for the colour roles. Your project then builds without Fournée.
3. **Style by role, never by value:**
   ```css
   .card  { background: var(--fr-surface); color: var(--fr-text); border: 1px solid var(--fr-border); }
   .price { color: var(--fr-accent-text); }
   ```
   ```html
   <h2 class="fd-heading-md">Today's bake</h2>
   <p class="fd-body">Every size, face and colour on this page comes from the recipe.</p>
   ```
4. **Change the recipe, rebuild, done.** Never edit the copied files; change the recipe or Fournée and re-run step 2.

React, Svelte, Electron and Python apps have their own wrappers: see [delivery/README.md](delivery/README.md).

> **A note on names:** Fournée was first built under the working name *Mise*. Code-level names keep that prefix for
> compatibility (`MiseApply`, `.mise-*` classes, `mise.js`, `mise-type.css`, the `mise/` output folder). They are
> part of Fournée's API, not a separate project.

## Develop

```
npm run install:frosting   # likewise install:fontdant (adds Playwright's browsers) and install:delivery
npm test                   # every part's build and tests
npm run test:catalog       # build the catalog and check it in a browser
npm run build              # rebuild the committed dist/ files after changing a source
```

Each part keeps its own `package.json`; the root scripts delegate to them. Built files in `*/dist/` are committed so
projects can copy them; never edit them by hand.

A few tests are optional and skip without their tools: Python delivery (pywebview, PyQt5, fontTools) and
Electron (`ELECTRON_PATH`). Copy [`.env.example`](.env.example) to `.env` to set paths for your machine.

| Path | What |
|---|---|
| [`frosting/`](frosting/) | colour roles ([`tokens.json`](frosting/tokens.json)), contracts, gallery, store, panel |
| [`fontdant/`](fontdant/) | type roles ([`type-tokens.json`](fontdant/type-tokens.json)), fit, font library, the Fontdant tab |
| [`kitchen/`](kitchen/) | recipe format, store, the pass, standards, Sprinkles, the panel shell and steps |
| [`delivery/`](delivery/) | wrappers and exports |
| [`catalog/`](catalog/) | the catalog site (`node catalog/build.mjs`; [`wrangler.example.jsonc`](catalog/wrangler.example.jsonc) to host it on Cloudflare) |
| [`docs/research/`](docs/research/) | research notes behind the standards and gradients |
| [`docs/decisions/`](docs/decisions/) | design decisions (ADRs) |

## Using Fournée with Claude

`Install-Fournee-Everywhere.bat` (Windows) installs a `fournee` skill for Claude Code from wherever you cloned this
repo, adds a short design-system rule to your global `CLAUDE.md` (with a backup first) and builds `fournee-skill.zip`
for claude.ai. It asks before each step. The catalog's *Copy instructions for Claude* button hands a recipe to Claude
with the steps to apply it.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and please follow the
[code of conduct](CODE_OF_CONDUCT.md). Security problems: see [SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE). The fonts in `fontdant/fonts/` keep their own open licences; each family's folder has its
`LICENSE.txt`.
