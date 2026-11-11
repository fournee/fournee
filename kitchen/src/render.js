/* kitchen · the pass, rendered checks (T13)
   Runs inside a page that shows every type style of a look (kitchen/src/specimen.html), at a 320px-wide
   viewport, and checks what only a browser can:
     - the viewport meta never blocks zoom (WCAG 1.4.4)
     - mono styles wrap long tokens (overflow-wrap: anywhere)
     - with the WCAG 1.4.12 text-spacing overrides applied (line-height 1.5, paragraph spacing 2em,
       letter-spacing 0.12em, word-spacing 0.16em) nothing is clipped and nothing runs past the
       viewport, so the page reflows at 320px without sideways scrolling (WCAG 1.4.10)
   measure(doc) → { ok, detail, problems: [{ style, problem }] }. Plain script (window.KitchenRender). */
(function (root) {
  'use strict';

  var OVERRIDES = '*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}';

  function viewportProblem(doc) {
    var m = doc.querySelector('meta[name="viewport"]');
    if (!m) return null;
    var c = (m.getAttribute('content') || '').toLowerCase().replace(/\s+/g, '');
    if (/user-scalable=(no|0)(,|$)/.test(c)) return 'viewport meta sets user-scalable=no';
    var mx = /maximum-scale=([\d.]+)/.exec(c);
    if (mx && parseFloat(mx[1]) < 2) return 'viewport meta caps zoom at maximum-scale=' + mx[1];
    return null;
  }

  function measure(doc, opts) {
    opts = opts || {};
    var win = doc.defaultView, problems = [];
    var vp = viewportProblem(doc); if (vp) problems.push({ style: '(page)', problem: vp });
    var els = [].slice.call(doc.querySelectorAll(opts.selector || '[data-style]'));
    els.forEach(function (el) {
      var name = el.getAttribute('data-style') || el.className;
      if (el.getAttribute('data-mono') === '1' && win.getComputedStyle(el).overflowWrap !== 'anywhere') problems.push({ style: name, problem: 'mono without overflow-wrap: anywhere' });
    });
    var style = doc.createElement('style'); style.setAttribute('data-wcag-1412', ''); style.textContent = OVERRIDES;
    doc.head.appendChild(style);
    void doc.body.offsetHeight;   // reflow with the overrides
    var vw = win.innerWidth;
    els.forEach(function (el) {
      var name = el.getAttribute('data-style') || el.className, r = el.getBoundingClientRect(), cs = win.getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 1) problems.push({ style: name, problem: 'text overflows its box sideways with 1.4.12 spacing (' + el.scrollWidth + ' > ' + el.clientWidth + 'px)' });
      if (cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 1) problems.push({ style: name, problem: 'text clipped vertically with 1.4.12 spacing' });
      if (r.right > vw + 1) problems.push({ style: name, problem: 'runs past a ' + vw + 'px viewport (right edge ' + Math.round(r.right) + 'px)' });
    });
    var sw = doc.documentElement.scrollWidth;
    if (sw > vw + 1) problems.push({ style: '(page)', problem: 'page scrolls sideways at ' + vw + 'px (' + sw + 'px wide)' });
    if (!opts.keepOverrides) style.remove();
    return {
      ok: !problems.length,
      problems: problems,
      detail: problems.length ? problems.map(function (p) { return p.style + ': ' + p.problem; }).join('; ') : els.length + ' styles survive 1.4.12 spacing and reflow at ' + vw + 'px',
    };
  }

  var api = { measure: measure, OVERRIDES: OVERRIDES };
  root.KitchenRender = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
