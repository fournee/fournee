// Phase 6, DTCG (F3): a recipe exports as W3C Design Tokens 2025.10, and the file validates in Style Dictionary 5:
// it builds CSS and JS with warnings treated as errors, every reference resolves, and the values come out right.
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportDtcg } from '../scripts/dtcg.mjs';
import { MiseApply, RECIPE } from './server.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out', 'dtcg');
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };

/* 1 ── the 2025.10 shapes, checked by hand */
function validate(doc) {
  const errs = [], tokens = {};
  const walk = (node, path, inherited) => {
    const type = node.$type || inherited;
    if ('$value' in node) { tokens[path.join('.')] = { type, value: node.$value }; return; }
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      if (/[{}.]/.test(k)) errs.push(`bad name ${path.concat(k).join('.')}`);
      if (v && typeof v === 'object') walk(v, path.concat(k), type); else errs.push(`${path.concat(k).join('.')}: not a token or group`);
    }
  };
  walk(doc, [], null);
  const isRef = (v) => typeof v === 'string' && /^\{[^{}]+\}$/.test(v);
  const refOk = (v, want) => { const t = tokens[v.slice(1, -1)]; if (!t) return `unresolved ${v}`; if (want && t.type !== want) return `${v} is ${t.type}, not ${want}`; return null; };
  const dim = (v) => v && typeof v === 'object' && typeof v.value === 'number' && (v.unit === 'px' || v.unit === 'rem');
  for (const [p, { type, value }] of Object.entries(tokens)) {
    if (!type) { errs.push(`${p}: no $type`); continue; }
    if (isRef(value)) { const e = refOk(value, type); if (e) errs.push(`${p}: ${e}`); continue; }
    if (type === 'color') { if (!(value.colorSpace === 'srgb' && value.components.length === 3 && value.components.every((c) => c >= 0 && c <= 1) && /^#[0-9a-f]{6}$/.test(value.hex))) errs.push(`${p}: bad color`); }
    else if (type === 'dimension') { if (!dim(value)) errs.push(`${p}: bad dimension`); }
    else if (type === 'fontFamily') { if (!(typeof value === 'string' || (Array.isArray(value) && value.length && value.every((s) => typeof s === 'string')))) errs.push(`${p}: bad fontFamily`); }
    else if (type === 'fontWeight') { if (!(typeof value === 'number' && value >= 1 && value <= 1000)) errs.push(`${p}: bad fontWeight`); }
    else if (type === 'typography') {
      for (const f of ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight']) if (!(f in value)) errs.push(`${p}: missing ${f}`);
      const want = { fontFamily: 'fontFamily', fontSize: 'dimension', fontWeight: 'fontWeight', letterSpacing: 'dimension' };
      for (const [f, t] of Object.entries(want)) { const v = value[f]; if (isRef(v)) { const e = refOk(v, t); if (e) errs.push(`${p}.${f}: ${e}`); } else if (t === 'dimension' ? !dim(v) : t === 'fontWeight' ? typeof v !== 'number' : !(Array.isArray(v) || typeof v === 'string')) errs.push(`${p}.${f}: bad ${t}`); }
      if (typeof value.lineHeight !== 'number') errs.push(`${p}.lineHeight: not a number`);
    } else if (type === 'gradient') {
      if (!Array.isArray(value) || value.length < 2) { errs.push(`${p}: bad gradient`); continue; }
      value.forEach((s, i) => {
        if (!(typeof s.position === 'number' && s.position >= 0 && s.position <= 1)) errs.push(`${p}[${i}]: bad position`);
        if (isRef(s.color)) { const e = refOk(s.color, 'color'); if (e) errs.push(`${p}[${i}]: ${e}`); }
        else if (!(s.color && s.color.colorSpace === 'srgb' && /^#[0-9a-f]{6}$/.test(s.color.hex))) errs.push(`${p}[${i}]: bad color`);
      });
    } else errs.push(`${p}: unknown type ${type}`);
  }
  return { errs, count: Object.keys(tokens).length };
}

const doc = exportDtcg(RECIPE);
const file = join(out, 'recipe.tokens.json');
writeFileSync(file, JSON.stringify(doc, null, 2));
const v = validate(doc);
expect(!v.errs.length, 'the export follows the 2025.10 shapes (types, colour objects, dimensions, composites, references)', v.errs.slice(0, 8));
const styles = globalThis.FontdantCheck.resolve(MiseApply.clean(RECIPE).fontdant).styles;
expect(Object.keys(doc.typography).filter((k) => !k.startsWith('$')).length === styles.length, 'one typography token per emitted style', styles.length);
expect(doc.color.muted.$value.hex === globalThis.KitchenSprinkles.effective(MiseApply.clean(RECIPE)).muted.toLowerCase() && doc.color.muted.$extensions['io.github.fournee'].designed.hex === '#9aa0aa', 'colours are what visitors see (Plain grey), the designed grey kept in $extensions');

/* 1b ── gradient fills export as 2025.10 `gradient` tokens (role stops as aliases; angle/kind/space in $extensions).
   Not fed to Style Dictionary: core has no gradient transform (research A, Nov 2026). */
{
  const withFills = JSON.parse(JSON.stringify(RECIPE));
  withFills.frosting.fills = { surface: { stops: ['role:surface', '#8fd0e1', 'role:accent'], angle: 135, space: 'oklab' } };
  const g = exportDtcg(withFills), gv = validate(g), t = g.gradient && g.gradient['surface-fill'];
  expect(!gv.errs.length, 'a look with fills still follows the 2025.10 shapes', gv.errs.slice(0, 8));
  expect(t && t.$value.length === 3 && t.$value[0].color === '{color.surface}' && t.$value[1].position === 0.5 && t.$extensions['io.github.fournee'].angle === 135, 'surface-fill: stops, positions, alias, angle', JSON.stringify(t));
}

/* 2 ── Style Dictionary 5 */
const { default: StyleDictionary } = await import('style-dictionary');
const sd = new StyleDictionary({
  source: [file],
  log: { warnings: 'error', verbosity: 'verbose' },
  platforms: {
    // expand: each typography field becomes its own variable (the CSS font shorthand has no slot for letter-spacing)
    css: { transformGroup: 'css', expand: { include: ['typography'] }, buildPath: out + '/', files: [{ destination: 'tokens.css', format: 'css/variables' }] },
    js: { transformGroup: 'js', buildPath: out + '/', files: [{ destination: 'tokens.js', format: 'javascript/es6' }] },
  },
});
let sdError = null;
try { await sd.buildAllPlatforms(); } catch (e) { sdError = e.message; }
expect(!sdError, 'Style Dictionary builds CSS and JS with warnings as errors', sdError && sdError.slice(0, 600));
if (!sdError) {
  const css = readFileSync(join(out, 'tokens.css'), 'utf8'), js = readFileSync(join(out, 'tokens.js'), 'utf8');
  expect(/--color-muted: #a6acb4;/i.test(css), 'SD css: the Plain muted colour', (css.match(/--color-muted:[^;]*/) || [])[0]);
  expect(/--font-family-display: Fraunces, system-ui, sans-serif;/.test(css) || /--font-family-display: "?Fraunces"?, system-ui, sans-serif;/.test(css), 'SD css: the display family stack', (css.match(/--font-family-display:[^;]*/) || [])[0]);
  const hxl = (css.match(/--typography-heading-xl-[a-z-]+:[^;]*;/g) || []).join(' ');
  expect(/font-weight: 650;/.test(hxl) && /font-size: 1\.75rem;/.test(hxl) && /font-family: Fraunces/.test(hxl) && /line-height: 1\.2;/.test(hxl) && /letter-spacing: -0\.0175rem;/.test(hxl),
    'SD css: heading-xl resolves every field (650, 1.75rem, -0.0175rem, 1.2, Fraunces)', hxl);
  expect(!/\[object Object\]|undefined|\{font\./.test(css + js), 'SD output has no unresolved references or object leaks');
  console.log(`DTCG: ${v.count} tokens, 2025.10 shapes ok; Style Dictionary 5 → ${css.split('\n').filter((l) => /^\s+--/.test(l)).length} CSS variables, e.g. ${hxl.trim()}`);
}
console.log(fails ? `FAIL: ${fails} DTCG failures` : 'PASS: DTCG 2025.10 export validates in Style Dictionary');
if (fails) process.exitCode = 1;
