/* fontdant · the Fontdant tab
   Frosting's panel, mirrored for type: presets and your saved looks, ‹ › and 🎲 lucky, the mode, one picker per
   face slot (library shelves + this client's own fonts), text size, fine-tune dials, live preview on the page,
   Save draft / Publish / Reset, and Add a font. Every pick goes through FontdantCheck.fit, so floors, order and
   missing weights are fitted and badged, never saved silently. Frosted: --fr-* roles only (panel.css), and it
   reuses frosting's .fr-btn / .fr-pal__card styles when frosting's panel.css is on the page.

   mount(el, opts) → { ready, draft(), apply(look), refresh() }
     opts.store        a type store: FontdantPanel.createStore(adapter[, base]) (published / draft / favorites);
                       base = the project's own look (its recipe's fontdant half), what an empty store starts from
     opts.fontShelf    { load() → {id: entry}, save(map) } for added fonts; FontdantPanel.createShelf(adapter)
     opts.client       the recipe's client: added fonts are offered only in that client's recipes
     opts.baseUrl      where library font folders are served ('fonts')
     opts.metricsUrl   dist/metrics.js, loaded when Add a font opens
     opts.saveFontFile(file, name) → Promise<url>   optional; without it added files are kept as data: URLs
     opts.target       element that gets data-fd-mode (document.documentElement)
     opts.onChange(look), opts.onApply(css, look) (mirror the live CSS elsewhere), opts.flash(msg, isError)
     opts.onPublish() / opts.onReset() → Promise   optional: publish or reset other drafts with the type (Sprinkles)
     opts.steps        step 2 of the Fournée steps (KitchenSteps): type presets with 🎲 first, then Faces, Size, Mode and
                       Add a font; no Publish here (Expo publishes everything), so the steps call save() / publish()
   Plain script (window.FontdantPanel). Needs the fontdant scripts, KitchenStore and KitchenRecipe. */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var SLOTS = ['display', 'text', 'mono'];
  var WEIGHT_WORDS = /[\s-]+(Thin|Hairline|ExtraLight|UltraLight|Light|Regular|Book|Normal|Medium|SemiBold|DemiBold|Bold|ExtraBold|UltraBold|Heavy|Black)?\s*(Italic|Oblique)?$/i;

  /* the type store: KitchenStore with fontdant's own keys; values are the recipe's fontdant half */
  function createStore(adapter, base) {
    var R = root.KitchenRecipe;
    return root.KitchenStore.createStore(adapter, {
      defaults: base ? R.cleanFontdant(base) : {},
      clean: function (v, d) { return R.cleanFontdant(v && typeof v === 'object' && Object.keys(v).length ? v : d); },   // nothing saved → the project's look
      keys: { theme: 'type', draft: 'type.draft', favorites: 'type.favorites' }, favoriteKey: 'look', favoriteName: 'Saved type',
    });
  }
  /* the shelf of added fonts, across clients: { id: entry } under 'type.fonts' */
  function createShelf(adapter) {
    return {
      load: function () { return adapter.get('type.fonts').then(function (raw) { var v = root.KitchenStore.parse(raw, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }); },
      save: function (map) { return adapter.set('type.fonts', JSON.stringify(map)); },
    };
  }
  function slug(s) { return String(s || 'font').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'font'; }
  function familyOf(name) { return String(name || '').replace(WEIGHT_WORDS, '').trim() || name; }
  function round(n, d) { var k = Math.pow(10, d || 2); return Math.round(n * k) / k; }

  function mount(el, opts) {
    opts = opts || {};
    var T = root.FontdantTokens, L = root.FontdantLibrary, F = root.FontdantFonts, C = root.FontdantCheck, G = root.FontdantGallery, E = root.FontdantEmit;
    var p = T.prefix, target = opts.target || document.documentElement, store = opts.store, shelfStore = opts.fontShelf;
    var state = { theme: {}, draft: {}, favorites: [], shelf: {}, notes: [], current: null };
    var presets = G.presets();

    var tipi = function (t) { return '<button type="button" class="mise-tipi" aria-label="About this">i<span role="tooltip">' + esc(t) + '</span></button>'; };
    var slotRows = SLOTS.map(function (s) { return '      <label class="fd-pal__row"><span class="fd-pal__label">' + (s === 'display' ? 'Display' : s === 'text' ? 'Text' : 'Mono') + '</span><select data-slot="' + s + '"></select></label>'; }).join('');
    var preview =
      '    <div class="fd-pal__preview" data-preview>' +
      '      <div class="' + p + '-eyebrow">Today’s specials</div><div class="' + p + '-heading-xl">Corner Bakery opens at seven</div>' +
      '      <p class="' + p + '-body">Our sourdough rests for two days before it is baked. Ask at the counter which loaves are still warm.</p>' +
      '      <p class="' + p + '-caption">Updated 8 Nov 2026 · prices include tax</p><div class="' + p + '-ui--button fd-pal__btnsample">Add to order</div> <code class="' + p + '-mono-inline">order #9f2c4b</code>' +
      '      <div class="' + p + '-metric">$1,284.50</div>' +
      '    </div>';
    if (opts.steps) el.innerHTML =
      '<div class="fd-pal fd-pal--steps">' +
      '  <div hidden><button type="button" data-prev></button><button type="button" data-next></button><strong data-name></strong><span data-faces></span>' +
      '    <button type="button" data-save></button><button type="button" data-publish></button><button type="button" data-reset></button></div>' +
      '  <h3>Type presets ' + tipi('Pick a pairing to start from, or roll a random one with 🎲. Your saved looks come after the presets.') + '</h3>' +
      '  <div class="fd-pal__cards" data-cards role="list" aria-label="Type presets"></div>' +
      '  <div class="fd-pal__grid">' +
      '    <div class="fd-pal__controls">' +
      '      <h3>Faces</h3>' + slotRows +
      '      <h3>Size</h3>' +
      '      <label class="fd-pal__row"><span class="fd-pal__label">Text size</span><input type="range" min="' + T.scalingRange[0] + '" max="' + T.scalingRange[1] + '" step="0.05" data-scaling><output data-scaling-out></output></label>' +
      '      <details class="fd-pal__fine" data-fine><summary>Fine-tune: size steps and weights</summary><div class="fd-pal__dials" data-dials></div></details>' +
      '      <h3>Mode</h3>' +
      '      <div class="fd-pal__row"><span class="fd-pal__label" id="fd-mode-l">Mode</span><div class="fd-seg" role="radiogroup" aria-labelledby="fd-mode-l" data-modes></div></div>' +
      '      <div class="fd-pal__notes" data-notes aria-live="polite"></div>' +
      '      <h3>Add a font</h3>' +
      '      <div class="fd-pal__actions"><button type="button" class="fr-btn fr-btn--ghost" data-add>＋ Add a font</button><button type="button" class="fr-btn fr-btn--ghost" data-fav>★ Save to my looks</button></div>' +
      '      <p class="fd-pal__flash" data-flash role="status"></p>' +
      '    </div>' + preview +
      '  </div>' +
      '  <section class="fd-add" data-addbox hidden aria-label="Add a font"></section>' +
      '</div>';
    else el.innerHTML =
      '<div class="fd-pal">' +
      '  <div class="fd-pal__top">' +
      '    <div class="fd-pal__nav"><button type="button" class="fr-btn fr-btn--ghost" aria-label="Previous look" data-prev>‹</button>' +
      '      <div class="fd-pal__now"><strong data-name>Your current type</strong><span class="fd-muted" data-faces></span></div>' +
      '      <button type="button" class="fr-btn fr-btn--ghost" aria-label="Next look" data-next>›</button></div>' +
      '    <button type="button" class="fr-btn" data-lucky>🎲 I\'m feeling lucky</button>' +
      '  </div>' +
      '  <div class="fd-pal__cards" data-cards role="list" aria-label="Type presets"></div>' +
      '  <div class="fd-pal__grid">' +
      '    <div class="fd-pal__controls">' +
      '      <div class="fd-pal__row"><span class="fd-pal__label" id="fd-mode-l">Mode</span><div class="fd-seg" role="radiogroup" aria-labelledby="fd-mode-l" data-modes></div></div>' +
      SLOTS.map(function (s) { return '      <label class="fd-pal__row"><span class="fd-pal__label">' + (s === 'display' ? 'Display' : s === 'text' ? 'Text' : 'Mono') + '</span><select data-slot="' + s + '"></select></label>'; }).join('') +
      '      <label class="fd-pal__row"><span class="fd-pal__label">Text size</span><input type="range" min="' + T.scalingRange[0] + '" max="' + T.scalingRange[1] + '" step="0.05" data-scaling><output data-scaling-out></output></label>' +
      '      <details class="fd-pal__fine"><summary>Fine-tune: size steps and weights</summary><div class="fd-pal__dials" data-dials></div></details>' +
      '      <div class="fd-pal__notes" data-notes aria-live="polite"></div>' +
      '      <div class="fd-pal__actions"><button type="button" class="fr-btn fr-btn--ghost" data-save>Save draft</button><button type="button" class="fr-btn" data-publish>Publish</button>' +
      '        <button type="button" class="fr-btn fr-btn--ghost" data-fav>★ Save to my looks</button><button type="button" class="fr-btn fr-btn--ghost" data-add>＋ Add a font</button>' +
      '        <button type="button" class="fr-link" data-reset>Reset draft to defaults</button></div>' +
      '      <p class="fd-pal__flash" data-flash role="status"></p>' +
      '    </div>' +
      '    <div class="fd-pal__preview" data-preview>' +
      '      <div class="' + p + '-eyebrow">Today’s specials</div><div class="' + p + '-heading-xl">Corner Bakery opens at seven</div>' +
      '      <p class="' + p + '-body">Our sourdough rests for two days before it is baked. Ask at the counter which loaves are still warm.</p>' +
      '      <p class="' + p + '-caption">Updated 8 Nov 2026 · prices include tax</p><div class="' + p + '-ui--button fd-pal__btnsample">Add to order</div> <code class="' + p + '-mono-inline">order #9f2c4b</code>' +
      '      <div class="' + p + '-metric">$1,284.50</div>' +
      '    </div>' +
      '  </div>' +
      '  <section class="fd-add" data-addbox hidden aria-label="Add a font"></section>' +
      '</div>';
    var $ = function (s) { return el.querySelector(s); };
    var ui = { name: $('[data-name]'), faces: $('[data-faces]'), cards: $('[data-cards]'), modes: $('[data-modes]'), scaling: $('[data-scaling]'), scalingOut: $('[data-scaling-out]'), dials: $('[data-dials]'), notes: $('[data-notes]'), flash: $('[data-flash]'), add: $('[data-addbox]') };

    function flash(msg, isError) { ui.flash.textContent = msg; ui.flash.classList.toggle('is-error', !!isError); clearTimeout(flash.t); flash.t = setTimeout(function () { ui.flash.textContent = ''; }, isError ? 7000 : 3500); if (opts.flash) opts.flash(msg, isError); }
    function clientFonts() {
      var out = {}; Object.keys(state.shelf).forEach(function (id) { var e = state.shelf[id]; if (!e.client || !opts.client || String(e.client).toLowerCase() === String(opts.client).toLowerCase()) out[id] = e; });
      return out;
    }
    /* keep look.fonts to the added fonts the faces actually use */
    function withFonts(look) {
      var avail = clientFonts(), used = {};
      SLOTS.forEach(function (s) { var id = look.faces && look.faces[s]; if (id && (avail[id] || (look.fonts && look.fonts[id]))) used[id] = avail[id] || look.fonts[id]; });
      if (Object.keys(used).length) look.fonts = used; else delete look.fonts;
      return look;
    }
    function fitted(look) { var f = C.fit(withFonts(JSON.parse(JSON.stringify(look || {})))); state.notes = f.notes; return withFonts(f.look); }

    /* live preview: the same CSS the server emits before first paint */
    var live = document.getElementById('fontdant-live');
    if (!live) { live = document.createElement('style'); live.id = 'fontdant-live'; document.head.appendChild(live); }
    function apply(look) {
      live.textContent = E.css(look, { baseUrl: opts.baseUrl });
      E.kits(look).forEach(function (u) { if (!document.querySelector('link[href="' + u + '"]')) { var k = document.createElement('link'); k.rel = 'stylesheet'; k.href = u; document.head.appendChild(k); } });
      if (look.mode && look.mode !== T.defaultMode) target.setAttribute('data-' + p + '-mode', look.mode); else target.removeAttribute('data-' + p + '-mode');
      if (opts.onApply) opts.onApply(live.textContent, look);   // e.g. mirror into a preview iframe
      if (opts.onChange) opts.onChange(look);
    }
    /* card faces: one alias per preset display face, for the "Aa" samples */
    var cardCss = document.getElementById('fontdant-cards') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'fontdant-cards' }));
    function cardFaces() {
      var seen = {}, css = [];
      presets.map(function (x) { return x.look; }).concat(state.favorites.map(function (f) { return f.look; })).forEach(function (l) {
        var id = F.facesOf(l).display; if (seen[id] || !F.entryOf(id)) return; seen[id] = 1; css.push(F.faceBlocks(id, 'display', { baseUrl: opts.baseUrl, display: 'swap' }).css);
      });
      cardCss.textContent = css.join('\n');
    }
    function famName(id) { var e = F.entryOf(id); return e ? e.family : id; }
    function card(item, i, kind) {
      var f = F.facesOf(item.look), on = state.current && state.current.kind === kind && state.current.i === i;
      return '<button type="button" role="listitem" class="fd-card" aria-pressed="' + on + '" data-fd' + kind + '="' + i + '">' +
        '<b class="fd-card__aa" style="font-family:' + esc(F.faceStack(f.display, 'display')) + '">Aa</b><span class="fd-card__name">' + esc(item.name) + '</span>' +
        '<span class="fd-card__faces">' + esc(famName(f.display) + (f.text !== f.display ? ' / ' + famName(f.text) : '')) + (item.look.mode === 'dense' ? ' · dense' : '') + '</span></button>';
    }
    function paintCards() {
      var lucky = opts.steps ? '<button type="button" role="listitem" class="fd-card fd-card--lucky" aria-pressed="' + !!(state.current && state.current.kind === 'lucky') + '" data-lucky>' +
        '<b class="fd-card__aa" aria-hidden="true">🎲</b><span class="fd-card__name">I\'m feeling lucky</span><span class="fd-card__faces">A random pairing</span></button>' : '';
      ui.cards.innerHTML = lucky + presets.map(function (x, i) { return card(x, i, 'pick'); }).join('') + state.favorites.map(function (x, i) { return card(x, i, 'favpick'); }).join('');
    }
    function options(slot) {
      var shelves = L.shelves, groups = {}, own = clientFonts(), cur = F.facesOf(state.draft)[slot];
      Object.keys(L.fonts).forEach(function (id) { var e = L.fonts[id]; if (e.slots.indexOf(slot) < 0) return; (groups[e.shelf] = groups[e.shelf] || []).push(e); });
      var html = Object.keys(shelves).filter(function (s) { return groups[s]; }).map(function (s) {
        return '<optgroup label="' + esc(shelves[s].label) + '">' + groups[s].map(function (e) { return '<option value="' + esc(e.id) + '"' + (e.id === cur ? ' selected' : '') + '>' + esc(e.family) + (e.lucky ? '' : ' (maybe)') + '</option>'; }).join('') + '</optgroup>';
      }).join('');
      var mine = Object.keys(own).filter(function (id) { return (own[id].slots || []).indexOf(slot) >= 0; });
      if (mine.length) html += '<optgroup label="Your fonts' + (opts.client ? ' · ' + esc(opts.client) : '') + '">' + mine.map(function (id) { return '<option value="' + esc(id) + '"' + (id === cur ? ' selected' : '') + '>' + esc(own[id].family) + '</option>'; }).join('') + '</optgroup>';
      return html;
    }
    function paintDials() {
      var R = C.resolve(state.draft);
      ui.dials.innerHTML = '<div class="fd-pal__dialgrid">' + T.stepOrder.map(function (s) {
        return '<label><span>' + esc(s) + '</span><input type="number" min="8" max="96" step="1" value="' + round(R.stepPx[s], 1) + '" data-step="' + esc(s) + '" aria-label="size step ' + esc(s) + ' in px"> px</label>';
      }).join('') + '</div><div class="fd-pal__dialgrid">' + Object.keys(T.weights).filter(function (k) { return k !== 'about'; }).map(function (k) {
        return '<label><span>' + esc(k) + '</span><select data-weight="' + esc(k) + '">' + [300, 400, 500, 600, 700, 800, 900].map(function (w) { return '<option' + (w === R.weights[k] ? ' selected' : '') + '>' + w + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div>';
    }
    function paint() {
      var d = state.draft, f = F.facesOf(d), mode = d.mode || T.defaultMode;
      ui.name.textContent = state.current ? (state.current.kind === 'pick' ? presets[state.current.i].name : (state.favorites[state.current.i] || {}).name || 'Your look') : 'Your current type';
      ui.faces.textContent = famName(f.display) + ' · ' + famName(f.text) + ' · ' + famName(f.mono);
      ui.modes.innerHTML = Object.keys(T.modes).map(function (m) { return '<button type="button" role="radio" aria-checked="' + (m === mode) + '" data-mode="' + esc(m) + '">' + esc(m.charAt(0).toUpperCase() + m.slice(1)) + '</button>'; }).join('');
      SLOTS.forEach(function (s) { $('[data-slot="' + s + '"]').innerHTML = options(s); });
      ui.scaling.value = d.scaling == null ? 1 : d.scaling; ui.scalingOut.textContent = Number(ui.scaling.value).toFixed(2) + '×';
      ui.notes.innerHTML = state.notes.map(function (n) { return '<span class="fd-tag">' + esc(n) + '</span>'; }).join('');
      paintCards(); paintDials();
    }
    function wear(look, current) { state.draft = fitted(look); state.current = current || null; apply(state.draft); paint(); }

    el.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t || !el.contains(t)) return;
      if (t.hasAttribute('data-fdpick')) { var i = +t.getAttribute('data-fdpick'); wear(presets[i].look, { kind: 'pick', i: i }); }
      else if (t.hasAttribute('data-fdfavpick')) { var j = +t.getAttribute('data-fdfavpick'); wear(state.favorites[j].look, { kind: 'favpick', i: j }); }
      else if (t.hasAttribute('data-next') || t.hasAttribute('data-prev')) {
        var n = presets.length, at = state.current && state.current.kind === 'pick' ? state.current.i : -1;
        var k = ((at + (t.hasAttribute('data-next') ? 1 : -1)) % n + n) % n; wear(presets[k].look, { kind: 'pick', i: k });
      }
      else if (t.hasAttribute('data-lucky')) { var l = G.lucky({ client: opts.client, domain: opts.domain }); wear(l.look, { kind: 'lucky' }); state.notes = ['🎲 rolled ' + famName(l.look.faces.display) + ' / ' + famName(l.look.faces.text) + ' / ' + famName(l.look.faces.mono)].concat(l.notes); paint(); }
      else if (t.hasAttribute('data-mode')) { var d = JSON.parse(JSON.stringify(state.draft)); d.mode = t.getAttribute('data-mode'); if (d.mode === T.defaultMode) delete d.mode; if (d.dials) delete d.dials.steps; wear(d, state.current); }
      else if (t.hasAttribute('data-save')) store.saveDraft(state.draft).then(function () { flash('Draft saved.'); }, function (err) { flash('Could not save: ' + err.message, true); });
      else if (t.hasAttribute('data-publish')) store.saveDraft(state.draft).then(function () { return store.publish(); }).then(function () { return opts.onPublish && opts.onPublish(); }).then(function () { state.theme = JSON.parse(JSON.stringify(state.draft)); flash('Published. Visitors see this type now.'); }, function (err) { flash('Could not publish: ' + err.message, true); });
      else if (t.hasAttribute('data-reset')) resetDraft().then(function () { flash('Draft reset to the default type.'); });
      else if (t.hasAttribute('data-fav')) {
        var name = (state.current && state.current.kind === 'pick' ? presets[state.current.i].name + ' (mine)' : 'Saved type ' + (state.favorites.length + 1));
        store.saveFavorites(state.favorites.concat([{ name: name, look: state.draft }])).then(function (list) { state.favorites = list; cardFaces(); paint(); flash('Saved to your looks.'); });
      }
      else if (t.hasAttribute('data-add')) openAdd();
    });
    el.addEventListener('change', function (e) {
      var t = e.target, d = JSON.parse(JSON.stringify(state.draft));
      if (t.hasAttribute('data-slot')) { d.faces = d.faces || {}; d.faces[t.getAttribute('data-slot')] = t.value; wear(d); }
      else if (t.hasAttribute('data-step')) { d.dials = d.dials || {}; d.dials.steps = d.dials.steps || {}; d.dials.steps[t.getAttribute('data-step')] = round(Number(t.value) / 16 / (d.scaling || 1), 4) + 'rem'; wear(d, state.current); }
      else if (t.hasAttribute('data-weight')) { d.dials = d.dials || {}; d.dials.weights = d.dials.weights || {}; d.dials.weights[t.getAttribute('data-weight')] = Number(t.value); wear(d, state.current); }
    });
    ui.scaling.addEventListener('input', function () { var d = JSON.parse(JSON.stringify(state.draft)); var v = Number(ui.scaling.value); if (v === 1) delete d.scaling; else d.scaling = v; wear(d, state.current); });

    /* ── Add a font ── 1 drop files or a kit id · 2 read metrics · 3 licence (optional, H3) · 4 add */
    var pending = null;
    function loadMetrics() {
      if (root.FontdantMetrics) return Promise.resolve(root.FontdantMetrics);
      return new Promise(function (ok, bad) {
        var s = document.createElement('script'); s.src = opts.metricsUrl || 'dist/metrics.js';
        s.onload = function () { ok(root.FontdantMetrics); }; s.onerror = function () { bad(new Error('could not load the font reader')); }; document.head.appendChild(s);
      });
    }
    function openAdd() {
      ui.add.hidden = false; pending = null;
      ui.add.innerHTML = '<div class="fd-add__head"><h3>Add a font</h3><button type="button" class="fr-btn fr-btn--ghost" data-add-close aria-label="Close Add a font">✕</button></div>' +
        '<ol class="fd-add__steps">' +
        '<li><strong>Drop the font files</strong> (.woff2, .woff, .ttf, .otf; several weights at once)<label class="fd-add__drop" data-drop><input type="file" multiple accept=".woff2,.woff,.ttf,.otf" data-add-files><span>Drop files here or click to choose</span></label>' +
        '<p class="fd-muted">or an Adobe Fonts kit: <input type="text" data-kit placeholder="kit id" size="10"> <input type="text" data-kit-family placeholder="family name" size="16"> <button type="button" class="fr-btn fr-btn--ghost" data-kit-go>Use kit</button></p></li>' +
        '<li data-add-read><strong>Read automatically</strong><p class="fd-muted">Metrics, weights and the fit appear here.</p></li>' +
        '<li><strong>Licence</strong> <span class="fd-muted">(all optional)</span><div class="fd-add__lic">' +
        '<label>Client <input type="text" data-lic="client" value="' + esc(opts.client || '') + '"></label>' +
        '<label>Licence <select data-lic="id"><option value="commercial">Commercial / own licence</option><option value="OFL-1.1">Open (OFL)</option><option value="unknown">Not sure</option></select></label>' +
        '<label>Licensee <input type="text" data-lic="licensee" value="' + esc(opts.client || '') + '"></label>' +
        '<label>Domains <input type="text" data-lic="domains" placeholder="example.com, shop.example.com"></label>' +
        '<label>Self-hosting <select data-lic="self_host"><option value="allowed">allowed</option><option value="forbidden">not allowed</option></select></label>' +
        '<label>Fit (metric overrides) <select data-lic="metric"><option value="allowed">allowed</option><option value="forbidden">not allowed</option></select></label>' +
        '<label>Expires <input type="date" data-lic="expires"></label>' +
        '<label>Proof (link or note) <input type="text" data-lic="proof"></label></div>' +
        '<p class="fd-muted">You only add fonts you hold, so blanks are fine. Using it for another client later shows a warning, not a block.</p></li>' +
        '<li><strong>Add</strong><p class="fd-muted" data-add-scope>Offered only in ' + esc(opts.client || 'this project') + '’s recipes. Lucky never picks it.</p><button type="button" class="fr-btn" data-add-go disabled>Add font</button></li></ol>';
    }
    function closeAdd() { ui.add.hidden = true; ui.add.innerHTML = ''; pending = null; }
    function readFiles(files) {
      var read = ui.add.querySelector('[data-add-read]');
      read.innerHTML = '<strong>Read automatically</strong><p class="fd-muted">Reading ' + files.length + ' file(s)…</p>';
      return loadMetrics().then(function (M) {
        return Promise.all([].map.call(files, function (file) {
          return file.arrayBuffer().then(function (buf) { var m = M.fromBuffer(buf); return { file: file, buf: buf, m: m }; });
        })).then(function (items) {
          var fam = familyOf(items[0].m.names.family), base = items[0].m, upright = items.filter(function (x) { return !x.m.italic; })[0] || items[0];
          var files2 = items.map(function (x) { return { file: x.file.name, weight: x.m.axes.wght ? x.m.axes.wght[0] + ' ' + x.m.axes.wght[2] : String(x.m.weightClass || 400), style: x.m.italic ? 'italic' : 'normal', bytes: x.file.size }; });
          var entry = M.makeEntry({ id: 'own', family: fam, files: files2, metrics: upright.m, shelf: 'own' });
          pending = { items: items, entry: entry };
          var k = { display: F.fitFactor(entry, 'display'), text: F.fitFactor(entry, 'text') };
          read.innerHTML = '<strong>Read automatically</strong><dl class="fd-add__kv">' +
            '<dt>Family</dt><dd><input type="text" data-add-family value="' + esc(fam) + '"></dd>' +
            '<dt>Files</dt><dd>' + items.map(function (x) { return esc(x.file.name) + ' (' + (x.m.axes.wght ? 'variable ' + x.m.axes.wght[0] + '–' + x.m.axes.wght[2] : x.m.weightClass) + (x.m.italic ? ' italic' : '') + ')'; }).join('<br>') + '</dd>' +
            '<dt>Weights</dt><dd>' + esc(entry.weights.kind === 'variable' ? entry.weights.min + '–' + entry.weights.max : entry.weights.available.join(', ')) + '</dd>' +
            '<dt>Cap / x</dt><dd>' + round(base.ratios.cap, 3) + ' / ' + round(base.ratios.x, 3) + ' → fit ×' + round(k.display) + ' (display), ×' + round(k.text) + ' (text)</dd>' +
            '<dt>Offered for</dt><dd>' + esc(entry.slots.join(', ')) + (entry.slots.indexOf('text') < 0 && entry.category !== 'mono' ? ' (the text slot needs weights 400–700)' : '') + '</dd>' +
            '<dt>Metrics</dt><dd>' + (base.metricTablesDisagree ? '<span class="fd-tag">hhea and typo differ: fit uses hhea (F5)</span>' : 'hhea = typo ✓') + '</dd>' +
            '<dt>Fallback</dt><dd>' + esc((L.systemFallbacks[entry.fallback] || {}).family || 'generic') + ', metric-matched</dd></dl>';
          ui.add.querySelector('[data-add-go]').disabled = false;
        });
      }).catch(function (err) { read.innerHTML = '<strong>Read automatically</strong><p class="fd-pal__flash is-error">Could not read that file: ' + esc(err.message) + '</p>'; });
    }
    function dataUrl(file) { return new Promise(function (ok, bad) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { bad(r.error); }; r.readAsDataURL(file); }); }
    function lic() { var v = function (k) { var i = ui.add.querySelector('[data-lic="' + k + '"]'); return i ? i.value.trim() : ''; };
      var domains = v('domains') ? v('domains').split(/[\s,]+/).filter(Boolean) : null;
      return { client: v('client') || null, licence: { id: v('id') || 'unknown', licensee: v('licensee') || null, domains: domains, self_host: v('self_host') || 'allowed', modify: { subset: null, convert: null, metric_override_css: v('metric') || 'allowed', rename_required: null }, term: v('expires') ? { type: 'term', expires: v('expires') } : { type: null }, proof: v('proof') || null, checked: new Date().toISOString().slice(0, 10), uses: ['web'] } };
    }
    function addFont() {
      if (!pending) return;
      var fam = (ui.add.querySelector('[data-add-family]') || {}).value || pending.entry.family, l = lic();
      var id = slug(fam); if (L.fonts[id]) id += '-own'; while (state.shelf[id] && state.shelf[id].client !== l.client) id += '-2';
      var save = opts.saveFontFile || function (file) { return dataUrl(file); };
      return Promise.all(pending.items.map(function (x) { return save(x.file, id + '/' + x.file.name); })).then(function (urls) {
        var e = JSON.parse(JSON.stringify(pending.entry));
        e.id = id; e.family = fam; e.added = true; e.client = l.client; e.provider = opts.saveFontFile ? 'own file (served)' : 'own file (inline)';
        e.files.forEach(function (f, i) { f.src = urls[i]; });
        e.licence = Object.assign(e.licence, l.licence);
        state.shelf[id] = e;
        return (shelfStore ? shelfStore.save(state.shelf) : Promise.resolve()).then(function () {
          closeAdd(); paint();
          flash('Added ' + fam + '. Pick it under “Your fonts”' + (l.client ? ' (' + l.client + ' only)' : '') + '.');
          return e;
        });
      }).catch(function (err) { flash('Could not add the font: ' + err.message, true); });
    }
    /* an Adobe Fonts kit: no files to read, so metrics are measured from the rendered family once the kit loads */
    function addKit() {
      var kit = ui.add.querySelector('[data-kit]').value.trim(), fam = ui.add.querySelector('[data-kit-family]').value.trim();
      if (!/^[a-z0-9]{5,10}$/i.test(kit) || !fam) { flash('Enter the kit id and the family name.', true); return; }
      var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://use.typekit.net/' + kit + '.css'; document.head.appendChild(link);
      (document.fonts ? document.fonts.load('700 40px "' + fam + '"').then(function () { return document.fonts.load('400 40px "' + fam + '"'); }) : Promise.resolve()).then(function () {
        var m = measure(fam), l = lic(), id = slug(fam) + '-kit';
        var e = { id: id, family: fam, shelf: 'own', slots: ['display', 'text'], lucky: false, category: 'sans', fallback: 'sans', provider: 'adobe-kit', kit: kit, variable: false, added: true, client: l.client,
          files: [], weights: { kind: 'static', available: [400, 500, 600, 700, 800] }, italics: { kind: 'none', available: [] }, axes: {}, metrics: m, licence: Object.assign({ id: 'adobe-fonts', licensee: l.client, self_host: 'forbidden' }, l.licence, { self_host: 'forbidden' }), note: 'Adobe Fonts kit: loads from Adobe, may flash' };
        state.shelf[id] = e;
        return (shelfStore ? shelfStore.save(state.shelf) : Promise.resolve()).then(function () { closeAdd(); paint(); flash('Added ' + fam + ' from the Adobe kit (may flash: it loads from Adobe).'); });
      });
    }
    function measure(fam) {
      var c = document.createElement('canvas').getContext('2d'), size = 200; c.font = '400 ' + size + 'px "' + fam + '"';
      var H = c.measureText('H'), x = c.measureText('x'), sample = c.measureText('the quick brown fox jumps over a lazy dog'), M = c.measureText('Hxg');
      var asc = (M.fontBoundingBoxAscent || H.actualBoundingBoxAscent * 1.35) / size, desc = (M.fontBoundingBoxDescent || size * 0.25) / size;
      return { names: { family: fam }, unitsPerEm: 1000, hhea: { ascent: round(asc * 1000, 0), descent: -round(desc * 1000, 0), lineGap: 0 }, typo: {}, win: {}, metricTablesDisagree: false, axes: {},
        ratios: { cap: round(H.actualBoundingBoxAscent / size, 4), x: round(x.actualBoundingBoxAscent / size, 4), xWidthAvg: round(sample.width / 41 / size, 4), ascent: round(asc, 4), descent: round(desc, 4), lineGap: 0 }, measured: 'canvas' };
    }
    ui.add.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-add-close')) closeAdd(); else if (t.hasAttribute('data-add-go')) addFont(); else if (t.hasAttribute('data-kit-go')) addKit();
    });
    ui.add.addEventListener('change', function (e) { if (e.target.hasAttribute('data-add-files') && e.target.files.length) readFiles(e.target.files); });
    ui.add.addEventListener('dragover', function (e) { if (e.target.closest('[data-drop]')) { e.preventDefault(); } });
    ui.add.addEventListener('drop', function (e) { if (e.target.closest('[data-drop]') && e.dataTransfer.files.length) { e.preventDefault(); readFiles(e.dataTransfer.files); } });

    function resetDraft() { return store.reset().then(function () { return !opts.steps && opts.onReset && opts.onReset(); }).then(function () { wear({}); }); }
    var ready = Promise.all([store.load(), shelfStore ? shelfStore.load() : Promise.resolve({})]).then(function (r) {
      state.favorites = r[0].favorites; state.shelf = r[1] || {};
      state.theme = withFonts(C.fit(withFonts(JSON.parse(JSON.stringify(r[0].theme || {})))).look);   // fitted like the draft, so an untouched look isn't 'pending'
      cardFaces(); wear(r[0].draft);
    });
    /* the steps drive the panel from outside: Expo saves and publishes, a Fix link opens the size controls */
    function save() { return store.saveDraft(state.draft); }
    function publish() { return save().then(function () { return store.publish(); }).then(function () { state.theme = JSON.parse(JSON.stringify(state.draft)); }); }
    function focus() {
      var fine = el.querySelector('[data-fine]'), box = el.querySelector('.fd-pal__controls'); if (fine) fine.open = true;
      if (box) { box.classList.add('is-flash'); box.scrollIntoView({ block: 'start', behavior: 'smooth' }); clearTimeout(focus.t); focus.t = setTimeout(function () { box.classList.remove('is-flash'); }, 4000); }
    }
    return { ready: ready, draft: function () { return state.draft; }, apply: apply, wear: wear, addFont: addFont, refresh: paint, shelf: function () { return state.shelf; },
      save: save, publish: publish, reset: resetDraft, focus: focus, pending: function () { return stable(state.draft) !== stable(state.theme); } };
    function stable(v) { return JSON.stringify(v, function (k, x) { return x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce(function (o, key) { o[key] = x[key]; return o; }, {}) : x; }); }
  }

  var api = { mount: mount, createStore: createStore, createShelf: createShelf, familyOf: familyOf };
  root.FontdantPanel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
