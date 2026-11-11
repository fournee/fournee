# 🍥 fontdant

The type half of Fournée. A page never names a font, it names the font's **role**
(`var(--fd-body-size)`, `.fd-heading-lg`); a look swaps the **faces** and **dials** behind the roles
and the layout stays put.

- **Source of truth:** [`type-tokens.json`](type-tokens.json): roles, steps, weights, face slots (with
  their fit targets), modes, variants, scopes, features, contracts. Everything else is generated.
- **Font library:** [`fonts/library-source.json`](fonts/library-source.json) names the families
  (the curated picks: 32 for presets and lucky, 5 pickable by hand) and the default look
  **Inter / Inter / JetBrains Mono**; `fonts/<id>/` holds each family's latin woff2 and licence;
  `fonts/library.json` is the measured library (generated).
- **Generated** (`npm run build`, do not edit `dist/`): `dist/fontdant.css` (longhand variables and
  classes), `dist/type-tokens.js` (`window.FontdantTokens`), `dist/library.js` (`window.FontdantLibrary`),
  `dist/fontdant-fonts.css` (the default look's `@font-face` aliases and fallbacks), `dist/metrics.js`
  (`window.FontdantMetrics`: fontkit + the metrics code for the browser, loaded only by Add a font).
- **Logic** (plain scripts, also `require()`-able): [`src/typecheck.js`](src/typecheck.js)
  (`FontdantCheck`: resolve, check, fit, cssVars), [`src/fontface.js`](src/fontface.js)
  (`FontdantFonts`: fit aliases, metric-matched fallbacks, face stacks, preloads),
  [`src/metrics.mjs`](src/metrics.mjs) (Node: read any font file's metrics, make an entry; the shared code is
  `src/metrics-core.mjs`), [`src/gallery.js`](src/gallery.js) (`FontdantGallery`: 16 presets, pairings,
  🎲 lucky), [`src/licence.js`](src/licence.js) (`FontdantLicence`: L1–L6, lucky's filter),
  [`src/emit.js`](src/emit.js) (`FontdantEmit`: the before-first-paint head), [`src/panel.js`](src/panel.js) +
  [`panel.css`](src/panel.css) (`FontdantPanel`: the Fontdant tab, its store and the added-fonts shelf).

## The shape

| Layer | Variables | What a look does with it |
|---|---|---|
| faces | `--fd-face-display` `--fd-face-text` `--fd-face-mono` | swaps the families; each value is an alias stack (`"Inter fd-text", "Inter fd-text fallback", "Inter", system-ui…`) |
| weights | `--fd-weight-regular/emph/title/bold/display` (400/500/600/700/800) | nudges the dials |
| steps | `--fd-step-xs … --fd-step-display` × `--fd-scaling` | picks a **mode** (`reading` default, `dense` via `data-fd-mode`) and nudges dials |
| roles | `--fd-<style>-family/-size/-weight/-leading/-tracking/-numeric/-transform/-style` | rarely overrides; pages only ever read these |

Styles emitted: `display` · `heading` (`-xl -lg -md -sm`) · `body` (`-sm`) · `ui` (`-sm`; variants
`--button --nav --input`) · `caption` · `eyebrow` (variants `--upper --lower`) · `mono` (`-block`
`-inline`) · `metric` (optional `data` group). Scope `data-fd-scope="embedded"` compresses headings
inside messages and cards. Every class sets `font-synthesis: none`; there is no `font:` shorthand.

## Fit

Each face slot carries a target: `display` normalises **cap height** to 0.7275 of the em, `text`
normalises **x-height** to 0.5459, `mono` borrows `text`'s target (the two interleave line by line).
The targets are Inter's own ratios, so the default look renders at 100%. For every font × slot the build
emits an `@font-face` alias `"<Family> fd-<slot>"` with `size-adjust = target ÷ (font metric ÷ UPM)`,
plus a `"… fallback"` alias on a local font (Arial, Times New Roman or Courier New) with capsize-style
`size-adjust` and `ascent/descent/line-gap-override`, so the swap from fallback to web font does not jump.
With the roles' explicit unitless leading, line boxes never depend on the face.

Measured in Chromium and Firefox (`test/browser.mjs`): cap heights of Inter, Fraunces and Anton agree
within 0.04% through their aliases (23% apart unadjusted); x-heights of Inter, Geist and Source Serif 4
within 1% at body size; line boxes identical; layout shift 0 with fonts delayed 400ms and 0 cached.
Variable fonts with an `opsz` axis change x-height per optical instance, so text faces are judged at
body size, not display size. Safari and iOS are on the later list (stable Safari lacks the three
overrides; `size-adjust` works there).

`FontdantCheck.fit(look)` raises any dial below its floor, bumps steps to keep the order, clamps scaling,
snaps a weight the face lacks to the nearest it has (Anton has only 400), badges a face whose hhea and
typo tables disagree (F5), and returns the notes. `FontdantCheck.check(look)` runs T1–T12 and T14–T17;
T13 is rendered by kitchen's pass. A font whose licence forbids metric-override CSS is not fitted (100%).

## Bring your own font

Any font file becomes an entry the same way the library was built:

```js
import { metricsFromFile, makeEntry } from './src/metrics.mjs';
const entry = makeEntry({ id: 'client-sans', family: 'Client Sans', files: [{ file: 'client-sans.woff2', weight: '100 900' }],
                          metrics: metricsFromFile('client-sans.woff2'), licence: { id: 'custom', licensee: 'Client Ltd' } });
```

In the panel, **＋ Add a font** does this in the browser (same code, `dist/metrics.js`): drop the files (or an
Adobe Fonts kit id), the metrics and fit appear, the licence fields are optional (H3), and the font is kept on
the added-fonts shelf for that client only. A recipe that uses it carries the entry in `fontdant.fonts`;
`FontdantFonts.use(look.fonts)` registers it (every function that takes a look does this itself), and its files
keep their own `src` (a URL the project serves, or a data: URL). In another client's recipe the licence check
warns rather than blocks.

## Gallery, panel and first paint

- `FontdantGallery.presets()`: 16 fitted looks leaning to compact sans (Default = Inter / Inter / JetBrains Mono);
  `lucky(ctx)` rolls lucky-marked library fonts whose licence covers `ctx.client` / `ctx.domain`, then fits.
- `FontdantPanel.mount(el, { store, fontShelf, client, baseUrl, metricsUrl, saveFontFile? })`: the Fontdant tab.
  `FontdantPanel.createStore(adapter)` keeps the type look under `type`, `type.draft`, `type.favorites`.
- `FontdantEmit.head(look, { baseUrl })` → `{ html, htmlAttrs }`: preloads, `@font-face`, `:root` and the mode
  attribute, for a server to write into the first bytes (a Cloudflare Worker can do it with HTMLRewriter).

## Develop

```
npm run fetch   # download the library's files and licences from Google Fonts (idempotent)
npm run build   # measure fonts/ → fonts/library.json; generate dist/
npm test        # build, unit checks (both modes, CSS, fit, console dial map, library, BYO), browser fit (Playwright)
```

To add a role, step, variant, mode or contract: edit `type-tokens.json`, run `npm test`. To add a
family to the library: add it to `fonts/library-source.json`, run `npm run fetch && npm test`.
