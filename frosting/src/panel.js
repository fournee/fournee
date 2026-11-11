/* frosting · the panel
   The user-facing frosting UI: gallery nav, 🎲 lucky, favorites, background lock, readability badge,
   one picker per role, Save draft / Publish / Reset. Storage-agnostic (Part D store), applies the
   draft live to a target element, and is itself frosted (it uses the same variables it edits).
   Since Nov 2026 also:
   - gradients: each role can be Solid or Gradient (2 stops from its colour, 8 angle chips, Flip, 🎲, More for a
     third stop, an exact angle and the colour space); the badge judges a fill at its worst point (FrostingFills)
   - the standards dial (KitchenStandards, when loaded): which rules the badge judges by; kept in the look
   - scope: mount(…, { base, scope }) themes one element (a card) on top of a page look; each role that differs
     from the page gets ↺ Page, and overrides() returns only what differs
   - steps: mount(…, { steps: true }) is step 1 of the Fournée steps (KitchenSteps): Build around a colour, Ready-made
     looks (🎲 first), Every role, My palettes, then the host's extras ({ extras: { title, mount(el) } }). The dial,
     Fit and Publish live in the later steps, which drive this panel through setDraft / setStandard / publish …
   Needs FrostingTokens, FrostingColor, FrostingGallery, FrostingStore (FrostingFills, KitchenStandards optional). */
