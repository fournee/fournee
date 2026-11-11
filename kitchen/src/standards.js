/* kitchen · standards (the dial)
   Which accessibility rules the pass judges a recipe against. Each profile is a jurisdiction, organisation or
   design system, reduced to the numbers Fournée can check (research, 10 Nov 2026: fournee/docs/research/standards/).
   A recipe names one in `standard` (null = Fournée's house rules alone). By default the house rules still apply on
   top (`house: true`), so a profile only ever tightens; `house: false` judges by the profile's numbers alone,
   which is what a compliance report wants.
     text   min ratio for text roles (text, muted, accent-text, button-text); large text gets LARGE[text]
     ui     min ratio for shapes, borders, focus rings (WCAG 1.4.11); null = not required (WCAG 2.0) → a warning
     bodyMin / anyMin   px floors for body text and any text (design systems only; no law sets one)
     focus  { width px, contrast } for the focus ring; targets: min target px (2.5.8 = 24, AAA = 44)
     apca   judge text by APCA Lc too (a draft, not law: offered as a "future" setting)
   Pure logic. Plain script (window.KitchenStandards) or require()-able. */
(function (root) {
  'use strict';
  var R = 'https://github.com/fournee/fournee/tree/main/docs/research/standards/';
  var P = [
    // ── WCAG itself (ISO/IEC 40500:2025 = WCAG 2.2) ──
    { id: 'wcag22-aa', label: 'WCAG 2.2 AA', group: 'WCAG', region: 'World', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, focus: { width: 0, contrast: 0 }, targets: 24,
      note: 'The baseline almost every law points at; meets every WCAG 2.0 and 2.1 AA law too.', src: 'international.md' },
    { id: 'wcag22-aaa', label: 'WCAG 2.2 AAA', group: 'WCAG', region: 'World', wcag: '2.2', level: 'AAA', text: 7, ui: 3, focus: { width: 2, contrast: 3 }, targets: 44, flashes: 0,
      note: 'Enhanced contrast (1.4.6), focus appearance (2.4.13), 44px targets (2.5.5).', src: 'international.md' },
    { id: 'wcag21-aa', label: 'WCAG 2.1 AA', group: 'WCAG', region: 'World', wcag: '2.1', level: 'AA', text: 4.5, ui: 3, note: 'No target-size rule.', src: 'international.md' },
    { id: 'wcag20-aa', label: 'WCAG 2.0 AA', group: 'WCAG', region: 'World', wcag: '2.0', level: 'AA', text: 4.5, ui: null,
      note: 'No UI-contrast, reflow or text-spacing rules (they arrived in 2.1): those checks become warnings.', src: 'international.md' },
    // ── North America ──
    { id: 'us-federal', label: 'US federal (Section 508 + USWDS)', group: 'Law', region: 'US', wcag: '2.0', level: 'AA', text: 4.5, ui: null, bodyMin: 16, leading: 1.5,
      note: 'Section 508 is still WCAG 2.0 AA; USWDS sets 16px body and 1.5 line height.', src: 'north-america.md' },
    { id: 'us-ada-ii', label: 'US ADA Title II', group: 'Law', region: 'US', wcag: '2.1', level: 'AA', text: 4.5, ui: 3,
      note: 'State and local government; deadlines 2027-04-26 / 2028-04-26 (DOJ interim rule, 2026-04-20).', src: 'north-america.md' },
    { id: 'canada-federal', label: 'Canada federal (ACA, CAN/ASC-EN 301 549)', group: 'Law', region: 'Canada', wcag: '2.1', level: 'AA', text: 4.5, ui: 3,
      note: 'New federal digital rules take effect 2027-12-05 / 2028-12-05.', src: 'north-america.md' },
    { id: 'canada-gc', label: 'Canada.ca design system', group: 'Design system', region: 'Canada', wcag: '2.1', level: 'AA', text: 4.5, ui: 3, bodyMin: 20, anyMin: 18,
      note: 'GC Design System: 20px body, 18px smallest, 65-character lines.', src: 'north-america.md' },
    { id: 'quebec', label: 'Québec SGQRI 008 3.0', group: 'Law', region: 'Canada', wcag: '2.1', level: 'AA', text: 4.5, ui: 3, focus: { width: 2, contrast: 3 }, targets: 24, flashes: 0,
      note: 'The strictest in North America: adds focus not obscured, focus appearance (2px, 3:1), 24px targets, zero flashes.', src: 'north-america.md' },
    { id: 'ontario', label: 'Ontario AODA', group: 'Law', region: 'Canada', wcag: '2.0', level: 'AA', text: 4.5, ui: null, note: 'Private organisations with 50+ staff.', src: 'north-america.md' },
    // ── UK and EU ──
    { id: 'eu-eaa', label: 'EU (EAA, EN 301 549 V3.2.1)', group: 'Law', region: 'EU', wcag: '2.1', level: 'AA', text: 4.5, ui: 3,
      note: 'In force 2025-06-28. EN 301 549 V4.1.1 (WCAG 2.2) is published but not yet cited in the Official Journal.', src: 'uk-eu.md' },
    { id: 'uk-public', label: 'UK public sector (PSBAR)', group: 'Law', region: 'UK', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, targets: 24, note: 'WCAG 2.2 AA, monitored since Oct 2024.', src: 'uk-eu.md' },
    { id: 'gov-uk', label: 'GOV.UK Design System', group: 'Design system', region: 'UK', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, bodyMin: 19, anyMin: 16, focus: { width: 3, contrast: 3 }, targets: 24,
      note: '19px body, 16px smallest, 3px yellow-and-black focus.', src: 'uk-eu.md' },
    { id: 'nhs', label: 'NHS design system', group: 'Design system', region: 'UK', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, bodyMin: 16, anyMin: 14, focus: { width: 3, contrast: 3 }, targets: 24,
      note: '19px body on desktop, 16px on mobile (checked at 16), 14px smallest; aims for AAA.', src: 'uk-eu.md' },
    // ── International organisations ──
    { id: 'un', label: 'United Nations', group: 'Organisation', region: 'World', wcag: '2.1', level: 'AA+', text: 7, ui: 3,
      note: 'WCAG 2.1 AA with enhanced text contrast: 7:1, large text 4.5:1. Never remove focus indicators.', src: 'international.md' },
    { id: 'nasa', label: 'NASA', group: 'Organisation', region: 'US', wcag: '2.0', level: 'AA', text: 4.5, ui: 3, bodyMin: 16, leading: 1.5, focus: { width: 3, contrast: 3 },
      note: 'Section 508 + USWDS; Horizon Design System (3px focus ring). UI contrast held at 3:1 although 2.0 does not require it.', src: 'nasa-cern.md' },
    { id: 'cern', label: 'CERN', group: 'Organisation', region: 'World', wcag: '2.1', level: 'AA', text: 4.5, ui: 3, bodyMin: 16, anyMin: 12, focus: { width: 3, contrast: 3 },
      note: 'WCAG AA target; home.cern: 16px body, 12px smallest, underlined links.', src: 'nasa-cern.md' },
    // ── Asia-Pacific ──
    { id: 'australia', label: 'Australia (DSS v2)', group: 'Law', region: 'Australia', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, targets: 24, note: 'Latest WCAG AA.', src: 'asia-pacific-rest.md' },
    { id: 'japan-gov', label: 'Japan (JIS X 8341-3 + DADS)', group: 'Design system', region: 'Japan', wcag: '2.0', level: 'AA', text: 4.5, ui: null, bodyMin: 17, anyMin: 14, leading: 1.7,
      note: 'JIS is WCAG 2.0-based (2.2 revision under way); the Digital Agency design system sets 17px body, 1.7 leading.', src: 'asia-pacific-rest.md' },
    { id: 'korea-gov', label: 'Korea (KWCAG 2.2 + KRDS)', group: 'Design system', region: 'Korea', wcag: '2.2', level: 'AA', text: 4.5, ui: 3, bodyMin: 17, targets: 23,
      note: 'KRDS 17px body; controls at least 6mm diagonal (about 23 CSS px).', src: 'asia-pacific-rest.md' },
    // ── future ──
    { id: 'apca-bronze', label: 'APCA Bronze (future, not law)', group: 'Future', region: 'World', wcag: '3 draft', level: 'APCA', text: 4.5, ui: 3, apca: { body: 75, text: 60, large: 45 },
      note: 'APCA is a beta; WCAG 3\'s contrast method is still to be decided. Checked on top of WCAG 2 ratios.', src: 'international.md' },
  ];
  var TEXT_ROLES = ['text', 'muted', 'accent-text', 'button-text'];
  var LARGE = { 7: 4.5, 4.5: 3 };

  function get(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function list() { return P.slice(); }
  function isText(role) { return TEXT_ROLES.indexOf(role) >= 0; }

  /* frosting contracts under a profile: text roles to profile.text, shapes to profile.ui. house keeps the
     stricter of the two; ui null (WCAG 2.0) keeps the house number but marks the row level 'warn'. */
  function contracts(id, base, house) {
    var p = get(id); house = house !== false;
    return (base || []).map(function (c) {
      if (!p) return c;
      var want = isText(c.role) ? p.text : p.ui, o = Object.assign({}, c);
      if (want == null) { o.level = 'warn'; if (!house) o.min = 3; return o; }
      o.min = house ? Math.max(c.min, want) : want;
      return o;
    });
  }
  /* fontdant floors under a profile (mode floors in; px) */
  function floors(id, modeFloors, house) {
    var p = get(id), out = Object.assign({}, modeFloors || {}); house = house !== false;
    if (!p) return out;
    var up = function (k, v) { if (v == null) return; out[k] = house ? Math.max(out[k] || 0, v) : v; };
    if (!house) { Object.keys(out).forEach(function (k) { out[k] = 0; }); }
    up('body', p.bodyMin); up('body-sm', p.bodyMin); up('any', p.anyMin);
    return out;
  }

  /* APCA-W3 0.0.98G-4g (the published constants), signed Lc; we use its absolute value */
  function apcaY(hex) {
    var c = hex.replace('#', ''), v = [0, 2, 4].map(function (i) { return Math.pow(parseInt(c.substr(i, 2), 16) / 255, 2.4); });
    var y = 0.2126729 * v[0] + 0.7151522 * v[1] + 0.0721750 * v[2];
    return y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y;
  }
  function apca(fg, bg) {
    var t = apcaY(fg), b = apcaY(bg), s;
    if (Math.abs(b - t) < 0.0005) return 0;
    if (b > t) { s = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
    s = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14; return s > -0.1 ? 0 : -(s + 0.027) * 100;
  }

  /* the extra checks a profile brings: S1 input borders, S2 focus ring, S3 targets (rendered), S4 APCA, S5 leading.
     colors: the look's hexes; rows: the pass's (style, background) records; R: fontdant's resolved look. */
  function checks(id, colors, rows, R, opts) {
    var p = get(id), out = []; opts = opts || {};
    if (!p) return out;
    var C = root.FrostingColor, hexOk = function (h) { return /^#[0-9a-fA-F]{6}$/.test(h || ''); };
    var lvl = p.ui == null ? 'warn' : 'hard', ui = p.ui == null ? 3 : p.ui;
    function add(code, label, ok, detail, level) { out.push({ id: code, label: label, level: level || 'hard', ok: !!ok, pending: false, detail: detail || '', source: 'standard' }); }
    // S1: WCAG 1.4.11, input and control borders. frosting's control-border is muted 80% into bg (was 50% until
    // Nov 2026, which failed 3:1 on its own defaults); 80% passes on every preset and 3,000 lucky looks.
    if (hexOk(colors.muted) && hexOk(colors.bg)) {
      var cb = C.mix(colors.muted, colors.bg, 0.2), bad = [];
      ['bg', 'surface'].forEach(function (g) { if (hexOk(colors[g])) { var r = C.contrast(cb, colors[g]); if (r < ui) bad.push('control-border on ' + g + ' ' + Math.round(r * 10) / 10 + ':1'); } });
      add('S1', 'Input borders (' + p.label + ')', !bad.length, bad.length ? bad.join('; ') + ' < ' + ui + ':1. Use a darker border on inputs, or the muted colour itself.' : 'control-border ≥ ' + ui + ':1', lvl);
    }
    // S2: focus ring (focus-ring = accent unless the look sets one)
    var fr = hexOk(colors['focus-ring']) ? colors['focus-ring'] : colors.accent, need = Math.max(ui, (p.focus && p.focus.contrast) || 0), bad2 = [];
    if (hexOk(fr)) ['bg', 'surface'].forEach(function (g) { if (hexOk(colors[g])) { var r = C.contrast(fr, colors[g]); if (r < need) bad2.push('focus ring on ' + g + ' ' + Math.round(r * 10) / 10 + ':1'); } });
    add('S2', 'Focus ring' + (p.focus && p.focus.width ? ' (' + p.focus.width + 'px, ' + need + ':1)' : ''), !bad2.length, bad2.length ? bad2.join('; ') + ' < ' + need + ':1' : 'focus ring ≥ ' + need + ':1' + (p.focus && p.focus.width ? '; draw it at least ' + p.focus.width + 'px' : ''), p.focus && p.focus.width ? 'hard' : lvl);
    // S3: targets, measured on a rendered page (opts.rendered.targets: [{ name, w, h }])
    if (p.targets) {
      var t = opts.rendered && opts.rendered.targets;
      if (!t) out.push({ id: 'S3', label: 'Targets ≥ ' + p.targets + 'px', level: 'hard', ok: true, pending: true, detail: 'needs a rendered page', source: 'standard' });
      else { var small = t.filter(function (x) { return x.w < p.targets || x.h < p.targets; }); add('S3', 'Targets ≥ ' + p.targets + 'px', !small.length, small.length ? small.slice(0, 6).map(function (x) { return x.name + ' ' + Math.round(x.w) + '×' + Math.round(x.h); }).join('; ') : t.length + ' targets'); }
    }
    // S4: APCA Lc on every text record (body ≥ body, large ≥ large, other text ≥ text)
    if (p.apca && rows) {
      var bad4 = [];
      rows.forEach(function (r) {
        if (!hexOk(r.fg) || !hexOk(r.bg)) return;
        var lc = Math.abs(apca(r.fg, r.bg)), want = r.role === 'body' ? p.apca.body : (r.size >= 36 || (r.size >= 24 && r.weight >= 700)) ? p.apca.large : p.apca.text;
        if (lc < want) bad4.push(r.style + ' ' + r.fgRole + ' on ' + r.bgRole + ' Lc ' + Math.round(lc) + ' < ' + want);
      });
      add('S4', 'APCA Lc (draft method)', !bad4.length, bad4.length ? bad4.slice(0, 8).join('; ') : 'every text record passes', 'warn');
    }
    // S5: body leading the design system asks for
    if (p.leading && R) {
      var body = R.styles.filter(function (s) { return s.name === 'body'; })[0];
      if (body) add('S5', 'Body line height ≥ ' + p.leading, body.leading >= p.leading - 1e-9, 'body ' + body.leading, 'warn');
    }
    return out;
  }

  /* ── fit: make a look meet a profile, moving only what fails, by the smallest amount ──
     fit(id, { colors, fills, type }, { house }) → { colors, fills, type, changes: [{ kind, what, from, to, why }], left: [labels] }
     - colours: each role that fails a contract (or S1 input borders / S2 focus ring) keeps its hue and moves lightness
       only (FrostingColor.fit) against the colours it sits on; backgrounds never move
     - fills: a gradient that fails at its worst point moves its stops' lightness (FrostingFills.fit), or goes solid
     - type: sizes rise to the profile's floors (FontdantCheck.fit with look.floors); body leading to the profile's
     Always fits from the look it is given: switching profiles re-fits from the original, never from a previous fit.
     `left` lists what still fails (e.g. a mid-tone background no text colour can reach 7:1 on). */
  function fit(id, look, opts) {
    var p = get(id), C = root.FrostingColor, Fl = root.FrostingFills, FC = root.FontdantCheck, house = !opts || opts.house !== false;
    var colors = Object.assign({}, look.colors), fills = look.fills ? JSON.parse(JSON.stringify(look.fills)) : null;
    var type = look.type ? JSON.parse(JSON.stringify(look.type)) : null, changes = [], left = [];
    if (!p) return { colors: colors, fills: fills, type: type, changes: changes, left: left };
    var list = contracts(id, C.contracts(), house).filter(function (c) { return c.level !== 'warn'; });
    var ui = p.ui == null ? 3 : p.ui;
    // roles that sit on others move; the grounds they sit on (bg, surface, button for button-text) stay put
    var extra = [];
    if (p.ui != null) {   // S1: input borders are muted 80% into bg → muted must clear ui / 0.8-ish; checked exactly below
      extra.push({ role: 'accent', against: 'bg', min: Math.max(ui, (p.focus && p.focus.contrast) || 0), label: 'Focus ring' });
      extra.push({ role: 'accent', against: 'surface', min: Math.max(ui, (p.focus && p.focus.contrast) || 0), label: 'Focus ring on surfaces' });
    }
    var all = list.concat(extra), roles = [];
    all.forEach(function (c) { if (roles.indexOf(c.role) < 0) roles.push(c.role); });
    for (var pass = 0; pass < 3; pass++) {
      roles.forEach(function (role) {
        var rules = all.filter(function (c) { return c.role === role && /^#[0-9a-fA-F]{6}$/.test(colors[c.against] || ''); }).map(function (c) { return [colors[c.against], c.min]; });
        if (!rules.length || !/^#[0-9a-fA-F]{6}$/.test(colors[role] || '')) return;
        if (rules.every(function (r) { return C.contrast(colors[role], r[0]) >= r[1]; })) return;
        var to = C.fit(colors[role], rules);
        if (to !== colors[role]) { changes.push({ kind: 'colour', what: role, from: colors[role], to: to, why: rules.map(function (r) { return r[1] + ':1'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') }); colors[role] = to; }
      });
      // S1: the input border (muted 80% into bg) at ui on bg and surface: darken/lighten muted until it does
      if (p.ui != null && colors.muted && colors.bg) {
        var cb = function (m) { return C.mix(m, colors.bg, 0.2); }, okS1 = function (m) { return ['bg', 'surface'].every(function (g) { return !colors[g] || C.contrast(cb(m), colors[g]) >= ui; }); };
        if (!okS1(colors.muted)) {
          var h = C.hsl(colors.muted), best = null;
          for (var d = 0.5; d <= 60 && !best; d += 0.5) [h.l - d, h.l + d].forEach(function (L) { if (best || L < 0 || L > 100) return; var m = C.hex({ h: h.h, s: h.s, l: L }); if (okS1(m) && all.filter(function (c) { return c.role === 'muted'; }).every(function (c) { return C.contrast(m, colors[c.against]) >= c.min; })) best = m; });
          if (best) { changes.push({ kind: 'colour', what: 'muted', from: colors.muted, to: best, why: 'input borders ' + ui + ':1' }); colors.muted = best; }
        }
      }
    }
    // a shape that text sits on (button under button-text, progress-track under progress-fill) moves when the text alone
    // can't pass; the page grounds (bg, surface) never do
    list.forEach(function (c) {
      if (c.against === 'bg' || c.against === 'surface' || !colors[c.role] || !colors[c.against] || C.contrast(colors[c.role], colors[c.against]) >= c.min) return;
      // try the text as designed, as fitted, and plain white / black; keep the pair that moves the shape least
      var g = c.against, ground = list.filter(function (o) { return o.role === g && colors[o.against]; }).map(function (o) { return [colors[o.against], o.min]; });
      var best = null;
      [look.colors[c.role], colors[c.role], '#FFFFFF', '#000000'].forEach(function (ink) {
        if (!/^#[0-9a-fA-F]{6}$/.test(ink || '')) return;
        var rules = [[ink, c.min]].concat(ground), to = C.fit(colors[g], rules);
        if (!rules.every(function (r) { return C.contrast(to, r[0]) >= r[1]; })) return;
        var cost = Math.abs(C.hsl(to).l - C.hsl(colors[g]).l);
        if (!best || cost < best.cost) best = { ink: ink.toUpperCase(), to: to, cost: cost };
      });
      if (best) {
        if (best.to !== colors[g]) { changes.push({ kind: 'colour', what: g, from: colors[g], to: best.to, why: c.role + ' on ' + g + ' ' + c.min + ':1' }); colors[g] = best.to; }
        if (best.ink !== String(colors[c.role]).toUpperCase()) { changes.push({ kind: 'colour', what: c.role, from: colors[c.role], to: best.ink, why: 'pairs with the new ' + g }); colors[c.role] = best.ink; }
      }
    });
    // fills at their worst point
    if (fills && Fl) Object.keys(fills).forEach(function (k) {
      var rules = all.filter(function (c) { return c.role === k || c.against === k; }).map(function (c) { var o = c.role === k ? c.against : c.role; return [(fills[o]) || colors[o], c.min]; }).filter(function (r) { return r[0]; });
      if (!rules.length) return;
      var f = Fl.fit(fills[k], colors, rules);
      if (!f) { changes.push({ kind: 'gradient', what: k, from: 'gradient', to: 'solid', why: 'no lightness made it readable' }); delete fills[k]; }
      else if (JSON.stringify(f) !== JSON.stringify(fills[k])) { changes.push({ kind: 'gradient', what: k, from: fills[k].stops.join(' → '), to: f.stops.join(' → '), why: 'readable at its worst point' }); fills[k] = f; }
    });
    // type: floors and leading
    if (type && FC) {
      var before = FC.resolve(type), wanted = Object.assign({}, type, { floors: floors(id, before.floors, house) });
      var fitted = FC.fit(wanted).look; delete fitted.floors;
      var after = FC.resolve(fitted);
      Object.keys(before.stepPx).forEach(function (s) { if (Math.abs(after.stepPx[s] - before.stepPx[s]) > 0.01) changes.push({ kind: 'type', what: 'step ' + s, from: Math.round(before.stepPx[s] * 10) / 10 + 'px', to: Math.round(after.stepPx[s] * 10) / 10 + 'px', why: p.bodyMin || p.anyMin ? p.label + ' floors' : 'order' }); });
      if (p.leading) {
        var body = after.styles.filter(function (s) { return s.name === 'body'; })[0];
        if (body && body.leading < p.leading) { fitted.roles = fitted.roles || {}; fitted.roles.body = Object.assign({}, fitted.roles.body, { leading: p.leading }); changes.push({ kind: 'type', what: 'body line height', from: String(body.leading), to: String(p.leading), why: p.label }); }
      }
      type = fitted;
    }
    // what still fails
    C.check(colors, list).forEach(function (r) { if (!r.ok) left.push(r.label + ' ' + r.ratio + ':1 (needs ' + r.min + ')'); });
    return { colors: colors, fills: fills, type: type, changes: changes, left: left };
  }

  var api = { list: list, get: get, contracts: contracts, floors: floors, checks: checks, fit: fit, apca: apca, isText: isText, LARGE: LARGE, PROFILES: P, RESEARCH: R };
  root.KitchenStandards = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
