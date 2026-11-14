/* kitchen · recipe
   A recipe is a saved business profile: { name, scheme, client, frosting: { colors, overrides? }, fontdant: { … } }.
   frosting.overrides (v1.3.0) pins calculated roles ({ role: '#RRGGBB' }); every other calculated role is recomputed.
   frosting's half is a look's colours; fontdant's half is a type look (mode, scaling, faces, dials, roles,
   styles, fonts) and may be empty. Validation follows frosting's one rule: unknown keys are dropped,
   missing ones fall back to defaults. Plain script (window.KitchenRecipe) or require()-able.
   createRecipeStore() keeps published / draft / favorite recipes through any KitchenStore adapter, under
   their own keys, so a project can hold its old frosting look and its recipes side by side. */
(function (root) {
  'use strict';
  var HEX = /^#[0-9a-fA-F]{6}$/;
  var SCHEMES = ['Light', 'Dark'];
  var FONTDANT_KEYS = ['mode', 'scaling', 'faces', 'dials', 'roles', 'styles', 'fonts'];
  var FACE_SLOTS = ['display', 'text', 'mono'];

  function str(v, max) { return typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max || 80) : ''; }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

  /* frosting half: keep known roles with #RRGGBB (uppercased), fill the rest from defaults. */
  function cleanColors(colors, defaults) {
    var out = Object.assign({}, defaults || {});
    Object.keys(colors || {}).forEach(function (k) { if (k in out && HEX.test(String(colors[k]))) out[k] = String(colors[k]).toUpperCase(); });
    return out;
  }

  /* fontdant half: may be empty. Keeps only the known keys with the right shapes. Deeper validation
     (floors, weights a face has, fit) is fontdant's FontdantCheck.fit(), run by the pass, not here. */
  function cleanFontdant(fd) {
    var out = {};
    if (!isObj(fd)) return out;
    var T = root.FontdantTokens;
    if (typeof fd.mode === 'string' && (!T || (T.modes && fd.mode in T.modes))) out.mode = fd.mode;
    if (typeof fd.scaling === 'number' && isFinite(fd.scaling)) out.scaling = fd.scaling;
    if (isObj(fd.faces)) {
      var faces = {}; FACE_SLOTS.concat(Object.keys(fd.faces)).forEach(function (s) { if (typeof fd.faces[s] === 'string' && fd.faces[s]) faces[s] = str(fd.faces[s], 80); });
      if (Object.keys(faces).length) out.faces = faces;
    }
    if (isObj(fd.fit)) { var fit = {}; FACE_SLOTS.forEach(function (s) { if (fd.fit[s] === false) fit[s] = false; }); if (Object.keys(fit).length) out.fit = fit; }   // fit off per slot (natural size)
    ['dials', 'roles', 'styles', 'fonts', 'extensions'].forEach(function (k) { if (isObj(fd[k]) && Object.keys(fd[k]).length) out[k] = JSON.parse(JSON.stringify(fd[k])); });
    return out;
  }

  /* defaults: { colors } — frosting's defaults for the viewer's scheme. */
  function clean(recipe, defaults) {
    recipe = isObj(recipe) ? recipe : {};
    defaults = defaults || {};
    var fr = isObj(recipe.frosting) ? recipe.frosting : {};
    var out = {
      name: str(recipe.name, 40) || 'Untitled recipe',
      scheme: SCHEMES.indexOf(recipe.scheme) >= 0 ? recipe.scheme : (defaults.scheme || 'Light'),
      client: str(recipe.client, 80) || null,
      frosting: { colors: cleanColors(fr.colors, defaults.colors) },
      fontdant: cleanFontdant(recipe.fontdant),
      // the standards dial (kitchen/src/standards.js): which rules the pass judges against; null = Fournée's house rules
      standard: typeof recipe.standard === 'string' && /^[a-z0-9-]{2,40}$/.test(recipe.standard) ? recipe.standard : null,
      sprinkles: recipe.sprinkles !== false,   // Sprinkles (J1): on unless turned off; Plain greys are computed, never stored
    };
    // gradient fills on roles (frosting/src/fills.js); kept only when FrostingFills is loaded to validate them
    var F = root.FrostingFills, fills = F && fr.fills ? F.clean(fr.fills, Object.keys(out.frosting.colors)) : null;
    if (fills && Object.keys(fills).length) out.frosting.fills = fills;
    // calculated roles (v1.3.0): recomputed from the recipe's own roles on every clean (a stored value is only a cache),
    // except those named in frosting.overrides (or, for a look-shaped map, colors.overrides). Under a standards profile its
    // contracts raise the calculated roles' minimums. Needs FrostingColor, like fills need FrostingFills.
    var C = root.FrostingColor;
    if (C && C.complete) {
      var ov = C.cleanOverrides(isObj(fr.overrides) ? fr.overrides : fr.colors && fr.colors.overrides);
      var KS = root.KitchenStandards, list = KS && out.standard && KS.get(out.standard) ? KS.contracts(out.standard, C.contracts(), true) : null;
      out.frosting.colors = C.complete(out.frosting.colors, { overrides: ov, contracts: list, fills: out.frosting.fills || null });
      if (Object.keys(ov).length) out.frosting.overrides = ov;
    }
    return out;
  }
  function empty(defaults) { return clean({}, defaults); }

  /* Bridges to frosting's own shapes. */
  function fromLook(look, defaults) {   // frosting look on disk: { name, scheme, colors }
    look = isObj(look) ? look : {};
    return clean({ name: look.name, scheme: look.scheme, frosting: { colors: look.colors, fills: look.colors && look.colors.fills, overrides: look.colors && look.colors.overrides } }, defaults);
  }
  function toLook(recipe) {
    var colors = Object.assign({}, recipe.frosting.colors);
    if (recipe.frosting.fills) colors.fills = JSON.parse(JSON.stringify(recipe.frosting.fills));
    if (recipe.frosting.overrides && Object.keys(recipe.frosting.overrides).length) colors.overrides = Object.assign({}, recipe.frosting.overrides);
    return { name: recipe.name, scheme: recipe.scheme, colors: colors };
  }

  /* The recipe store. Keys default to recipe / recipe.draft / recipe.favorites. If no recipe is saved yet
     but the adapter holds a published frosting look under 'theme', load() starts from that look, so a
     project switching to recipes keeps its colours. */
  function createRecipeStore(adapter, defaults, opts) {
    var S = root.KitchenStore;
    opts = opts || {};
    var base = S.createStore(adapter, {
      defaults: empty(defaults), clean: function (r) { return clean(r, defaults); },
      favoriteName: 'Saved recipe', favoriteKey: 'recipe',
      keys: Object.assign({ theme: 'recipe', draft: 'recipe.draft', favorites: 'recipe.favorites' }, opts.keys),
    });
    var load = base.load;
    base.load = function () {
      return Promise.all([load(), adapter.get(base.keys.theme), adapter.get(opts.legacyKey || 'theme')]).then(function (r) {
        var loaded = r[0];
        if (!r[1] && r[2]) {   // no recipe yet; adopt the published frosting look
          var colors = S.parse(r[2], null);
          if (colors) { var adopted = clean({ name: 'Current look', frosting: { colors: colors } }, defaults); loaded.theme = adopted; loaded.draft = adopted; loaded.adoptedFrostingLook = true; }
        }
        return loaded;
      });
    };
    return base;
  }

  var api = { clean: clean, empty: empty, cleanColors: cleanColors, cleanFontdant: cleanFontdant, fromLook: fromLook, toLook: toLook, createRecipeStore: createRecipeStore, FONTDANT_KEYS: FONTDANT_KEYS, SCHEMES: SCHEMES };
  root.KitchenRecipe = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