(function (root) {
  'use strict';
  var C = root.FrostingColor, G = root.FrostingGallery, T = root.FrostingTokens;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var same = function (a, b) { return JSON.stringify(a || null) === JSON.stringify(b || null); };

  var TEMPLATE =
    '<div class="fr-pal" tabindex="-1">' +
    '  <p class="fr-pal__scope" data-scope hidden></p>' +
    '  <div class="fr-pal__bar">' +
    '    <div class="fr-pal__nav"><button type="button" class="fr-btn fr-btn--ghost" aria-label="Previous look" data-prev>‹</button>' +
    '      <div class="fr-pal__now"><strong data-name>Your current colours</strong><span class="fr-muted" data-scheme></span></div>' +
    '      <button type="button" class="fr-btn fr-btn--ghost" aria-label="Next look" data-next>›</button></div>' +
    '    <button type="button" class="fr-btn" data-lucky>🎲 I\'m feeling lucky</button>' +
    '    <button type="button" class="fr-btn fr-btn--ghost" data-fav>☆ Save to favorites</button>' +
    '  </div>' +
    '  <div class="fr-pal__lock"><label class="fr-pal__bg">Background <input type="color" data-bg><input type="text" maxlength="7" aria-label="Background hex" data-bghex></label>' +
    '    <label class="fr-pal__check"><input type="checkbox" data-lock> Build everything around this background</label><span class="fr-muted" data-bgnote></span>' +
    '    <label class="fr-pal__dial" data-dialwrap hidden>Standard <select data-standard></select></label></div>' +
    '  <div class="fr-fit" data-fit hidden aria-live="polite"></div>' +
    '  <p class="fr-pal__badge" data-badge></p>' +
    '  <h3>Ready-made looks</h3><div class="fr-pal__grid" data-grid></div>' +
    '  <h3>My palettes</h3><div class="fr-pal__grid" data-favs></div><p class="fr-muted" data-favsempty>Nothing saved yet. Find a look you like and press ☆ Save to favorites.</p>' +
    '  <p class="fr-muted fr-pal__keys">Tip: with the gallery focused, ← and → step through the looks and L rolls a lucky one.</p>' +
    '  <h3>Every role</h3><div class="fr-swatches" data-swatches></div>' +
    '  <div class="fr-pal__actions"><button type="button" class="fr-btn fr-btn--ghost" data-save>Save draft</button>' +
    '    <button type="button" class="fr-btn" data-publish>Publish</button><button type="button" class="fr-link" data-reset>Reset draft to defaults</button>' +
    '    <span class="fr-muted" data-flash role="status"></span></div>' +
    '</div>';

  var tipi = function (t) { return '<button type="button" class="mise-tipi" aria-label="About this">i<span role="tooltip">' + esc(t) + '</span></button>'; };
  var STEPS_TEMPLATE =
    '<div class="fr-pal fr-pal--steps" tabindex="-1">' +
    '  <p class="fr-pal__scope" data-scope hidden></p>' +
    '  <div hidden><button type="button" data-prev></button><button type="button" data-next></button><strong data-name></strong><span data-scheme></span>' +
    '    <input type="color" data-bg><input type="text" data-bghex><input type="checkbox" data-lock><select data-standard></select><span data-dialwrap></span><div data-fit></div>' +
    '    <button type="button" data-save></button><button type="button" data-publish></button><button type="button" data-reset></button></div>' +
    '  <h3>Build around a colour ' + tipi('From a client\'s logo or style guide: enter up to three of their colours and say what each one is. Fournée builds every other colour around them and keeps them readable.') + '</h3>' +
    '  <div class="fr-build"><div class="fr-build__pins" data-pins></div>' +
    '    <div class="fr-build__acts"><button type="button" class="fr-chip" data-pinadd>+ Another colour</button><button type="button" class="fr-btn fr-btn--sm" data-build>Build it</button>' +
    '      <button type="button" class="fr-link" data-unbuild hidden>Let go of my background</button></div>' +
    '    <p class="fr-muted fr-build__note" data-buildnote aria-live="polite"></p><p class="fr-muted" data-bgnote></p></div>' +
    '  <p class="fr-pal__flash" data-flash role="status"></p>' +
    '  <p class="fr-pal__badge" data-badge hidden></p>' +
    '  <h3>Ready-made looks ' + tipi('Pick one to start from, or roll a random one with 🎲. ← and → step through them; L rolls.') + '</h3><div class="fr-pal__grid" data-grid></div>' +
    '  <h3>Every role ' + tipi('Fine-tune one colour at a time. Gradient turns a role into a gradient; it is checked at its weakest point.') + '</h3><div class="fr-swatches" data-swatches></div>' +
    '  <h3>My palettes <button type="button" class="fr-link fr-pal__save" data-fav>☆ Save what\'s on now</button></h3><div class="fr-pal__grid" data-favs></div><p class="fr-muted" data-favsempty>Nothing saved yet.</p>' +
    '  <section class="fr-pal__extras" data-extras hidden><h3 data-extrastitle></h3><div data-extrasbody></div></section>' +
    '</div>';
  var PIN_ROLES = [['bg', 'Background'], ['a', 'Accent (brand)'], ['b', 'Button']];

  /* mount(container, { store, target, prefix, onChange, flash, base, scope, roles, labels, type, steps, extras })
     type: { get() -> fontdant look, set(look) } lets Fit to a standard move type too (the Fournée shell passes the Fontdant tab) */
  function mount(container, opts) {
    opts = opts || {};
    var F = root.FrostingFills, K = root.KitchenStandards;
    var store = opts.store, target = opts.target || document.documentElement, pfx = opts.prefix || T.prefix, prefix = '--' + pfx + '-';
    var steps = !!opts.steps;
    container.innerHTML = steps ? STEPS_TEMPLATE : TEMPLATE;
    var $ = function (s) { return container.querySelector(s); };
    var el = { name: $('[data-name]'), scheme: $('[data-scheme]'), bg: $('[data-bg]'), bgHex: $('[data-bghex]'), lock: $('[data-lock]'), bgNote: $('[data-bgnote]'),
      badge: $('[data-badge]'), grid: $('[data-grid]'), favs: $('[data-favs]'), favsEmpty: $('[data-favsempty]'), swatches: $('[data-swatches]'), flash: $('[data-flash]'), pal: $('.fr-pal'),
      scope: $('[data-scope]'), dial: steps ? null : $('[data-standard]'), dialWrap: $('[data-dialwrap]'), fit: steps ? null : $('[data-fit]'),
      pins: $('[data-pins]'), buildNote: $('[data-buildnote]'), unbuild: $('[data-unbuild]') };
    var fitting = null;   // { id, original: { draft, type }, fitted: { draft, type }, changes, left, showing: 'after' | 'before' }
    var state = { theme: {}, draft: {}, favorites: [] }, list = [], current = null, more = {};
    // opts.roles: show only these roles' pickers (a card that uses six roles); opts.labels: { role: 'what it paints here' }
    var allRoles = G.roles(), roleNames = allRoles.map(function (r) { return r.name; });
    var roles = (opts.roles ? allRoles.filter(function (r) { return opts.roles.indexOf(r.name) >= 0; }) : allRoles).map(function (r) {
      return opts.labels && opts.labels[r.name] ? Object.assign({}, r, { label: opts.labels[r.name] }) : r;
    });
    var defaults = store ? store.defaults : G.defaults('light'), base = opts.base || null;
    var start = base || defaults;   // what Reset returns to, and what a card follows

    function flash(msg, isError) { el.flash.textContent = msg; el.flash.classList.toggle('is-error', !!isError); clearTimeout(flash.t); flash.t = setTimeout(function () { el.flash.textContent = ''; }, isError ? 7000 : 3500); if (opts.flash) opts.flash(msg, isError); }
    function lockBg() { return el.lock.checked && C.HEX.test(el.bgHex.value) ? el.bgHex.value.toUpperCase() : null; }
    function fills() { return state.draft.fills || {}; }
    function setFill(k, f) { var fs = Object.assign({}, fills()); if (f) fs[k] = f; else delete fs[k]; if (Object.keys(fs).length) state.draft.fills = fs; else delete state.draft.fills; }
    function fromItem(colors) {   // a look worn from the gallery or favourites: its colours (and fills), the dial kept
      var d = Object.assign({}, start, colors); delete d.fills;
      if (colors && colors.fills && F) { var f = F.clean(colors.fills, roleNames); if (Object.keys(f).length) d.fills = f; }
      if (state.draft.standard) d.standard = state.draft.standard; else delete d.standard;
      return d;
    }
    function apply() {
      roleNames.forEach(function (k) { if (typeof state.draft[k] === 'string') target.style.setProperty(prefix + k, state.draft[k]); });
      if (F) F.apply(target, fills(), pfx, roleNames);
      if (opts.onChange) opts.onChange(state.draft);
    }
    function contracts() { var l = C.contracts(); return K && state.draft.standard ? K.contracts(state.draft.standard, l, true) : l; }

    /* ── swatches: a colour per role, and its gradient editor when it has one ── */
    function fillCss(f) { return F.css({ stops: f.stops.map(function (s) { return F.stopHex(s, state.draft) || '#000000'; }), angle: f.angle, space: f.space }, pfx); }
    function gradEditor(k, f) {
      var stops = f.stops.map(function (s, i) {
        var h = F.stopHex(s, state.draft) || '#000000';
        return '<label class="fr-grad__stop" title="' + (/^role:/.test(s) ? 'Follows ' + esc(s.slice(5)) : 'Stop ' + (i + 1)) + '"><input type="color" value="' + h + '" data-stop="' + k + ':' + i + '" aria-label="' + esc(k) + ' stop ' + (i + 1) + '"></label>';
      }).join('');
      var angles = F.ANGLES.map(function (a) { return '<button type="button" class="fr-grad__angle" aria-pressed="' + (f.angle === a) + '" data-angle="' + k + ':' + a + '" aria-label="' + a + ' degrees" title="' + a + '°"><span style="transform:rotate(' + a + 'deg)">↑</span></button>'; }).join('');
      var rules = contracts().filter(function (c) { return c.role === k || c.against === k; });
      var worst = rules.length ? Math.min.apply(null, F.check(state.draft, (function () { var o = {}; o[k] = f; return o; })(), rules).map(function (r) { return r.ratio; })) : null;
      var m = more[k];
      return '<div class="fr-grad" data-grad="' + k + '">' +
        '<div class="fr-grad__preview" style="background-color:' + state.draft[k] + ';background-image:' + fillCss(f) + '"></div>' +
        '<div class="fr-grad__row">' + stops + '<span class="fr-grad__angles">' + angles + '</span></div>' +
        '<div class="fr-grad__row"><button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-flip="' + k + '">⇄ Flip</button>' +
        '<button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-glucky="' + k + '">🎲</button>' +
        '<button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-gmore="' + k + '" aria-expanded="' + !!m + '">More</button>' +
        (worst != null ? '<span class="fr-grad__ratio ' + (worst >= Math.min.apply(null, rules.map(function (r) { return r.min; })) ? '' : 'is-bad') + '">worst ' + worst + ':1</span>' : '') + '</div>' +
        (m ? '<div class="fr-grad__row fr-grad__more">' +
          (f.stops.length < F.MAX_STOPS ? '<button type="button" class="fr-link" data-addstop="' + k + '">+ Middle stop</button>' : '<button type="button" class="fr-link" data-dropstop="' + k + '">− Middle stop</button>') +
          '<label>Angle <input type="number" min="0" max="359" value="' + f.angle + '" data-anglenum="' + k + '"></label>' +
          '<label>Blend <select data-space="' + k + '"><option value="oklab"' + (f.space === 'oklab' ? ' selected' : '') + '>Oklab (smooth)</option><option value="oklch"' + (f.space === 'oklch' ? ' selected' : '') + '>OKLCH (vivid, avoid with greys)</option></select></label>' +
          '<button type="button" class="fr-link" data-gfix="' + k + '">Make it readable</button></div>' : '') +
        '</div>';
    }
    function paintSwatches() {
      el.swatches.innerHTML = roles.map(function (r) {
        var v = state.draft[r.name], live = state.theme[r.name], f = F && fills()[r.name];
        var differs = base && (v !== base[r.name] || !same(f, base.fills && base.fills[r.name]));
        return '<div class="fr-sw' + (f ? ' has-fill' : '') + '" title="' + esc(r.use) + '"><input type="color" value="' + v + '" data-k="' + r.name + '" aria-label="' + esc(r.label) + '">' +
          '<span>' + esc(r.label) + '<br><code>' + prefix + r.name + '</code>' + (live !== v ? ' <span class="fr-tag fr-tag--warn">draft</span>' : '') + '</span>' +
          '<input type="text" value="' + v + '" data-hex="' + r.name + '" maxlength="7" aria-label="' + esc(r.label) + ' hex">' +
          (F || differs ? '<span class="fr-sw__tools">' +
            (F ? '<button type="button" class="fr-chip" aria-pressed="' + !!f + '" data-gtoggle="' + r.name + '">Gradient</button>' : '') +
            (differs ? '<button type="button" class="fr-chip" data-backto="' + r.name + '" title="Follow the page again">↺ Page</button>' : '') + '</span>' : '') +
          (f ? gradEditor(r.name, f) : '') + '</div>';
      }).join('');
    }
    function card(item, i, isFav) {
      var c = item.colors, on = current && current.kind === (isFav ? 'fav' : 'preset') && current.i === i;
      return '<button type="button" class="fr-pal__card" aria-pressed="' + on + '" data-' + (isFav ? 'favpick' : 'pick') + '="' + i + '" style="background:' + c.bg + ';color:' + c.text + ';border-color:' + c.border + '">' +
        '<b>' + esc(item.name) + '</b><small>' + esc(item.scheme || 'Saved') + '</small>' +
        '<span class="fr-pal__chips"><span class="fr-pal__pill" style="background:' + c.button + ';color:' + c['button-text'] + '">Button</span>' +
        '<span class="fr-pal__dot" style="background:' + c.accent + '"></span><span class="fr-pal__dot" style="background:' + c.ok + '"></span><span class="fr-pal__dot" style="background:' + c.warn + '"></span><span class="fr-pal__dot" style="background:' + c.bad + '"></span></span></button>';
    }
    function badge() {
      var l = contracts(), res = C.check(state.draft, l), fr = F ? F.check(state.draft, fills(), l) : [];
      var hard = res.filter(function (r, i) { return !r.ok && l[i].level !== 'warn'; }).concat(fr.filter(function (r) { return !r.ok; }));
      var soft = res.filter(function (r, i) { return !r.ok && l[i].level === 'warn'; });
      var p = K && state.draft.standard ? K.get(state.draft.standard) : null, by = p ? ' under ' + esc(p.label) : '';
      el.badge.innerHTML = hard.length
        ? '<span class="fr-tag fr-tag--warn">Hard to read' + by + '</span> ' + hard.map(function (r) { return esc(r.label) + ' ' + r.ratio + ':1 (needs ' + r.min + ')'; }).join(' · ')
        : '<span class="fr-tag fr-tag--ok">Readable ✓</span> All ' + (res.length + fr.length) + ' contrast checks pass' + by + ' (main text ' + res[0].ratio + ':1' + (fr.length ? '; gradients judged at their worst point' : '') + ').' +
          (soft.length ? ' <span class="fr-muted">Advisory under this standard: ' + soft.map(function (r) { return esc(r.label); }).join(', ') + '.</span>' : '');
      var lb = lockBg();
      el.bgNote.textContent = lb && C.bgHeadroom(lb) < 7.5 ? 'This background is a mid-tone, so no text colour can reach 7:1 on it. A lighter or darker one works better.' : '';
    }
    function luckyCard() {
      var on = current && current.kind === 'lucky';
      return '<button type="button" class="fr-pal__card fr-pal__lucky" aria-pressed="' + !!on + '" data-lucky><b>🎲 I\'m feeling lucky</b><small>' +
        (on ? esc(current.name) + ' · roll again' : 'A random look' + (lockBg() ? ' around your background' : '')) + '</small></button>';
    }
    function paint() {
      el.grid.innerHTML = (steps ? luckyCard() : '') + list.map(function (it, i) { return card(it, i, false); }).join('');
      el.favs.innerHTML = state.favorites.map(function (f, i) {
        return '<div class="fr-pal__favwrap">' + card({ name: f.name, scheme: 'Saved', colors: f.colors }, i, true) + '<button type="button" class="fr-pal__del" aria-label="Delete ' + esc(f.name) + '" data-del="' + i + '">×</button></div>';
      }).join('');
      el.favsEmpty.hidden = state.favorites.length > 0;
      el.name.textContent = current ? current.name : 'Your current colours';
      el.scheme.textContent = current ? (current.kind === 'preset' ? current.scheme + ' · ' + (current.i + 1) + ' of ' + list.length : current.scheme || '') : '';
      badge(); paintFit();
    }
    /* ── Fit to a standard: judge → fit → preview (before / after) → keep or undo ── */
    function recipeOf(d, type) {
      var colors = {}; roleNames.forEach(function (k) { if (typeof d[k] === 'string') colors[k] = d[k]; });
      return { colors: colors, fills: d.fills || null, type: type || null };
    }
    function problems() {
      var id = state.draft.standard, P = root.KitchenPass, R = root.KitchenRecipe, t = opts.type ? opts.type.get() : null;
      if (P && R) {
        var rc = recipeOf(state.draft, t), res = P.run(R.clean({ frosting: { colors: rc.colors, fills: rc.fills }, fontdant: t || {}, standard: id }, { colors: defaults }), { standard: id });
        return res.results.filter(function (r) { return !r.ok && !r.pending && r.level === 'hard' && (t || r.source !== 'fontdant'); }).map(function (r) { return r.label + (r.detail ? ': ' + r.detail : ''); });
      }
      var l = contracts(); return C.check(state.draft, l).filter(function (r, i) { return !r.ok && l[i].level !== 'warn'; }).map(function (r) { return r.label + ' ' + r.ratio + ':1 (needs ' + r.min + ')'; });
    }
    function paintFit() {
      var id = state.draft.standard, p = K && id ? K.get(id) : null;
      if (!p || !el.fit) { if (el.fit) el.fit.hidden = true; return; }
      el.fit.hidden = false;
      if (fitting) {
        var sw = function (v) { return /^#[0-9A-F]{6}$/i.test(v) ? '<span class="fr-fit__sw" style="background:' + v + '"></span>' : ''; };
        el.fit.innerHTML = '<p><strong>Fitted to ' + esc(p.label) + '</strong> · ' + fitting.changes.length + ' change' + (fitting.changes.length === 1 ? '' : 's') + '. It\'s a draft: nothing is saved until you publish.</p>' +
          (fitting.changes.length ? '<ul class="fr-fit__list">' + fitting.changes.map(function (c) { return '<li>' + esc(c.what) + ': ' + sw(c.from) + esc(c.from) + ' → ' + sw(c.to) + esc(c.to) + ' <span class="fr-muted">(' + esc(c.why) + ')</span></li>'; }).join('') + '</ul>' : '<p class="fr-muted">Nothing needed to move.</p>') +
          (fitting.left.length ? '<p class="fr-fit__left">Still short: ' + esc(fitting.left.join('; ')) + '</p>' : '') +
          '<div class="fr-fit__actions"><span class="fr-seg" role="group" aria-label="Compare"><button type="button" class="fr-chip" aria-pressed="' + (fitting.showing === 'before') + '" data-fitshow="before">Before</button>' +
          '<button type="button" class="fr-chip" aria-pressed="' + (fitting.showing === 'after') + '" data-fitshow="after">After</button></span>' +
          '<button type="button" class="fr-btn fr-btn--sm" data-fitkeep>Keep</button><button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-fitundo>Undo</button></div>';
        return;
      }
      var probs = problems();
      el.fit.innerHTML = '<p><strong>Judging by ' + esc(p.label) + '</strong> · ' + (probs.length ? probs.length + ' problem' + (probs.length === 1 ? '' : 's') : 'meets it ✓') + ' <span class="fr-muted">' + esc(p.note) + '</span></p>' +
        (probs.length ? '<ul class="fr-fit__list">' + probs.slice(0, 6).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + (probs.length > 6 ? '<li class="fr-muted">and ' + (probs.length - 6) + ' more</li>' : '') + '</ul>' +
          '<div class="fr-fit__actions"><button type="button" class="fr-btn fr-btn--sm" data-fitrun>Fit to ' + esc(p.label) + '</button><span class="fr-muted">Moves only what fails, by the least it can; you preview it before keeping it.</span></div>' : '');
    }
    function showLook(which) {   // put the original or the fitted look on the page
      var l = fitting[which === 'before' ? 'original' : 'fitted'];
      state.draft = JSON.parse(JSON.stringify(l.draft)); if (opts.type && l.type) opts.type.set(JSON.parse(JSON.stringify(l.type)));
      fitting.showing = which; paintSwatches(); apply(); paint();
    }
    function runFit(id) {
      var t = opts.type ? opts.type.get() : null, original = { draft: JSON.parse(JSON.stringify(state.draft)), type: t ? JSON.parse(JSON.stringify(t)) : null };
      var rc = recipeOf(state.draft, original.type), r = K.fit(id, rc, { house: true });
      var d = Object.assign({}, state.draft, r.colors); if (r.fills && Object.keys(r.fills).length) d.fills = r.fills; else delete d.fills;
      fitting = { id: id, original: original, fitted: { draft: d, type: r.type }, changes: r.changes, left: r.left, showing: 'after' };
      showLook('after'); handEdited('Fitted to ' + K.get(id).label);
    }
    function repaint() { paintSwatches(); apply(); paint(); }
    function wear(item) {
      var hadFocus = el.pal.contains(document.activeElement);
      current = item;
      state.draft = fromItem(item.colors);
      if (!el.lock.checked) { el.bg.value = state.draft.bg; el.bgHex.value = state.draft.bg; }
      repaint();
      if (hadFocus) { var on = el.pal.querySelector('.fr-pal__card[aria-pressed="true"]'); (on || el.pal).focus({ preventScroll: true }); }
    }
    function handEdited(label) { current = { kind: 'hand', name: label || 'Your edits', scheme: 'Hand-tuned' }; if (!el.lock.checked) { el.bg.value = state.draft.bg; el.bgHex.value = state.draft.bg; } paint(); }
    function rebuild() {
      list = G.presets(lockBg());
      if (current && current.kind === 'preset') current = Object.assign({ kind: 'preset', i: current.i }, list[current.i]);
      if (current && current.kind === 'lucky') current = Object.assign({ kind: 'lucky', seed: current.seed }, G.lucky(current.seed, lockBg()));
      if (current && (current.kind === 'preset' || current.kind === 'lucky')) wear(current); else paint();
    }
    function step(d) { var i = current && current.kind === 'preset' ? (current.i + d + list.length) % list.length : (d > 0 ? 0 : list.length - 1); wear(Object.assign({ kind: 'preset', i: i }, list[i])); }
    function lucky() { var seed = Math.floor(Math.random() * 4294967296); wear(Object.assign({ kind: 'lucky', seed: seed }, G.lucky(seed, lockBg()))); }
    function saveFavs(favs, msg) {
      if (!store) { state.favorites = favs; paint(); return; }
      store.saveFavorites(favs).then(function (f) { state.favorites = f; paint(); flash(msg); }).catch(function (e) { flash(e.message, true); });
    }
    function editFill(k, fn) { var f = fills()[k]; if (!f) return; setFill(k, F.cleanFill(fn(JSON.parse(JSON.stringify(f))), roleNames)); repaint(); handEdited(); }

    /* ── the dial ── */
    if (K && el.dial) {
      var groups = {};
      K.list().forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
      el.dial.innerHTML = '<option value="">Fournée house rules</option>' + Object.keys(groups).map(function (g) {
        return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (p) { return '<option value="' + esc(p.id) + '" title="' + esc(p.note) + '">' + esc(p.label) + '</option>'; }).join('') + '</optgroup>';
      }).join('');
      el.dialWrap.hidden = false;
      el.dial.addEventListener('change', function () {
        var was = fitting; if (was) { showLook('before'); fitting = null; }   // switching standards re-fits from the original
        if (el.dial.value) state.draft.standard = el.dial.value; else delete state.draft.standard;
        if (was && el.dial.value) runFit(el.dial.value); else { repaint(); handEdited(); }
      });
    }
    if (opts.scope) { el.scope.hidden = false; el.scope.innerHTML = '<span class="fr-tag">' + esc(opts.scope) + '</span> ' + (base ? 'Follows the page until you change a colour; ↺ Page puts one back.' : ''); }

    container.addEventListener('input', function (e) {
      var t = e.target, s = t.getAttribute('data-stop');
      if (s && F) { var p = s.split(':'), k = p[0], i = +p[1], v = t.value.toUpperCase(); var f = fills()[k]; if (!f || !C.HEX.test(v)) return; f.stops[i] = v; setFill(k, f); apply(); badge(); var pv = t.closest('.fr-grad').querySelector('.fr-grad__preview'); if (pv) pv.style.backgroundImage = fillCss(fills()[k]); handEdited(); return; }
      var an = t.getAttribute('data-anglenum'); if (an) { editFill(an, function (f) { f.angle = +t.value || 0; return f; }); return; }
      var k2 = t.getAttribute('data-k') || t.getAttribute('data-hex'); if (!k2) return;
      fitting = null;   // editing by hand keeps what's on the page
      var v2 = t.value.trim(); if (!C.HEX.test(v2)) return;
      state.draft[k2] = v2.toUpperCase();
      var pair = t.hasAttribute('data-k') ? $('[data-hex="' + k2 + '"]') : $('[data-k="' + k2 + '"]'); if (pair) pair.value = state.draft[k2];
      apply(); handEdited();
    });
    container.addEventListener('change', function (e) {
      var sp = e.target.getAttribute('data-space'); if (sp) editFill(sp, function (f) { f.space = e.target.value; return f; });
      if (e.target.hasAttribute('data-stop') || e.target.hasAttribute('data-k')) { paintSwatches(); badge(); }
    });
    $('[data-prev]').addEventListener('click', function () { step(-1); });
    $('[data-next]').addEventListener('click', function () { step(1); });
    $('[data-fav]').addEventListener('click', function () {
      var favs = state.favorites.slice();
      if (favs.length >= 40) { flash('That\'s 40 saved palettes, the most it keeps. Delete one first.', true); return; }
      var name = current ? current.name : 'My palette';
      if (favs.some(function (f) { return f.name === name; })) name += ' ' + (favs.length + 1);
      favs.push({ name: name, colors: JSON.parse(JSON.stringify(state.draft)) });
      saveFavs(favs, 'Saved "' + name + '" to My palettes.');
    });
    container.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var a;
      if (t.hasAttribute('data-lucky')) lucky();
      else if (t.hasAttribute('data-pick')) { var i = +t.getAttribute('data-pick'); wear(Object.assign({ kind: 'preset', i: i }, list[i])); }
      else if (t.hasAttribute('data-pinadd')) { pins.push({ hex: state.draft.button || '#336699', role: pins.some(function (q) { return q.role === 'b'; }) ? 'bg' : 'b' }); paintPins(); }
      else if ((a = t.getAttribute('data-pindel'))) { pins.splice(+a, 1); if (!pins.length) pins.push({ hex: state.draft.accent, role: 'a' }); paintPins(); }
      else if (t.hasAttribute('data-build')) build();
      else if (t.hasAttribute('data-unbuild')) { el.lock.checked = false; el.unbuild.hidden = true; el.buildNote.textContent = ''; rebuild(); }
      else if (t.hasAttribute('data-favpick')) { var j = +t.getAttribute('data-favpick'), fv = state.favorites[j]; wear({ kind: 'fav', i: j, name: fv.name, scheme: 'Saved', colors: fv.colors }); }
      else if (t.hasAttribute('data-del')) { var k = +t.getAttribute('data-del'), favs = state.favorites.slice(), gone = favs.splice(k, 1)[0]; if (current && current.kind === 'fav') current = null; saveFavs(favs, 'Deleted "' + gone.name + '".'); }
      else if (t.hasAttribute('data-fitrun')) runFit(state.draft.standard);
      else if ((a = t.getAttribute('data-fitshow'))) { if (fitting) showLook(a); }
      else if (t.hasAttribute('data-fitkeep')) { if (fitting && fitting.showing === 'before') showLook('after'); fitting = null; paint(); flash('Kept. Publish to make it the look.'); }
      else if (t.hasAttribute('data-fitundo')) { if (fitting) { showLook('before'); fitting = null; paint(); flash('Back to your look.'); } }
      else if ((a = t.getAttribute('data-gtoggle'))) { setFill(a, fills()[a] ? null : F.seed(state.draft[a])); repaint(); handEdited(); }
      else if ((a = t.getAttribute('data-backto'))) {
        state.draft[a] = base[a]; setFill(a, base.fills && base.fills[a] ? JSON.parse(JSON.stringify(base.fills[a])) : null); repaint(); handEdited();
      }
      else if ((a = t.getAttribute('data-angle'))) { var q = a.split(':'); editFill(q[0], function (f) { f.angle = +q[1]; return f; }); }
      else if ((a = t.getAttribute('data-flip'))) editFill(a, F.flip);
      else if ((a = t.getAttribute('data-glucky'))) editFill(a, function () { return F.lucky(state.draft[a]); });
      else if ((a = t.getAttribute('data-gmore'))) { more[a] = !more[a]; paintSwatches(); }
      else if ((a = t.getAttribute('data-addstop'))) editFill(a, function (f) { f.stops.splice(1, 0, F.mixIn(F.stopHex(f.stops[0], state.draft), F.stopHex(f.stops[1], state.draft), 0.5, f.space)); return f; });
      else if ((a = t.getAttribute('data-dropstop'))) editFill(a, function (f) { f.stops.splice(1, 1); return f; });
      else if ((a = t.getAttribute('data-gfix'))) {
        var rules = contracts().filter(function (c) { return c.role === a || c.against === a; }).map(function (c) { var other = c.role === a ? c.against : c.role; return [fills()[other] || state.draft[other], c.min]; });
        var fixed = F.fit(fills()[a], state.draft, rules);
        if (fixed) { setFill(a, fixed); repaint(); handEdited(); flash('Moved the gradient\'s lightness until every check passes.'); }
        else { setFill(a, null); repaint(); handEdited(); flash('No lightness makes that gradient readable, so ' + a + ' is solid again.', true); }
      }
    });
    el.pal.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } else if (e.key === 'l' || e.key === 'L') { e.preventDefault(); lucky(); }
    });
    el.bg.addEventListener('input', function () { el.bgHex.value = el.bg.value.toUpperCase(); if (el.lock.checked) rebuild(); else badge(); });
    el.bgHex.addEventListener('input', function () { if (C.HEX.test(el.bgHex.value)) { el.bg.value = el.bgHex.value; if (el.lock.checked) rebuild(); else badge(); } });
    el.lock.addEventListener('change', rebuild);
    $('[data-save]').addEventListener('click', function () {
      if (!store) return flash('No store attached; the draft lives in this page only.');
      store.saveDraft(state.draft).then(function () { flash('Draft saved. Nothing changes for others until you publish.'); }).catch(function (e) { flash(e.message, true); });
    });
    $('[data-publish]').addEventListener('click', function () {
      if (!store) return flash('No store attached; the draft lives in this page only.');
      store.saveDraft(state.draft).then(function () { return store.publish(); }).then(function () { state.theme = JSON.parse(JSON.stringify(state.draft)); paintSwatches(); flash('Published.'); }).catch(function (e) { flash(e.message, true); });
    });
    function resetDraft() {
      var std = state.draft.standard; state.draft = JSON.parse(JSON.stringify(start)); if (std) state.draft.standard = std;
      repaint(); handEdited(base ? 'The page\'s look' : 'The defaults'); flash(base ? 'Back to the page\'s look. Save or publish to keep it.' : 'Draft reset to the defaults. Save or publish to keep it.');
    }
    $('[data-reset]').addEventListener('click', resetDraft);

    /* ── Build around a colour (steps): up to three of a client's colours as background, accent or button;
       derive() builds every other role around them, fitted until every contract passes (hue kept). A background
       also locks the gallery, so ready-made looks and 🎲 follow it. ── */
    var pins = [];
    function paintPins() {
      if (!el.pins) return;
      el.pins.innerHTML = pins.map(function (q, i) {
        return '<div class="fr-build__pin"><input type="color" value="' + esc(q.hex) + '" data-pinc="' + i + '" aria-label="Colour ' + (i + 1) + '">' +
          '<input type="text" maxlength="7" value="' + esc(q.hex) + '" data-pinx="' + i + '" aria-label="Colour ' + (i + 1) + ' hex">' +
          '<select data-pinr="' + i + '" aria-label="What colour ' + (i + 1) + ' is">' + PIN_ROLES.map(function (r) { return '<option value="' + r[0] + '"' + (q.role === r[0] ? ' selected' : '') + '>as ' + r[1] + '</option>'; }).join('') + '</select>' +
          (pins.length > 1 ? '<button type="button" class="fr-link" data-pindel="' + i + '" aria-label="Remove colour ' + (i + 1) + '">Remove</button>' : '') + '</div>';
      }).join('');
      var add = $('[data-pinadd]'); if (add) add.hidden = pins.length >= 3;
    }
    function build() {
      var by = {}, bad = pins.filter(function (q) { return !C.HEX.test(q.hex); });
      if (bad.length) { flash('Each colour needs a 6-digit hex like #0B3D91.', true); return; }
      pins.forEach(function (q) { by[q.role] = q.hex.toUpperCase(); });
      var spec = { bg: by.bg || state.draft.bg, a: by.a || by.b || state.draft.accent, b: by.b || by.a || state.draft.button };
      el.lock.checked = !!by.bg; if (by.bg) { el.bg.value = by.bg; el.bgHex.value = by.bg; }
      list = G.presets(lockBg());
      var colors = G.derive(spec), notes = [];
      [['bg', 'bg', 'Background'], ['a', 'accent', 'Accent'], ['b', 'button', 'Button']].forEach(function (r) {
        if (by[r[0]] && colors[r[1]] !== by[r[0]]) notes.push(r[2] + ' ' + by[r[0]] + ' → ' + colors[r[1]] + ' so it stays readable (same hue)');
      });
      wear({ kind: 'built', name: 'Built around your colours', scheme: 'Built', colors: colors });
      el.unbuild.hidden = !by.bg;
      el.buildNote.textContent = (notes.length ? 'Adjusted: ' + notes.join('; ') + '. ' : 'Your colours are used exactly. ') +
        'Every other colour is fitted around them' + (by.bg ? '; ready-made looks and 🎲 now follow your background.' : '.');
      badge();
    }
    container.addEventListener('input', function (e) {
      var t = e.target, i = t.getAttribute('data-pinc'), j = t.getAttribute('data-pinx');
      if (i != null) { pins[+i].hex = t.value.toUpperCase(); var x = $('[data-pinx="' + i + '"]'); if (x) x.value = pins[+i].hex; }
      else if (j != null && C.HEX.test(t.value.trim())) { pins[+j].hex = t.value.trim().toUpperCase(); var c = $('[data-pinc="' + j + '"]'); if (c) c.value = pins[+j].hex; }
    });
    container.addEventListener('change', function (e) { var r = e.target.getAttribute('data-pinr'); if (r != null) pins[+r].role = e.target.value; });
    if (steps && opts.extras && opts.extras.mount) {
      var ex = $('[data-extras]'); ex.hidden = false; $('[data-extrastitle]').textContent = opts.extras.title || 'More';
      opts.extras.mount($('[data-extrasbody]'));
    }

    function init(loaded) {
      state.theme = loaded.theme; state.draft = JSON.parse(JSON.stringify(loaded.draft)); state.favorites = loaded.favorites || [];
      if (el.dial) el.dial.value = state.draft.standard || '';
      el.bg.value = state.draft.bg; el.bgHex.value = state.draft.bg;
      list = G.presets(null); repaint();
      if (steps && !pins.length) { pins.push({ hex: state.draft.accent || '#336699', role: 'a' }); paintPins(); }
    }
    var ready = store ? store.load().then(init) : Promise.resolve(init({ theme: start, draft: start, favorites: [] }));
    /* overrides(): what this look changes from the page (base); the whole look when there is no base */
    function overrides() {
      if (!base) return JSON.parse(JSON.stringify(state.draft));
      var o = {}, f = {};
      roleNames.forEach(function (k) { if (state.draft[k] !== base[k]) o[k] = state.draft[k]; var a = fills()[k], b = base.fills && base.fills[k]; if (a && !same(a, b)) f[k] = a; });
      if (Object.keys(f).length) o.fills = f;
      return o;
    }
    /* the steps drive the panel from outside: Spec previews a fitted look and adopts a standard, Expo publishes,
       a Fix link brings a role into view */
    function setDraft(d, label) { fitting = null; state.draft = JSON.parse(JSON.stringify(d)); if (label) handEdited(label); repaint(); }
    function setStandard(id) { if (id) state.draft.standard = id; else delete state.draft.standard; apply(); paint(); }
    function focusRole(k) {
      var inp = $('[data-k="' + k + '"]'), sw = inp && inp.closest('.fr-sw'); if (!sw) return false;
      sw.classList.add('is-flash'); sw.scrollIntoView({ block: 'center', behavior: 'smooth' }); inp.focus({ preventScroll: true });
      clearTimeout(focusRole.t); focusRole.t = setTimeout(function () { sw.classList.remove('is-flash'); }, 4000);
      return true;
    }
    function save() { return store ? store.saveDraft(state.draft) : Promise.resolve(); }
    function publish() { return save().then(function () { return store && store.publish(); }).then(function () { state.theme = JSON.parse(JSON.stringify(state.draft)); paintSwatches(); }); }
    return { ready: ready, wear: wear, lucky: lucky, draft: function () { return state.draft; }, overrides: overrides, fit: function (id) { runFit(id || state.draft.standard); }, refresh: paint,
      setDraft: setDraft, setStandard: setStandard, focusRole: focusRole, save: save, publish: publish, reset: resetDraft, pending: function () { return stable(state.draft) !== stable(state.theme); } };
    function stable(v) { return JSON.stringify(v, function (k, x) { return x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce(function (o, key) { o[key] = x[key]; return o; }, {}) : x; }); }
  }

  var api = { mount: mount };
  root.FrostingPanel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
