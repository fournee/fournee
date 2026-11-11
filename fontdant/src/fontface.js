/* fontdant · font faces: the fit aliases and the metric-matched fallbacks
   For a look's three faces this emits the @font-face rules a page needs (proposal §5):
     1. one alias per font × slot, "<Family> fd-<slot>", with size-adjust = slot target ÷ (font metric ÷ UPM),
        so swapping the family keeps cap height (display slot) or x-height (text, mono) and, with the roles'
        explicit unitless leading, the line boxes;
     2. one metric-matched local() fallback per alias, "<Family> fd-<slot> fallback", the capsize / next/font
        method: size-adjust from average character width, then ascent/descent/line-gap overrides computed
        against the adjusted em, so the swap from fallback to web font does not jump (Chrome, Firefox; Safari
        ignores the three overrides until 27.4/28).
   A recipe's own fonts (Add a font: fontdant.fonts, scoped to that client) sit beside the library: use(fonts)
   registers them, and every function that takes a look registers look.fonts first. Their files carry a full
   `src` (a URL the project serves, or a data: URL) instead of a library path.
   Licence gate (proposal §5.8): a font whose licence forbids metric-override CSS gets no size-adjust (k = 1).
   A look may also turn the fit off for a slot (look.fit = { display: false }): that slot's face renders at its
   natural size (k = 1), for a project whose sizes were drawn for that face (a site whose headings were drawn for Alegreya).
   Pure logic, no DOM. Plain script (window.FontdantFonts) or require()-able. Needs FontdantTokens and
   FontdantLibrary (dist/library.js) on the same root. */
