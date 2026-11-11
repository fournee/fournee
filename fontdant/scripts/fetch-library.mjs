// Downloads the font library's files and licences.
//   node scripts/fetch-library.mjs [--only=inter,geist] [--force]
// For each family in fonts/library-source.json:
//   1. asks fonts.google.com/metadata/fonts for its axes and static styles,
//   2. asks the css2 API (with a modern Chrome UA, so it answers with woff2) for the latin subset:
//      one variable file covering the full wght range (plus opsz/wdth when the family has them), or
//      one static file per needed weight (400, 500, 600, 700, 800 where available),
//   3. saves the files under fonts/<id>/ and the licence text from github.com/google/fonts,
//   4. writes fonts/<id>/source.json (what was fetched, from where, when).
// Idempotent: a family whose source.json exists is skipped unless --force.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(join(root, 'fonts', 'library-source.json'), 'utf8'));
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const force = process.argv.includes('--force');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const WANT_WEIGHTS = [400, 500, 600, 700, 800];

const metaRaw = await (await fetch('https://fonts.google.com/metadata/fonts')).text();
const meta = JSON.parse(metaRaw.slice(metaRaw.indexOf('{')));
const byFamily = Object.fromEntries(meta.familyMetadataList.map((f) => [f.family, f]));

const slug = (family) => family.toLowerCase().replace(/[^a-z0-9]/g, '');
async function licenceFor(family) {
  const s = slug(family);
  for (const [dir, id] of [['ofl', 'OFL-1.1'], ['apache', 'Apache-2.0'], ['ufl', 'UFL-1.0']]) {
    const base = `https://raw.githubusercontent.com/google/fonts/main/${dir}/${s}/`;
    const md = await fetch(base + 'METADATA.pb');
    if (!md.ok) continue;
    const pb = await md.text();
    const licName = dir === 'ofl' ? 'OFL.txt' : dir === 'apache' ? 'LICENSE.txt' : 'UFL.txt';
    const lic = await fetch(base + licName);
    const text = lic.ok ? await lic.text() : '';
    const rfn = /Reserved Font Name/i.test(text);
    const designer = (/designer:\s*"([^"]+)"/.exec(pb) || [])[1] || null;
    return { id, dir, designer, reservedFontName: rfn, text, source: base };
  }
  return { id: 'unknown', dir: null, designer: null, reservedFontName: null, text: '', source: null };
}

// The css2 request for a family's upright (italic = false) or italic (italic = true) faces, or null when
// the family has no italics. css2 wants axis tags in alphabetical order, and `ital` is an axis like any other.
function css2Url(family, fm, italic) {
  const axes = Object.fromEntries((fm.axes || []).map((a) => [a.tag, a]));
  const fam = family.replace(/ /g, '+');
  const have = Object.keys(fm.fonts).filter((k) => italic ? /^\d+i$/.test(k) : /^\d+$/.test(k)).map((k) => parseInt(k, 10));
  if (!have.length) return null;
  if (axes.wght) {
    const tags = ['opsz', 'wdth', 'wght'].filter((t) => axes[t]);
    const ranges = tags.map((t) => `${axes[t].min}..${axes[t].max}`);
    const url = italic
      ? `https://fonts.googleapis.com/css2?family=${fam}:ital,${tags.join(',')}@1,${ranges.join(',')}&display=swap`
      : `https://fonts.googleapis.com/css2?family=${fam}:${tags.join(',')}@${ranges.join(',')}&display=swap`;
    return { url, variable: true, tags, italic };
  }
  const weights = WANT_WEIGHTS.filter((w) => have.includes(w));
  if (!weights.length) weights.push(have[0]);
  const url = italic
    ? `https://fonts.googleapis.com/css2?family=${fam}:ital,wght@${weights.map((w) => `1,${w}`).join(';')}&display=swap`
    : `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(';')}&display=swap`;
  return { url, variable: false, weights, italic };
}

