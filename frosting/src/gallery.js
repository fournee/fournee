/* frosting · Part C · gallery
   Ready-made looks, 🎲 lucky, and derive(): a few chosen colours → every role, fitted until all
   contracts pass. Pure logic, no DOM. Needs FrostingTokens (dist/tokens.js) and FrostingColor
   (src/readability.js) loaded first. */
(function (root) {
  'use strict';
  var C = root.FrostingColor, T = root.FrostingTokens;
  var hsl = C.hsl, hex = C.hex, fit = C.fit, mix = C.mix, ink = C.ink, contrast = C.contrast, isDark = C.isDark;

  /* ── extensions: a project adds roles of its own ──
     ext = { roles: [{name, label, use, light, dark}], contracts: [{label, role, against, min}],
             derive: function (theme, spec, helpers) -> { role: hex, … } } */
  var exts = [];
  function extend(ext) { exts.push(ext); if (ext.contracts) C.addContracts(ext.contracts); }
  function roles() { return T.roles.concat.apply(T.roles, exts.map(function (e) { return e.roles || []; })); }
  function defaults(mode) { var d = {}; roles().forEach(function (r) { d[r.name] = r[mode || 'light']; }); return d; }

  /* ── tags: eight fixed, evenly spread hues for telling projects or categories apart ──
     The same hue order in every look (tag-1 is always the blue one), fitted as shapes on bg and surface. */
  var TAG_HUES = [224, 17, 262, 163, 295, 193, 35, 86];
  function tags(bg, surface) {
    var dark = isDark(bg), out = {};
    TAG_HUES.forEach(function (h, n) {
      out['tag-' + (n + 1)] = fit(hex({ h: h, s: dark ? 80 : 75, l: dark ? 66 : 38 }), [[bg, 3], [surface, 3]]);
    });
    return out;
  }

  /* ── build a full look from a few chosen colours ──
     spec: { bg, a (accent), b (button), p (progress, optional), status (hue overrides, optional) }
     lockBg: when set, replaces spec.bg and everything is rebuilt around it. */
  function derive(spec, lockBg) {
    var bg = (lockBg || spec.bg).toUpperCase();
    var dark = isDark(bg), A = hsl(spec.a);
    var text = fit(dark ? hex({ h: A.h, s: 14, l: 95 }) : hex({ h: A.h, s: 22, l: 11 }), [[bg, 7]]);
    // Surfaces are a step toward the text colour; the step shrinks if text would drop under 7:1 on them.
    var surface = bg, steps = dark ? [0.07, 0.05, 0.035, 0.02, 0.01, 0] : [0.045, 0.03, 0.02, 0.01, 0];
    for (var i = 0; i < steps.length; i++) {
      var sf = mix(bg, text, steps[i]), tf = fit(text, [[bg, 7], [sf, 7]]);
      if (contrast(tf, bg) >= 7 && contrast(tf, sf) >= 7) { surface = sf; text = tf; break; }
    }
    var onBoth = function (min) { return [[bg, min], [surface, min]]; };
    var muted = fit(mix(text, bg, 0.36), onBoth(4.5));
    var accent = fit(spec.a, [[bg, 3]]);
    var accentText = fit(spec.a, onBoth(4.5));

    // Button: try light and dark button text; keep whichever needs the smaller change to the chosen colour.
    var B = hsl(spec.b), button = null, buttonText = null, bestD = 1e9;
    [ink(spec.b, B.h), hex({ h: B.h, s: 18, l: 10 }), hex({ h: B.h, s: 20, l: 97 })].forEach(function (t) {
      var c = fit(spec.b, [[bg, 3], [t, 4.5]]), d = Math.abs(hsl(c).l - B.l) + (contrast(c, t) < 4.5 || contrast(c, bg) < 3 ? 1e6 : 0);
      if (d < bestD) { bestD = d; button = c; buttonText = t; }
    });

    var track = mix(bg, text, dark ? 0.2 : 0.11);
    var fill = fit(spec.p || button, [[track, 3], [bg, 3]]);
    var border = mix(bg, text, dark ? 0.22 : 0.13);

    // Status: fixed meaning hues (green / amber / red), lightness picked for the mode, fitted as shapes.
    var sh = Object.assign({ ok: 145, warn: 40, bad: 4 }, spec.status || {});
    var statusL = dark ? 62 : 38, statusS = dark ? 70 : 70;
    var status = function (h) { return fit(hex({ h: h, s: statusS, l: statusL }), onBoth(3)); };

    // Series: the accent hue and three spread hues, fitted as shapes on the background.
    var offsets = [0, 150, 270, 60], series = {};
    offsets.forEach(function (o, n) { series['series-' + (n + 1)] = fit(hex({ h: A.h + o, s: dark ? 75 : 65, l: dark ? 66 : 42 }), [[bg, 3]]); });

    var theme = Object.assign({
      'bg': bg, 'surface': surface, 'border': border, 'text': text, 'muted': muted,
      'accent': accent, 'accent-text': accentText, 'button': button, 'button-text': buttonText,
      'progress-fill': fill, 'progress-track': track,
      'ok': status(sh.ok), 'warn': status(sh.warn), 'bad': status(sh.bad),
    }, series, tags(bg, surface));
    theme = C.complete(theme, { roles: roles() });   // the calculated roles (v1.3.0), from the roles above, fitted
    exts.forEach(function (e) { if (e.derive) Object.assign(theme, e.derive(theme, spec, C)); });
    return theme;
  }

  /* ── ready-made looks ── */
  var SCHEMES = { comp: 'Complementary', split: 'Split-complementary', tri: 'Triadic', ana: 'Analogous', mono: 'Single colour', tet: 'Four-colour', dark: 'Dark' };
  var PRESETS = [
    { name: 'Violet Night', scheme: 'dark', bg: '#0F1115', a: '#9D7BFF', b: '#9D7BFF' },
    { name: 'Harbor', scheme: 'comp', bg: '#F4F7FA', a: '#1F5F8B', b: '#D9622B' },
    { name: 'Plum & Brass', scheme: 'comp', bg: '#FBF7F2', a: '#6B2D5C', b: '#9C6F1E' },
    { name: 'Tomato Garden', scheme: 'split', bg: '#FFF8F2', a: '#2F6F6A', b: '#C8402F' },
    { name: 'Midnight Diner', scheme: 'dark', bg: '#12141C', a: '#F2B33D', b: '#F2B33D' },
    { name: 'Citrus Pop', scheme: 'tri', bg: '#FFFBEA', a: '#D9481E', b: '#2457D6' },
    { name: 'Lavender Field', scheme: 'ana', bg: '#F7F4FC', a: '#6A4C9C', b: '#7E4FB8' },
    { name: 'Terracotta', scheme: 'ana', bg: '#FBF3EC', a: '#A0462B', b: '#B9542C' },
    { name: 'Deep Sea', scheme: 'dark', bg: '#0B1E2D', a: '#4FD1C5', b: '#FF7A59' },
    { name: 'Cherry Cola', scheme: 'split', bg: '#FFF5F6', a: '#8C1C3B', b: '#C81E36' },
    { name: 'Matcha Latte', scheme: 'mono', bg: '#F3F1E7', a: '#5C6B3A', b: '#4A5A2C' },
    { name: 'Sunset Strip', scheme: 'tri', bg: '#FFF4EC', a: '#D24E0B', b: '#7B2CBF' },
    { name: 'Blueprint', scheme: 'mono', bg: '#EEF3FB', a: '#1D4ED8', b: '#1D4ED8' },
    { name: 'Bubblegum', scheme: 'ana', bg: '#FFF0F6', a: '#C2185B', b: '#D63A7E' },
    { name: 'Espresso', scheme: 'dark', bg: '#1E1612', a: '#D9A066', b: '#E8C29A' },
    { name: 'Mint Chip', scheme: 'comp', bg: '#EEF8F4', a: '#1B7F79', b: '#5B3A29' },
    { name: 'Neon Arcade', scheme: 'tri', bg: '#0E0B1A', a: '#FF3EA5', b: '#00E5FF' },
    { name: 'Saffron', scheme: 'split', bg: '#FFF9EC', a: '#B45309', b: '#1E3A8A' },
    { name: 'Ocean Glass', scheme: 'ana', bg: '#F0FAFB', a: '#0E7490', b: '#0B7C99' },
    { name: 'Rust & Denim', scheme: 'comp', bg: '#F5F2EE', a: '#2B4C7E', b: '#B5532A' },
    { name: 'Mono Ink', scheme: 'mono', bg: '#FAFAF7', a: '#222222', b: '#111111' },
    { name: 'Pistachio & Pink', scheme: 'comp', bg: '#F6F9EE', a: '#5E7A24', b: '#C8456F' },
    { name: 'Goldenrod Night', scheme: 'dark', bg: '#191714', a: '#E9B949', b: '#E9B949' },
    { name: 'Berry Smoothie', scheme: 'tri', bg: '#FBF4FA', a: '#7E2E84', b: '#C2610F' },
    { name: 'Coral Reef', scheme: 'split', bg: '#FFF6F2', a: '#1F7A8C', b: '#E8553F' },
    { name: 'Bold Cobalt', scheme: 'tet', bg: '#1F3FBF', a: '#FFD447', b: '#FFD447' },
  ];
  /* Brand looks: an organisation's own colours on the roles, exact rather than derived (research Nov 2026,
     docs/research/standards/nasa-cern.md). Where a brand colour fails as text, the role uses a darker
     shade from the same family and the brand colour stays where shapes allow 3:1 (series, fills). They pair with
     a standards profile of the same name (kitchen/src/standards.js). No logos: colours only. */
  var BRANDS = [
    { name: 'NASA Horizon', standard: 'nasa', note: 'Terra UI horizon.scss + nasa.gov CSS. NASA Red #F64137 and orange #EB7024 fail as text: chart series only; status uses darker shades.',
      colors: { 'bg': '#FFFFFF', 'surface': '#F6F6F6', 'border': '#D1D1D1', 'text': '#17171B', 'muted': '#444447', 'accent': '#1C67E3', 'accent-text': '#1C67E3',
        'button': '#1C67E3', 'button-text': '#FFFFFF', 'progress-fill': '#1C67E3', 'progress-track': '#D1D1D1', 'ok': '#1F7F47', 'warn': '#A34B14', 'bad': '#B60109',
        'series-1': '#1C67E3', 'series-2': '#F64137', 'series-3': '#EB7024', 'series-4': '#58585B' } },
    { name: 'CERN', standard: 'cern', note: 'CERN Blue #0033A0 (Pantone 286 C) + home.cern theme. Warning yellow #FFCD0C fails on white: warn uses the theme’s #996C00; the yellow stays a fill under dark text.',
      colors: { 'bg': '#FFFFFF', 'surface': '#F6F6F7', 'border': '#999999', 'text': '#151515', 'muted': '#666666', 'accent': '#0033A0', 'accent-text': '#0033A0',
        'button': '#0033A0', 'button-text': '#FFFFFF', 'progress-fill': '#0033A0', 'progress-track': '#CDD6ED', 'ok': '#1A8C48', 'warn': '#996C00', 'bad': '#E6001D',
        'series-1': '#0033A0', 'series-2': '#FD6109', 'series-3': '#6E2466', 'series-4': '#224D53' } },
  ];
  /* presets(lockBg): the derived looks, then the brand looks (left out when a background is locked: they're exact) */
  function presets(lockBg) {
    var out = PRESETS.map(function (p) { return { name: p.name, scheme: SCHEMES[p.scheme], colors: derive(p, lockBg) }; });
    if (!lockBg) BRANDS.forEach(function (b) { out.push({ name: b.name, scheme: 'Brand', standard: b.standard, note: b.note, colors: C.complete(Object.assign(tags(b.colors.bg, b.colors.surface), b.colors), { roles: roles() }) }); });
    return out;
  }

  /* ── 🎲 I'm feeling lucky (seeded, so a look can be rebuilt) ── */
  function rng(seed) { var t = seed >>> 0; return function () { t += 0x6D2B79F5; var r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  var OFFSETS = { comp: [0, 180], split: [0, 150], tri: [0, 120], ana: [0, 30], mono: [0, 0], tet: [0, 90] };
  var NAME_A = ['Velvet', 'Neon', 'Dusty', 'Electric', 'Midnight', 'Sunny', 'Salted', 'Wild', 'Paper', 'Candied', 'Smoky', 'Tidal', 'Feral', 'Gilded', 'Static'];
  var NAME_B = ['Cupcake', 'Lagoon', 'Disco', 'Orchard', 'Arcade', 'Harbor', 'Bakery', 'Comet', 'Jukebox', 'Meadow', 'Diner', 'Lantern', 'Parade', 'Postcard', 'Radio'];
  function lucky(seed, lockBg) {
    var r = rng(seed == null ? Math.floor(Math.random() * 4294967296) : seed);
    var pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    var between = function (a, b) { return a + r() * (b - a); };
    var key = pick(Object.keys(OFFSETS)), h = between(0, 360), off = OFFSETS[key];
    var style = r(), bg;
    if (style < 0.55) bg = hex({ h: h + between(-20, 20), s: between(15, 70), l: between(93, 98) });       // light, tinted
    else if (style < 0.8) bg = hex({ h: h + between(-20, 20), s: between(15, 45), l: between(5, 13) });   // dark
    else {                                                                                                 // bold
      for (var tries = 0; tries < 20; tries++) {
        bg = hex({ h: h + off[1] + tries * 23, s: between(55, 85), l: between(18, 40) });
        if (C.bgHeadroom(bg) >= 8) break;   // room for 7:1 text
      }
    }
    var spec = { bg: bg, a: hex({ h: h, s: between(55, 85), l: between(35, 55) }), b: hex({ h: h + off[1], s: between(60, 90), l: between(38, 58) }) };
    return { name: pick(NAME_A) + ' ' + pick(NAME_B), scheme: SCHEMES[key], seed: seed, colors: derive(spec, lockBg) };
  }

  /* ── spread: distinct looks for many cards on one page (research D, Nov 2026: people tell ~8 hues apart, so use
     8–12 hue families and a second cue). spread(count, page, opts) → [overrides] for card i: accent + accent-text in
     its family's hue (fitted as text and shapes), and a surface fill tinted with that hue; the second cue is the
     fill's angle, which steps once every time the families wrap round. Text keeps its contract on every point of
     the fill (FrostingFills.fit), or the card stays solid. opts: { families (8–12, default 10), seed (hue offset) } ── */
  function spread(count, page, opts) {
    opts = opts || {};
    var Fl = root.FrostingFills, n = Math.max(8, Math.min(12, opts.families || 10)), off = opts.seed == null ? 20 : opts.seed;
    var dark = isDark(page.bg), out = [], angles = [135, 45, 180, 90];
    var textMin = (C.contracts().filter(function (c) { return c.role === 'text' && c.against === 'surface'; })[0] || { min: 7 }).min;
    for (var i = 0; i < count; i++) {
      // neighbours stride round the wheel (3 families on, coprime with n) so cards side by side never look alike
      var stride = n % 3 ? 3 : 7, fam = (i * stride) % n, round = Math.floor(i / n), h = off + fam * (360 / n);
      var hue = hex({ h: h, s: 70, l: dark ? 62 : 40 });
      var o = { accent: fit(hue, [[page.bg, 3], [page.surface, 3]]), 'accent-text': fit(hue, [[page.bg, 4.5], [page.surface, 4.5]]) };
      // the card's own link hover, calculated over the page plus the card's accent (the page's overrides do not apply)
      o['accent-text-hover'] = C.complete(Object.assign({}, page, o), { overrides: {} })['accent-text-hover'];
      if (Fl) {
        var tint = function (t) { return mix(page.surface, hex({ h: h, s: 55, l: dark ? 30 : 88 }), t); };
        var f = { stops: [tint(dark ? 0.55 : 0.6), tint(dark ? 0.15 : 0.2)], angle: angles[round % angles.length], space: 'oklab' };
        f = Fl.fit(f, page, [[page.text, textMin], [o.accent, 3]]);
        if (f) o.fills = { surface: f };
      }
      out.push(o);
    }
    return out;
  }

  var api = { derive: derive, presets: presets, lucky: lucky, spread: spread, extend: extend, roles: roles, defaults: defaults, PRESETS: PRESETS, BRANDS: BRANDS, SCHEMES: SCHEMES };
  root.FrostingGallery = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
