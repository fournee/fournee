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
    fit: fit, ink: ink, bgHeadroom: bgHeadroom, check: check, contracts: contracts, addContracts: addContracts, HEX: HEX,
  };
  root.FrostingColor = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
