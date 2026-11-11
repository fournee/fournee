/* kitchen · store
   The storage engine frosting and fontdant share: a published value, a draft, and up to 40 favorites,
   behind pluggable adapters. The engine only sees get/set of JSON strings under three keys; where they
   live (localStorage, a server, pywebview, D1, memory) is the adapter's business. What a value is, and how
   it is validated, is the caller's business: createStore takes a clean() function.
   Plain script (window.KitchenStore) or require()-able. Lifted from frosting's Part D store. */
(function (root) {
  'use strict';

  function parse(raw, fallback) { try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  /* Favorite names: ≤ 40 chars, control chars and <> stripped, a fallback when empty. */
  function cleanName(name, fallback) {
    var n = typeof name === 'string' ? name.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 40) : '';
    return n || fallback;
  }

  /* ── adapters: { get(key) -> Promise<string|null>, set(key, string) -> Promise } ── */
  function memoryAdapter() {
    var m = {};
    return { get: function (k) { return Promise.resolve(k in m ? m[k] : null); }, set: function (k, v) { m[k] = v; return Promise.resolve(); } };
  }
  function localStorageAdapter(ns) {
    ns = (ns || 'frosting') + '.';
    return {
      get: function (k) { try { return Promise.resolve(localStorage.getItem(ns + k)); } catch (e) { return Promise.resolve(null); } },
      set: function (k, v) { try { localStorage.setItem(ns + k, v); } catch (e) { /* private window etc. */ } return Promise.resolve(); },
    };
  }
  /* GET/PUT {baseUrl}/{key}; 404 → null. For a Worker or any small server. */
  function httpAdapter(baseUrl, init) {
    return {
      get: function (k) {
        return fetch(baseUrl + '/' + k, Object.assign({ credentials: 'same-origin' }, init)).then(function (r) {
          if (r.status === 404) return null;
          if (!r.ok) throw new Error('frosting store: GET ' + k + ' → ' + r.status);
          return r.text();
        });
      },
      set: function (k, v) {
        return fetch(baseUrl + '/' + k, Object.assign({ method: 'PUT', headers: { 'content-type': 'application/json' }, body: v, credentials: 'same-origin' }, init))
          .then(function (r) { if (!r.ok) throw new Error('frosting store: PUT ' + k + ' → ' + r.status); });
      },
    };
  }
  /* pywebview: Python exposes get_frosting(key) / set_frosting(key, value) on its js_api. The method names
     stay frosting's so existing desktop apps keep working; a recipe store just uses different keys. */
  function pywebviewAdapter() {
    return {
      get: function (k) { return root.pywebview.api.get_frosting(k); },
      set: function (k, v) { return root.pywebview.api.set_frosting(k, v); },
    };
  }

  /* ── the store ──
     createStore(adapter, {
       defaults,                          // the value when nothing is saved
       clean(value, defaults) -> value,   // validation: unknown parts dropped, missing parts from defaults
       favoriteName: 'Saved palette',     // fallback name for an unnamed favorite
       favoriteKey: 'colors',             // where a favorite holds its value
       keys: { theme, draft, favorites }  // storage keys (frosting's defaults: theme / draft / favorites)
     }) */
  function createStore(adapter, opts) {
    var defaults = opts.defaults, clean = opts.clean;
    var keys = Object.assign({ theme: 'theme', draft: 'draft', favorites: 'favorites' }, opts.keys);
    var favName = opts.favoriteName || 'Saved', favKey = opts.favoriteKey || 'value';
    function cleanFavorites(list) {
      return (Array.isArray(list) ? list : []).slice(0, 40).map(function (f) {
        var o = { name: cleanName(f && f.name, favName) }; o[favKey] = clean(f && f[favKey], defaults); return o;
      });
    }
    function read(k, fallback) { return adapter.get(k).then(function (raw) { return parse(raw, fallback); }); }
    return {
      /* { theme, draft, favorites }: draft falls back to the published value, which falls back to defaults. */
      load: function () {
        return Promise.all([read(keys.theme, null), read(keys.draft, null), read(keys.favorites, [])]).then(function (r) {
          var theme = clean(r[0] || {}, defaults), draft = clean(r[1] || r[0] || {}, defaults);
          return { theme: theme, draft: draft, favorites: cleanFavorites(r[2]) };
        });
      },
      saveDraft: function (value) { return adapter.set(keys.draft, JSON.stringify(clean(value, defaults))); },
      publish: function () { return read(keys.draft, null).then(function (d) { return d ? adapter.set(keys.theme, JSON.stringify(clean(d, defaults))) : null; }); },
      saveFavorites: function (list) { var f = cleanFavorites(list); return adapter.set(keys.favorites, JSON.stringify(f)).then(function () { return f; }); },
      reset: function () { return adapter.set(keys.draft, JSON.stringify(defaults)); },
      cleanFavorites: cleanFavorites,
      defaults: defaults,
      keys: keys,
    };
  }

  var api = { createStore: createStore, cleanName: cleanName, parse: parse, memoryAdapter: memoryAdapter, localStorageAdapter: localStorageAdapter, httpAdapter: httpAdapter, pywebviewAdapter: pywebviewAdapter };
  root.KitchenStore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
