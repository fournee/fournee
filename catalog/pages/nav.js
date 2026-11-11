/* The Fournée catalog's one navigation bar. Every page loads this in <head>:
     <link rel="stylesheet" href="nav.css"><script src="nav.js"></script>     (../ from frosting/)
   It sets light or dark before the page paints (your choice, remembered in this browser; otherwise your system's),
   then draws the bar: Fournée, the pages, the one you're on, and a light/dark switch. The bar stays at the top as you
   scroll; --mise-nav-h tells a page's own sticky header where to sit under it. Pages with their own theme logic
   listen for the 'mise-theme' event (detail: 'light' | 'dark'). Add or rename a page here, nowhere else. */
(function () {
  'use strict';
  var KEY = 'mise.theme', html = document.documentElement;
  var me = document.currentScript && document.currentScript.src, base = me ? me.replace(/nav\.js(\?.*)?$/, '') : './';
  var PAGES = [['', 'Home'], ['frosting/', 'Frosting'], ['fontdant.html', 'Fontdant'], ['spec.html', 'Spec'], ['steps.html', 'The four steps']];

  function saved() { try { var v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch (e) { return null; } }
  function system() { return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  html.setAttribute('data-theme', saved() || system());   // before paint

  function clean(u) { return u.split('#')[0].split('?')[0].replace(/index\.html$/, '').replace(/\.html$/, ''); }
  function label(mode) { return mode === 'dark' ? '☾ Dark' : '☀ Light'; }
  function build() {
    var old = document.querySelector('header.top'); if (old) old.remove();
    var here = clean(location.href), mode = html.getAttribute('data-theme');
    var bar = document.createElement('header');
    bar.className = 'mise-nav';
    bar.innerHTML = '<a class="mise-nav__brand" href="' + base + '">Fournée</a><nav class="mise-nav__links" aria-label="Fournée catalog">' +
      PAGES.map(function (p) {
        var href = base + p[0], on = clean(new URL(href, location.href).href) === here;
        return '<a href="' + href + '"' + (on ? ' aria-current="page"' : '') + '>' + p[1] + '</a>';
      }).join('') + '</nav>' +
      '<button type="button" class="mise-nav__theme" aria-label="Switch light or dark" title="Switch light or dark">' + label(mode) + '</button>';
    document.body.insertBefore(bar, document.body.firstChild);
    var btn = bar.querySelector('.mise-nav__theme');
    btn.addEventListener('click', function () {
      var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* private window: still switches this page */ }
      btn.textContent = label(next);
      window.dispatchEvent(new CustomEvent('mise-theme', { detail: next }));
    });
    var setH = function () { html.style.setProperty('--mise-nav-h', bar.offsetHeight + 'px'); };
    setH(); if (window.ResizeObserver) new ResizeObserver(setH).observe(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