(function (root) {
  'use strict';
  function T() { return root.FontdantTokens; }
  function L() { return root.FontdantLibrary; }
  var SLOTS = ['display', 'text', 'mono'];
  function pct(x) { return (Math.round(x * 10000) / 100) + '%'; }
  function q(s) { return '"' + String(s).replace(/"/g, '\\"') + '"'; }

  /* The target a slot normalises to: {metric, target}; a slot with matchFace borrows another slot's target. */
  function slotTarget(slot) {
    var f = T().faces[slot] && T().faces[slot].fit; if (!f) return null;
    if (f.matchFace) { var o = slotTarget(f.matchFace); return o ? { metric: o.metric, target: o.target, matchFace: f.matchFace } : null; }
    return { metric: f.metric, target: f.target };
  }
  function ratioFor(entry, metric) { var r = entry.metrics.ratios; return metric === 'cap-height' ? r.cap : r.x; }
  /* k: the size-adjust factor that puts this font's metric on the slot's target (1 = untouched). */
  function fitAllowed(entry) { var m = entry.licence && entry.licence.modify; return !(m && m.metric_override_css === 'forbidden'); }
  var fitOff = {};
  /* A look's fit switches: { display|text|mono: false } = that slot keeps its face's natural size. Every function
     that takes a look sets them (as it registers look.fonts); useFit(null) turns every fit back on. */
  function useFit(fit) { fitOff = {}; if (fit && typeof fit === 'object') SLOTS.forEach(function (s) { if (fit[s] === false) fitOff[s] = true; }); return api; }
  function fitOn(slot) { var t = slotTarget(slot), m = t && t.matchFace; return !fitOff[slot] && !(m && fitOff[m]); }
  function fitFactor(entry, slot) { var t = slotTarget(slot); if (!t || !fitAllowed(entry) || !fitOn(slot)) return 1; var r = ratioFor(entry, t.metric); return r ? t.target / r : 1; }
  function aliasName(entry, slot) { return entry.family + ' fd-' + slot; }
  function facesOf(look) {
    var d = (L() && L().defaultLook) || {}, out = {};
    SLOTS.forEach(function (s) { out[s] = (look && look.faces && look.faces[s]) || d[s] || null; });
    return out;
  }
  var client = {};
  function use(fonts) { client = fonts && typeof fonts === 'object' ? fonts : {}; return api; }
  function clientFonts() { return client; }
  function entryOf(id) { return (L() && L().fonts && L().fonts[id]) || (id && client[id]) || null; }
  function isClient(id) { return !!(id && client[id] && !(L() && L().fonts && L().fonts[id])); }
  var FORMAT = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
  function format(file) { var m = /\.(\w+)(\?|$)/.exec(file || ''); return FORMAT[m && m[1].toLowerCase()] || 'woff2'; }

  /* The font-family stack for a slot: alias, its fallback, the real family, the slot's generic stack. */
  function faceStack(fontId, slot) {
    var e = entryOf(fontId), generic = (T().faces[slot] && T().faces[slot].generic) || 'sans-serif';
    if (!e) return fontId ? q(fontId) + ', ' + generic : generic;
    // a font with no files (an Adobe Fonts kit) is loaded by its own name; the fallback only covers the wait
    if (!e.files || !e.files.length) return [q(e.family), q(aliasName(e, slot) + ' fallback')].join(', ') + ', ' + generic;
    return [q(aliasName(e, slot)), q(aliasName(e, slot) + ' fallback'), q(e.family)].join(', ') + ', ' + generic;
  }

  /* @font-face blocks for one font in one slot. opts: { baseUrl ('fonts'), display ('swap'|'optional'|'block') } */
  function faceBlocks(fontId, slot, opts) {
    opts = opts || {};
    var e = entryOf(fontId); if (!e) return { css: '', preloads: [], k: 1, alias: null };
    var base = (opts.baseUrl == null ? 'fonts' : opts.baseUrl).replace(/\/$/, '');
    var k = fitFactor(e, slot), alias = aliasName(e, slot);
    var display = opts.display || (T().faces[slot] && T().faces[slot].loading) || 'swap';
    var m = e.metrics, lines = [], preloads = [], hasItalic = false;
    e.files.forEach(function (f) {
      var italic = f.style === 'italic'; if (italic) hasItalic = true;
      var weight = e.weights.kind === 'variable' ? e.weights.min + ' ' + e.weights.max : f.weight;
      var url = f.src || base + '/' + e.id + '/' + f.file;
      if (!italic && !/^data:/.test(url)) preloads.push(url);   // italics load on demand; only the upright files are preloaded
      lines.push('@font-face {\n  font-family: ' + q(alias) + ';\n  src: url(' + q(url) + ') format("' + format(f.file || f.src) + '");\n  font-weight: ' + weight + ';\n  font-style: ' + (italic ? 'italic' : 'normal') + ';\n  font-display: ' + display + ';\n  size-adjust: ' + pct(k) + ';' + (f.unicodeRange ? '\n  unicode-range: ' + f.unicodeRange + ';' : '') + '\n}');
    });
    var fb = L().systemFallbacks && L().systemFallbacks[e.fallback];
    if (fb) {
      var fr = fb.metrics.ratios, s = k * (m.ratios.xWidthAvg / fr.xWidthAvg);   // width match, then the fit factor on top
      var overrides = '\n  size-adjust: ' + pct(s) + ';\n  ascent-override: ' + pct(k * m.ratios.ascent / s) + ';\n  descent-override: ' + pct(k * m.ratios.descent / s) + ';\n  line-gap-override: ' + pct(k * m.ratios.lineGap / s) + ';';
      lines.push('@font-face {\n  font-family: ' + q(alias + ' fallback') + ';\n  src: ' + fb.local.map(function (n) { return 'local(' + q(n) + ')'; }).join(', ') + ';\n  font-style: normal;' + overrides + '\n}');
      if (hasItalic && fb.localItalic && fb.localItalic.length) lines.push('@font-face {\n  font-family: ' + q(alias + ' fallback') + ';\n  src: ' + fb.localItalic.map(function (n) { return 'local(' + q(n) + ')'; }).join(', ') + ';\n  font-style: italic;' + overrides + '\n}');
    }
    return { css: lines.join('\n'), preloads: preloads, k: k, alias: alias, fallbackFactor: fb ? k * (m.ratios.xWidthAvg / fb.metrics.ratios.xWidthAvg) : null };
  }

  /* Everything a page needs for a look's faces: the @font-face css, the preload urls, and the --fd-face-* values. */
  function faceCss(look, opts) {
    if (look && look.fonts) use(look.fonts);
    useFit(look && look.fit);
    var faces = facesOf(look), css = [], preloads = [], vars = {}, factors = {};
    SLOTS.forEach(function (slot) {
      var id = faces[slot]; if (!id) return;
      var b = faceBlocks(id, slot, opts);
      if (b.css) css.push('/* ' + slot + ': ' + id + ' (size-adjust ' + pct(b.k) + ') */\n' + b.css);
      preloads = preloads.concat(b.preloads); vars[slot] = faceStack(id, slot); factors[slot] = b.k;
    });
    // the same font in two slots gets two aliases with two factors; de-duplicate nothing, that is the point
    return { css: css.join('\n\n'), preloads: uniq(preloads), vars: vars, factors: factors };
  }
  function preloadTags(look, opts) {
    return faceCss(look, opts).preloads.map(function (u) { return '<link rel="preload" as="font" type="font/' + (format(u) === 'truetype' ? 'ttf' : format(u) === 'opentype' ? 'otf' : format(u)) + '" href="' + u + '" crossorigin>'; }).join('\n');
  }
  /* The adjusted metric ratio a font renders at in a slot (what T11/T12 compare). */
  function adjusted(fontId, slot) {
    var e = entryOf(fontId), t = slotTarget(slot); if (!e || !t) return null;
    var k = fitFactor(e, slot); return { cap: e.metrics.ratios.cap * k, x: e.metrics.ratios.x * k, k: k, metric: t.metric, target: t.target, raw: ratioFor(e, t.metric) };
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  var api = { SLOTS: SLOTS, slotTarget: slotTarget, fitFactor: fitFactor, aliasName: aliasName, faceStack: faceStack, faceBlocks: faceBlocks, faceCss: faceCss, preloadTags: preloadTags, adjusted: adjusted, facesOf: facesOf, entryOf: entryOf, use: use, clientFonts: clientFonts, isClient: isClient, fitAllowed: fitAllowed, useFit: useFit, fitOn: fitOn, format: format };
  root.FontdantFonts = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
