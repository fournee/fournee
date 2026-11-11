// The metrics fontdant needs from a parsed font (fontkit), and the library entry built from them.
// No Node or browser APIs: metrics.mjs (Node, files) and metrics-browser.mjs (the panel's Add a font)
// both read fonts through these functions, so a client's file becomes the same entry either way.

// Frequency weights for the average character width (the capsize idea: weight each glyph's
// advance by how often it appears in running English text). Space is the most frequent
// "character" on a line, so it carries the largest weight.
const WEIGHTS = {
  ' ': 0.1733, e: 0.1041, t: 0.0729, a: 0.0651, o: 0.0596, i: 0.0558, n: 0.0565, s: 0.0516, r: 0.0497, h: 0.0492,
  l: 0.0331, d: 0.0335, c: 0.0232, u: 0.0225, m: 0.0202, f: 0.0198, p: 0.0162, g: 0.0160, w: 0.0170, y: 0.0166,
  b: 0.0127, v: 0.0083, k: 0.0057, x: 0.0015, j: 0.0011, q: 0.0010, z: 0.0007,
};

export function metricsFrom(font) {
  const os2 = font['OS/2'] || {};
  const upm = font.unitsPerEm;
  const glyphAdvance = (ch) => { try { const g = font.glyphForCodePoint(ch.codePointAt(0)); return g && g.advanceWidth != null ? g.advanceWidth : null; } catch { return null; } };
  let wSum = 0, aSum = 0;
  for (const [ch, w] of Object.entries(WEIGHTS)) { const a = glyphAdvance(ch); if (a != null) { aSum += a * w; wSum += w; } }
  const xWidthAvg = wSum ? Math.round(aSum / wSum) : null;
  const zero = glyphAdvance('0');
  // cap height and x-height: OS/2 values when present, else measured from H and x outlines
  const capFromGlyph = () => { try { const b = font.glyphForCodePoint(72).bbox; return b.maxY; } catch { return null; } };
  const xFromGlyph = () => { try { const b = font.glyphForCodePoint(120).bbox; return b.maxY; } catch { return null; } };
  const capHeight = os2.capHeight || font.capHeight || capFromGlyph();
  const xHeight = os2.xHeight || font.xHeight || xFromGlyph();
  const fsSelection = os2.fsSelection || {};
  const useTypoMetrics = !!(typeof fsSelection === 'object' ? fsSelection.useTypoMetrics : (fsSelection & 128));
  const axes = {};
  for (const [tag, a] of Object.entries(font.variationAxes || {})) axes[tag] = [a.min, a.default, a.max];
  const hhea = { ascent: font.ascent, descent: font.descent, lineGap: font.lineGap };
  const typo = { ascent: os2.typoAscender ?? null, descent: os2.typoDescender ?? null, lineGap: os2.typoLineGap ?? null };
  const win = { ascent: os2.winAscent ?? null, descent: os2.winDescent ?? null };
  const disagree = typo.ascent != null && (Math.abs(hhea.ascent - typo.ascent) > 0 || Math.abs(hhea.descent - typo.descent) > 0 || Math.abs((hhea.lineGap || 0) - (typo.lineGap || 0)) > 0);
  return {
    names: { family: font.familyName, fullName: font.fullName, postscriptName: font.postscriptName },
    unitsPerEm: upm, hhea, typo, win, useTypoMetrics, metricTablesDisagree: !!disagree,
    capHeight, xHeight, xWidthAvg, zeroAdvance: zero,
    ratios: { cap: round(capHeight / upm), x: round(xHeight / upm), xWidthAvg: round(xWidthAvg / upm), ascent: round(hhea.ascent / upm), descent: round(Math.abs(hhea.descent) / upm), lineGap: round((hhea.lineGap || 0) / upm) },
    axes, weightClass: os2.usWeightClass ?? null, italic: !!(font['post'] && font['post'].italicAngle), glyphCount: font.numGlyphs,
  };
}

/* A library entry from measured metrics: the same shape for a library font and a client's own file.
   files: [{file, weight ('400' or '100 900' for a variable file), unicodeRange?, bytes?}] */
export function makeEntry({ id, family, files, metrics, shelf = 'custom', slots, lucky = false, category, licence = {}, provider = 'own file', note }) {
  const DIALS = [400, 500, 600, 700, 800];
  const upright = files.filter((f) => (f.style || 'normal') !== 'italic'), italic = files.filter((f) => f.style === 'italic');
  const weights = metrics.axes.wght
    ? { kind: 'variable', min: metrics.axes.wght[0], max: metrics.axes.wght[2], available: DIALS.filter((w) => w >= metrics.axes.wght[0] && w <= metrics.axes.wght[2]) }
    : { kind: 'static', available: upright.map((f) => Number(f.weight)).filter((n) => !isNaN(n)).sort((a, b) => a - b) };
  const italics = !italic.length ? { kind: 'none', available: [] }
    : metrics.axes.wght ? { kind: 'variable', min: metrics.axes.wght[0], max: metrics.axes.wght[2] }
    : { kind: 'static', available: italic.map((f) => Number(f.weight)).filter((n) => !isNaN(n)).sort((a, b) => a - b) };
  const textOk = [400, 500, 600, 700].every((w) => weights.available.includes(w));
  const cat = category || (metrics.zeroAdvance && metrics.xWidthAvg && Math.abs(metrics.zeroAdvance - metrics.xWidthAvg) < 2 ? 'mono' : 'sans');
  const defaultSlots = cat === 'mono' ? ['mono'] : textOk ? ['text', 'display'] : ['display'];
  return {
    id, family: family || metrics.names.family, shelf, slots: (slots || defaultSlots).filter((s) => s !== 'text' || textOk), lucky, category: cat,
    fallback: cat === 'mono' ? 'mono' : cat === 'serif' ? 'serif' : 'sans', note, provider, variable: !!metrics.axes.wght,
    files: files.map((f) => ({ style: 'normal', ...f })), weights, italics, axes: metrics.axes, metrics,
    licence: Object.assign({ id: 'custom', licensor: null, licensee: null, uses: ['web'], domains: null, cap: null, self_host: 'allowed', modify: { subset: null, convert: null, metric_override_css: 'unconfirmed', rename_required: null }, reserved_font_name: null, term: { type: null }, proof: null, checked: null }, licence),
  };
}

function round(n) { return Math.round(n * 10000) / 10000; }