// Parse the css2 answer into [{subset, weight, url, unicodeRange}] and keep the latin blocks.
function latinFaces(css) {
  const out = [];
  const re = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
  let m;
  while ((m = re.exec(css))) {
    const block = m[2];
    const url = (/url\(([^)]+\.woff2)\)/.exec(block) || [])[1];
    const weight = (/font-weight:\s*([^;]+);/.exec(block) || [])[1]?.trim();
    const range = (/unicode-range:\s*([^;]+);/.exec(block) || [])[1]?.trim();
    if (m[1] === 'latin' && url) out.push({ subset: m[1], weight, url, unicodeRange: range });
  }
  return out;
}

async function fetchFaces(fam, q, dir) {
  const css = await (await fetch(q.url, { headers: { 'User-Agent': UA } })).text();
  const faces = latinFaces(css);
  if (!faces.length) { console.error(`!! ${fam.family}: no latin woff2 in css2 answer\n${css.slice(0, 300)}`); return []; }
  const files = [];
  for (const f of faces) {
    const suffix = q.italic ? '-italic' : '';
    const name = q.variable ? `${fam.id}-latin-wght${suffix}.woff2` : `${fam.id}-latin-${f.weight.replace(/\s+/g, '-')}${suffix}.woff2`;
    const buf = Buffer.from(await (await fetch(f.url)).arrayBuffer());
    writeFileSync(join(dir, name), buf);
    files.push({ file: name, weight: f.weight, style: q.italic ? 'italic' : 'normal', unicodeRange: f.unicodeRange, from: f.url, bytes: buf.length });
  }
  return files;
}

let done = 0, skipped = 0, italicsAdded = 0;
for (const fam of src.families) {
  if (only.length && !only.includes(fam.id)) continue;
  const dir = join(root, 'fonts', fam.id);
  const fm = byFamily[fam.family];
  if (!fm) { console.error(`!! ${fam.family}: not on Google Fonts`); continue; }
  const sjPath = join(dir, 'source.json');
  if (!force && existsSync(sjPath)) {
    // already fetched: top up with italics if the family has them and we have none yet
    const sj = JSON.parse(readFileSync(sjPath, 'utf8'));
    const qi = css2Url(fam.family, fm, true);
    if (qi && !sj.files.some((f) => f.style === 'italic')) {
      const it = await fetchFaces(fam, qi, dir);
      sj.files = sj.files.map((f) => ({ style: 'normal', ...f })).concat(it);
      sj.css2Italic = qi.url; sj.italicsFetched = new Date().toISOString();
      writeFileSync(sjPath, JSON.stringify(sj, null, 2));
      italicsAdded++;
      console.log(`${fam.id}: +${it.length} italic file(s), ${it.reduce((a, f) => a + f.bytes, 0)} bytes`);
    } else skipped++;
    continue;
  }
  mkdirSync(dir, { recursive: true });
  const q = css2Url(fam.family, fm, false), qi = css2Url(fam.family, fm, true);
  const files = await fetchFaces(fam, q, dir);
  if (!files.length) continue;
  if (qi) files.push(...await fetchFaces(fam, qi, dir));
  const lic = await licenceFor(fam.family);
  if (lic.text) writeFileSync(join(dir, 'LICENSE.txt'), lic.text);
  writeFileSync(sjPath, JSON.stringify({
    id: fam.id, family: fam.family, category: fm.category, designers: fm.designers, variable: q.variable, axes: (fm.axes || []).map((a) => ({ tag: a.tag, min: a.min, max: a.max })),
    staticStyles: Object.keys(fm.fonts), files, licence: { id: lic.id, designer: lic.designer, reservedFontName: lic.reservedFontName, source: lic.source }, fetched: new Date().toISOString(), css2: q.url, css2Italic: qi ? qi.url : null,
  }, null, 2));
  done++;
  console.log(`${fam.id}: ${files.length} file(s), ${files.reduce((a, f) => a + f.bytes, 0)} bytes, ${lic.id}${lic.reservedFontName ? ' (RFN)' : ''}`);
}
console.log(`fetched ${done}, italics added to ${italicsAdded}, unchanged ${skipped}`);
