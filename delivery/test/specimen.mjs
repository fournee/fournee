// The specimen every delivery target renders: one line per style (role, step, variant) with that style's class,
// plus colour samples. measure() runs in the page and returns what the browser actually computed, so targets can
// be compared field by field with the plain-HTML reference.
export const TEXT = 'Hamburgefonstiv 0123 $1,284.50';

/** body markup for a classes map ({ styleName: className }) */
export function bodyHtml(classes) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return '<main id="spec">' + Object.keys(classes).map((n) => `<p data-style="${esc(n)}" class="${esc(classes[n])}">${TEXT}</p>`).join('') +
    '<div data-colors style="background: var(--fr-surface); color: var(--fr-muted); border: 1px solid var(--fr-border)">muted on surface</div></main>';
}

/** in-page measurement (pass measure.toString() to an evaluate) */
export function measure() {
  const out = { styles: {}, colors: {}, mode: document.documentElement.getAttribute('data-fd-mode'), origin: location.origin, protocol: location.protocol, vw: innerWidth, vh: innerHeight };
  for (const el of document.querySelectorAll('#spec [data-style]')) {
    const cs = getComputedStyle(el);
    out.styles[el.getAttribute('data-style')] = { className: el.className, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, fontStyle: cs.fontStyle, fontVariantNumeric: cs.fontVariantNumeric, height: el.getBoundingClientRect().height };
  }
  const root = getComputedStyle(document.documentElement), body = getComputedStyle(document.body), c = document.querySelector('[data-colors]');
  out.colors = { bg: root.getPropertyValue('--fr-bg').trim(), text: root.getPropertyValue('--fr-text').trim(), muted: root.getPropertyValue('--fr-muted').trim(), sampleColor: c ? getComputedStyle(c).color : null, sampleBg: c ? getComputedStyle(c).backgroundColor : null, bodyBg: body.backgroundColor };
  out.fonts = [...document.fonts].filter((f) => f.status === 'loaded' && !/ fallback"?$/.test(f.family)).map((f) => f.family.replace(/"/g, '')).filter((f, i, a) => a.indexOf(f) === i).sort();
  // every url() in the page's @font-face rules (Resource Timing misses preloads over custom schemes)
  out.fontSrcs = [];
  for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; } for (const r of rules) if (r instanceof CSSFontFaceRule) for (const m of (r.style.getPropertyValue('src') || '').matchAll(/url\("?([^")]+)"?\)/g)) out.fontSrcs.push(m[1]); }
  out.fontUrls = performance.getEntriesByType('resource').filter((e) => /\.(woff2?|ttf|otf)(\?|$)/.test(e.name)).map((e) => e.name);
  return out;
}

/** wait for the specimen and its fonts in a page (Playwright page or anything with evaluate) */
export async function settle(page) {
  await page.waitForFunction(() => document.querySelector('#spec [data-style]'));
  await page.evaluate(async () => { await document.fonts.ready; for (const el of document.querySelectorAll('#spec [data-style]')) el.offsetHeight; await document.fonts.ready; });
}

/** field-by-field differences (fonts: the real faces; metric-matched fallbacks load only where text paints before them) between two measurements (ignores origin, protocol, fontUrls) */
/** fluid styles: their size depends on the viewport, so each is checked against its own formula at that viewport */
export const FLUID = { 'deck-time': (vw, vh) => Math.min(38, Math.max(24, Math.min(0.026 * vw, 0.042 * vh))) };

export function diff(ref, got) {
  const out = [];
  for (const [name, s] of Object.entries(ref.styles)) {
    const g = got.styles[name]; if (!g) { out.push(`${name}: missing`); continue; }
    const fluid = FLUID[name] && (ref.vw !== got.vw || ref.vh !== got.vh);
    for (const k of ['className', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'fontStyle', 'fontVariantNumeric']) {
      if (fluid && (k === 'fontSize' || k === 'lineHeight')) continue;
      if (s[k] !== g[k]) out.push(`${name}.${k}: ${s[k]} ≠ ${g[k]}`);
    }
    if (fluid) { const want = FLUID[name](got.vw, got.vh); if (Math.abs(parseFloat(g.fontSize) - want) > 0.05) out.push(`${name}.fontSize: ${g.fontSize} ≠ its formula at ${got.vw}×${got.vh} (${want.toFixed(2)}px)`); }
    else if (Math.abs(s.height - g.height) > 0.5) out.push(`${name}.height: ${s.height} ≠ ${g.height}`);
  }
  if (Object.keys(got.styles).length !== Object.keys(ref.styles).length) out.push(`style count ${Object.keys(ref.styles).length} ≠ ${Object.keys(got.styles).length}`);
  for (const k of Object.keys(ref.colors)) if (ref.colors[k] !== got.colors[k]) out.push(`colors.${k}: ${ref.colors[k]} ≠ ${got.colors[k]}`);
  if (ref.mode !== got.mode) out.push(`mode: ${ref.mode} ≠ ${got.mode}`);
  if (ref.fonts.join('|') !== got.fonts.join('|')) out.push(`fonts loaded: ${ref.fonts.join(', ')} ≠ ${got.fonts.join(', ')}`);
  return out;
}
