/* fontdant · type checks and the dial fit
   Resolves a look (the fontdant half of a recipe) against the token defaults, checks the contracts
   that need no font data (T1–T10, T15–T17), and fits dials to their floors and order the way
   a dense console app's validateAndFix() did. Pure logic, no DOM. Plain script (window.FontdantCheck) or
   require()-able. Contracts that need font metrics (T11, T12, T14) or a rendered page (T13) are
   reported as pending here and land in later phases. */
(function (root) {
  'use strict';

  var REM = 16;
  function tokens() { return root.FontdantTokens; }
  function lib() { return root.FontdantLibrary || null; }
  function fonts() { return root.FontdantFonts || null; }
  function facesOf(look) {
    var d = (lib() && lib().defaultLook) || {}, out = {};
    ['display', 'text', 'mono'].forEach(function (s) { out[s] = (look && look.faces && look.faces[s]) || d[s] || null; });
    return out;
  }
  // library fonts, plus the look's own fonts (Add a font) once FontdantFonts.use() has registered them
  function entryOf(id) { if (!id) return null; if (fonts()) return fonts().entryOf(id); return lib() && lib().fonts ? lib().fonts[id] || null : null; }
  function useFonts(look) { if (fonts() && look) { fonts().use(look.fonts || {}); if (fonts().useFit) fonts().useFit(look.fit); } }
  function weightAvailable(entry, w) {
    if (!entry) return true;
    var a = entry.weights; return a.kind === 'variable' ? w >= a.min && w <= a.max : a.available.indexOf(w) >= 0;
  }
  function nearestWeight(entry, w) {
    var a = entry.weights; if (a.kind === 'variable') return Math.max(a.min, Math.min(a.max, w));
    return a.available.reduce(function (best, v) { return Math.abs(v - w) < Math.abs(best - w) ? v : best; }, a.available[0]);
  }
  function modes() { return Object.keys(tokens().modes); }
  function isModeMap(v) { return v && typeof v === 'object' && modes().some(function (m) { return m in v; }); }
  function forMode(v, mode) { return isModeMap(v) ? v[mode] : v; }
  function weightKeys() { return Object.keys(tokens().weights); }

  /* ── units ── */
  // px value of a size expression at a scaling factor. rem terms scale; clamp() resolves to its minimum
  // (the floors are checked where the text is smallest); vw terms are ignored inside clamp minima.
  function px(expr, scaling, basePx) {
    if (typeof expr === 'number') return expr;
    var s = String(expr).trim();
    var m;
    if ((m = /^clamp\(\s*([^,]+),/.exec(s))) return px(m[1], scaling, basePx);
    if ((m = /^calc\(\s*(\d*\.?\d+)rem\s*\*\s*var\(--[\w-]+-scaling\)\s*\)$/.exec(s))) return parseFloat(m[1]) * REM * scaling;
    if ((m = /^(\d*\.?\d+)rem$/.exec(s))) return parseFloat(m[1]) * REM * scaling;
    if ((m = /^(\d*\.?\d+)em$/.exec(s))) return parseFloat(m[1]) * (basePx || REM * scaling);
    if ((m = /^(\d*\.?\d+)px$/.exec(s))) return parseFloat(m[1]);
    return NaN;
  }
  function relativeUnit(expr) {
    var s = String(expr);
    if (/^\d*\.?\d+(rem|em)$/.test(s)) return true;
    if (/^clamp\(/.test(s)) return /\d*\.?\d+rem/.test(s);
    return false;
  }
  function emValue(tr) { var m = /^(-?\d*\.?\d+)em$/.exec(String(tr).trim()); return m ? parseFloat(m[1]) : (String(tr).trim() === '0' ? 0 : NaN); }
  function isEm(tr) { return String(tr).trim() === '0' || /^-?\d*\.?\d+em$/.test(String(tr).trim()); }

  /* ── resolve ──
     look: { mode, scaling, faces:{}, dials:{ steps:{}, weights:{} }, roles:{ name:{ field overrides } } }
     Returns every emitted style (role, role-step, role-variant) with px size, numeric weight, leading,
     tracking (em number), case, italic, plus the mode's step table in px. */
  function resolve(look) {
    var T = tokens(); look = look || {}; useFonts(look);
    var mode = look.mode || T.defaultMode, modeDef = T.modes[mode];
    if (!modeDef) throw new Error('unknown mode ' + mode);
    var scaling = look.scaling == null ? 1 : look.scaling;
    var steps = {}, dialSteps = (look.dials && look.dials.steps) || {};
    T.stepOrder.forEach(function (s) { steps[s] = dialSteps[s] != null ? dialSteps[s] : modeDef.steps[s]; });
    var weights = {}, dialW = (look.dials && look.dials.weights) || {};
    weightKeys().forEach(function (k) { weights[k] = dialW[k] != null ? dialW[k] : T.weights[k]; });
    var stepPx = {}; T.stepOrder.forEach(function (s) { stepPx[s] = px(steps[s], scaling); });
    var roleOver = look.roles || {};
    var bodyPx = null, styles = [];
    function one(role, over, name, kind) {
      var s = {}; Object.keys(role).forEach(function (k) { s[k] = role[k]; });
      Object.keys(over || {}).forEach(function (k) { s[k] = over[k]; });
      var o = roleOver[name] || (name === role.name ? null : null); if (o) Object.keys(o).forEach(function (k) { s[k] = o[k]; });
      var baseOver = roleOver[role.name]; if (baseOver && name !== role.name) Object.keys(baseOver).forEach(function (k) { if (!(k in (over || {})) && !(o && k in o)) s[k] = baseOver[k]; });
      var w = s.weight; if (over && over.strong) { var ks = weightKeys(); w = ks[Math.min(ks.indexOf(w) + 1, ks.length - 1)]; }
      var sizeExpr = forMode(s.size, mode), isStep = T.stepOrder.indexOf(sizeExpr) >= 0;
      var sizePx = isStep ? stepPx[sizeExpr] : px(sizeExpr, scaling, bodyPx || stepPx.md);
      var tr = forMode(s.tracking, mode);
      return { name: name, role: role.name, kind: kind, face: forMode(s.face, mode), step: isStep ? sizeExpr : null, sizeExpr: isStep ? steps[sizeExpr] : sizeExpr, sizePx: sizePx,
        weight: typeof w === 'number' ? w : weights[w], weightDial: typeof w === 'number' ? null : w, leading: forMode(s.leading, mode), tracking: tr, trackingEm: emValue(tr),
        tnum: !!s.tnum, case: s.case || 'none', italic: !!s.italic, measure: s.measure || null, align: s.align || null, coarseFloor: s.coarseFloor || null, fit: s.fit || null, loading: s.loading || null,
        color: s.color || null, against: s.against || null, extension: !!role.extension, base: role.base || null };
    }
    extensionRoles(look).forEach(function (role) { if (!T.roles.some(function (r) { return r.name === role.name; })) T = withRole(T, role); });
    T.roles.forEach(function (role) {
      var baseOver = (role.steps && role.defaultStep && role.steps[role.defaultStep]) || {}; // bare role = its default step
      var base = one(role, baseOver, role.name, 'role'); if (role.name === 'body') bodyPx = base.sizePx; styles.push(base);
      Object.keys(role.steps || {}).forEach(function (k) { styles.push(one(role, role.steps[k], role.name + '-' + k, 'step')); });
      Object.keys(role.variants || {}).forEach(function (k) { styles.push(one(role, role.variants[k], role.name + '-' + k, 'variant')); });
    });
    var faces = facesOf(look);
    styles.forEach(function (s) { s.faceId = faces[s.face] || null; });
    // look.floors: px floors that override the mode's (the standards dial sets them; kitchen/src/standards.js)
    return { mode: mode, scaling: scaling, steps: steps, stepPx: stepPx, weights: weights, styles: styles, floors: Object.assign({}, modeDef.floors, look.floors || {}), faces: faces };
  }

  /* ── extensions ── a project registers extra roles (proposal §8) in look.extensions.roles, with the
     standard role schema ({ name, base, face, size, weight, leading, tracking, case, tnum, color }); base names
     the core role whose job it does (the pass reads its colour rules from it). They are
     resolved, emitted and checked like core roles; other projects never see them. An extension cannot
     replace a core role. */
  function extensionRoles(look) {
    var ext = look && look.extensions && look.extensions.roles;
    return Array.isArray(ext) ? ext.filter(function (r) { return r && typeof r.name === 'string' && /^[a-z][a-z0-9-]*$/.test(r.name); })
      .map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { o[k] = r[k]; }); o.extension = true; if (o.leading == null) o.leading = 1.3; if (o.tracking == null) o.tracking = '0'; if (o.face == null) o.face = 'text'; return o; }) : [];
  }
  function withRole(T, role) { var t = Object.create(T); t.roles = T.roles.concat([role]); return t; }

  /* ── check ── returns [{id, label, level, ok, pending, detail}] in contract order. */
  /* opts.rendered: the result of a rendered run (kitchen's KitchenRender.measure) — fills T13. */
  function check(look, opts) {
    opts = opts || {};
    var T = tokens(), R = resolve(look), out = [];
    var byName = {}; R.styles.forEach(function (s) { byName[s.name] = s; });
    function add(c, ok, detail, level) { out.push({ id: c.id, label: c.label, level: level || c.level, ok: !!ok, pending: false, detail: detail || '' }); }
    var haveFonts = !!(lib() && fonts());
    T.contracts.forEach(function (c) {
      if (c.needs === 'render' && opts.rendered) { var rr = opts.rendered; out.push({ id: c.id, label: c.label, level: c.level, ok: !!rr.ok, pending: false, detail: rr.detail || '' }); return; }
      if (c.needs && !(c.needs === 'font-metrics' && haveFonts)) { out.push({ id: c.id, label: c.label, level: c.level, ok: true, pending: true, detail: 'needs ' + c.needs + ' (later phase)' }); return; }
      var bad = [];
      switch (c.id) {
        case 'T11': {   // every face is measured and sits on its slot target after the fit
          ['display', 'text', 'mono'].forEach(function (slot) {
            var id = R.faces[slot], e = entryOf(id);
            if (!e) { bad.push(slot + ': ' + (id || 'no face') + ' is not in the library (unmeasured, no fit)'); return; }
            var a = fonts().adjusted(id, slot); if (!a) return;
            var delta = Math.abs(a.raw - a.target) / a.target;
            if (delta > 0.10 && Math.abs(a.k - 1) < 1e-9) bad.push(slot + ': ' + id + ' ' + a.metric + ' ' + round(a.raw) + ' vs target ' + a.target + (fonts().fitOn && !fonts().fitOn(slot) ? ' (fit off by choice: natural size)' : ' with no fit'));
          });
          add(c, !bad.length, bad.length ? bad.join('; ') : ['display', 'text', 'mono'].map(function (slot) { var a = fonts().adjusted(R.faces[slot], slot); return a ? slot + ' ' + R.faces[slot] + ' ×' + round(a.k) : ''; }).join(', ')); break;
        }
        case 'T12': {   // mono's adjusted x-height within 5% of body's
          var am = fonts().adjusted(R.faces.mono, 'mono'), at = fonts().adjusted(R.faces.text, 'text');
          if (!am || !at) { add(c, false, 'unmeasured face'); break; }
          var d12 = Math.abs(am.x - at.x) / at.x;
          add(c, d12 <= 0.05, 'mono x ' + round(am.x) + ' vs body x ' + round(at.x) + ' (' + round(d12 * 100) + '%)'); break;
        }
        case 'T14': {   // every style's weight exists in its face
          R.styles.forEach(function (s) { var e = entryOf(s.faceId); if (e && !weightAvailable(e, s.weight)) bad.push(s.name + ' ' + s.weight + ' not in ' + s.faceId + ' (' + (e.weights.kind === 'variable' ? e.weights.min + '–' + e.weights.max : e.weights.available.join('/')) + ')'); });
          add(c, !bad.length, bad.join('; ')); break;
        }
        case 'T1':
          T.stepOrder.forEach(function (s) { if (!relativeUnit(R.steps[s])) bad.push('step ' + s + ' = ' + R.steps[s]); });
          R.styles.forEach(function (s) { if (!s.step && !relativeUnit(s.sizeExpr)) bad.push(s.name + ' = ' + s.sizeExpr); });
          add(c, !bad.length, bad.join('; ')); break;
        case 'T2':
          R.styles.forEach(function (s) { if (typeof s.leading !== 'number') bad.push(s.name + ' leading ' + s.leading); if (!isEm(s.tracking)) bad.push(s.name + ' tracking ' + s.tracking); });
          add(c, !bad.length, bad.join('; ')); break;
        case 'T3': { var b = byName[c.role]; add(c, b && b.leading >= c.min, b ? c.role + ' leading ' + b.leading : 'no body'); break; }
        case 'T4': {
          var m = byName[c.role], ch = m && m.measure ? parseFloat(m.measure) : NaN;
          if (!(ch <= c.max)) add(c, false, 'measure ' + (m && m.measure) + ' > ' + c.max + 'ch');
          else if (ch < c.warnBand[0] || ch > c.warnBand[1]) add(c, false, 'measure ' + ch + 'ch outside ' + c.warnBand.join('–') + 'ch', 'warn');
          else add(c, true, 'measure ' + ch + 'ch'); break;
        }
        case 'T5': {
          var fl = R.floors, minScale = (T.scalingRange && T.scalingRange[0]) || 1, k = minScale / R.scaling;
          R.styles.forEach(function (s) {
            if (s.step === null && !/rem/.test(String(s.sizeExpr))) return; // em-relative steps (mono-inline) float with their parent
            var at = s.sizePx * k, floor = fl[s.name] != null ? fl[s.name] : fl.any;
            if (at < floor - 1e-9) bad.push(s.name + ' ' + round(at) + 'px < ' + floor + 'px' + (k !== 1 ? ' at scaling ' + minScale : ''));
          });
          add(c, !bad.length, bad.join('; ')); break;
        }
        case 'T6': {
          for (var i = 1; i < T.stepOrder.length; i++) { var a = R.stepPx[T.stepOrder[i - 1]], bb = R.stepPx[T.stepOrder[i]]; if (!(bb > a)) bad.push(T.stepOrder[i - 1] + ' ' + round(a) + ' !< ' + T.stepOrder[i] + ' ' + round(bb)); }
          add(c, !bad.length, bad.join('; ')); break;
        }
        case 'T7': {
          var hard = [];
          R.styles.forEach(function (s) { if (s.sizePx < 24) { if (s.weight < 300) hard.push(s.name + ' ' + s.weight + ' @ ' + round(s.sizePx) + 'px'); else if (s.weight < 400) bad.push(s.name + ' ' + s.weight + ' @ ' + round(s.sizePx) + 'px'); } });
          if (hard.length) add(c, false, hard.join('; '), 'hard'); else add(c, !bad.length, bad.join('; '), 'warn'); break;
        }
        case 'T8':
          R.styles.forEach(function (s) { if (s.case === 'upper' && !(s.trackingEm >= 0.05)) bad.push(s.name + ' tracking ' + s.tracking); });
          add(c, !bad.length, bad.join('; ')); break;
        case 'T9':
          R.styles.forEach(function (s) { if (s.trackingEm < 0 && s.sizePx < 20) bad.push(s.name + ' ' + s.tracking + ' @ ' + round(s.sizePx) + 'px'); });
          add(c, !bad.length, bad.join('; ')); break;
        case 'T10':
          Object.keys(c.bands).forEach(function (roleName) {
            var band = c.bands[roleName];
            R.styles.filter(function (s) { return s.role === roleName; }).forEach(function (s) {
              if ((band[0] != null && s.leading < band[0]) || (band[1] != null && s.leading > band[1])) bad.push(s.name + ' leading ' + s.leading + ' outside ' + band.join('–'));
            });
          });
          add(c, !bad.length, bad.join('; ')); break;
        case 'T15': {
          var v = byName[c.role + '-' + c.variant], fpx = v && v.coarseFloor ? px(v.coarseFloor, 1) : 0;
          add(c, fpx >= c.minPx, v ? c.role + '-' + c.variant + ' coarse floor ' + (v.coarseFloor || 'none') : 'no ' + c.role + '-' + c.variant); break;
        }
        case 'T16': { var bo = byName.body; add(c, !!bo, bo ? 'paragraph = ' + round(bo.leading * 1.5) + 'em, derived from leading ' + bo.leading : 'no body'); break; }
        case 'T17': { var bd = byName.body; var problems = []; if (bd && bd.align === 'justify') problems.push('justified'); if (bd && bd.italic) problems.push('italic'); if (bd && bd.case === 'upper') problems.push('uppercase'); add(c, !problems.length, problems.join(', ')); break; }
        default: add(c, true, 'no checker');
      }
    });
    return out;
  }
  function round(n) { return Math.round(n * 100) / 100; }
  function failures(look, opts) { return check(look, opts).filter(function (c) { return !c.ok && !c.pending; }); }

  /* ── fit ── the dial fit, after a console app's validateAndFix(): floors clamp, order bumps, scaling range clamps.
     Returns { look, notes } where notes are the badges to show. Never silently saves an undercut look. */
  function fit(look) {
    var T = tokens(); look = JSON.parse(JSON.stringify(look || {})); useFonts(look);
    var notes = [];
    var mode = look.mode || T.defaultMode, modeDef = T.modes[mode]; if (!modeDef) { look.mode = mode = T.defaultMode; modeDef = T.modes[mode]; notes.push('unknown mode; reset to ' + mode); }
    if (look.scaling != null && T.scalingRange) {
      var lo = T.scalingRange[0], hi = T.scalingRange[1];
      if (look.scaling < lo) { notes.push('scaling ' + look.scaling + ' raised to ' + lo); look.scaling = lo; }
      if (look.scaling > hi) { notes.push('scaling ' + look.scaling + ' lowered to ' + hi); look.scaling = hi; }
    }
    look.dials = look.dials || {}; look.dials.steps = look.dials.steps || {}; look.dials.weights = look.dials.weights || {};
    // weights: numeric, 100..900, in dial order
    var wk = weightKeys(), prevW = 0;
    wk.forEach(function (k) {
      var v = look.dials.weights[k] != null ? Number(look.dials.weights[k]) : T.weights[k];
      if (!(v >= 100 && v <= 900)) { notes.push('weight ' + k + ' ' + look.dials.weights[k] + ' reset to ' + T.weights[k]); v = T.weights[k]; }
      if (v < prevW) { notes.push('weight ' + k + ' raised to keep the order (' + prevW + ')'); v = prevW; }
      if (v !== T.weights[k]) look.dials.weights[k] = v; else delete look.dials.weights[k];
      prevW = v;
    });
    // steps: resolve to px, apply role floors, then order, then write back as rem (fluid defaults are left alone unless raised)
    var R = resolve(look), pxs = {}; T.stepOrder.forEach(function (s) { pxs[s] = R.stepPx[s]; });
    var needed = {}; // step -> highest floor any style on it demands
    R.styles.forEach(function (s) { if (!s.step) return; var f = R.floors[s.name] != null ? R.floors[s.name] : R.floors.any; if (needed[s.step] == null || f > needed[s.step]) needed[s.step] = f; });
    T.stepOrder.forEach(function (s) { var f = needed[s] != null ? needed[s] : R.floors.any; if (pxs[s] < f) { notes.push('step ' + s + ' raised to its floor (' + f + 'px)'); pxs[s] = f; } });
    for (var i = 1; i < T.stepOrder.length; i++) { var a = T.stepOrder[i - 1], b = T.stepOrder[i]; if (pxs[b] <= pxs[a]) { pxs[b] = pxs[a] + 1; notes.push('step ' + b + ' bumped to keep the order (' + pxs[b] + 'px)'); } }
    T.stepOrder.forEach(function (s) {
      var changed = Math.abs(pxs[s] - R.stepPx[s]) > 1e-9;
      if (changed) look.dials.steps[s] = (Math.round(pxs[s] / R.scaling / REM * 10000) / 10000) + 'rem';
      // an override that lands on the mode's default is no override
      if (look.dials.steps[s] != null && String(look.dials.steps[s]) === String(modeDef.steps[s])) delete look.dials.steps[s];
    });
    if (!Object.keys(look.dials.steps).length) delete look.dials.steps;
    if (!Object.keys(look.dials.weights).length) delete look.dials.weights;
    if (!Object.keys(look.dials).length) delete look.dials;
    // faces: unknown ids fall back to the default look; weights a face lacks snap to the nearest it has (badged);
    // a face whose hhea and typo tables disagree is flagged (F5)
    if (lib()) {
      var faces = facesOf(look), seen = {};
      ['display', 'text', 'mono'].forEach(function (slot) {
        var id = look.faces && look.faces[slot];
        if (id && !entryOf(id)) { notes.push(slot + ' face "' + id + '" is not in the library; using ' + (lib().defaultLook[slot] || 'the default')); delete look.faces[slot]; }
        var e = entryOf(faces[slot]);
        if (e && e.slots && e.slots.indexOf(slot) < 0) notes.push(faces[slot] + ' is not offered for the ' + slot + ' slot (' + e.slots.join('/') + ')');
        if (e && fonts() && !fonts().fitAllowed(e)) notes.push(e.id + ': its licence forbids metric-override CSS, so it is not fitted (size-adjust 100%)');
        if (e && e.metrics.metricTablesDisagree && !seen[e.id]) { seen[e.id] = 1; notes.push(e.id + ': hhea and typo metrics differ (' + e.metrics.hhea.ascent + '/' + e.metrics.typo.ascent + '); fit uses hhea'); }
      });
      if (look.faces && !Object.keys(look.faces).length) delete look.faces;
      var R2 = resolve(look);
      R2.styles.forEach(function (s) {
        var e = entryOf(s.faceId); if (!e || weightAvailable(e, s.weight)) return;
        var w = nearestWeight(e, s.weight);
        look.roles = look.roles || {}; look.roles[s.name] = look.roles[s.name] || {}; look.roles[s.name].weight = w;
        notes.push(s.name + ' weight ' + s.weight + ' snapped to ' + w + ' (' + e.id + ' has ' + (e.weights.kind === 'variable' ? e.weights.min + '–' + e.weights.max : e.weights.available.join('/')) + ')');
      });
    }
    return { look: look, notes: notes };
  }

  /* ── css ── the :root override block for a look, for before-first-paint injection or live preview. */
  function cssVars(look) {
    var T = tokens(), p = T.prefix, R = resolve(look), out = [];
    if (look && look.mode && look.mode !== T.defaultMode) out.push('/* mode: ' + look.mode + ' — set data-' + p + '-mode="' + look.mode + '" on <html> */');
    if (look && look.scaling != null && look.scaling !== 1) out.push('--' + p + '-scaling: ' + look.scaling + ';');
    Object.keys((look && look.faces) || {}).forEach(function (f) { out.push('--' + p + '-face-' + f + ': ' + (fonts() ? fonts().faceStack(look.faces[f], f) : look.faces[f]) + ';'); });
    Object.keys((look && look.dials && look.dials.steps) || {}).forEach(function (s) { out.push('--' + p + '-step-' + s + ': ' + String(R.steps[s]).replace(/(\d*\.?\d+)rem/g, 'calc($1rem * var(--' + p + '-scaling))') + ';'); });
    Object.keys((look && look.dials && look.dials.weights) || {}).forEach(function (w) { out.push('--' + p + '-weight-' + w + ': ' + R.weights[w] + ';'); });
    // per-role overrides (hand edits, and the weights fit snapped) → that style's longhand variables
    var mode = (look && look.mode) || T.defaultMode;
    Object.keys((look && look.roles) || {}).forEach(function (name) {
      var o = look.roles[name] || {}, v = function (k, val) { out.push('--' + p + '-' + name + '-' + k + ': ' + val + ';'); };
      var size = forMode(o.size, mode), tr = forMode(o.tracking, mode), lead = forMode(o.leading, mode);
      if (size != null) v('size', T.stepOrder.indexOf(size) >= 0 ? 'var(--' + p + '-step-' + size + ')' : String(size).replace(/(\d*\.?\d+)rem/g, 'calc($1rem * var(--' + p + '-scaling))'));
      if (o.weight != null) v('weight', typeof o.weight === 'number' ? o.weight : 'var(--' + p + '-weight-' + o.weight + ')');
      if (lead != null) v('leading', lead);
      if (tr != null) v('tracking', tr);
      if (o.case != null) v('transform', o.case === 'upper' ? 'uppercase' : o.case === 'lower' ? 'lowercase' : 'none');
      if (o.italic != null) v('style', o.italic ? 'italic' : 'normal');
      if (o.tnum != null) v('numeric', o.tnum ? 'tabular-nums' : 'normal');
    });
    return out.join('\n');
  }

  var api = { resolve: resolve, check: check, failures: failures, fit: fit, cssVars: cssVars, px: px };
  root.FontdantCheck = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
