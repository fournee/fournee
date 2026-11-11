/* kitchen · the Fournée steps
   The one Fournée panel as four steps, in the order you use it:
     1 Frosting  colour: build around a client's colours, ready-made looks (🎲 first), every role, saved palettes, extras
     2 Fontdant  type: presets (🎲 first), faces, size, mode, add a font
     3 Spec      the rules the look is held to: House spec by default; try another (NASA, CERN, GOV.UK …) side by
                 side, see what would fail on your page, Fit to it with a before/after, then Adopt it or Keep yours.
                 Sprinkles (the designed greys, or Plain 7:1 greys) lives here too
     4 Expo      the final check of colour and type together against the adopted spec; everything that needs
                 attention links back to the step and setting that fixes it; one Publish for all of it
   Names stay short; each step and section explains itself on hover, focus or tap.
   Needs the frosting, fontdant and kitchen scripts (KitchenShell, KitchenPass, KitchenPassView, KitchenRecipe,
   KitchenStandards, KitchenSprinkles). Frosted: --fr-* roles only (shell.css).

   mount(container, {
     colours: { store, target, prefix?, extras?: { title, mount(el) } },    the Frosting panel's options
     type:    { store, fontShelf, client, domain, baseUrl, metricsUrl },      the Fontdant panel's options
     sprinkles?: KitchenSprinkles.store(adapter),
     name?, client?, designColors?() → the design's colours (what the recipe falls back to),
     passOpts?, onChange?({ colours, type, sprinkles }), onPublished?(), flash?(msg, isError),
     handoff?: true   Expo gets "Take it with you": a plain summary of the look, Download recipe.json,
                      Copy instructions for Claude, and Load a recipe. For a look made where it can't be published to a
                      project (the catalog's playground), or to carry a look from one place to another.
   }) → { ready, show(step), frosting, fontdant, recipe(), refresh(), summary(), load(recipe) } */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tipi = function (t) { return '<button type="button" class="mise-tipi" aria-label="About this">i<span role="tooltip">' + esc(t) + '</span></button>'; };
  var clone = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  var hex = function (h) { return /^#[0-9a-fA-F]{6}$/.test(h || ''); };

  var STEPS = [
    { id: 'frosting', label: 'Frosting', tip: 'Colour: build around your client\'s colours, start from a look or a lucky roll, then fine-tune.' },
    { id: 'fontdant', label: 'Fontdant', tip: 'Type: faces, sizes and presets for the whole page.' },
    { id: 'spec', label: 'Spec', tip: 'The standard your page is held to. House spec by default; try NASA, CERN, GOV.UK and others side by side.' },
    { id: 'expo', label: 'Expo', tip: 'The final check of colour and type together against your spec, then one Publish for everything.' },
  ];
  var HOUSE = { label: 'House spec', short: 'House', note: 'Fournée\'s own rules: main text 7:1, other text 4.5:1, shapes 3:1, nothing under 12px, extra care for small, thin and quiet text.' };
  var SHORT = function (p) { return p ? p.label.replace(/\s*\(.*\)$/, '').replace(/ [Dd]esign [Ss]ystem$/, '') : HOUSE.short; };

  function mount(container, opts) {
    opts = opts || {};
    var FC = root.FrostingColor, G = root.FrostingGallery, K = root.KitchenStandards, P = root.KitchenPass, R = root.KitchenRecipe, S = root.KitchenSprinkles, FT = root.FontdantTokens;
    var spr = opts.sprinkles || null, frost = null, type = null, spec = null, expo = null, shell = null;
    var roleNames = G.roles().map(function (r) { return r.name; });

    function standard() { var d = frost ? frost.draft() : {}; return d.standard || null; }
    function profile(id) { return id && K ? K.get(id) : null; }
    function recipe(std) {
      var d = frost ? frost.draft() : {}, c = {};
      roleNames.forEach(function (k) { if (typeof d[k] === 'string') c[k] = d[k]; });
      return R.clean({ name: opts.name || 'Fournée', client: opts.client || opts.name || 'Fournée', scheme: hex(c.bg) && FC.isDark(c.bg) ? 'Dark' : 'Light',
        frosting: { colors: c, fills: d.fills }, fontdant: type ? type.draft() : {}, sprinkles: spr ? spr.draft() : true,
        standard: std !== undefined ? std : (d.standard || null) }, { colors: opts.designColors ? opts.designColors() : d });
    }
    function run(std) { return P.run(recipe(std), Object.assign({ standard: std !== undefined ? std : standard() }, opts.passOpts || {})); }

    var busy = false;
    function changed() {
      if (busy) return; busy = true;
      try {
        if (opts.onChange) opts.onChange({ colours: frost ? frost.draft() : null, type: type ? type.draft() : null, sprinkles: spr ? spr.draft() : true });
        if (expo) expo.refresh(); else badgeExpo(run());
        if (spec) spec.refresh();
        badgeSpec();
      } finally { busy = false; }
    }
    function badgeSpec() { if (!shell) return; var id = standard(), r = run(id); shell.badge('spec', SHORT(profile(id)), r.summary.hard ? 'warn' : 'ok'); }
    function badgeExpo(r) { if (shell) shell.badge('expo', r.summary.hard ? r.summary.hard + ' failing' : r.summary.warn ? r.summary.warn + ' warn' : 'ok', r.summary.hard ? 'bad' : r.summary.warn ? 'warn' : 'ok'); }

    /* where a Fix / Adjust link goes */
    function go(where) {
      if (!where) return;
      var tab = where.tab === 'spec' ? 'spec' : where.tab === 'fontdant' ? 'fontdant' : 'frosting';
      shell.show(tab);
      setTimeout(function () {
        if (tab === 'frosting' && frost && where.role) frost.focusRole(where.role) || frost.focusRole(where.against);
        else if (tab === 'fontdant' && type) type.focus();
        else if (tab === 'spec' && spec && where.role === 'sprinkles') spec.focusSprinkles();
      }, 60);
    }
    function nav(i) {
      var prev = STEPS[i - 1], next = STEPS[i + 1];
      return '<div class="mise-steps__nav">' + (prev ? '<button type="button" class="fr-btn fr-btn--ghost" data-step-go="' + prev.id + '">← ' + esc(prev.label) + '</button>' : '<span></span>') +
        (next ? '<button type="button" class="fr-btn" data-step-go="' + next.id + '">Next: ' + esc(next.label) + ' →</button>' : '<span></span>') + '</div>';
    }
    function frame(el, i) {
      el.innerHTML = '<div class="mise-steps__body"></div>' + nav(i);
      return el.querySelector('.mise-steps__body');
    }

    shell = root.KitchenShell.mount(container, {
      numbered: true,
      tabs: STEPS.map(function (st, i) {
        return { id: st.id, label: st.label, tip: st.tip, mount: function (el) {
          var body = frame(el, i);
          if (st.id === 'frosting') return (frost = root.FrostingPanel.mount(body, Object.assign({}, opts.colours, { steps: true, flash: opts.flash, onChange: changed,
            type: { get: function () { return type ? type.draft() : null; }, set: function (l) { if (type) type.wear(l); } } })));
          if (st.id === 'fontdant') return (type = root.FontdantPanel.mount(body, Object.assign({}, opts.type, { steps: true, flash: opts.flash, onChange: changed })));
          if (st.id === 'spec') return (spec = mountSpec(body));
          return (expo = mountExpo(body));
        } };
      }),
      onTab: function (id) { if (id !== 'spec' && spec) spec.leave(); if (id === 'spec' && spec) spec.refresh(); if (id === 'expo' && expo) expo.refresh(); },
    });
    container.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-step-go]'); if (!b) return;
      shell.show(b.getAttribute('data-step-go')); var top = container.querySelector('.mise-shell'); if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start' });
    });
    // every step mounts now (the shell mounts lazily), so Spec and Expo can judge colour and type from the start
    shell.show('fontdant'); shell.show('spec'); shell.show('expo'); shell.show('frosting');

    /* ── 3 · Spec ── */
    function mountSpec(el) {
      var cmp = null;     // { id, original: { colours, type } , fitted: { colours, type, changes, left } | null, showing }
      var fitNow = null;  // the same for "Fit to your spec" in the main view
      el.innerHTML = '<div class="mise-spec"><div data-main></div><div class="mise-spec__cmp" data-cmp hidden></div>' +
        '<section class="mise-spec__spr" data-sprwrap><h3>Sprinkles ' + tipi('Ensure high-contrast greys. On: the designed greys (at least 4.5:1). Off (Plain): quiet text pushed to 7:1, same hue. Visitors who ask their device for more contrast get Plain automatically.') + '</h3>' +
        '<div class="mise-spec__sprbox" data-spr></div></section></div>';
      var main = el.querySelector('[data-main]'), box = el.querySelector('[data-cmp]'), sprWrap = el.querySelector('[data-sprwrap]');
      var sprToggle = spr && S ? S.toggle(el.querySelector('[data-spr]'), { get: spr.draft, set: function (on) { var p = spr.set(on); changed(); return p; }, pending: spr.pending, colors: function () { return frost ? frost.draft() : {}; } }) : null;
      if (!sprToggle) sprWrap.hidden = true;

      function looks() { return { colours: clone(frost.draft()), type: type ? clone(type.draft()) : null }; }
      function show(l, label) { frost.setDraft(l.colours, label); if (type && l.type) type.wear(clone(l.type)); }
      function fitFrom(id, original) {
        var c = {}; roleNames.forEach(function (k) { if (typeof original.colours[k] === 'string') c[k] = original.colours[k]; });
        var r = K.fit(id, { colors: c, fills: original.colours.fills || null, type: original.type }, { house: true });
        var d = Object.assign({}, original.colours, r.colors); if (r.fills && Object.keys(r.fills).length) d.fills = r.fills; else delete d.fills;
        return { colours: d, type: r.type, changes: r.changes, left: r.left };
      }
      function problems(id) {
        var res = run(id);
        return res.results.filter(function (r) { return !r.ok && !r.pending && r.level === 'hard'; });
      }
      function sample(w) {
        if (!w || !hex(w.fg) || !hex(w.bg)) return '';
        return '<span class="mise-spec__sample" style="color:' + w.fg + ';background:' + w.bg + (w.size ? ';font-size:' + w.size + 'px' : '') + (w.weight ? ';font-weight:' + w.weight : '') + '">' + esc(w.style ? 'Sample · ' + w.style : 'Sample text') + '</span>';
      }
      var shown = [];
      function probList(list) {
        shown = list;
        if (!list.length) return '<p class="mise-spec__ok">✓ Nothing fails.</p>';
        return '<ul class="mise-spec__probs">' + list.slice(0, 8).map(function (r, i) {
          return '<li><div><b>' + esc(r.label) + '</b><span class="mise-spec__detail">' + esc(r.detail) + '</span>' + sample(r.where) + '</div>' +
            (r.where ? '<button type="button" class="fr-link" data-adjust="' + i + '">Adjust it myself →</button>' : '') + '</li>';
        }).join('') + (list.length > 8 ? '<li class="mise-spec__more">and ' + (list.length - 8) + ' more (all of them are in Expo)</li>' : '') + '</ul>';
      }
      function changesList(f) {
        var sw = function (v) { return hex(v) ? '<span class="mise-spec__sw" style="background:' + v + '"></span>' : ''; };
        return (f.changes.length ? '<ul class="mise-spec__changes">' + f.changes.map(function (c) { return '<li>' + esc(c.what) + ': ' + sw(c.from) + esc(c.from) + ' → ' + sw(c.to) + esc(c.to) + ' <span class="mise-spec__why">(' + esc(c.why) + ')</span></li>'; }).join('') + '</ul>' : '<p>Nothing needed to move.</p>') +
          (f.left.length ? '<p class="mise-spec__left">Still short: ' + esc(f.left.join('; ')) + '</p>' : '');
      }
      function seg(state) {
        return '<span class="mise-spec__seg" role="group" aria-label="Compare on the page"><button type="button" class="fr-chip" aria-pressed="' + (state.showing === 'before') + '" data-show="before">Before</button>' +
          '<button type="button" class="fr-chip" aria-pressed="' + (state.showing === 'after') + '" data-show="after">After fit</button></span>';
      }
      /* the rules side by side */
      function contract(list, role, against) { var c = list.filter(function (x) { return x.role === role && x.against === against; })[0]; return c ? c.min + ':1' + (c.level === 'warn' ? ' (advice)' : '') : '—'; }
      function rules(id) {
        var p = profile(id), list = id ? K.contracts(id, FC.contracts(), true) : FC.contracts();
        var mode = (type && type.draft().mode) || FT.defaultMode, fl = K.floors(id, (FT.modes[mode] || {}).floors || {}, true);
        return [
          ['Based on', p ? 'WCAG ' + p.wcag + ' ' + p.level : 'WCAG 2.2 AA, tightened'],
          ['Main text contrast', contract(list, 'text', 'bg')],
          ['Quiet text contrast', contract(list, 'muted', 'bg')],
          ['Accent text contrast', contract(list, 'accent-text', 'bg')],
          ['Button text contrast', contract(list, 'button-text', 'button')],
          ['Shapes and borders', contract(list, 'accent', 'bg')],
          ['Body text at least', fl.body ? fl.body + 'px' : '—'],
          ['Smallest text', fl.any ? fl.any + 'px' : '—'],
          ['Focus ring', p && p.focus && p.focus.width ? p.focus.width + 'px, ' + p.focus.contrast + ':1' : '—'],
          ['Tap targets', p && p.targets ? p.targets + 'px' : '—'],
          ['Body line height', p && p.leading ? String(p.leading) : '—'],
          ['APCA (draft method)', p && p.apca ? 'Lc ' + p.apca.body + ' body' : '—'],
        ];
      }

      function paintMain() {
        var id = standard(), p = profile(id), probs = problems(id);
        main.innerHTML = '<h3>Judged by ' + tipi('The spec is the standard your page is held to. Everything in Expo is checked against it.') + '</h3>' +
          '<div class="mise-spec__now" data-level="' + (probs.length ? 'warn' : 'ok') + '"><span class="mise-spec__eyebrow">Your spec now</span><b>' + esc(p ? p.label : HOUSE.label) + '</b>' +
          '<span class="mise-spec__note">' + esc(p ? p.note : HOUSE.note) + '</span><span class="mise-spec__status">' + (probs.length ? probs.length + ' thing' + (probs.length === 1 ? '' : 's') + ' to fix' : 'Your page meets it ✓') + '</span></div>' +
          (probs.length ? probList(probs) + (fitNow ? '<div class="mise-spec__fit"><p><b>Fitted to ' + esc(p ? p.label : HOUSE.label) + '</b> · it\'s a draft until you publish in Expo.</p>' + changesList(fitNow.fitted) +
            '<div class="mise-spec__acts">' + seg(fitNow) + '<button type="button" class="fr-btn fr-btn--sm" data-keepfit>Keep</button><button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-undofit>Undo</button></div></div>'
            : '<div class="mise-spec__acts"><button type="button" class="fr-btn fr-btn--sm" data-fitnow>Fit to ' + esc(p ? SHORT(p) : HOUSE.label) + '</button><span class="mise-spec__hint">Moves only what fails, by the least it can. You see it on the page before you keep it.</span></div>') :
            (fitNow ? '<div class="mise-spec__fit"><p><b>Fitted</b> · it\'s a draft until you publish in Expo.</p>' + changesList(fitNow.fitted) + '<div class="mise-spec__acts">' + seg(fitNow) + '<button type="button" class="fr-btn fr-btn--sm" data-keepfit>Keep</button><button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-undofit>Undo</button></div></div>' : '')) +
          '<h3>Try another spec ' + tipi('See another standard\'s rules next to yours and what would fail on your page, before you change anything.') + '</h3>' +
          '<div class="mise-spec__try"><select data-try aria-label="Spec to try"><option value="">Choose one…</option>' + options(id) + '</select>' +
          '<button type="button" class="fr-btn fr-btn--sm" data-compare disabled>Compare side by side</button></div>';
      }
      function options(cur) {
        var groups = {}, out = cur ? '<option value="house">' + esc(HOUSE.label) + '</option>' : '';
        K.list().forEach(function (q) { if (q.id !== cur) (groups[q.group] = groups[q.group] || []).push(q); });
        return out + Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].map(function (q) { return '<option value="' + esc(q.id) + '">' + esc(q.label) + '</option>'; }).join('') + '</optgroup>'; }).join('');
      }
      function paintCmp() {
        if (!cmp) { box.hidden = true; main.hidden = false; return; }
        var cur = standard(), a = profile(cur), b = profile(cmp.id), ra = rules(cur), rb = rules(cmp.id), probs = problems(cmp.id);
        var nameA = a ? SHORT(a) : HOUSE.label, nameB = b ? SHORT(b) : HOUSE.label;
        main.hidden = true; box.hidden = false;
        box.innerHTML = '<div class="mise-spec__cmphead"><button type="button" class="fr-link" data-back>← Back</button><b>' + esc(nameA) + ' vs ' + esc(nameB) + '</b></div>' +
          (b ? '<p class="mise-spec__note">' + esc(b.note) + '</p>' : '') +
          '<table class="mise-spec__table"><thead><tr><th>Rule</th><th>' + esc(nameA) + ' (now)</th><th>' + esc(nameB) + '</th></tr></thead><tbody>' +
          ra.map(function (r, i) { var d = r[1] !== rb[i][1]; return '<tr' + (d ? ' class="is-diff"' : '') + '><td>' + (d ? '<span class="mise-spec__dot" aria-hidden="true">●</span> ' : '') + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(rb[i][1]) + (d ? '<span class="mise-spec__vh"> (differs)</span>' : '') + '</td></tr>'; }).join('') +
          '</tbody></table>' +
          '<h3>On your page · ' + (cmp.showing === 'after' ? 'after fitting, ' : '') + (probs.length ? probs.length + ' would fail' : 'nothing fails') + '</h3>' +
          (cmp.fitted ? '<div class="mise-spec__acts">' + seg(cmp) + '</div>' : '') +
          probList(probs) +
          (cmp.fitted ? '<div class="mise-spec__fit"><p><b>What Fit changed</b></p>' + changesList(cmp.fitted) + '</div>' : '') +
          '<div class="mise-spec__acts">' + (cmp.fitted ? '' : '<button type="button" class="fr-btn fr-btn--sm" data-cmpfit>Fit to ' + esc(nameB) + '</button>') +
          '<button type="button" class="fr-btn fr-btn--sm' + (cmp.fitted ? '' : ' fr-btn--ghost') + '" data-adopt>Adopt ' + esc(nameB) + '</button>' +
          '<button type="button" class="fr-btn fr-btn--ghost fr-btn--sm" data-keep>Keep ' + esc(nameA) + '</button></div>' +
          '<p class="mise-spec__hint">Fit moves only what fails, by the least it can: colours keep their hue, sizes rise to the floors. You see it on the page before you adopt anything; Adopt keeps what\'s showing.</p>';
      }
      function paint() { paintMain(); paintCmp(); }

      el.addEventListener('change', function (e) {
        if (e.target.hasAttribute('data-try')) { var b = el.querySelector('[data-compare]'); if (b) b.disabled = !e.target.value; }
      });
      el.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('button'); if (!t || !el.contains(t)) return;
        var a;
        if (t.hasAttribute('data-compare')) {
          var v = el.querySelector('[data-try]').value; if (!v) return;
          if (fitNow) { fitNow = null; }
          cmp = { id: v === 'house' ? null : v, original: looks(), fitted: null, showing: 'before' }; paint();
          box.scrollIntoView && box.scrollIntoView({ block: 'start' });
        }
        else if (t.hasAttribute('data-cmpfit') && cmp) { cmp.fitted = fitFrom(cmp.id, cmp.original); cmp.showing = 'after'; show(cmp.fitted, 'Fitted to ' + (profile(cmp.id) ? SHORT(profile(cmp.id)) : HOUSE.label)); paint(); }
        else if ((a = t.getAttribute('data-show'))) {
          var st = cmp || fitNow; if (!st || !st.fitted) return;
          st.showing = a; show(a === 'after' ? st.fitted : st.original, a === 'after' ? 'Fitted' : null); paint();
        }
        else if (t.hasAttribute('data-adopt') && cmp) { var id = cmp.id; cmp = null; frost.setStandard(id); flash('Adopted ' + (profile(id) ? profile(id).label : HOUSE.label) + '. Publish in Expo to keep it.'); paint(); }
        else if ((t.hasAttribute('data-keep') || t.hasAttribute('data-back')) && cmp) { var o = cmp.original; cmp = null; show(o, null); frost.setStandard(o.colours.standard || null); paint(); }
        else if (t.hasAttribute('data-fitnow')) { var id2 = standard(), orig = looks(); fitNow = { id: id2, original: orig, fitted: fitFrom(id2, orig), showing: 'after' }; show(fitNow.fitted, 'Fitted'); paint(); }
        else if (t.hasAttribute('data-keepfit') && fitNow) { if (fitNow.showing === 'before') show(fitNow.fitted, 'Fitted'); fitNow = null; flash('Kept. Publish in Expo to make it the look.'); paint(); }
        else if (t.hasAttribute('data-undofit') && fitNow) { var o2 = fitNow.original; fitNow = null; show(o2, null); paint(); flash('Back to your look.'); }
        else if ((a = t.getAttribute('data-adjust')) != null) { var r = shown[+a]; if (r) go(r.where); }
      });
      function flash(msg) { if (opts.flash) opts.flash(msg); var f = el.querySelector('.mise-spec__flash'); if (!f) { f = document.createElement('p'); f.className = 'mise-spec__flash'; f.setAttribute('role', 'status'); el.querySelector('.mise-spec').prepend(f); } f.textContent = msg; clearTimeout(flash.t); flash.t = setTimeout(function () { f.textContent = ''; }, 4000); }
      paint();
      return {
        refresh: function () { if (!busyPaint) { busyPaint = true; try { paint(); if (sprToggle) sprToggle.refresh(); } finally { busyPaint = false; } } },
        // leaving the step keeps what's on the page as the draft (a preview you walked away from counts as kept)
        leave: function () { if (cmp || fitNow) { cmp = null; fitNow = null; paint(); } },
        focusSprinkles: function () { sprWrap.classList.add('is-flash'); sprWrap.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(function () { sprWrap.classList.remove('is-flash'); }, 4000); },
      };
    }
    var busyPaint = false;

    /* ── 4 · Expo ── */
    function mountExpo(el) {
      el.innerHTML = '<div class="mise-expo"><h3>Final check ' + tipi('Colour and type checked together against your spec. Anything that needs attention links back to the setting that causes it.') + '</h3>' +
        '<p class="mise-expo__against" data-against></p><div data-pass></div>' +
        '<h3>Send it</h3><div class="mise-expo__send"><p>One Publish saves colour, type, spec and Sprinkles together, for everyone.</p>' +
        '<div class="mise-expo__acts"><button type="button" class="fr-btn" data-pub>Publish</button><button type="button" class="fr-btn fr-btn--ghost" data-savedraft>Save draft</button>' +
        '<button type="button" class="fr-link" data-startover>Start over from the design</button></div>' +
        '<p class="mise-expo__pending" data-pending hidden>You have changes that aren\'t published yet.</p>' +
        '<p class="mise-expo__flash" data-flash role="status"></p><p class="mise-expo__hint">Closing without publishing puts the published look back.</p></div>' +
        (opts.handoff ? '<details class="mise-expo__handoff" data-handoff><summary>Take it with you ' + tipi('For a project or client that isn\'t hooked up to Fournée yet: a summary to read or send, the recipe file a project builds from, ready-made instructions for Claude, and a way to load a saved recipe back in.') + '</summary>' +
          '<label class="mise-expo__name">Name <input type="text" maxlength="40" data-hname value="' + esc(opts.handoffName || 'My look') + '"></label>' +
          '<h4>Summary</h4><pre class="mise-expo__summary" data-hsummary></pre>' +
          '<div class="mise-expo__acts"><button type="button" class="fr-btn fr-btn--ghost" data-hdownload>Download recipe.json</button>' +
          '<button type="button" class="fr-btn fr-btn--ghost" data-hcopy>Copy instructions for Claude</button></div>' +
          '<textarea class="mise-expo__prompt" readonly rows="6" data-hprompt aria-label="Instructions for Claude"></textarea>' +
          '<h4>Load a recipe</h4><p class="mise-expo__hint">Bring a saved recipe.json back in to keep working on it. It\'s a draft until you publish.</p>' +
          '<input type="file" accept=".json,application/json" data-hload aria-label="Load a recipe file"><p class="mise-expo__flash" data-hnote role="status"></p></details>' : '') +
        '</div>';
      var against = el.querySelector('[data-against]'), fl = el.querySelector('[data-flash]'), pend = el.querySelector('[data-pending]');
      var hand = el.querySelector('[data-handoff]');
      var view = root.KitchenPassView.mount(el.querySelector('[data-pass]'), {
        recipe: function () { return recipe(); }, passOpts: Object.assign({ standard: undefined }, opts.passOpts || {}), samples: true,
        onPick: function (r) { go(r.where); }, onResult: badgeExpo,
      });
      function flash(msg, bad) { fl.textContent = msg; fl.classList.toggle('is-error', !!bad); clearTimeout(flash.t); flash.t = setTimeout(function () { fl.textContent = ''; }, bad ? 8000 : 4000); if (opts.flash) opts.flash(msg, bad); }
      function pending() { return !!((frost && frost.pending && frost.pending()) || (type && type.pending && type.pending()) || (spr && spr.pending())); }
      function refresh() { var p = profile(standard()); against.textContent = 'Against: ' + (p ? p.label : HOUSE.label); pend.hidden = !pending(); view.refresh(); paintHand(); }
      /* Take it with you */
      function name() { var i = hand && hand.querySelector('[data-hname]'); return (i && i.value.trim()) || 'My look'; }
      function paintHand() {
        if (!hand) return;
        hand.querySelector('[data-hsummary]').textContent = summary(name());
        hand.querySelector('[data-hprompt]').value = prompt(name());
      }
      function fileName() { return name().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'look'; }
      if (hand) {
        hand.addEventListener('input', function (e) { if (e.target.hasAttribute('data-hname')) paintHand(); });
        hand.addEventListener('click', function (e) {
          var t = e.target.closest && e.target.closest('button'); if (!t) return;
          if (t.hasAttribute('data-hdownload')) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(named(name()), null, 2) + '\n'], { type: 'application/json' }));
            a.download = fileName() + '.recipe.json'; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
            note('Downloaded ' + fileName() + '.recipe.json.');
          } else if (t.hasAttribute('data-hcopy')) {
            var ta = hand.querySelector('[data-hprompt]'), text = ta.value;
            var done = function () { note('Copied. Paste it into any Claude session.'); };
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { ta.select(); document.execCommand('copy'); done(); });
            else { ta.select(); document.execCommand('copy'); done(); }
          }
        });
        hand.addEventListener('change', function (e) {
          if (!e.target.hasAttribute('data-hload') || !e.target.files.length) return;
          var file = e.target.files[0];
          file.text().then(function (txt) {
            var r = load(JSON.parse(txt));
            hand.querySelector('[data-hname]').value = r.name; paintHand();
            note('Loaded "' + r.name + '". It\'s on the page as a draft; publish to keep it.');
          }).catch(function (err) { note('Couldn\'t load that file: ' + (err && err.message ? err.message : 'not a recipe'), true); });
          e.target.value = '';
        });
      }
      function note(msg, bad) { var n = hand.querySelector('[data-hnote]'); n.textContent = msg; n.classList.toggle('is-error', !!bad); clearTimeout(note.t); note.t = setTimeout(function () { n.textContent = ''; }, bad ? 8000 : 5000); }
      el.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('button'); if (!t) return;
        if (t.hasAttribute('data-pub')) {
          t.disabled = true; flash('Publishing…');
          frost.publish().then(function () { return type && type.publish(); }).then(function () { return spr && spr.publish(); })
            .then(function () { flash('Published. Everyone sees this look now.'); refresh(); if (opts.onPublished) opts.onPublished(); }, function (err) { flash('Not published: ' + err.message, true); })
            .then(function () { t.disabled = false; });
        }
        else if (t.hasAttribute('data-savedraft')) Promise.all([frost.save(), type ? type.save() : null]).then(function () { flash('Draft saved. Nothing changes for others until you publish.'); }, function (err) { flash('Not saved: ' + err.message, true); });
        else if (t.hasAttribute('data-startover')) { frost.reset(); (type ? type.reset() : Promise.resolve()).then(function () { changed(); flash('Back to the design\'s colours and type. Publish to keep it.'); }); }
      });
      refresh();
      return { refresh: refresh };
    }

    /* ── Take it with you: the look as a recipe, a summary, instructions for Claude, and loading one back ── */
    function named(n) { var r = recipe(); r.name = String(n || r.name).slice(0, 40); r.client = r.name; return r; }
    function summary(n) {
      var r = named(n), c = r.frosting.colors, t = r.fontdant || {}, FF = root.FontdantFonts, res = run(), p = profile(r.standard);
      var faces = FF ? FF.facesOf(t) : {}, fam = function (id) { var e = FF && FF.entryOf(id); return e ? e.family : (id || '?'); };
      var fills = r.frosting.fills ? Object.keys(r.frosting.fills) : [];
      return [
        'Name: ' + r.name,
        'Colours: ' + r.scheme + ' · background ' + c.bg + ' · surface ' + c.surface + ' · text ' + c.text + ' · accent ' + c.accent + ' · button ' + c.button + (fills.length ? ' · gradients on ' + fills.join(', ') : ''),
        'Type: ' + fam(faces.display) + ' (headings) / ' + fam(faces.text) + ' (text) / ' + fam(faces.mono) + ' (mono) · ' + ((t.mode || (FT && FT.defaultMode) || 'reading')) + ' mode' + (t.scaling && t.scaling !== 1 ? ' · size ×' + t.scaling : ''),
        'Spec: ' + (p ? p.label : HOUSE.label),
        'Sprinkles: ' + (r.sprinkles ? 'on (the designed greys)' : 'off (Plain: quiet text at 7:1)'),
        'Check: ' + (res.summary.hard ? res.summary.hard + ' failing' : 'passes') + (res.summary.warn ? ' · ' + res.summary.warn + ' warning' + (res.summary.warn > 1 ? 's' : '') : '') + (res.summary.info ? ' · ' + res.summary.info + ' note' + (res.summary.info > 1 ? 's' : '') : ''),
      ].join('\n');
    }
    function prompt(n) {
      return 'Apply this Fournée look to <project>. Use the fournee skill (source of truth: your local clone of the Fournée repo).\n' +
        '1. Make it the project\'s Fournée recipe: type/recipe.json (or the values in type/make-recipe.mjs), then run type/build-type.mjs against that Fournée clone. A project without Fournée yet gets the usual recipe + build-type.mjs setup first.\n' +
        '2. Colours only from Frosting roles (--fr-*), type only from Fontdant steps and faces (--fd-*, .fd-*); fonts self-hosted.\n' +
        '3. Check it with the pass against the recipe\'s spec and show me before/after screenshots before merging or deploying.\n\n' +
        summary(n) + '\n\nRecipe:\n```json\n' + JSON.stringify(named(n), null, 2) + '\n```\n';
    }
    function load(obj) {
      if (!obj || typeof obj !== 'object' || !obj.frosting) throw new Error('that file has no Fournée recipe in it');
      var r = R.clean(obj, { colors: opts.designColors ? opts.designColors() : (frost ? frost.draft() : {}) });
      var d = Object.assign({}, frost.draft(), r.frosting.colors);
      if (r.frosting.fills) d.fills = clone(r.frosting.fills); else delete d.fills;
      if (r.standard) d.standard = r.standard; else delete d.standard;
      frost.setDraft(d, 'Loaded: ' + r.name);
      if (type) type.wear(clone(r.fontdant || {}));
      if (spr && spr.draft() !== r.sprinkles) spr.set(r.sprinkles);
      changed();
      return r;
    }

    var ready = Promise.all([frost && frost.ready, type && type.ready, spr ? spr.load() : null]).then(function () { changed(); });
    return { ready: ready, show: function (id) { shell.show(id); }, frosting: function () { return frost; }, fontdant: function () { return type; }, recipe: function () { return recipe(); }, refresh: changed, shell: shell,
      summary: function (n) { return summary(n); }, load: load };
  }

  var api = { mount: mount, STEPS: STEPS };
  root.KitchenSteps = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
