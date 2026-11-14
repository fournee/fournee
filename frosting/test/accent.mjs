// Numeric accent (v1.3.0, deliverable B): --fr-accent-h / -s / -l beside --fr-accent.
//  B1-B5: FrostingColor.accentParts and channelVars; B6-B7: what the build writes into dist/frosting.css
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sandbox = { console }; sandbox.window = sandbox; sandbox.globalThis = sandbox; vm.createContext(sandbox);
for (const f of ['dist/tokens.js', 'src/readability.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox);
const C = sandbox.FrostingColor, T = sandbox.FrostingTokens;
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// B1
expect(typeof C.accentParts === 'function' && typeof C.channelVars === 'function', 'B1: accentParts and channelVars exist');
if (typeof C.accentParts === 'function') {
  expect(same(C.accentParts('#2E7D4F'), { h: 145.1, s: 46.2, l: 33.5 }), 'B1 light default', C.accentParts('#2E7D4F'));
  expect(same(C.accentParts('#9D7BFF'), { h: 255.5, s: 100, l: 74.1 }), 'B1 dark default', C.accentParts('#9D7BFF'));
  // B2: a grey has no hue
  expect(same(C.accentParts('#808080'), { h: 0, s: 0, l: 50.2 }), 'B2 grey', C.accentParts('#808080'));
  expect(same(C.accentParts('#000000'), { h: 0, s: 0, l: 0 }) && same(C.accentParts('#FFFFFF'), { h: 0, s: 0, l: 100 }), 'B2 black and white');
  // B3: a hue that rounds to 360 is 0, never 360
  let top = 0, seen360 = 0;
  for (let b = 0; b < 256; b++) { const p = C.accentParts(C.rgbToHex([255, 0, b])); if (p.h >= 360) seen360++; if (p.h > top) top = p.h; }
  expect(seen360 === 0 && top < 360, 'B3: no hue reaches 360', top);
  expect(C.accentParts('#FF0001').h === 359.8 && C.accentParts('#FF0000').h === 0, 'B3: the top of the wheel stays below 360 (8-bit hex cannot round up to 360; % 360 is a guard)', C.accentParts('#FF0001'));
  // B4: round trip within 1 per channel
  let s = 12345, worst = 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 1000; i++) {
    const rgb = [0, 0, 0].map(() => Math.floor(rnd() * 256)), h0 = C.rgbToHex(rgb), back = C.hexToRgb(C.hex(C.accentParts(h0)));
    rgb.forEach((v, j) => { worst = Math.max(worst, Math.abs(v - back[j])); });
  }
  expect(worst <= 1, 'B4: round trip within 1 level per channel, worst ' + worst);
}
// B5
if (typeof C.channelVars === 'function') {
  expect(same(C.channelVars({ accent: '#2E7D4F' }, 'fr'), { '--fr-accent-h': '145.1', '--fr-accent-s': '46.2%', '--fr-accent-l': '33.5%' }), 'B5', C.channelVars({ accent: '#2E7D4F' }, 'fr'));
  expect(Object.keys(C.channelVars({ accent: '#2E7D4F' }, 'app')).every((k) => k.startsWith('--app-accent-')), 'B5: prefix');
  expect(same(C.channelVars({ accent: '#808080' }, 'fr'), { '--fr-accent-h': '0', '--fr-accent-s': '0%', '--fr-accent-l': '50.2%' }), 'B5/B10: grey');
  expect(same(C.channelVars({ accent: 'red' }, 'fr'), {}) && same(C.channelVars({}, 'fr'), {}) && same(C.channelVars(null, 'fr'), {}), 'B5: invalid accent gives {}');
  expect(Object.keys(C.channelVars({ accent: '#FF0000' })).join() === '--fr-accent-h,--fr-accent-s,--fr-accent-l', 'B5: default prefix fr');
}
// the stored defaults in tokens.json match the colour maths
const ch = T.channels;
expect(ch && ['accent-h', 'accent-s', 'accent-l'].every((k) => ch[k]), 'tokens.json channels has accent-h, -s, -l', ch && Object.keys(ch));
if (ch && typeof C.accentParts === 'function') {
  for (const mode of ['light', 'dark']) {
    const p = C.accentParts(T[mode].accent);
    expect(ch['accent-h'][mode] === String(p.h) && ch['accent-s'][mode] === String(p.s) && ch['accent-l'][mode] === String(p.l), `channels ${mode} defaults equal accentParts of the default accent`, p, ch);
  }
}

// B6: the default build
const css = readFileSync(join(root, 'dist', 'frosting.css'), 'utf8');
const rootBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'));
const darkMedia = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf(':root[data-theme="dark"]'));
const darkAttr = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('/* Gradient fills'));
const has = (block, p, h, s, l) => block.includes(`--${p}-accent-h: ${h};`) && block.includes(`--${p}-accent-s: ${s};`) && block.includes(`--${p}-accent-l: ${l};`);
expect(has(rootBlock, 'fr', '145.1', '46.2%', '33.5%'), 'B6: :root has the light accent channels');
expect(has(darkMedia, 'fr', '255.5', '100%', '74.1%'), 'B6: the prefers-color-scheme dark block has the dark channels');
expect(has(darkAttr, 'fr', '255.5', '100%', '74.1%'), 'B6: the [data-theme="dark"] block has the dark channels');

// B7: --prefix=app (built into a scratch folder; dist/ is not touched)
const out = mkdtempSync(join(tmpdir(), 'frosting-accent-'));
try {
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'build.mjs'), '--prefix=app', '--out=' + out], { encoding: 'utf8', windowsHide: true });
  expect(r.status === 0, 'B7: build with --prefix=app and --out runs', r.stderr);
  let app = ''; try { app = readFileSync(join(out, 'frosting.css'), 'utf8'); } catch { /* reported below */ }
  expect(has(app, 'app', '145.1', '46.2%', '33.5%') && !/--fr-accent-h/.test(app), 'B7: channels carry the prefix');
} finally { rmSync(out, { recursive: true, force: true }); }

console.log(fails ? `FAIL: ${fails} accent checks` : 'PASS: accent.mjs - numeric accent (B1-B7)');
process.exit(fails ? 1 : 0);
