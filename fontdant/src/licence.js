/* fontdant · licence checks (proposal §6, decision H3)
   Reads the licence block on every font a look uses (library entry or a font added through Add a font).
   Library fonts and generated looks get the full checks; fonts the user added get the light version (H3):
   their fields are optional and a mismatch is a warning, never a failure. Open licences (OFL, Apache, MIT,
   Ubuntu) pass the client and domain checks by definition.
     L1 Licensee      recipe client ≠ font licensee ⇒ hard (warn for added fonts); an added font tagged for
                      another client ⇒ warn
     L2 Domains       the project's domain not in the licence's domains ⇒ hard (warn for added)
     L3 Self-hosting  self_host: forbidden with build-time injection ⇒ hard
     L4 Term          expired ⇒ hard (warn for added); expires within 60 days ⇒ warn
     L5 Traffic cap   the project's recorded traffic over the cap ⇒ warn
     L6 Reserved name OFL Reserved Font Name and the files are subset ⇒ warn: rename the subset
   covers(entry, ctx) is lucky's filter: may this font be proposed for this project at all?
   Plain script (window.FontdantLicence) or require()-able. Needs FontdantFonts (entryOf). */
(function (root) {
  'use strict';
  var OPEN = /^(OFL|Apache|MIT|Ubuntu|CC0|UFL)/i;
  var CHECKS = [
    { id: 'L1', label: 'Font licensee' }, { id: 'L2', label: 'Font domains' }, { id: 'L3', label: 'Self-hosting allowed' },
    { id: 'L4', label: 'Licence term' }, { id: 'L5', label: 'Traffic cap' }, { id: 'L6', label: 'Reserved font name' },
  ];
  function F() { return root.FontdantFonts; }
  function isOpen(lic) { return !!(lic && (OPEN.test(lic.id || '') || /open/i.test(lic.licensee || ''))); }
  function same(a, b) { return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase(); }
  function domainOk(domains, domain) {
    if (!domain || domains == null || domains === 'any' || domains === '*') return true;
    var list = [].concat(domains).map(function (d) { return String(d).toLowerCase().replace(/^\*\./, ''); });
    var host = String(domain).toLowerCase();
    return list.some(function (d) { return host === d || host.slice(-(d.length + 1)) === '.' + d; });
  }
  function daysUntil(date, today) { var t = Date.parse(date); if (isNaN(t)) return null; return Math.floor((t - (today || Date.now())) / 864e5); }

  /* lucky's filter: an open licence, or one whose licensee and domains cover this project */
  function covers(entry, ctx) {
    ctx = ctx || {}; var lic = entry.licence || {};
    if (lic.self_host === 'forbidden' && ctx.injection === 'build') return false;
    if (isOpen(lic)) return true;
    if (!same(lic.licensee, ctx.client)) return false;
    if (!domainOk(lic.domains, ctx.domain)) return false;
    var d = lic.term && lic.term.expires ? daysUntil(lic.term.expires, ctx.today) : null;
    return d == null || d >= 0;
  }

  /* check(look, ctx) → [{ id, label, level, ok, pending, detail, source: 'licence' }]
     ctx: { client, domain, injection ('build'|'runtime'), traffic, subset, today (ms) } */
  function check(look, ctx) {
    ctx = ctx || {}; look = look || {};
    if (look.fonts) F().use(look.fonts);
    var faces = F().facesOf(look), ids = [];
    Object.keys(faces).forEach(function (s) { if (faces[s] && ids.indexOf(faces[s]) < 0) ids.push(faces[s]); });
    var found = {}; CHECKS.forEach(function (c) { found[c.id] = { hard: [], warn: [] }; });
    ids.forEach(function (id) {
      var e = F().entryOf(id); if (!e) return;
      var lic = e.licence || {}, added = !!e.added || F().isClient(id), open = isOpen(lic);
      var lvl = added ? 'warn' : 'hard', name = e.family || id;
      if (!open && lic.licensee && ctx.client && !same(lic.licensee, ctx.client)) found.L1[lvl].push(name + ' is licensed to ' + lic.licensee + ', not ' + ctx.client);
      if (!open && !lic.licensee && !added) found.L1.hard.push(name + ' has no licensee on record');
      if (added && e.client && ctx.client && !same(e.client, ctx.client)) found.L1.warn.push(name + ' was added for ' + e.client);
      if (!open && !domainOk(lic.domains, ctx.domain)) found.L2[lvl].push(name + ' is not licensed for ' + ctx.domain + ' (' + [].concat(lic.domains).join(', ') + ')');
      if (lic.self_host === 'forbidden' && ctx.injection === 'build') found.L3.hard.push(name + ' may not be self-hosted, and this project injects fonts at build time');
      var d = lic.term && lic.term.expires ? daysUntil(lic.term.expires, ctx.today) : null;
      if (d != null && d < 0) found.L4[lvl].push(name + ' licence expired ' + lic.term.expires);
      else if (d != null && d <= 60) found.L4.warn.push(name + ' licence expires in ' + d + ' days (' + lic.term.expires + ')');
      if (lic.cap && ctx.traffic != null && ctx.traffic > lic.cap) found.L5.warn.push(name + ' traffic ' + ctx.traffic + ' over the cap of ' + lic.cap);
      if ((lic.reserved_font_name || (lic.modify && lic.modify.rename_required)) && ctx.subset) found.L6.warn.push(name + ': OFL Reserved Font Name; rename the subset');
    });
    return CHECKS.map(function (c) {
      var f = found[c.id], hard = f.hard.length, warn = f.warn.length;
      return { id: c.id, label: c.label, level: hard ? 'hard' : 'warn', ok: !hard && !warn, pending: false, detail: f.hard.concat(f.warn).join('; ') || ids.length + ' fonts', source: 'licence' };
    });
  }

  var api = { check: check, covers: covers, isOpen: isOpen, domainOk: domainOk, CHECKS: CHECKS };
  root.FontdantLicence = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
