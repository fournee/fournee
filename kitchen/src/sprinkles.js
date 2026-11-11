/* kitchen · Sprinkles (decisions J1–J4)
   Sprinkles on (the default) shows a recipe's designed greys, which already pass AA 4.5:1. Sprinkles off,
   "Plain", darkens (on a dark scheme: lightens) each muted colour just enough to reach 7:1 on bg and surface,
   keeping its hue: frosting's lightness-only fit. Plain greys are always computed, never stored.
     1. the panel: toggle(el, …) puts the switch and a side-by-side compare on the shell's tab bar; the pass
        turns X4's 7:1 advice into an info note when a Plain version exists
     2. visitors with prefers-contrast: more get Plain automatically: css() emits the media block
     3. a project may add an on-page "High contrast" switch: contrastSwitch(el) + bootScript() (before paint)
   Plain script (window.KitchenSprinkles) or require()-able. Needs FrostingColor. */
(function (root) {
  'use strict';
  var TARGET = 7, GROUNDS = ['bg', 'surface'], ATTR = 'data-mise-contrast';
  function C() { return root.FrostingColor; }
  function hexOk(h) { return /^#[0-9a-fA-F]{6}$/.test(h || ''); }
  function mutedRoles(colors) { return Object.keys(colors || {}).filter(function (k) { return k === 'muted' || /(^|-)muted$/.test(k); }); }
  function worst(c, colors) { return Math.min.apply(null, GROUNDS.filter(function (g) { return hexOk(colors[g]); }).map(function (g) { return C().contrast(c, colors[g]); })); }

  /* plain(colors) → { colors, changes: { role: { from, to, before, after } }, available } */
  function plain(colors) {
    colors = colors || {};
    var out = Object.assign({}, colors), changes = {}, available = true;
    mutedRoles(colors).forEach(function (k) {
      var from = colors[k]; if (!hexOk(from)) return;
      var before = worst(from, colors);
      var rules = GROUNDS.filter(function (g) { return hexOk(colors[g]); }).map(function (g) { return [colors[g], TARGET]; });
      var to = before >= TARGET ? from : C().fit(from, rules);
      var after = worst(to, colors);
      if (after < TARGET - 1e-9) available = false;
      out[k] = to.toUpperCase();
      changes[k] = { from: from.toUpperCase(), to: to.toUpperCase(), before: Math.round(before * 100) / 100, after: Math.round(after * 100) / 100 };
    });
    return { colors: out, changes: changes, available: available && mutedRoles(colors).length > 0 };
  }
  /* the colours a recipe actually shows: Plain when sprinkles is off */
  function effective(recipe) {
    var colors = (recipe && recipe.frosting && recipe.frosting.colors) || {};
    return recipe && recipe.sprinkles === false ? plain(colors).colors : colors;
  }

  /* css(colors, { prefix }) → the Plain greys for prefers-contrast: more and for the on-page switch.
     [data-mise-contrast="normal"] on <html> opts a visitor back out of the media query. */
  function css(colors, opts) {
    opts = opts || {}; var p = opts.prefix || 'fr', P = plain(colors), decl = Object.keys(P.changes).filter(function (k) { return P.changes[k].to !== P.changes[k].from; })
      .map(function (k) { return '--' + p + '-' + k + ': ' + P.changes[k].to + ' !important;'; }).join(' ');   // !important: wins over a panel's inline preview
    if (!decl) return '';
    return '@media (prefers-contrast: more) { :root:not([' + ATTR + '="normal"]) { ' + decl + ' } }\n:root[' + ATTR + '="more"] { ' + decl + ' }';
  }

  /* ── the Sprinkles setting, with a draft (decision J5: it waits for Publish, like colours and type) ──
     store(adapter, { key }) → { load(), draft(), published(), set(bool), publish(), reset(), pending() }
     The switch writes the draft ('sprinkles.draft'); visitors see the published value ('sprinkles') once the
     project's Publish calls publish(). Both default to on. */
  function store(adapter, sopts) {
    var key = (sopts && sopts.key) || 'sprinkles', st = { draft: true, published: true };
    var parse = function (raw) { if (raw == null || raw === '') return null; try { return JSON.parse(raw) !== false; } catch (e) { return null; } };
    return {
      load: function () {
        return Promise.all([adapter.get(key), adapter.get(key + '.draft')]).then(function (r) {
          var pub = parse(r[0]), dr = parse(r[1]);
          st.published = pub !== false; st.draft = dr == null ? st.published : dr; return st.draft;
        });
      },
      draft: function () { return st.draft; },
      published: function () { return st.published; },
      pending: function () { return st.draft !== st.published; },
      set: function (on) { st.draft = on !== false; return adapter.set(key + '.draft', JSON.stringify(st.draft)); },
      publish: function () { var v = st.draft; return adapter.set(key, JSON.stringify(v)).then(function () { st.published = v; return v; }); },
      reset: function () { st.draft = st.published; return adapter.set(key + '.draft', JSON.stringify(st.draft)); },
    };
  }

  /* ── 1. the panel toggle ──
     toggle(el, { get() → bool, set(bool), colors() → designed colours, pending() → bool (optional: shows
     "Not published yet" while the switch differs from what visitors see) }) → { refresh() } */
  function toggle(el, opts) {
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    el.innerHTML = '<div class="mise-spr"><label class="mise-spr__switch"><input type="checkbox" role="switch" data-sprinkles> <span>Sprinkles</span></label>' +
      '<span class="mise-spr__pending" data-sprinkles-pending hidden>Not published yet</span>' +
      '<button type="button" class="mise-spr__cmp" data-sprinkles-compare aria-expanded="false">Compare</button>' +
      '<div class="mise-spr__pop" data-sprinkles-pop hidden></div></div>';
    var box = el.querySelector('[data-sprinkles]'), btn = el.querySelector('[data-sprinkles-compare]'), pop = el.querySelector('[data-sprinkles-pop]'), pend = el.querySelector('[data-sprinkles-pending]');
    function mini(title, colors, note) {
      return '<div class="mise-spr__mini" style="background:' + colors.bg + ';color:' + colors.text + ';border-color:' + (colors.border || colors.muted) + '">' +
        '<strong>' + esc(title) + '</strong><span class="mise-spr__ratio" style="color:' + colors.muted + '">' + esc(note) + '</span>' +
        '<p style="color:' + colors.muted + '">Updated 8 Nov · 3 people helped</p>' +
        '<p style="color:' + colors.muted + ';background:' + colors.surface + '">On a card: prices include tax</p></div>';
    }
    function refresh() {
      var on = opts.get() !== false, d = opts.colors(), P = plain(d), m = P.changes.muted;
      box.checked = on;
      pend.hidden = !(opts.pending && opts.pending());
      pop.innerHTML = '<p class="mise-spr__lede">' + (P.available ? 'Plain darkens each grey just enough to reach 7:1. Visitors who ask their system for more contrast get Plain automatically.' : 'No Plain version: this background can’t carry 7:1 greys.') + '</p>' +
        '<div class="mise-spr__pair">' + mini('Sprinkles' + (on ? ' (on)' : ''), d, m ? 'muted ' + m.from + ' · ' + m.before + ':1' : '') + mini('Plain' + (on ? '' : ' (on)'), P.colors, m ? 'muted ' + m.to + ' · ' + m.after + ':1' : '') + '</div>';
    }
    box.addEventListener('change', function () { Promise.resolve(opts.set(box.checked)).then(refresh, refresh); refresh(); });
    btn.addEventListener('click', function () { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); if (!pop.hidden) refresh(); });
    refresh();
    return { refresh: refresh };
  }

  /* ── 3. the on-page High contrast switch ──
     contrastSwitch(el, { key, label }) → a button that sets data-mise-contrast on <html> and remembers it per
     visitor (localStorage, guarded). bootScript(key) is the inline snippet that restores it before paint. */
  function bootScript(key) {
    key = key || 'mise.contrast';
    return '<script>try{var c=localStorage.getItem(' + JSON.stringify(key) + ');if(c==="more"||c==="normal")document.documentElement.setAttribute("' + ATTR + '",c)}catch(e){}</script>';
  }
  function contrastSwitch(el, opts) {
    opts = opts || {}; var key = opts.key || 'mise.contrast', html = document.documentElement;
    var mq = root.matchMedia ? root.matchMedia('(prefers-contrast: more)') : null;
    if (!html.hasAttribute(ATTR)) { try { var saved = localStorage.getItem(key); if (saved === 'more' || saved === 'normal') html.setAttribute(ATTR, saved); } catch (e) { /* no storage */ } }
    var b = document.createElement('button'); b.type = 'button'; b.className = 'mise-contrast'; b.textContent = opts.label || 'High contrast';
    function active() { var a = html.getAttribute(ATTR); return a === 'more' || (a !== 'normal' && !!(mq && mq.matches)); }
    function sync() { b.setAttribute('aria-pressed', String(active())); }
    b.addEventListener('click', function () {
      var next = active() ? 'normal' : 'more'; html.setAttribute(ATTR, next);
      try { localStorage.setItem(key, next); } catch (e) { /* private mode: still works for this page */ }
      sync();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', sync);
    el.appendChild(b); sync();
    return { button: b, active: active };
  }

  var api = { plain: plain, effective: effective, css: css, store: store, toggle: toggle, contrastSwitch: contrastSwitch, bootScript: bootScript, mutedRoles: mutedRoles, TARGET: TARGET, ATTR: ATTR };
  root.KitchenSprinkles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
