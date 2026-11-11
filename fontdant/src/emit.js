/* fontdant · before-first-paint emission
   What a page needs in its first HTML bytes so a look renders with no flash and no jump (proposal §5.5):
   one preload per upright face file, the @font-face aliases and metric-matched fallbacks, the :root variables
   (faces, dials, role overrides) and the mode attribute for <html>. A server (a Worker's HTMLRewriter, a
   build step, pywebview's served page) writes these; the panel uses the same output for live preview.
   head(look, { baseUrl, id }) → { preloads, style, css, htmlAttrs, html }
   Plain script (window.FontdantEmit) or require()-able. Needs FontdantTokens, FontdantLibrary, FontdantFonts,
   FontdantCheck. */
(function (root) {
  'use strict';
  function css(look, opts) {
    look = look || {}; opts = opts || {};
    var T = root.FontdantTokens, p = T.prefix, F = root.FontdantFonts, C = root.FontdantCheck;
    if (look.fonts) F.use(look.fonts);
    // opts.display overrides each slot's font-display (desktop apps whose fonts are local files: 'block')
    var fc = F.faceCss(look, { baseUrl: opts.baseUrl, display: opts.display });
    var vars = Object.keys(fc.vars).map(function (s) { return '--' + p + '-face-' + s + ': ' + fc.vars[s] + ';'; });
    var rest = C.cssVars(look).split('\n').filter(function (l) { return l && !/^\/\*/.test(l) && !/^--[\w-]+-face-/.test(l); });
    var ext = extensionCss(look);
    return { fonts: fc, text: fc.css + '\n:root {\n  ' + vars.concat(rest).join('\n  ') + '\n}' + (ext ? '\n' + ext : '') };
  }
  /* A project's extension roles (look.extensions.roles, proposal §8): the same longhand variables and class the
     build emits for a core role (.fd-<name>), so a project uses them like any role. Mode maps are honoured. */
  function extensionCss(look) {
    var T = root.FontdantTokens, p = T.prefix, ext = look && look.extensions && look.extensions.roles;
    if (!Array.isArray(ext) || !ext.length) return '';
    var modes = Object.keys(T.modes), core = {}; T.roles.forEach(function (r) { core[r.name] = 1; });
    var isMap = function (v) { return v && typeof v === 'object' && modes.some(function (m) { return m in v; }); };
    var at = function (v, m) { return isMap(v) ? v[m] : v; };
    var scaled = function (e) { return String(e).replace(/(\d*\.?\d+)rem/g, 'calc($1rem * var(--' + p + '-scaling))'); };
    var size = function (s) { return T.stepOrder.indexOf(s) >= 0 ? 'var(--' + p + '-step-' + s + ')' : scaled(s); };
    var weight = function (w) { return w in T.weights ? 'var(--' + p + '-weight-' + w + ')' : String(w); };
    var roots = {}, classes = [];
    ext.forEach(function (r) {
      if (!r || typeof r.name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(r.name) || core[r.name]) return;
      var n = r.name, face = r.face || 'text';
      modes.forEach(function (m) {
        var lines = roots[m] = roots[m] || [];
        var push = function (k, v) { lines.push('--' + p + '-' + n + '-' + k + ': ' + v + ';'); };
        push('family', 'var(--' + p + '-face-' + at(face, m) + ')');
        push('size', size(at(r.size, m)));
        push('weight', weight(r.weight == null ? 'regular' : r.weight));
        push('leading', String(at(r.leading == null ? 1.3 : r.leading, m)));
        push('tracking', String(at(r.tracking == null ? '0' : r.tracking, m)));
        push('numeric', r.tnum ? 'tabular-nums' : 'normal');
        push('transform', r.case === 'upper' ? 'uppercase' : r.case === 'lower' ? 'lowercase' : 'none');
        push('style', r.italic ? 'italic' : 'normal');
      });
      classes.push('.' + p + '-' + n + ' {\n  font-family: var(--' + p + '-' + n + '-family); font-size: var(--' + p + '-' + n + '-size); font-weight: var(--' + p + '-' + n + '-weight);\n  line-height: var(--' + p + '-' + n + '-leading); letter-spacing: var(--' + p + '-' + n + '-tracking); font-variant-numeric: var(--' + p + '-' + n + '-numeric);\n  text-transform: var(--' + p + '-' + n + '-transform); font-style: var(--' + p + '-' + n + '-style); font-synthesis: none;' + (at(face, T.defaultMode) === 'mono' ? ' overflow-wrap: anywhere;' : '') + '\n}');
    });
    if (!classes.length) return '';
    var out = ['/* extension roles: ' + ext.map(function (r) { return r && r.name; }).join(', ') + ' */', ':root {\n  ' + roots[T.defaultMode].join('\n  ') + '\n}'];
    modes.filter(function (m) { return m !== T.defaultMode; }).forEach(function (m) {
      var diff = roots[m].filter(function (l, i) { return l !== roots[T.defaultMode][i]; });
      if (diff.length) out.push(':root[data-' + p + '-mode="' + m + '"] {\n  ' + diff.join('\n  ') + '\n}');
    });
    return out.concat(classes).join('\n');
  }
  /* Adobe Fonts kits the look uses (provider adobe-kit): their stylesheet links, which may flash */
  function kits(look) {
    var F = root.FontdantFonts, out = []; if (look && look.fonts) F.use(look.fonts);
    var faces = F.facesOf(look || {}); Object.keys(faces).forEach(function (s) { var en = F.entryOf(faces[s]); if (en && en.kit) { var u = 'https://use.typekit.net/' + en.kit + '.css'; if (out.indexOf(u) < 0) out.push(u); } });
    return out;
  }
  function head(look, opts) {
    look = look || {}; opts = opts || {};
    var T = root.FontdantTokens, p = T.prefix, c = css(look, opts);
    var preloads = c.fonts.preloads.map(function (u) { return '<link rel="preload" as="font" type="font/' + (/\.woff2(\?|$)/.test(u) ? 'woff2' : /\.woff(\?|$)/.test(u) ? 'woff' : /\.otf(\?|$)/.test(u) ? 'otf' : 'ttf') + '" href="' + u + '" crossorigin>'; }).join('');
    preloads += kits(look).map(function (u) { return '<link rel="stylesheet" href="' + u + '">'; }).join('');
    var style = '<style id="' + (opts.id || 'fontdant') + '">' + c.text.replace(/<\/style/gi, '<\\/style') + '</style>';
    var attrs = {}; if (look.mode && look.mode !== T.defaultMode) attrs['data-' + p + '-mode'] = look.mode;
    return { preloads: preloads, style: style, css: c.text, htmlAttrs: attrs, html: preloads + style };
  }
  var api = { head: head, kits: kits, extensionCss: extensionCss, css: function (look, opts) { return css(look, opts).text; } };
  root.FontdantEmit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
