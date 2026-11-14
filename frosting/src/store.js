/* frosting · Part D · store
   Published look, draft, favorites — with pluggable storage. Since Fournée phase 1 the engine lives in
   kitchen (kitchen/src/store.js, window.KitchenStore); this file is frosting's face on it, with the same
   API it always had: createStore(adapter, defaults) over a look's colours, clean, cleanFavorites, the four
   adapters, HEX. Consumers that load one store.js get dist/store.js, which bundles kitchen's engine ahead of
   this file (scripts/build.mjs), so nothing changes for them.
   Plain script (window.FrostingStore) or require()-able. Needs window.KitchenStore. */
(function (root) {
  'use strict';
  var K = root.KitchenStore;
  if (!K && typeof require === 'function') { try { K = require('../../kitchen/src/store.js'); } catch (e) { /* bundled build */ } }
  if (!K) throw new Error('frosting store: KitchenStore is not loaded (load kitchen/src/store.js first, or use dist/store.js)');
  var HEX = /^#[0-9a-fA-F]{6}$/;

  /* A look's colours: keep known roles, require #RRGGBB (uppercased), fill the rest from defaults. A look may
     also carry `fills` (gradients on roles, frosting/src/fills.js), kept when FrostingFills is loaded to check
     them. Code that writes a look's roles as CSS variables skips non-string values. */
  function clean(colors, defaults) {
    var out = {};
    Object.keys(defaults).forEach(function (k) { if (typeof defaults[k] === 'string') out[k] = defaults[k]; });
    Object.keys(colors || {}).forEach(function (k) { if (k in out && HEX.test(String(colors[k]))) out[k] = String(colors[k]).toUpperCase(); });
    var F = root.FrostingFills, src = colors && colors.fills ? colors.fills : defaults.fills;
    if (F && src) { var f = F.clean(src, Object.keys(out)); if (Object.keys(f).length) out.fills = f; }
    // the standards dial (kitchen/src/standards.js) the look is judged by
    var std = colors && typeof colors.standard === 'string' ? colors.standard : defaults.standard;
    if (typeof std === 'string' && /^[a-z0-9-]{2,40}$/.test(std)) out.standard = std;
    // calculated roles (v1.3.0): recomputed from the look's own roles on every clean (a stored value is only a cache),
    // except those named in colors.overrides; needs FrostingColor, like fills need FrostingFills
    var C = root.FrostingColor;
    if (C && C.complete) {
      var ov = C.cleanOverrides(colors && colors.overrides);
      if (Object.keys(ov).length) out.overrides = ov;
      out = C.complete(out, { overrides: ov, contracts: standardContracts(C, out.standard) });
    }
    return out;
  }
  /* a standards profile's contracts (KitchenStandards, when loaded) raise the calculated roles' minimums */
  function standardContracts(C, std) { var KS = root.KitchenStandards; return KS && std && KS.get(std) ? KS.contracts(std, C.contracts(), true) : null; }
  /* Favorites: [{name, colors}], at most 40, names ≤ 40 chars with control chars and <> stripped. */
  function cleanFavorites(list, defaults) {
    return (Array.isArray(list) ? list : []).slice(0, 40).map(function (f) {
      return { name: K.cleanName(f && f.name, 'Saved palette'), colors: clean(f && f.colors, defaults) };
    });
  }
  function createStore(adapter, defaults) {
    return K.createStore(adapter, { defaults: defaults, clean: clean, favoriteName: 'Saved palette', favoriteKey: 'colors' });
  }

  var api = { createStore: createStore, clean: clean, cleanFavorites: cleanFavorites, memoryAdapter: K.memoryAdapter, localStorageAdapter: K.localStorageAdapter, httpAdapter: K.httpAdapter, pywebviewAdapter: K.pywebviewAdapter, HEX: HEX };
  root.FrostingStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
