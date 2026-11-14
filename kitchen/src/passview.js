/* kitchen · the pass in the panel
   Shows a recipe's pass result as badges: hard failures first, then warnings, then what passed, each with the
   contract id (T5, X4, "Quiet text"…) and the detail. With a specimenUrl it also runs the rendered checks
   (T13) in a hidden 320px-wide frame and folds the result in. Frosted with --fr-* roles only (passview.css).

   mount(el, { recipe: () => recipe, specimenUrl?, onResult?(result), passOpts?, onPick?(r), samples? })   passOpts: domain, injection… for the licence checks → { refresh(), result(), ready }
   refresh() re-runs the pass (call it after the recipe changes); onResult lets the shell badge its tab.
   onSuggest(result, suggest): a failed or warned result that carries `suggest` shows the colour that would pass
   (swatch, hex, ratio); with this hook it also gets a "Use this" button that hands the suggestion to the caller.
   onPick: every item that needs attention (failing, warning or note) gets a Fix / Look button that hands its result
   (with r.where: { tab, role, … }) to the caller, which takes you to the setting. samples: show the failing text
   as it looks (its colours, size and weight). */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MARK = { hard: '✕', warn: '!', ok: '✓', pending: '…', info: 'i' };

  function mount(el, opts) {
    opts = opts || {};
    var last = null, rendered = null, frame = null, waiting = null;
    el.innerHTML = '<div class="mise-pass"><div class="mise-pass__head" data-pass-summary aria-live="polite"></div><div data-pass-list></div></div>';
    var head = el.querySelector('[data-pass-summary]'), list = el.querySelector('[data-pass-list]');

    var hex = function (h) { return /^#[0-9a-fA-F]{6}$/.test(h || ''); };
    function sample(w) {
      if (!opts.samples || !w || !hex(w.fg) || !hex(w.bg)) return '';
      return '<span class="mise-pass__sample" style="color:' + w.fg + ';background:' + w.bg + (w.size ? ';font-size:' + w.size + 'px' : '') + (w.weight ? ';font-weight:' + w.weight : '') + '">' + esc(w.style ? 'Sample · ' + w.style : 'Sample text') + '</span>';
    }
    // the suggested passing colour (KitchenPass `suggest`), or the plain sentence when none exists
    function suggestion(r, index) {
      if (r.suggest === null) return '<span class="mise-pass__suggest" data-pass-nosuggest>No colour of this hue reaches ' + (r.suggestTarget != null ? esc(r.suggestTarget) + ':1' : 'the contrast asked for') + ' here. Change the background or the hue.</span>';
      var s = r.suggest;
      if (!s || !hex(s.to)) return '';
      var binding = (s.against || []).slice().sort(function (a, b) { return a.ratio - b.ratio; })[0];
      var on = binding ? ' on ' + esc(binding.role || binding.hex) : '';
      var w = Object.assign({}, r.where || {}, { fg: s.to });
      if (!hex(w.bg) && binding) w.bg = binding.hex;
      return '<span class="mise-pass__suggest"><span class="mise-pass__swatch" aria-hidden="true" style="background:' + s.to + '"></span>' +
        'Try <strong>' + esc(s.to) + '</strong> · ' + esc(s.ratio) + ':1' + on + ' (' + esc(s.target) + ':1 asked)' +
        (opts.onSuggest ? ' <button type="button" class="mise-pass__use" data-pass-suggest="' + index + '">Use this</button>' : '') + '</span>' + sample(w);
    }
    function item(r) {
      var kind = r.pending ? 'pending' : r.level === 'info' ? 'info' : r.ok ? 'ok' : r.level === 'hard' ? 'hard' : 'warn';
      var pick = opts.onPick && r.where && (kind === 'hard' || kind === 'warn' || kind === 'info') && last ? last.results.indexOf(r) : -1;
      return '<li class="mise-pass__item" data-kind="' + kind + '" data-id="' + esc(r.id) + '">' +
        '<span class="mise-pass__mark" aria-hidden="true">' + MARK[kind] + '</span>' +
        '<span class="mise-pass__id">' + esc(r.id === r.label ? '' : r.id) + '</span>' +
        '<span class="mise-pass__label">' + esc(r.label) + (kind === 'warn' ? ' <em>(warning)</em>' : kind === 'info' ? ' <em>(note)</em>' : '') + '</span>' +
        (pick >= 0 ? '<button type="button" class="mise-pass__fix" data-pass-pick="' + pick + '">' + (kind === 'hard' ? 'Fix' : 'Look') + ' →</button>' : '') +
        (r.detail ? '<span class="mise-pass__detail">' + esc(r.detail) + '</span>' : '') + (kind !== 'ok' && kind !== 'pending' ? sample(r.where) + suggestion(r, last ? last.results.indexOf(r) : -1) : '') + '</li>';
    }
    el.addEventListener('click', function (e) {
      var u = e.target.closest && e.target.closest('[data-pass-suggest]');
      if (u && last && opts.onSuggest) { var sr = last.results[+u.getAttribute('data-pass-suggest')]; if (sr && sr.suggest) opts.onSuggest(sr, sr.suggest); return; }
      var b = e.target.closest && e.target.closest('[data-pass-pick]'); if (!b || !last || !opts.onPick) return;
      var r = last.results[+b.getAttribute('data-pass-pick')]; if (r) opts.onPick(r);
    });
    function draw(res) {
      var s = res.summary;
      head.setAttribute('data-level', s.hard ? 'bad' : s.warn ? 'warn' : 'ok');
      head.textContent = (s.hard ? MARK.hard + ' ' + s.hard + ' failing' : MARK.ok + ' Passes') + (s.warn ? ' · ' + s.warn + ' warning' + (s.warn > 1 ? 's' : '') : '') + (s.info ? ' · ' + s.info + ' note' + (s.info > 1 ? 's' : '') : '') + ' · ' + s.passed + ' checks passed' + (s.pending ? ' · ' + s.pending + ' pending' : '');
      var bad = res.results.filter(function (r) { return !r.ok && !r.pending; }).sort(function (a, b) { return (a.level === 'hard' ? 0 : 1) - (b.level === 'hard' ? 0 : 1); });
      var notes = res.results.filter(function (r) { return r.level === 'info'; });
      var rest = res.results.filter(function (r) { return (r.ok || r.pending) && r.level !== 'info'; });
      bad = bad.concat(notes);
      list.innerHTML = (bad.length ? '<ul class="mise-pass__list">' + bad.map(item).join('') + '</ul>' : '') +
        '<details class="mise-pass__passed"><summary>' + rest.length + ' passed or pending</summary><ul class="mise-pass__list">' + rest.map(item).join('') + '</ul></details>';
    }
    function refresh() {
      var recipe = opts.recipe ? opts.recipe() : {};
      last = root.KitchenPass.run(recipe, Object.assign({ rendered: rendered }, opts.passOpts || {}));
      draw(last);
      if (opts.onResult) opts.onResult(last);
      return last;
    }
    function renderCheck() {
      if (!opts.specimenUrl) return Promise.resolve(null);
      return new Promise(function (resolve) {
        waiting = resolve;
        var look = (opts.recipe ? opts.recipe() : {}).fontdant || {};
        if (!frame) {
          frame = document.createElement('iframe');
          frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1; frame.title = 'pass specimen';
          frame.className = 'mise-pass__frame';
          frame.src = opts.specimenUrl + '#' + encodeURIComponent(JSON.stringify(look));
          el.appendChild(frame);
        } else frame.contentWindow.postMessage({ look: look }, '*');
      });
    }
    window.addEventListener('message', function (e) {
      if (!frame || e.source !== frame.contentWindow || !e.data || e.data.pass !== 'rendered') return;
      rendered = e.data.result; refresh();
      if (waiting) { var w = waiting; waiting = null; w(rendered); }
    });
    refresh();
    var ready = renderCheck().then(function () { return last; });
    return {
      refresh: function () { rendered = null; var r = refresh(); ready = renderCheck().then(function () { return last; }); return r; },
      result: function () { return last; },
      get ready() { return ready; },
    };
  }

  var api = { mount: mount };
  root.KitchenPassView = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
