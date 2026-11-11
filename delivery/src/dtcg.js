/* delivery · MiseDTCG: a recipe as W3C Design Tokens, Format Module 2025.10 (decision F3: export only;
   type-tokens.json and the recipe stay the source of truth).

   export(recipe, opts) → a .tokens.json object:
     color.*            $type color: frosting's roles as {colorSpace: "srgb", components, hex}; the colours visitors
                        see (Plain greys when Sprinkles is off; the designed ones are kept in $extensions)
     font.family.*      $type fontFamily: the three face slots (the real family, then the slot's generic stack)
     font.weight.*      $type fontWeight: the five weight dials
     font.size.*        $type dimension: the mode's size steps in rem (a fluid clamp() exports as its minimum)
     typography.*       $type typography: every role, step and variant: fontFamily, fontSize, fontWeight,
                        letterSpacing (em tracking → rem at that size), lineHeight, by reference where it can
   Anything DTCG has no field for (case, tabular numbers, italic, the class name, the fit factor) goes under
   $extensions["io.github.fournee"]. opts: { mode } to export another mode than the recipe's.
   Plain script (window.MiseDTCG) or require()-able. Needs what MiseApply needs. */
(function (root) {
  'use strict';
  var EXT = 'io.github.fournee';
  function r4(n) { return Math.round(n * 10000) / 10000; }
  function rem(px) { return { value: r4(px / 16), unit: 'rem' }; }
  function color(hex) {
    var h = String(hex).replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var c = [0, 2, 4].map(function (i) { return r4(parseInt(h.slice(i, i + 2), 16) / 255); });
    return { colorSpace: 'srgb', components: c, hex: '#' + h.toLowerCase() };
  }
  function ext(o) { var e = {}; e[EXT] = o; return e; }

  function exportTokens(recipe, opts) {
    opts = opts || {};
    var A = root.MiseApply, T = root.FontdantTokens, C = root.FontdantCheck, F = root.FontdantFonts, S = root.KitchenSprinkles, FT = root.FrostingTokens;
    var r = A.clean(recipe), look = JSON.parse(JSON.stringify(r.fontdant)); if (opts.mode) look.mode = opts.mode;
    var R = C.resolve(look), faces = F.facesOf(look), seen = r.frosting.colors, shown = S.effective(r);
    var out = { $description: 'Fournée recipe "' + r.name + '" as W3C Design Tokens (Format Module 2025.10). Exported from Fournée; the recipe is the source of truth.',
      $extensions: ext({ recipe: r.name, client: r.client, scheme: r.scheme, mode: R.mode, sprinkles: r.sprinkles, format: '2025.10' }) };

    // colours
    var roleInfo = {}; (FT.roles || []).forEach(function (x) { roleInfo[x.name] = x; });
    out.color = { $type: 'color' };
    Object.keys(shown).forEach(function (k) {
      var t = { $value: color(shown[k]) }, info = roleInfo[k];
      if (info && info.use) t.$description = info.use;
      if (String(shown[k]).toUpperCase() !== String(seen[k]).toUpperCase()) t.$extensions = ext({ designed: color(seen[k]), plain: true });
      out.color[k] = t;
    });
    // gradient fills: DTCG 2025.10 `gradient` tokens beside the solid ones (accent → accent-fill). The stable
    // format has no angle, kind or colour space, so those ride in $extensions; a stop that follows a role is an alias.
    var fills = r.frosting.fills || {};
    if (Object.keys(fills).length) {
      out.gradient = { $type: 'gradient' };
      Object.keys(fills).forEach(function (k) {
        var f = fills[k], n = f.stops.length;
        out.gradient[k + '-fill'] = {
          $value: f.stops.map(function (s, i) { var m = /^role:(.+)$/.exec(s); return { color: m ? '{color.' + m[1] + '}' : color(s), position: n > 1 ? i / (n - 1) : 0 }; }),
          $description: 'Gradient fill painted over the ' + k + ' role (the solid ' + k + ' stays underneath).',
          $extensions: ext({ angle: f.angle, kind: 'linear', space: f.space }),
        };
      });
    }

    // faces
    out.font = { family: { $type: 'fontFamily' }, weight: { $type: 'fontWeight' }, size: { $type: 'dimension' } };
    ['display', 'text', 'mono'].forEach(function (slot) {
      var e = F.entryOf(faces[slot]), generic = (T.faces[slot] && T.faces[slot].generic) || 'sans-serif';
      var stack = [e ? e.family : faces[slot]].concat(generic.split(',').map(function (s) { return s.trim().replace(/^["']|["']$/g, ''); }));
      out.font.family[slot] = { $value: stack, $description: (T.faces[slot] && T.faces[slot].use) || slot,
        $extensions: ext(e ? { fontId: e.id, fit: r4(F.fitFactor(e, slot)), sizeAdjust: Math.round(F.fitFactor(e, slot) * 10000) / 100 + '%', licence: e.licence ? (e.licence.id || e.licence.spdx || null) : null } : {}) };
    });
    Object.keys(R.weights).forEach(function (k) { out.font.weight[k] = { $value: R.weights[k] }; });
    T.stepOrder.forEach(function (s) {
      var t = { $value: rem(R.stepPx[s]) };
      if (/clamp\(/.test(String(R.steps[s]))) t.$extensions = ext({ css: String(R.steps[s]), note: 'fluid: exported at its minimum' });
      out.font.size[s] = t;
    });

    // typography: one composite per emitted style
    var cls = A.classes(r);
    out.typography = { $type: 'typography' };
    R.styles.forEach(function (s) {
      var lead = typeof s.leading === 'number' ? s.leading : parseFloat(s.leading);
      var v = {
        fontFamily: '{font.family.' + s.face + '}',
        fontSize: s.step ? '{font.size.' + s.step + '}' : rem(s.sizePx),
        fontWeight: s.weightDial ? '{font.weight.' + s.weightDial + '}' : s.weight,
        letterSpacing: rem((isNaN(s.trackingEm) ? 0 : s.trackingEm) * s.sizePx),
        lineHeight: lead,
      };
      out.typography[s.name] = { $value: v, $extensions: ext({ class: cls[s.name], role: s.role, kind: s.kind, case: s.case, tnum: s.tnum, italic: s.italic, tracking: s.tracking, sizePx: s.sizePx, extension: s.extension || undefined }) };
    });
    return out;
  }

  var api = { export: exportTokens, color: color, EXT: EXT };
  root.MiseDTCG = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
