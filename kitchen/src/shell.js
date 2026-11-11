/* kitchen · panel shell
   The one Fournée panel: a tab bar (Frosting, Fontdant, or whatever a project registers) and a body per tab.
   Each tab mounts lazily the first time it is shown and keeps its state after that. The shell knows nothing
   about colour or type; tabs bring their own panels (FrostingPanel today, the Fontdant panel in phase 5).
   It is itself frosted: it styles with --fr-* roles only (shell.css).
   Plain script (window.KitchenShell) or require()-able.

   mount(container, { tabs: [{ id, label, mount(bodyEl) -> any, disabled?, note?, tip? }], active?, onTab?, tools?(el), numbered? })
     tools: mounts recipe-wide controls (the Sprinkles switch) at the right end of the tab bar
     tip: a one-line explanation shown on hover, keyboard focus or a tap (the steps keep their names short)
     numbered: tabs are steps (1 2 3 4), drawn as equal columns with the badge under the name
     → { ready, show(id), active(), tab(id), badge(id, text, level) }
       tab(id) returns what that tab's mount returned; badge() puts a small count on a tab (level: ok | warn | bad,
       empty text clears it), which is how the pass shows its result on its tab */
(function (root) {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function mount(container, opts) {
    opts = opts || {};
    var tabs = opts.tabs || [], mounted = {}, current = null, ready = [];
    container.innerHTML =
      '<div class="mise-shell' + (opts.numbered ? ' mise-shell--steps' : '') + '">' +
      '  <div class="mise-shell__bar"><div class="mise-shell__tabs" role="tablist" aria-label="Fournée">' +
      tabs.map(function (t, i) {
        var tip = t.tip ? '<span class="mise-shell__tip" role="tooltip" id="mise-tip-' + esc(t.id) + '">' + esc(t.tip) + '</span>' : '';
        return '<button type="button" class="mise-shell__tab" role="tab" id="mise-tab-' + esc(t.id) + '" aria-controls="mise-body-' + esc(t.id) + '" aria-selected="false" data-tab="' + esc(t.id) + '"' + (t.disabled ? ' aria-disabled="true"' : '') + (t.tip ? ' aria-describedby="mise-tip-' + esc(t.id) + '"' : '') + '>' +
          (opts.numbered ? '<span class="mise-shell__num" aria-hidden="true">' + (i + 1) + '</span>' : '') + '<span class="mise-shell__label">' + esc(t.label) + '</span><span class="mise-shell__badge" data-badge hidden></span>' + tip + '</button>';
      }).join('') +
      '  </div><div class="mise-shell__tools" data-tools></div></div>' +
      tabs.map(function (t) {
        return '<div class="mise-shell__body" role="tabpanel" id="mise-body-' + esc(t.id) + '" aria-labelledby="mise-tab-' + esc(t.id) + '" data-body="' + esc(t.id) + '" hidden>' + (t.disabled && t.note ? '<p class="mise-shell__note">' + esc(t.note) + '</p>' : '') + '</div>';
      }).join('') +
      '</div>';
    var bar = container.querySelector('.mise-shell__tabs');
    if (opts.tools) opts.tools(container.querySelector('[data-tools]'));

    function show(id) {
      var t = tabs.filter(function (x) { return x.id === id; })[0]; if (!t) return;
      current = id;
      tabs.forEach(function (x) {
        container.querySelector('[data-tab="' + x.id + '"]').setAttribute('aria-selected', String(x.id === id));
        container.querySelector('[data-tab="' + x.id + '"]').tabIndex = x.id === id ? 0 : -1;
        container.querySelector('[data-body="' + x.id + '"]').hidden = x.id !== id;
      });
      if (!(id in mounted) && !t.disabled && t.mount) {
        mounted[id] = t.mount(container.querySelector('[data-body="' + id + '"]'));
        if (mounted[id] && mounted[id].ready) ready.push(mounted[id].ready);
      }
      if (opts.onTab) opts.onTab(id);
    }
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) show(b.getAttribute('data-tab')); });
    bar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var i = tabs.map(function (t) { return t.id; }).indexOf(current), n = tabs.length;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].id;
      show(next); container.querySelector('[data-tab="' + next + '"]').focus();
    });
    show(opts.active || (tabs[0] && tabs[0].id));
    return {
      ready: Promise.all(ready),
      show: show,
      active: function () { return current; },
      tab: function (id) { return mounted[id]; },
      badge: function (id, text, level) {
        var b = container.querySelector('[data-tab="' + id + '"] [data-badge]'); if (!b) return;
        b.textContent = text || ''; b.hidden = !text; b.setAttribute('data-level', level || 'ok');
      },
    };
  }

  var api = { mount: mount };
  root.KitchenShell = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
