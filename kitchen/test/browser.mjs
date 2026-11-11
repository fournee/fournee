// The panel shell in a real browser (Chromium), with frosting's own panel mounted in the Frosting tab:
//  - the tabs render; Frosting is selected and its panel mounted; Fontdant mounts its panel when shown
//  - the frosting panel works inside the shell: pick a preset (look applied to :root), save a draft, publish,
//    reload, and the published look comes back from the store (kitchen engine via frosting/dist/store.js)
//  - arrow keys move between tabs; the Frosting panel keeps its state when you come back
//  - no page errors
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); const d = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/kitchen/test/shell.html`;

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForSelector('.fr-pal__card');
  const tabs = await page.$$eval('[role="tab"]', (els) => els.map((e) => [e.firstChild.textContent, e.getAttribute('aria-selected')]));
  expect(JSON.stringify(tabs) === JSON.stringify([['Frosting', 'true'], ['Fontdant', 'false'], ['The pass', 'false']]), 'tabs', tabs);
  const cards = await page.$$eval('.fr-pal__card', (els) => els.length);
  expect(cards >= 26, 'frosting panel mounted with its presets', cards);

  // pick the third preset, save, publish
  await page.click('[data-pick="2"]');
  const picked = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fr-bg').trim().toUpperCase());
  const presetBg = await page.evaluate(() => FrostingGallery.presets()[2].colors.bg.toUpperCase());
  expect(picked === presetBg, 'preset applied to :root', picked, presetBg);
  await page.click('[data-save]');
  await page.click('[data-publish]');
  await page.waitForFunction(() => /Published/.test(document.querySelector('[data-flash]').textContent));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kitchen-test.theme')).bg.toUpperCase());
  expect(stored === presetBg, 'published look stored through the kitchen engine', stored);

  // tabs: arrow right to Fontdant, its panel mounts; back to Frosting, state kept
  await page.focus('[data-tab="frosting"]');
  await page.keyboard.press('ArrowRight');
  const onFd = await page.evaluate(() => [shell.active(), !document.querySelector('[data-body="fontdant"]').hidden, !!document.querySelector('[data-body="fontdant"] .fd-pal'), document.querySelector('[data-body="frosting"]').hidden]);
  expect(onFd[0] === 'fontdant' && onFd[1] && onFd[2] && onFd[3], 'ArrowRight shows the Fontdant tab with its panel', onFd);
  await page.keyboard.press('ArrowLeft');
  const back = await page.evaluate(() => [shell.active(), document.querySelector('.fr-pal__card[aria-pressed="true"]') && document.querySelector('.fr-pal__card[aria-pressed="true"]').getAttribute('data-pick')]);
  expect(back[0] === 'frosting' && back[1] === '2', 'back on Frosting, the picked preset is still selected (mounted once)', back);

  // reload: the published look comes back from the store
  await page.reload();
  await page.waitForSelector('.fr-pal__card');
  await page.waitForFunction((bg) => getComputedStyle(document.documentElement).getPropertyValue('--fr-bg').trim().toUpperCase() === bg, presetBg, { timeout: 5000 }).catch(() => {});
  const after = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fr-bg').trim().toUpperCase());
  expect(after === presetBg, 'after reload the store\'s draft is applied again', after);
  expect(errors.length === 0, 'no page errors', errors);
  console.log(`chromium: shell tabs ${tabs.map((t) => t[0]).join(' / ')}, ${cards} preset cards, preset → draft → publish → reload kept ${after}, keyboard tabs OK`);
} finally { await browser.close(); server.close(); }
console.log(fails ? `FAIL: ${fails} shell failures` : 'PASS: kitchen shell with the frosting panel (Chromium)');
if (fails) process.exitCode = 1;
