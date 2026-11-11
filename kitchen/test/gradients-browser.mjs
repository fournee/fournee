// The Frosting panel's gradients, standards dial and card scope, in Chromium and Firefox:
//  - Gradient on surface → --fr-surface-fill lands on the target in oklab; an angle chip, Flip and More work; the swatch
//    shows the fill's worst ratio
//  - the page paints it; forced colours and print switch it off (frosting.css), leaving the solid role
//  - the dial: United Nations raises quiet text to 7:1, so Frosting's light defaults read "Hard to read under United Nations"
//  - card scope: mounted on a card over a page look, only changed roles land on the card, ↺ Page puts one back,
//    overrides() lists only the differences
//  - NASA Horizon and CERN are in the gallery and pass
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const pw = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="/frosting/dist/frosting.css"><link rel="stylesheet" href="/frosting/src/panel.css">
<style>body{margin:0;background:var(--fr-bg);color:var(--fr-text)} .paint{background-color:var(--fr-surface);background-image:var(--fr-surface-fill,none);height:40px}
.card{width:300px;padding:8px;margin:8px;background-color:var(--fr-surface);background-image:var(--fr-surface-fill,none)}</style>
${['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js', 'frosting/src/gallery.js', 'frosting/dist/store.js', 'kitchen/src/standards.js', 'frosting/src/panel.js'].map((f) => `<script src="/${f}"></script>`).join('')}
</head><body><div class="paint" id="paint"></div><div class="card" id="card">card</div><div id="host"></div><div id="cardhost"></div>
<script>window.p = FrostingPanel.mount(document.getElementById('host'), {});</script></body></html>`;
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); return; }
  try { const d = await readFile(join(root, decodeURIComponent(u.pathname))); res.writeHead(200, { 'content-type': types[extname(u.pathname)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };

for (const name of ['chromium', 'firefox']) {
  const browser = await pw[name].launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base); await page.evaluate(() => window.p.ready);
  const fill = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--fr-surface-fill'));

  await page.click('[data-gtoggle="surface"]');
  expect(/linear-gradient\(135deg in oklab, #F5F3EF, #/.test(await fill()), name, 'gradient on surface', await fill());
  await page.click('[data-angle="surface:90"]');
  expect((await fill()).startsWith('linear-gradient(90deg'), name, 'angle chip', await fill());
  const before = await fill(); await page.click('[data-flip="surface"]');
  expect((await fill()) !== before && /, #F5F3EF\)$/.test(await fill()), name, 'flip', await fill());
  await page.click('[data-gmore="surface"]');
  await page.click('[data-addstop="surface"]');
  expect(((await fill()).match(/#/g) || []).length === 3, name, 'middle stop', await fill());
  expect(/worst \d/.test(await page.textContent('[data-grad="surface"]')), name, 'worst ratio shown');
  const painted = await page.evaluate(() => getComputedStyle(document.getElementById('paint')).backgroundImage);
  expect(/gradient/.test(painted), name, 'the page paints the fill', painted);
  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await page.evaluate(() => getComputedStyle(document.getElementById('paint')).backgroundImage);
  expect(forced === 'none', name, 'forced colours: fill off', forced);
  await page.emulateMedia({ forcedColors: 'none', media: 'print' });
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('paint')).backgroundImage) === 'none', name, 'print: fill off');
  await page.emulateMedia({ media: 'screen' });
  await page.click('[data-gtoggle="surface"]');
  expect((await fill()) === '', name, 'gradient off removes the fill');

  await page.selectOption('[data-standard]', 'un');
  const b = await page.textContent('[data-badge]');
  expect(/Hard to read under United Nations/.test(b) && /needs 7/.test(b), name, 'UN dial', b);
  expect(await page.evaluate(() => window.p.draft().standard) === 'un', name, 'dial kept in the look');
  // Fit to a standard: judge → fit → before/after → undo; switching standards re-fits from the original
  const mutedBefore = await page.evaluate(() => window.p.draft().muted);
  expect(/Judging by United Nations · \d+ problem/.test(await page.textContent('[data-fit]')), name, 'fit strip judges', await page.textContent('[data-fit]'));
  await page.click('[data-fitrun]');
  const fitted = await page.evaluate(() => window.p.draft().muted);
  expect(fitted !== mutedBefore && /Fitted to United Nations/.test(await page.textContent('[data-fit]')), name, 'fit moves quiet text', mutedBefore, fitted);
  expect((await page.evaluate(() => document.documentElement.style.getPropertyValue('--fr-muted'))) === fitted, name, 'the fit shows on the page');
  await page.click('[data-fitshow="before"]');
  expect((await page.evaluate(() => window.p.draft().muted)) === mutedBefore, name, 'Before shows the original');
  await page.click('[data-fitshow="after"]');
  await page.selectOption('[data-standard]', 'wcag22-aaa');
  expect(/Fitted to WCAG 2.2 AAA/.test(await page.textContent('[data-fit]')) && (await page.evaluate(() => window.p.draft().standard)) === 'wcag22-aaa', name, 'switching re-fits from the original');
  await page.click('[data-fitundo]');
  expect((await page.evaluate(() => window.p.draft().muted)) === mutedBefore && !/Fitted/.test(await page.textContent('[data-fit]')), name, 'Undo restores');
  await page.selectOption('[data-standard]', '');

  const names = await page.$$eval('.fr-pal__card b', (bs) => bs.map((x) => x.textContent));
  expect(names.includes('NASA Horizon') && names.includes('CERN'), name, 'brand looks in the gallery', names.slice(-3));
  await page.click(`[data-pick="${names.indexOf('CERN')}"]`);
  expect(/Readable ✓/.test(await page.textContent('[data-badge]')), name, 'CERN look passes');

  // card scope over the page look
  await page.evaluate(() => {
    const pageLook = window.p.draft();
    window.c = FrostingPanel.mount(document.getElementById('cardhost'), { target: document.getElementById('card'), base: pageLook, scope: 'This card' });
  });
  await page.evaluate(() => window.c.ready);
  const cardHost = '#cardhost ';
  expect(!(await page.$(cardHost + '[data-backto]')), name, 'a fresh card follows the page');
  await page.evaluate(() => { const i = document.querySelector('#cardhost [data-hex="surface"]'); i.value = '#FFE0E0'; i.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.evaluate(() => document.querySelector('#cardhost [data-k="surface"]').dispatchEvent(new Event('change', { bubbles: true })));
  await page.click(cardHost + '[data-gtoggle="accent"]');
  const ov = await page.evaluate(() => window.c.overrides());
  expect(ov.surface === '#FFE0E0' && ov.fills && ov.fills.accent && Object.keys(ov).length === 2, name, 'overrides: only what differs', JSON.stringify(ov));
  expect(await page.evaluate(() => document.getElementById('card').style.getPropertyValue('--fr-surface')) === '#FFE0E0', name, 'the card wears it');
  await page.click(cardHost + '[data-backto="surface"]');
  expect(!('surface' in (await page.evaluate(() => window.c.overrides()))), name, '↺ Page puts surface back');
  expect(!errors.length, name, 'page errors', errors);
  await browser.close();
}
server.close();
console.log(fails ? `FAIL: ${fails} failures` : 'PASS: panel gradients (toggle, angle, flip, middle stop, worst ratio), forced colours + print fall back to solid, standards dial, fit to a standard (fit, before/after, re-fit on switch, undo), NASA/CERN looks, card scope (Chromium, Firefox)');
if (fails) process.exitCode = 1;
