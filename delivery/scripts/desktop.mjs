// The desktop export for Qt and tkinter (build phase 6): a recipe → mise-desktop.json + one static TTF per face and
// weight the look uses. Python toolkits have no CSS, so the work CSS does in the browser is done here:
//   · each role's face, size in px, weight, leading, tracking, case (resolved by fontdant, the same as the web)
//   · fit: CSS scales a face with size-adjust; a toolkit can't, so pixelSize = size × the face's fit factor, which
//     gives the same cap height as the web (lineHeightPx keeps the unscaled size × leading, as CSS does)
//   · fonts: woff2 unpacked (wawoff2), variable fonts pinned at each weight and renamed to a family of their own
//     (fontTools, delivery/python/_ttf_instance.py), so Qt and tkinter get that exact weight with no synthesis
//   · colours: frosting's, with the Plain greys when Sprinkles is off
// Honest scope (proposal §7): face, size, weight (plus colours); no tracking or line-height control in tkinter.
//
//   node delivery/scripts/desktop.mjs <recipe.json> <out dir> [--python python] [--fonts <fontdant/fonts>]
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const mise = join(here, '..', '..');
const require = createRequire(import.meta.url);

export async function exportDesktop(recipe, outDir, opts = {}) {
  const M = require('../dist/mise.js');
  const F = globalThis.FontdantFonts, C = globalThis.FontdantCheck, S = globalThis.KitchenSprinkles;
  const fontsDir = opts.fontsDir || join(mise, 'fontdant', 'fonts');
  const r = M.clean(recipe), R = C.resolve(r.fontdant);
  mkdirSync(join(outDir, 'fonts'), { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'mise-desktop-'));
  const jobs = new Map(), roles = {};
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  try {
    for (const s of R.styles) {
      const e = F.entryOf(s.faceId); if (!e) throw new Error(`${s.name}: face ${s.faceId} not found`);
      if (!e.files || !e.files.length) throw new Error(`${e.id}: no font files (an Adobe Fonts kit can't be exported for desktop)`);
      const k = F.fitFactor(e, s.face), italic = !!s.italic;
      const pick = (style) => e.files.filter((f) => (f.style || 'normal') === style);
      let files = pick(italic ? 'italic' : 'normal'); if (!files.length) files = pick('normal');
      const variable = e.weights.kind === 'variable';
      const src = variable ? files[0] : files.reduce((a, f) => (Math.abs(Number(f.weight) - s.weight) < Math.abs(Number(a.weight) - s.weight) ? f : a));
      const weight = variable ? s.weight : Number(src.weight);
      const family = `${e.family} Fournee ${weight}${italic ? ' Italic' : ''}`, file = `fonts/${slug(family)}.ttf`;
      if (!jobs.has(file)) jobs.set(file, { src, entry: e, weight, italic, family, file });
      const lead = typeof s.leading === 'number' ? s.leading : parseFloat(s.leading);
      roles[s.name] = { family, file, slot: s.face, faceId: e.id, sizePx: s.sizePx, fit: Math.round(k * 10000) / 10000, pixelSize: Math.round(s.sizePx * k * 100) / 100,
        weight, leading: lead, lineHeightPx: Math.round(s.sizePx * lead * 100) / 100, letterSpacingEm: isNaN(s.trackingEm) ? 0 : s.trackingEm, case: s.case, italic, tnum: s.tnum,
        capHeightPx: Math.round(s.sizePx * k * e.metrics.ratios.cap * 100) / 100 };
    }
    // unpack each source once
    const wawoff2 = require('wawoff2'), unpacked = new Map(), pyJobs = [];
    for (const j of jobs.values()) {
      const key = j.entry.id + '/' + (j.src.file || j.src.src);
      if (!unpacked.has(key)) {
        let buf;
        if (j.src.src && /^data:/.test(j.src.src)) buf = Buffer.from(j.src.src.split(',')[1], 'base64');
        else if (j.src.src && /^(https?:)?\/\//.test(j.src.src)) throw new Error(`${j.entry.id}: remote font files aren't fetched for the desktop export; save them locally first`);
        else buf = readFileSync(join(fontsDir, j.entry.id, j.src.file));
        if (/\.woff2$/i.test(j.src.file || '') || (buf[0] === 0x77 && buf[1] === 0x4f && buf[2] === 0x46 && buf[3] === 0x32)) buf = Buffer.from(await wawoff2.decompress(buf));
        const p = join(work, slug(key) + '.ttf'); writeFileSync(p, buf); unpacked.set(key, p);
      }
      pyJobs.push({ in: unpacked.get(key), out: resolve(outDir, j.file), wght: j.weight, family: j.family, italic: j.italic });
    }
    writeFileSync(join(work, 'jobs.json'), JSON.stringify(pyJobs));
    execFileSync(opts.python || process.env.MISE_PYTHON || 'python', [join(mise, 'delivery', 'python', '_ttf_instance.py'), join(work, 'jobs.json')], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  } finally { rmSync(work, { recursive: true, force: true }); }
  const out = {
    format: 'mise-desktop/1', name: r.name, client: r.client, scheme: r.scheme, mode: R.mode, sprinkles: r.sprinkles,
    colors: S.effective(r), roles, fonts: [...jobs.values()].map((j) => ({ file: j.file, family: j.family, weight: j.weight, italic: j.italic, source: `${j.entry.id}/${j.src.file || 'inline'}`, licence: j.entry.licence ? j.entry.licence.id || j.entry.licence.spdx || null : null })),
    about: 'Generated by fournee/delivery/scripts/desktop.mjs. pixelSize is the fitted size (same cap height as the web); lineHeightPx is the CSS size × leading. Load with delivery/python/mise_desktop.py.',
  };
  writeFileSync(join(outDir, 'mise-desktop.json'), JSON.stringify(out, null, 2));
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [recipePath, outDir] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').startsWith('--'));
  if (!recipePath || !outDir) { console.error('usage: node delivery/scripts/desktop.mjs <recipe.json> <out dir> [--python python]'); process.exit(2); }
  const flag = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!existsSync(recipePath)) { console.error('no recipe at ' + recipePath); process.exit(2); }
  const out = await exportDesktop(JSON.parse(readFileSync(recipePath, 'utf8')), outDir, { python: flag('--python'), fontsDir: flag('--fonts') });
  console.log(`mise-desktop.json: ${Object.keys(out.roles).length} styles, ${out.fonts.length} font files → ${outDir}`);
}
