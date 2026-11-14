// The new roles in the Frosting panel, in a real browser (v1.3.0, deliverable C), Chromium:
//  C23 the "Every role" grid lists the 13 roles, calculated ones captioned "calculated"; editing a base role updates the
//      calculated roles' CSS properties to complete() of the draft; editing a calculated swatch records an override that
//      survives a later accent change; "Use calculated" removes it
//  C20 wearing a ready-made look or a lucky roll clears the overrides, and so does Reset
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); const d = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// the expected values come from the colour maths, loaded here the way the page loads it
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js', 'frosting/src/gallery.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), sb);
const C = sb.FrostingColor, T = sb.FrostingTokens;
const CALC = T.roles.filter((r) => r.calc).map((r) => r.name);

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/kitchen/test/shell.html`);
  await page.waitForSelector('.fr-pal__card');
  const props = () => page.evaluate((names) => { const s = getComputedStyle(document.documentElement); const o = {}; names.forEach((n) => { o[n] = s.getPropertyValue('--fr-' + n).trim().toUpperCase(); }); return o; }, CALC);
  const draft = () => page.evaluate(() => JSON.parse(JSON.stringify(window.draft || null)));
  const wantFor = (d) => C.complete(d);
  const setHex = async (k, v) => { await page.fill(`[data-hex="${k}"]`, v); await page.dispatchEvent(`[data-hex="${k}"]`, 'change'); };

  // C23: the grid lists the 13, captioned
  for (const n of CALC) {
    const sw = await page.$(`.fr-sw:has([data-k="${n}"])`);
    expect(sw, `C23: a swatch for ${n}`);
    if (sw) expect(/calculated/i.test(await sw.textContent()), `C23: ${n} is captioned "calculated"`);
  }
  expect(!/calculated/i.test(await page.textContent('.fr-sw:has([data-k="accent"])')), 'C23: a base role has no "calculated" caption');

  // C23: editing a base role re-runs complete() and re-applies the calculated roles
  await setHex('accent-text', '#5A1F8C');
  await setHex('bad', '#A1123F');
  let d = await draft(), got = await props(), want = wantFor(d);
  expect(CALC.every((n) => got[n] === want[n]), 'C23: the calculated roles follow a base-role edit', CALC.filter((n) => got[n] !== want[n]).map((n) => `${n} ${got[n]} != ${want[n]}`));
  expect(got['accent-text-hover'] !== T.light['accent-text-hover'] && got['bad-text'] !== T.light['bad-text'], 'C23: they moved off the defaults');
  expect((await page.inputValue('[data-hex="accent-text-hover"]')).toUpperCase() === want['accent-text-hover'], 'C23: the calculated swatch shows the new value');

  // C23: editing a calculated swatch records an override that survives an accent change
  await setHex('border-strong', '#7A766F');
  d = await draft();
  expect(d.overrides && d.overrides['border-strong'] === '#7A766F', 'C23: the edit is recorded as an override', d.overrides);
  expect(await page.$('[data-usecalc="border-strong"]'), 'C23: an overridden role offers "Use calculated"');
  await setHex('accent', '#1D4ED8');
  await setHex('border', '#C9C3BA');
  got = await props(); d = await draft();
  expect(got['border-strong'] === '#7A766F' && d['border-strong'] === '#7A766F', 'C23: the override survives later edits', got['border-strong']);
  // C23: "Use calculated" removes it
  await page.click('[data-usecalc="border-strong"]');
  d = await draft(); got = await props();
  expect(!(d.overrides && d.overrides['border-strong']) && got['border-strong'] === wantFor(d)['border-strong'] && got['border-strong'] !== '#7A766F', 'C23: "Use calculated" puts the calculated value back', d.overrides, got['border-strong']);
  expect(/calculated/i.test(await page.textContent('.fr-sw:has([data-k="border-strong"])')) && !(await page.$('[data-usecalc="border-strong"]')), 'C23: the caption is back');

  // C20: a ready-made look, a lucky roll and Reset each clear the overrides
  for (const [label, act] of [['a ready-made look', () => page.click('[data-pick="3"]')], ['a lucky roll', () => page.click('[data-lucky]')], ['Reset', () => page.click('[data-reset]')]]) {
    await setHex('ok-soft', '#DDEEE4');
    d = await draft();
    expect(d.overrides && d.overrides['ok-soft'] === '#DDEEE4', `C20: override set before ${label}`);
    await act();
    d = await draft(); got = await props();
    expect(!d.overrides, `C20: ${label} clears the overrides`, d.overrides);
    expect(CALC.every((n) => got[n] === wantFor(d)[n]), `C20: after ${label} the calculated roles are complete() of the new look`);
  }
  expect(errors.length === 0, 'no page errors', errors);
} finally { await browser.close(); server.close(); }

console.log(fails ? `FAIL: ${fails} roles-browser checks` : 'PASS: roles-browser.mjs - the panel lists, recalculates and overrides the 13 calculated roles (C20, C23)');
process.exit(fails ? 1 : 0);
