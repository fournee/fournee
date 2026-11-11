/* kitchen · the pass
   The shared readability checks: the counter where every plate is inspected before it goes out.
   Reads both halves of a recipe and returns one list of results:
     - frosting's colour contracts, unchanged (FrostingColor.check)
     - fontdant's type contracts T1–T17 (FontdantCheck.check; T13 filled from a rendered run when given)
     - the colour ↔ type cross-checks X1–X9 (proposal §6), which need to know which colour each type role
       is painted in: a role's `color` (a frosting role name or a hex) and `against` (its background),
       else the defaults below
   With Sprinkles off the colours checked are the Plain ones (kitchen/src/sprinkles.js); with it on, X4's 7:1
   advice is an info note when a Plain version exists. Licence checks L1–L6 run when FontdantLicence is loaded
   (opts: domain, injection, traffic, subset, today).
   Type never loosens frosting's contracts, only tightens them. Pure logic, no DOM.
   Plain script (window.KitchenPass) or require()-able; needs FrostingTokens, FrostingColor, FontdantTokens,
   FontdantCheck on the same root (FontdantLibrary + FontdantFonts for the font-metric contracts). */
(function (root) {
  'use strict';

  /* which colour role each type role uses, and on which backgrounds */
  var INK = { display: 'text', heading: 'text', body: 'text', ui: 'text', caption: 'muted', eyebrow: 'muted', mono: 'text', metric: 'text' };
  var VARIANT_INK = { 'ui-button': { color: 'button-text', against: ['button'] } };
  var GROUNDS = ['bg', 'surface'];
  var LARGE_OK = ['display', 'heading'];           // X2: only these may be judged at the large-text ratio
  var LARGE_RATIO = { 7: 4.5, 4.5: 3 };            // AAA → AAA large, AA → AA large

  var CROSS = [
    { id: 'X1', label: 'Large text', level: 'definition', source: 'WCAG 1.4.3 glossary', rule: 'large = size ≥ 24px, or ≥ 18.67px at weight ≥ 700' },
    { id: 'X2', label: 'Small roles keep full contrast', level: 'hard', source: 'house rule', rule: 'body ui mono caption eyebrow keep frosting\'s 7:1 / 4.5:1 at any size; only display and heading may use the large-text ratio' },
    { id: 'X3', label: 'Thin small text needs more contrast', level: 'warn', source: 'house rule', rule: 'weight < 400 at size < 24px ⇒ contrast ≥ 7:1' },
    { id: 'X4', label: 'Quiet text at small sizes', level: 'hard', source: 'house rule', rule: 'muted on text < 14px ⇒ size ≥ 12px and ≥ 4.5:1 (hard); ≥ 7:1 recommended (warn)' },
    { id: 'X5', label: 'Accent text as reading text', level: 'warn', source: 'house rule', rule: 'accent-text as body or caption colour ⇒ 7:1' },
    { id: 'X6', label: 'Button text', level: 'warn', source: 'house rule', rule: 'ui-button: size ≥ 14px (reading) / 12px (dense), weight ≥ 500, button-text on button ≥ 4.5:1' },
    { id: 'X7', label: 'Thin text on dark', level: 'warn', source: 'practitioner evidence', rule: 'scheme Dark + weight < 400 ⇒ warn (light-on-dark thins strokes)' },
    { id: 'X8', label: 'Disabled and placeholder text', level: 'warn', source: 'house rule', rule: 'disabled and placeholder text ≥ 3:1 though exempt from 1.4.3' },
    { id: 'X9', label: 'Size-aware colour records', level: 'format', source: 'WCAG 3 readiness', rule: 'every colour check stores (fg, bg, size, weight, face)' },
  ];

  function C() { return root.FrostingColor; }
  function hexOk(h) { return /^#[0-9a-fA-F]{6}$/.test(h || ''); }
  function round(n) { return Math.round(n * 100) / 100; }
  function isLarge(px, w) { return px >= 24 || (px >= 18.67 && w >= 700); }   // X1 (14pt bold = 18.67px)
  function colorOf(colors, ref) { return hexOk(ref) ? ref.toUpperCase() : (colors[ref] || null); }
  var active = null;   // the contract list in force for this run (the standards dial adjusts it)
  function contractFor(fg, bg) {
    var list = active || (C() && C().contracts()) || [];
    for (var i = 0; i < list.length; i++) if (list[i].role === fg && list[i].against === bg) return list[i].min;
    return null;
  }
  // an ink with no frosting contract (a literal hex, a project colour) is held to the contract of the ink the
  // role normally uses: body in a custom grey still needs text's 7:1
  function contractMin(fg, bg, usual) { var m = contractFor(fg, bg); if (m == null) m = contractFor(usual, bg); return m == null ? 4.5 : m; }
  function jobOf(s) { return s.base || s.role; }
  function inkOf(s) {
    var v = VARIANT_INK[s.name] || {};
    var usual = v.color || INK[jobOf(s)] || 'text';
    var color = s.color || usual;
    var against = s.against ? [].concat(s.against) : (v.against || GROUNDS);
    return { color: color, against: against, usual: usual };
  }

  /* one row per (style, background): the X9 record */
  function rows(R, colors) {
    var out = [];
    R.styles.forEach(function (s) {
      var ink = inkOf(s);
      ink.against.forEach(function (bgRef) {
        var fg = colorOf(colors, ink.color), bg = colorOf(colors, bgRef);
        var ratio = hexOk(fg) && hexOk(bg) ? C().contrast(fg, bg) : 0;
        out.push({ style: s.name, role: jobOf(s), extension: s.extension, usualRole: ink.usual, fgRole: ink.color, bgRole: bgRef, fg: fg, bg: bg, ratio: round(ratio),
          size: round(s.sizePx), weight: s.weight, face: s.faceId || s.face, large: isLarge(s.sizePx, s.weight) });
      });
    });
    return out;
  }

  function cross(recipe, R, rs) {
    var colors = recipe.frosting.colors, mode = R.mode, out = [];
    var dark = recipe.scheme === 'Dark' || (hexOk(colors.bg) && C().isDark(colors.bg));
    function add(c, ok, detail, level, where) { out.push({ id: c.id, label: c.label, level: level || c.level, ok: !!ok, pending: false, detail: detail || '', source: 'cross', where: where || null }); }
    // where: which step and setting fixes it (the Fournée steps' Fix links), with a sample of the first failing record
    function at(tab, r, role) { return r ? { tab: tab, role: role || r.fgRole, against: r.bgRole, fg: r.fg, bg: r.bg, size: r.size, weight: r.weight, style: r.style } : { tab: tab, role: role || null }; }
    function pair(r) { return r.style + ' ' + r.size + 'px/' + r.weight + ' ' + r.fgRole + ' on ' + r.bgRole + ' ' + r.ratio + ':1'; }
    CROSS.forEach(function (c) {
      var bad = [], warn = [];
      switch (c.id) {
        case 'X1': {
          var large = rs.filter(function (r) { return r.large; }).map(function (r) { return r.style; });
          add(c, true, large.length ? 'large: ' + unique(large).join(', ') : 'no large text'); break;
        }
        case 'X2':
          var first2 = null;
          rs.forEach(function (r) {
            var min = contractMin(r.fgRole, r.bgRole, r.usualRole);
            if (r.large && LARGE_OK.indexOf(r.role) >= 0) min = LARGE_RATIO[min] || 3;
            if (r.ratio < min) { bad.push(pair(r) + ' < ' + min); first2 = first2 || r; }
          });
          add(c, !bad.length, bad.join('; '), null, at('frosting', first2)); break;
        case 'X3':
          var first3 = null;
          rs.forEach(function (r) { if (r.weight < 400 && r.size < 24 && r.ratio < 7) { bad.push(pair(r)); first3 = first3 || r; } });
          add(c, !bad.length, bad.join('; '), null, at('fontdant', first3)); break;
        case 'X4':
          var first4 = null, firstW = null;
          rs.forEach(function (r) {
            if (r.fgRole !== 'muted' || r.size >= 14) return;
            if (r.size < 12 || r.ratio < 4.5) { bad.push(pair(r) + (r.size < 12 ? ' (under 12px)' : ' (< 4.5:1)')); first4 = first4 || r; }
            else if (r.ratio < 7) { warn.push(pair(r)); firstW = firstW || r; }
          });
          if (bad.length) add(c, false, bad.join('; '), 'hard', at(first4.size < 12 ? 'fontdant' : 'frosting', first4));
          else if (warn.length && recipe.plain && recipe.plain.available) {   // Sprinkles (J2): advice, not a warning, when Plain exists
            var ch = recipe.plain.changes.muted;
            add(c, true, 'Plain version available' + (ch ? ' (muted ' + ch.from + ' → ' + ch.to + ', ' + ch.after + ':1)' : '') + '. Sprinkles keeps the designed grey: ' + warn.join('; '), 'info', at('spec', firstW, 'sprinkles'));
          }
          else add(c, !warn.length, warn.length ? warn.join('; ') + ' (7:1 recommended)' : '', 'warn', at('frosting', firstW)); break;
        case 'X5':
          var first5 = null;
          rs.forEach(function (r) { if (r.fgRole === 'accent-text' && (r.role === 'body' || r.role === 'caption') && r.ratio < 7) { bad.push(pair(r)); first5 = first5 || r; } });
          add(c, !bad.length, bad.join('; '), null, at('frosting', first5)); break;
        case 'X6': {
          var b = R.styles.filter(function (s) { return s.name === 'ui-button'; })[0];
          if (!b) { add(c, true, 'no ui-button'); break; }
          var minPx = mode === 'dense' ? 12 : 14;
          var typeBad = b.sizePx < minPx || b.weight < 500, first6 = null;
          if (b.sizePx < minPx) bad.push('size ' + round(b.sizePx) + 'px < ' + minPx + 'px');
          if (b.weight < 500) bad.push('weight ' + b.weight + ' < 500');
          rs.forEach(function (r) { if (r.style === 'ui-button') { first6 = first6 || r; if (r.ratio < 4.5) bad.push(pair(r)); } });
          add(c, !bad.length, bad.join('; '), null, at(typeBad ? 'fontdant' : 'frosting', first6, typeBad ? null : 'button-text')); break;
        }
        case 'X7':
          var thin = null;
          if (dark) R.styles.forEach(function (s) { if (s.weight < 400) { bad.push(s.name + ' ' + s.weight + ' @ ' + round(s.sizePx) + 'px'); thin = thin || s; } });
          add(c, !bad.length, bad.length ? bad.join('; ') : (dark ? 'no thin weights' : 'light scheme'), null,
            thin ? { tab: 'fontdant', role: null, style: thin.name, fg: colorOf(colors, 'text'), bg: colorOf(colors, 'bg'), size: round(thin.sizePx), weight: thin.weight } : { tab: 'fontdant' }); break;
        case 'X8': {
          var found = ['disabled', 'placeholder'].filter(function (k) { return hexOk(colors[k]); });
          found.forEach(function (k) { GROUNDS.forEach(function (g) { var r = C().contrast(colors[k], colors[g]); if (r < 3) bad.push(k + ' on ' + g + ' ' + round(r) + ':1'); }); });
          add(c, !bad.length, bad.length ? bad.join('; ') : (found.length ? found.join(', ') + ' ≥ 3:1' : 'no disabled/placeholder colours in this recipe; placeholders use muted (X4)'), null, { tab: 'frosting', role: found[0] || 'muted' }); break;
        }
        case 'X9': {
          var missing = rs.filter(function (r) { return !r.fg || !r.bg || r.size == null || r.weight == null || !r.face; });
          add(c, !missing.length, missing.length ? missing.length + ' records lack fg/bg/size/weight/face: ' + unique(missing.map(function (r) { return r.style; })).join(', ') : rs.length + ' records'); break;
        }
      }
    });
    return out;
  }
  function unique(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  /* run(recipe, opts) → { ok, results, rows, summary }
     recipe: { scheme, frosting: { colors }, fontdant: { … } } (a KitchenRecipe; missing halves default)
     opts.rendered: T13's rendered result ({ ok, detail }) from KitchenRender.measure */
  function run(recipe, opts) {
    opts = opts || {};
    recipe = recipe || {};
    var designed = (recipe.frosting && recipe.frosting.colors) || {};
    var S = root.KitchenSprinkles, sprinkles = recipe.sprinkles !== false;
    var plain = S ? S.plain(designed) : null;
    var colors = !sprinkles && plain ? plain.colors : designed;   // the pass checks what visitors see
    var look = recipe.fontdant || {};
    var R = root.FontdantCheck.resolve(look);
    // the standards dial: opts.standard beats recipe.standard; house rules stay on top unless opts.house === false
    var K = root.KitchenStandards, std = opts.standard !== undefined ? opts.standard : recipe.standard, house = opts.house !== false;
    var profile = K && std ? K.get(std) : null;
    var list = profile ? K.contracts(std, C().contracts(), house) : C().contracts();
    active = list;
    if (profile && (profile.bodyMin != null || profile.anyMin != null || !house)) {
      look = Object.assign({}, look, { floors: K.floors(std, R.floors, house) });
      R = root.FontdantCheck.resolve(look);
    }
    var results = [];
    C().check(colors, list).forEach(function (r, i) {
      results.push({ id: r.label, label: r.label, level: list[i].level || 'hard', ok: r.ok, pending: false, detail: r.role + ' on ' + r.against + ' ' + r.ratio + ':1 (min ' + r.min + ')', source: 'frosting',
        where: { tab: 'frosting', role: r.role, against: r.against, fg: colors[r.role] || null, bg: colors[r.against] || null } });
    });
    // gradient fills: every contract touching a filled role, at the fill's worst point (frosting/src/fills.js)
    var fills = recipe.frosting && recipe.frosting.fills, F = root.FrostingFills;
    if (fills && F) F.check(colors, fills, list).forEach(function (r) {
      results.push({ id: r.label, label: r.label, level: 'hard', ok: r.ok, pending: false, detail: r.role + ' on ' + r.against + ' ' + r.range[0] + '–' + r.range[1] + ':1 across the fill (min ' + r.min + ')', source: 'frosting',
        where: { tab: 'frosting', role: r.role, against: r.against } });
    });
    root.FontdantCheck.check(look, { rendered: opts.rendered }).forEach(function (r) {
      results.push({ id: r.id, label: r.label, level: r.level, ok: r.ok, pending: r.pending, detail: r.detail, source: 'fontdant', where: { tab: 'fontdant' } });
    });
    var rs = rows(R, colors);
    results = results.concat(cross({ scheme: recipe.scheme, frosting: { colors: colors }, plain: sprinkles ? plain : null }, R, rs));
    if (profile) results = results.concat(K.checks(std, colors, rs, R, opts).map(function (r) {
      var w = { S1: { tab: 'frosting', role: 'muted' }, S2: { tab: 'frosting', role: 'accent' }, S3: { tab: 'spec' }, S4: { tab: 'frosting', role: 'text' }, S5: { tab: 'fontdant' } }[r.id];
      return Object.assign({ where: w || { tab: 'spec' } }, r);
    }));
    active = null;
    if (root.FontdantLicence) results = results.concat(root.FontdantLicence.check(look, { client: recipe.client, domain: opts.domain, injection: opts.injection, traffic: opts.traffic, subset: opts.subset, today: opts.today })
      .map(function (r) { return Object.assign({ where: { tab: 'fontdant' } }, r); }));
    var summary = { hard: 0, warn: 0, pending: 0, passed: 0, info: 0 };
    results.forEach(function (r) {
      if (r.level === 'info') summary.info++;
      if (r.pending) summary.pending++;
      else if (r.ok) summary.passed++;
      else if (r.level === 'hard') summary.hard++;
      else summary.warn++;
    });
    return { ok: summary.hard === 0, results: results, rows: rs, summary: summary, mode: R.mode, sprinkles: sprinkles, plain: plain, colors: colors, standard: profile ? profile.id : null, house: house };
  }
  function failing(result, level) {
    return result.results.filter(function (r) { return !r.ok && !r.pending && (!level || r.level === level); }).map(function (r) { return r.id; });
  }

  var api = { run: run, failing: failing, rows: rows, isLarge: isLarge, INK: INK, CROSS: CROSS };
  root.KitchenPass = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
