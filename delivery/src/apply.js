/* delivery · MiseApply: one recipe → what any web view needs (build phase 6)
   The core every wrapper calls, so React, Svelte, Electron, pywebview and plain HTML render a recipe the same way.

   css(recipe, opts)      → the whole look as CSS text: frosting's colours (Plain greys when Sprinkles is off), the
                             prefers-contrast / High contrast block (J3), fontdant's @font-face aliases and :root vars
   head(recipe, opts)     → { html, preloads, style, css, htmlAttrs } for the first HTML bytes (a server, a build
                             step, a Python string): no flash, no jump
   apply(recipe, opts)    → writes the same into a live document: one <style id="mise">, the mode attribute on <html>.
                             Synchronous, so a <script> in <head> applies it before first paint; returns classes(recipe)
   classes(recipe)        → { styleName: 'fd-…' } for every role, step and variant (extension roles included)
   fontFiles(recipe, opts)→ the font files the look uses ({ id, file, url }) so a host can copy or serve them
   opts: { baseUrl ('fonts'), doc (document), id ('mise'), frostingPrefix ('fr') }

   Plain script (window.MiseApply) or require()-able. Needs FrostingTokens, FrostingColor, FontdantTokens,
   FontdantLibrary, FontdantFonts, FontdantCheck, FontdantEmit, KitchenRecipe, KitchenSprinkles (dist/mise.js
   bundles them all). */
(function (root) {
  'use strict';
  function need(name) { var v = root[name]; if (!v) throw new Error('MiseApply needs ' + name + ' (load dist/mise.js)'); return v; }

  /* a recipe as stored (any shape) → a clean one; colours default to frosting's for the recipe's scheme */
  function clean(recipe) {
    var FT = need('FrostingTokens'), R = need('KitchenRecipe');
    var scheme = recipe && recipe.scheme === 'Dark' ? 'Dark' : 'Light';
    return R.clean(recipe || {}, { scheme: scheme, colors: scheme === 'Dark' ? FT.dark : FT.light });
  }
  function colorCss(r, prefix) {
    var S = need('KitchenSprinkles'), colors = S.effective(r), p = prefix || need('FrostingTokens').prefix || 'fr';
    var decl = Object.keys(colors).filter(function (k) { return typeof colors[k] === 'string'; }).map(function (k) { return '--' + p + '-' + k + ': ' + colors[k] + ';'; }).join('\n  ');
    // gradient fills on roles: --<p>-<role>-fill (frosting/src/fills.js); frosting.css turns them off for forced colours, more contrast, print
    var F = root.FrostingFills, fd = F && r.frosting.fills ? F.declarations(r.frosting.fills, p) : {};
    Object.keys(fd).forEach(function (k) { decl += '\n  ' + k + ': ' + fd[k] + ';'; });
    var contrast = S.css(r.frosting.colors, { prefix: p });
    // :root:root:root (specificity 0,3,0) so the recipe beats frosting.css's own scheme defaults
    // (:root:not([data-theme="light"]) under prefers-color-scheme: dark, and :root[data-theme="dark"], both 0,2,0):
    // a recipe's colours hold on a dark-mode system too. Sprinkles' contrast block uses !important and still wins.
    return ':root:root:root {\n  ' + decl + '\n  color-scheme: ' + (r.scheme === 'Dark' ? 'dark' : 'light') + ';\n}' + (contrast ? '\n' + contrast : '');
  }
  function css(recipe, opts) {
    opts = opts || {}; var r = clean(recipe);
    return colorCss(r, opts.frostingPrefix) + '\n' + need('FontdantEmit').css(r.fontdant, { baseUrl: opts.baseUrl || 'fonts' });
  }
  function head(recipe, opts) {
    opts = opts || {}; var r = clean(recipe);
    var h = need('FontdantEmit').head(r.fontdant, { baseUrl: opts.baseUrl || 'fonts', id: opts.id || 'mise' });
    var text = colorCss(r, opts.frostingPrefix) + '\n' + h.css;
    var style = '<style id="' + (opts.id || 'mise') + '">' + text.replace(/<\/style/gi, '<\\/style') + '</style>';
    return { html: h.preloads + style, preloads: h.preloads, style: style, css: text, htmlAttrs: h.htmlAttrs };
  }
  function apply(recipe, opts) {
    opts = opts || {}; var doc = opts.doc || root.document, r = clean(recipe), id = opts.id || 'mise';
    var T = need('FontdantTokens'), attr = 'data-' + T.prefix + '-mode';
    var tag = doc.getElementById(id);
    if (!tag) { tag = doc.createElement('style'); tag.id = id; (doc.head || doc.documentElement).appendChild(tag); }
    tag.textContent = css(r, opts);
    var mode = r.fontdant.mode;
    if (mode && mode !== T.defaultMode) doc.documentElement.setAttribute(attr, mode); else doc.documentElement.removeAttribute(attr);
    return classes(r);
  }
  function classes(recipe) {
    var T = need('FontdantTokens'), C = need('FontdantCheck'), r = recipe && recipe.frosting ? recipe : clean(recipe), p = T.prefix, out = {};
    var variant = {}; (T.styles || []).forEach(function (s) { if (s.variant) variant[s.name] = s.role; });
    C.resolve(r.fontdant).styles.forEach(function (s) {
      out[s.name] = s.kind === 'variant' || variant[s.name] ? p + '-' + s.role + '--' + s.name.slice(s.role.length + 1) : p + '-' + s.name;
    });
    return out;
  }
  function fontFiles(recipe, opts) {
    opts = opts || {}; var r = clean(recipe), F = need('FontdantFonts'), base = (opts.baseUrl || 'fonts').replace(/\/$/, '');
    if (r.fontdant.fonts) F.use(r.fontdant.fonts);
    var faces = F.facesOf(r.fontdant), seen = {}, out = [];
    Object.keys(faces).forEach(function (slot) {
      var e = F.entryOf(faces[slot]); if (!e || seen[e.id]) return; seen[e.id] = 1;
      (e.files || []).forEach(function (f) {
        var file = typeof f === 'string' ? f : f.file || f.src; if (!file) return;
        var src = typeof f === 'object' && f.src ? f.src : null;
        out.push({ id: e.id, family: e.family, file: file, weight: typeof f === 'object' ? f.weight : null, style: (typeof f === 'object' && f.style) || 'normal', variable: !!(e.weights && e.weights.kind === 'variable'),
          url: src || base + '/' + e.id + '/' + file, inline: !!(src && /^data:/.test(src)), external: !!(src && /^(https?:)?\/\//.test(src)) });
      });
    });
    return out;
  }

  var api = { clean: clean, css: css, head: head, apply: apply, classes: classes, fontFiles: fontFiles };
  root.MiseApply = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
