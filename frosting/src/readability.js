/* frosting · Part B · readability
   Colour math and the contrast contracts. Pure logic, no DOM. Loaded as a plain script
   (window.FrostingColor) or require()-able from Node. */
(function (root) {
  'use strict';

  /* ── colour math ── */
  function hexToRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function rgbToHex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }
  function hslToRgb(o) {
    var h = ((o.h % 360) + 360) % 360 / 360, s = Math.max(0, Math.min(100, o.s)) / 100, l = Math.max(0, Math.min(100, o.l)) / 100;
    if (!s) return [l * 255, l * 255, l * 255];
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  var hsl = function (hex) { return rgbToHsl(hexToRgb(hex)); };
  var hex = function (o) { return rgbToHex(hslToRgb(o)); };
  function lum(h) {
    return hexToRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  /* WCAG contrast ratio, 1..21 */
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(a, b, t) { var x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function isDark(bg) { return contrast(bg, '#FFFFFF') > contrast(bg, '#000000'); }
  var HEX = /^#[0-9a-fA-F]{6}$/;

  /* Keep the hue and saturation, move only the lightness: the closest lightness that passes every rule.
     rules: [[againstHex, minRatio], …]. Falls back to less saturation, then to plain black or white. */
  function fit(color, rules) {
    var o = hsl(color);
    function passes(h) { return rules.every(function (r) { return contrast(h, r[0]) >= r[1]; }); }
    if (passes(color)) return color;
    var sats = [o.s, o.s * 0.6, o.s * 0.3, 0];
    for (var si = 0; si < sats.length; si++) {
      var best = null, bestD = 1e9;
      for (var L = 0; L <= 100; L += 0.5) {
        var c = hex({ h: o.h, s: sats[si], l: L });
        if (passes(c) && Math.abs(L - o.l) < bestD) { best = c; bestD = Math.abs(L - o.l); }
      }
      if (best) return best;
    }
    return ['#000000', '#FFFFFF'].filter(passes)[0] || '#000000';
  }
  /* The dark or light ink that reads best on a colour, gently tinted with a hue (default: the colour's own). */
  function ink(on, hue) {
    if (hue == null) hue = hsl(on).h;
    var dark = hex({ h: hue, s: 18, l: 10 }), light = hex({ h: hue, s: 20, l: 97 });
    return contrast(on, dark) >= contrast(on, light) ? dark : light;
  }
  /* Can any text colour reach 7:1 on this background? (Mid-tones can't.) */
  function bgHeadroom(bg) { return Math.max(contrast(bg, '#FFFFFF'), contrast(bg, '#000000')); }

  /* The numeric parts of a colour for CSS that builds its own hsl(): { h, s, l }, h in degrees (0 to 359.9), s and l in
     percent, one decimal each. A grey has no hue: when s rounds to 0, h is 0. A hue that rounds to 360 is 0. */
  function accentParts(hexColor) {
    var o = hsl(hexColor), r1 = function (n) { return Math.round(n * 10) / 10; }, s = r1(o.s);
    return { h: s ? r1(o.h) % 360 : 0, s: s, l: r1(o.l) };
  }
  /* --<prefix>-accent-h / -s / -l for colors.accent, as CSS values (h unitless, s and l with %); {} when there is no valid accent. */
  function channelVars(colors, prefix) {
    var a = colors && colors.accent, out = {};
    if (!HEX.test(a || '')) return out;
    var p = accentParts(a), pre = '--' + (prefix || 'fr') + '-accent-';
    out[pre + 'h'] = String(p.h); out[pre + 's'] = p.s + '%'; out[pre + 'l'] = p.l + '%';
    return out;
  }

  /* ── calculated roles (v1.3.0) ──
     A role with a `calc` block in tokens.json ({ from, to, weight, rules, alt?, minWeight? }) lies on the sRGB line from
     one role (weight 0) to another (weight 100). complete(colors, opts) returns a copy of colors with every calculated
     role filled, in role order: an override (#RRGGBB in opts.overrides, default colors.overrides) wins; otherwise the
     nominal weight, or the nearest integer weight that passes the role's rules (ties go to the lower weight).
     opts.roles: the role list (default FrostingTokens.roles); opts.contracts: contracts (e.g. a standards profile's) that
     raise a calculated role's rule minimums where they name it;
     opts.fills (default colors.fills): gradients on roles, so a rule against a filled ground holds at its worst point. Never throws; a missing input gives the static default. */
  function calcRoles(list) { return (list || (root.FrostingTokens && root.FrostingTokens.roles) || []).filter(function (r) { return r && r.calc; }); }
  function cleanOverrides(ov, list) {
    var out = {};
    if (!ov || typeof ov !== 'object') return out;
    calcRoles(list).forEach(function (r) { var v = ov[r.name]; if (typeof v === 'string' && HEX.test(v)) out[r.name] = v.toUpperCase(); });
    return out;
  }
  function calcRules(r, contracts, later) {
    var rules = r.calc.rules.map(function (x) { return [x[0], x[1], true]; });
    function raise(g, min) { for (var i = 0; i < rules.length; i++) if (rules[i][0] === g) { rules[i][1] = Math.max(rules[i][1], min); return; } rules.push([g, min, false]); }
    (contracts || []).forEach(function (c) {
      if (!c || c.level === 'warn') return;
      var other = c.role === r.name ? c.against : c.role;
      if (later[other]) return;   // a calculated role still to come fits itself to this one, not the other way round
      if (c.role === r.name) raise(c.against, c.min); else if (c.against === r.name) raise(c.role, c.min);
    });
    return rules;
  }
  function resolve(r, col, contracts, later, fills) {
    var c = r.calc, rules = calcRules(r, contracts, later);
    var needed = [c.from, c.to].concat(c.alt ? [c.alt] : [], rules.filter(function (x) { return x[2]; }).map(function (x) { return x[0]; }));
    if (!needed.every(function (k) { return HEX.test(col[k] || ''); })) return HEX.test(col.bg || '') && isDark(col.bg) ? r.dark : r.light;
    // a ground painted with a gradient (FrostingFills) is judged at every sampled point, as the pass judges it
    var Fl = root.FrostingFills;
    rules = rules.filter(function (x) { return HEX.test(col[x[0]] || ''); }).map(function (x) {
      var pts = Fl && fills && fills[x[0]] ? Fl.sample(fills[x[0]], col) : [];
      return { min: x[1], at: pts.length ? pts : [col[x[0]]] };
    });
    function worstOf(h, x) { return Math.min.apply(null, x.at.map(function (g) { return contrast(h, g); })); }
    function score(h) { return Math.min.apply(null, rules.map(function (x) { return worstOf(h, x) / x.min; })); }
    function passes(h) { return rules.every(function (x) { return worstOf(h, x) >= x.min; }); }
    function line(a, b, w) { return mix(col[a], col[b], w / 100); }
    function order(w0, lo) {   // w0, w0-1, w0+1, w0-2, w0+2 … within [lo, 100]
      var ws = [];
      for (var d = 0; d <= 100; d++) { if (w0 - d >= lo) ws.push(w0 - d); if (d && w0 + d <= 100) ws.push(w0 + d); }
      return ws;
    }
    function search(a, b, lo) { var ws = order(c.weight, lo); for (var i = 0; i < ws.length; i++) { var h = line(a, b, ws[i]); if (passes(h)) return h; } return null; }
    if (!c.alt) {
      var h = search(c.from, c.to, 0);
      if (h) return h;
      var best = null, bestS = -1;   // best effort: the weight whose worst rule comes closest
      order(c.weight, 0).forEach(function (w) { var x = line(c.from, c.to, w), s = score(x); if (s > bestS) { bestS = s; best = x; } });
      return best;
    }
    var lo = c.minWeight || 0, m = line(c.from, c.to, c.weight), a = line(c.from, c.alt, c.weight);
    if (passes(m)) return m;
    if (passes(a)) return a;
    return search(c.from, c.to, lo) || search(c.from, c.alt, lo) || col[c.from].toUpperCase();
  }
  function complete(colors, opts) {
    opts = opts || {};
    var out = Object.assign({}, colors || {}), list = calcRoles(opts.roles);
    var ov = cleanOverrides(opts.overrides !== undefined ? opts.overrides : out.overrides, list);
    var fills = opts.fills !== undefined ? opts.fills : out.fills;
    var later = {}; list.forEach(function (r) { later[r.name] = true; });
    list.forEach(function (r) { delete later[r.name]; out[r.name] = ov[r.name] || resolve(r, out, opts.contracts, later, fills); });
    return out;
  }

  /* ── contracts ──
     check(theme, contracts): contracts default to tokens.json's list (via FrostingTokens) plus any
     registered by extensions. Returns [{label, ratio, min, ok}] in contract order; a missing role fails. */
  var extra = [];
  function contracts() { return ((root.FrostingTokens && root.FrostingTokens.contracts) || []).concat(extra); }
  function check(theme, list) {
    return (list || contracts()).map(function (c) {
      var a = theme[c.role], b = theme[c.against], r = HEX.test(a || '') && HEX.test(b || '') ? contrast(a, b) : 0;
      return { label: c.label, role: c.role, against: c.against, ratio: Math.round(r * 10) / 10, min: c.min, ok: r >= c.min };
    });
  }
  function addContracts(list) { extra = extra.concat(list); }

  var api = {
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, hsl: hsl, hex: hex, lum: lum, contrast: contrast, mix: mix, isDark: isDark,
    accentParts: accentParts, channelVars: channelVars, complete: complete, cleanOverrides: cleanOverrides, fit: fit, ink: ink, bgHeadroom: bgHeadroom, check: check, contracts: contracts, addContracts: addContracts, HEX: HEX,
  };
  root.FrostingColor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
