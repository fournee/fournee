/* frosting · fills (gradients on roles)
   A role keeps its solid colour (text, borders and the contrast maths use it, and it is always painted under
   the fill) and may carry a gradient fill for the areas it paints:
     fills = { surface: { stops: ['#123456', 'role:accent'], angle: 135, space: 'oklab' }, … }
   - stops: 2–3, each a #RRGGBB or 'role:<name>' (follows that role when the look changes), evenly spaced
   - angle: degrees, 0–359 (no corner keywords: they change with the box's shape)
   - space: 'oklab' (default; never a grey midpoint) or 'oklch' (shorter hue; never with greys, Chromium shifts them)
   Emitted as --<p>-<role>-fill: linear-gradient(<angle>deg in <space>, …). A page paints
     background-color: var(--fr-surface); background-image: var(--fr-surface-fill, none);
   and frosting.css switches every fill off under forced colours, prefers-contrast: more and print.
   Contrast over a fill is the worst of 32 samples along it, in its own colour space (research, Nov 2026:
   the middle of a gradient can be worse than either end). fit() moves the stops' OKLCH lightness only.
   Pure logic plus apply(); plain script (window.FrostingFills) or require()-able. Needs FrostingColor. */
(function (root) {
  'use strict';
  var C = root.FrostingColor;   // load src/readability.js first (bundles do; no require here, so bundlers don't chase it)
  if (!C) throw new Error('frosting fills: FrostingColor is not loaded (load src/readability.js first)');
  var HEX = /^#[0-9a-fA-F]{6}$/, ROLE = /^role:([a-z0-9-]+)$/, SPACES = ['oklab', 'oklch'];
  var ANGLES = [0, 45, 90, 135, 180, 225, 270, 315], SAMPLES = 32, MAX_STOPS = 3;

  /* ── Oklab (Björn Ottosson's matrices, the ones CSS Color 4 uses) ── */
  function toLin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function fromLin(v) { v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, v * 255)); }
  function oklab(hex) {
    var c = C.hexToRgb(hex).map(toLin), r = c[0], g = c[1], b = c[2];
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
  }
  function fromOklab(o) {
    var l = Math.pow(o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2], 3);
    var m = Math.pow(o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2], 3);
    var s = Math.pow(o[0] - 0.0894841775 * o[1] - 1.2914855480 * o[2], 3);
    return C.rgbToHex([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(fromLin));
  }
  function oklch(hex) { var o = oklab(hex), c = Math.hypot(o[1], o[2]), h = Math.atan2(o[2], o[1]) * 180 / Math.PI; return [o[0], c, (h + 360) % 360]; }
  function fromOklch(o) { var h = o[2] * Math.PI / 180; return fromOklab([o[0], o[1] * Math.cos(h), o[1] * Math.sin(h)]); }
  /* into sRGB by lowering chroma only, so the hue and lightness stay put (clipping channels would shift the hue) */
  function inGamut(o) {
    var c = o[1];
    function ok(cc) {
      var h = o[2] * Math.PI / 180, a = cc * Math.cos(h), b = cc * Math.sin(h);
      var l = Math.pow(o[0] + 0.3963377774 * a + 0.2158037573 * b, 3), m = Math.pow(o[0] - 0.1055613458 * a - 0.0638541728 * b, 3), s = Math.pow(o[0] - 0.0894841775 * a - 1.2914855480 * b, 3);
      return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
        .every(function (v) { return v >= -1e-4 && v <= 1 + 1e-4; });
    }
    while (c > 0 && !ok(c)) c -= 0.002;
    return fromOklch([o[0], Math.max(0, c), o[2]]);
  }

  /* ── shape ── */
  function stopHex(stop, colors) { var m = ROLE.exec(stop); return m ? (colors && HEX.test(colors[m[1]] || '') ? colors[m[1]].toUpperCase() : null) : stop.toUpperCase(); }
  function validStop(s, roleNames) { if (typeof s !== 'string') return false; if (HEX.test(s)) return true; var m = ROLE.exec(s); return !!m && (!roleNames || roleNames.indexOf(m[1]) >= 0); }
  /* one fill, or null when it isn't one */
  function cleanFill(f, roleNames) {
    if (!f || typeof f !== 'object' || !Array.isArray(f.stops)) return null;
    var stops = f.stops.filter(function (s) { return validStop(s, roleNames); }).slice(0, MAX_STOPS).map(function (s) { return HEX.test(s) ? s.toUpperCase() : s; });
    if (stops.length < 2) return null;
    var angle = Math.round(Number(f.angle)); if (!isFinite(angle)) angle = 180; angle = ((angle % 360) + 360) % 360;
    return { stops: stops, angle: angle, space: SPACES.indexOf(f.space) >= 0 ? f.space : 'oklab' };
  }
  /* fills for a look: known roles only (roleNames), bad entries dropped */
  function clean(fills, roleNames) {
    var out = {};
    if (!fills || typeof fills !== 'object') return out;
    Object.keys(fills).forEach(function (k) { if (roleNames && roleNames.indexOf(k) < 0) return; var f = cleanFill(fills[k], roleNames); if (f) out[k] = f; });
    return out;
  }

  /* ── sampling: the colours a fill really shows, in its own space ── */
  function mixIn(a, b, t, space) {
    if (space === 'oklch') {
      var x = oklch(a), y = oklch(b), dh = y[2] - x[2];
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;   // shorter hue
      if (x[1] < 0.02) x[2] = y[2]; if (y[1] < 0.02) { y[2] = x[2]; dh = 0; }   // powerless hue on greys
      return fromOklch([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + dh * t]);
    }
    var p = oklab(a), q = oklab(b);
    return fromOklab([0, 1, 2].map(function (i) { return p[i] + (q[i] - p[i]) * t; }));
  }
  function sample(fill, colors, n) {
    n = n || SAMPLES;
    var hexes = fill.stops.map(function (s) { return stopHex(s, colors); });
    if (hexes.some(function (h) { return !h; })) return [];
    var out = [], seg = hexes.length - 1;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1), k = Math.min(seg - 1, Math.floor(t * seg)), u = t * seg - k;
      out.push(mixIn(hexes[k], hexes[k + 1], u, fill.space));
    }
    return out;
  }
  /* the worst WCAG ratio between two paints (a hex or a fill); a fill against a fill takes every pairing */
  function worst(a, b, colors) {
    var A = typeof a === 'string' ? [a] : sample(a, colors), B = typeof b === 'string' ? [b] : sample(b, colors);
    if (!A.length || !B.length) return 0;
    var min = 99, max = 0;
    A.forEach(function (x) { B.forEach(function (y) { var r = C.contrast(x, y); if (r < min) min = r; if (r > max) max = r; }); });
    return min;
  }
  function range(a, b, colors) {
    var A = typeof a === 'string' ? [a] : sample(a, colors), B = typeof b === 'string' ? [b] : sample(b, colors), lo = 99, hi = 0;
    A.forEach(function (x) { B.forEach(function (y) { var r = C.contrast(x, y); lo = Math.min(lo, r); hi = Math.max(hi, r); }); });
    return [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10];
  }

  /* ── contracts over fills: every contract that touches a filled role, judged at its worst point ── */
  function check(colors, fills, list) {
    fills = fills || {};
    return (list || C.contracts()).filter(function (c) { return fills[c.role] || fills[c.against]; }).map(function (c) {
      var a = fills[c.role] || colors[c.role], b = fills[c.against] || colors[c.against];
      var r = worst(a, b, colors), rg = range(a, b, colors);
      return { label: c.label + ' (gradient)', role: c.role, against: c.against, ratio: Math.round(r * 10) / 10, range: rg, min: c.min, ok: r >= c.min, fill: true };
    });
  }

  /* ── fit: move the stops' OKLCH lightness (all together, smallest move first) until every rule passes at
     the fill's worst point. rules: [[againstHexOrFill, min], …]. Returns a fill with literal stops, or null when
     no lightness passes (the caller then falls back to the solid role). ── */
  function fit(fill, colors, rules) {
    var base = fill.stops.map(function (s) { return stopHex(s, colors); });
    if (base.some(function (h) { return !h; })) return null;
    var lch = base.map(oklch);
    function at(d) { return { stops: lch.map(function (o) { return inGamut([Math.max(0, Math.min(1, o[0] + d)), o[1], o[2]]); }), angle: fill.angle, space: fill.space }; }
    function passes(f) { return rules.every(function (r) { return worst(f, r[0], colors) >= r[1]; }); }
    if (passes(fill)) return fill;
    for (var step = 1; step <= 60; step++) {
      var d = step * 0.01;
      var up = at(d), down = at(-d);
      if (passes(up)) return up;
      if (passes(down)) return down;
    }
    return null;
  }

  /* ── 🎲 a tasteful gradient from one colour (seeded): OKLCH, the second stop 20–60° round the hue wheel with
     similar lightness and chroma, so the middle never goes grey; angle from the 8 chips. ── */
  function rng(seed) { var t = seed >>> 0; return function () { t += 0x6D2B79F5; var r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  function lucky(baseHex, seed) {
    var r = rng(seed == null ? Math.floor(Math.random() * 4294967296) : seed), o = oklch(baseHex);
    var shift = (20 + r() * 40) * (r() < 0.5 ? -1 : 1), dl = (r() - 0.5) * 0.12, c = Math.max(o[1], 0.06);
    var other = inGamut([Math.max(0.05, Math.min(0.97, o[0] + dl)), c * (0.85 + r() * 0.3), (o[2] + shift + 360) % 360]);
    return { stops: [baseHex.toUpperCase(), other], angle: ANGLES[Math.floor(r() * ANGLES.length)], space: 'oklab' };
  }
  /* the editor's first gradient for a role: two stops from its current colour, a nudge apart in lightness */
  function seed(hex) {
    var o = oklch(hex), d = o[0] > 0.5 ? -0.08 : 0.08;
    return { stops: [hex.toUpperCase(), inGamut([o[0] + d, o[1], (o[2] + 18) % 360])], angle: 135, space: 'oklab' };
  }
  function flip(fill) { return { stops: fill.stops.slice().reverse(), angle: fill.angle, space: fill.space }; }

  /* ── CSS ── */
  function stopCss(s, prefix) { var m = ROLE.exec(s); return m ? 'var(--' + prefix + '-' + m[1] + ')' : s; }
  function css(fill, prefix) {
    prefix = prefix || (root.FrostingTokens && root.FrostingTokens.prefix) || 'fr';
    return 'linear-gradient(' + fill.angle + 'deg in ' + fill.space + ', ' + fill.stops.map(function (s) { return stopCss(s, prefix); }).join(', ') + ')';
  }
  function declarations(fills, prefix) {
    prefix = prefix || (root.FrostingTokens && root.FrostingTokens.prefix) || 'fr';
    var out = {};
    Object.keys(fills || {}).forEach(function (k) { out['--' + prefix + '-' + k + '-fill'] = css(fills[k], prefix); });
    return out;
  }
  /* write a look's fills onto an element; roles in `all` without a fill have theirs removed */
  function apply(target, fills, prefix, all) {
    prefix = prefix || (root.FrostingTokens && root.FrostingTokens.prefix) || 'fr';
    var d = declarations(fills, prefix);
    (all || Object.keys(fills || {})).forEach(function (k) { var p = '--' + prefix + '-' + k + '-fill'; if (d[p]) target.style.setProperty(p, d[p]); else target.style.removeProperty(p); });
  }

  var api = { clean: clean, cleanFill: cleanFill, sample: sample, worst: worst, range: range, check: check, fit: fit, lucky: lucky, seed: seed, flip: flip,
    css: css, declarations: declarations, apply: apply, oklab: oklab, fromOklab: fromOklab, oklch: oklch, fromOklch: fromOklch, inGamut: inGamut, stopHex: stopHex, mixIn: mixIn,
    ANGLES: ANGLES, SAMPLES: SAMPLES, MAX_STOPS: MAX_STOPS, SPACES: SPACES };
  root.FrostingFills = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
