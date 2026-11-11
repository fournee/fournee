/* fontdant · gallery: presets, pairings and 🎲 lucky (frosting part C, mirrored)
   A preset = face triple + mode + dial overrides; a pairing = a preset's face triple alone; lucky rolls a face
   triple from the library fonts marked lucky whose licence covers the project, picks a mode, and runs fit.
   Presets lean to compact modern sans (H2). Every generated look goes through FontdantCheck.fit, so weights a
   face lacks are snapped and badged, never synthesised.
   Plain script (window.FontdantGallery) or require()-able. Needs FontdantTokens, FontdantLibrary,
   FontdantFonts, FontdantCheck (FontdantLicence when present, for lucky's licence filter). */
(function (root) {
  'use strict';

  var PRESETS = [
    { name: 'Default',      faces: { display: 'inter',               text: 'inter',             mono: 'jetbrains-mono' } },
    { name: 'Tight',        faces: { display: 'inter-tight',         text: 'inter',             mono: 'geist-mono' }, dials: { weights: { bold: 800 } } },
    { name: 'Swiss',        faces: { display: 'arimo',               text: 'arimo',             mono: 'ibm-plex-mono' } },
    { name: 'Geist',        faces: { display: 'geist',               text: 'geist',             mono: 'geist-mono' } },
    { name: 'Grotesk',      faces: { display: 'schibsted-grotesk',   text: 'public-sans',       mono: 'jetbrains-mono' } },
    { name: 'Workbench',    faces: { display: 'archivo',             text: 'inter',             mono: 'jetbrains-mono' }, mode: 'dense' },
    { name: 'Console',      faces: { display: 'mona-sans',           text: 'instrument-sans',   mono: 'geist-mono' }, mode: 'dense' },
    { name: 'Civic',        faces: { display: 'public-sans',         text: 'public-sans',       mono: 'ibm-plex-mono' } },
    { name: 'Hyperlegible', faces: { display: 'atkinson-hyperlegible-next', text: 'atkinson-hyperlegible-next', mono: 'jetbrains-mono' }, scaling: 1.1 },
    { name: 'Editorial',    faces: { display: 'fraunces',            text: 'source-sans-3',     mono: 'ibm-plex-mono' } },
    { name: 'Bookish',      faces: { display: 'newsreader',          text: 'source-serif-4',    mono: 'ibm-plex-mono' } },
    { name: 'Classic',      faces: { display: 'eb-garamond',         text: 'libre-franklin',    mono: 'ibm-plex-mono' } },
    { name: 'Poster',       faces: { display: 'anton',               text: 'archivo',           mono: 'space-mono' } },
    { name: 'Marquee',      faces: { display: 'bebas-neue',          text: 'inter',             mono: 'jetbrains-mono' } },
    { name: 'Studio',       faces: { display: 'bricolage-grotesque', text: 'manrope',           mono: 'geist-mono' } },
    { name: 'Gallery',      faces: { display: 'syne',                text: 'inter',             mono: 'space-mono' } },
    // brand looks (research Nov 2026, nasa-cern.md): the organisations' own web faces, all open-licence
    { name: 'NASA Horizon', faces: { display: 'inter',               text: 'public-sans',       mono: 'dm-mono' }, standard: 'nasa' },
    { name: 'CERN',         faces: { display: 'roboto',              text: 'roboto',            mono: 'jetbrains-mono' }, standard: 'cern' },
  ];

  function L() { return root.FontdantLibrary; }
  function C() { return root.FontdantCheck; }
  function look(p) {
    var o = { faces: Object.assign({}, p.faces) };
    if (p.mode) o.mode = p.mode;
    if (p.scaling) o.scaling = p.scaling;
    if (p.dials) o.dials = JSON.parse(JSON.stringify(p.dials));
    return o;
  }
  /* presets(): [{ name, look, notes }] — each look already fitted (badges in notes) */
  function presets() {
    return PRESETS.map(function (p) { var f = C().fit(look(p)); return { name: p.name, look: f.look, notes: f.notes }; });
  }
  function pairings() { return PRESETS.map(function (p) { return { name: p.name, faces: Object.assign({}, p.faces) }; }); }

  /* fonts lucky may roll for a slot. ctx: { client, domain, injection } — passed to the licence filter */
  function candidates(slot, ctx) {
    var out = [], lib = L();
    Object.keys(lib.fonts).forEach(function (id) {
      var e = lib.fonts[id];
      if (!e.lucky || e.slots.indexOf(slot) < 0) return;
      if (root.FontdantLicence && !root.FontdantLicence.covers(e, ctx || {})) return;
      out.push(id);
    });
    return out;
  }
  function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }

  /* lucky(ctx, rnd) → { look, notes }. Text and display come from different shelves half the time (contrast),
     the same family the rest (a calm look); mode is reading two times in three. */
  function lucky(ctx, rnd) {
    rnd = rnd || Math.random;
    var text = pick(candidates('text', ctx), rnd), mono = pick(candidates('mono', ctx), rnd);
    var displays = candidates('display', ctx), display = rnd() < 0.35 && displays.indexOf(text) >= 0 ? text : pick(displays, rnd);
    var l = { faces: { display: display, text: text, mono: mono } };
    if (rnd() < 1 / 3) l.mode = 'dense';
    return C().fit(l);
  }

  var api = { PRESETS: PRESETS, presets: presets, pairings: pairings, lucky: lucky, candidates: candidates };
  root.FontdantGallery = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
