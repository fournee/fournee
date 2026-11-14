// The Fournée catalog in a real browser (Chromium): every page has the one Fournée bar (five links, the current page
// marked), light/dark switches and is remembered across pages, the bar stays at the top when scrolled, the Frosting
// section's own row sits under it, the four steps work, nothing errors or 404s, nothing scrolls sideways on a phone.
// Usage: node catalog/build.mjs && node catalog/test.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, 'site');
const pw = createRequire(join(here, '..', 'fontdant', 'package.json'))('playwright');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); const d = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } };
const PAGES = [['', 'Home'], ['frosting/', 'Frosting'], ['fontdant.html', 'Fontdant'], ['spec.html', 'Spec'], ['steps.html', 'The four steps']];

const b = await pw.chromium.launch();
for (const [w, h, tag] of [[1280, 900, 'desk'], [390, 844, 'phone']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' });
  for (const [path, name] of PAGES) {
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.goto(base + path, { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
    const bars = await p.$$eval('.mise-nav', (x) => x.length);
    ok(bars === 1, `${tag} ${name}: one Fournée bar (${bars})`);
    ok(await p.$$eval('.mise-nav__links a', (a) => a.length) === 5, `${tag} ${name}: five links`);
    ok((await p.textContent('.mise-nav__links a[aria-current="page"]')) === name, `${tag} ${name}: marked as the current page`);
    ok(!(await p.$('header.top')), `${tag} ${name}: no old page header`);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(over <= 0, `${tag} ${name}: fits (${over}px over)`);
    await p.mouse.wheel(0, 1500); await p.waitForTimeout(250);
    ok(Math.abs(await p.$eval('.mise-nav', (n) => n.getBoundingClientRect().top)) < 1, `${tag} ${name}: the bar stays at the top`);
    if (path === 'frosting/') {
      const r = await p.evaluate(() => { const n = document.querySelector('.mise-nav').getBoundingClientRect(), s = document.querySelector('header:not(.mise-nav)').getBoundingClientRect(); return [n.bottom, s.top]; });
      ok(Math.abs(r[0] - r[1]) < 2, `${tag} Frosting: its section row sits under the bar (${r})`);
      ok(!(await p.$('#mode')), `${tag} Frosting: its own light/dark button is gone`);
    }
    ok(!errs.length, `${tag} ${name}: no errors or missing files: ${errs.slice(0, 3)}`);
    await p.close();
  }
  // font library: four tabs, every family in exactly one, no sideways scroll, nothing under 12px, light and dark
  for (const scheme of ['light', 'dark']) {
    const lp = await ctx.newPage(); await lp.emulateMedia({ colorScheme: scheme });
    await lp.goto(base + 'fontdant.html', { waitUntil: 'networkidle' });
    const lib = JSON.parse(await readFile(join(here, '..', 'fontdant', 'fonts', 'library.json'), 'utf8'));
    const tabs = await lp.$$eval('#lib-tabs [role="tab"]', (t) => t.map((x) => x.textContent.replace(/ \(\d+\)/, '')));
    ok(JSON.stringify(tabs) === JSON.stringify(['Sans', 'Serif', 'Decorative', 'Mono']), `${tag} ${scheme} library: four tabs (${tabs})`);
    ok(await lp.$eval('#lib-tabs', (e) => e.getAttribute('role')) === 'tablist', `${tag} ${scheme} library: ARIA tablist`);
    const counts = {};
    for (const t of ['sans', 'serif', 'decorative', 'mono']) {
      await lp.click(`#tab-${t}`);
      ok(await lp.getAttribute(`#tab-${t}`, 'aria-selected') === 'true' && await lp.isVisible(`#panel-${t}`), `${tag} ${scheme} library: ${t} tab opens its panel`);
      for (const id of await lp.$$eval(`#panel-${t} .lib-card`, (c) => c.map((x) => x.dataset.family))) counts[id] = (counts[id] || 0) + 1;
      ok((await lp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${tag} ${scheme} library: ${t} fits width`);
      const small = await lp.$$eval(`#panel-${t} *, #lib-tabs *`, (els) => els.filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.tagName));
      ok(!small.length, `${tag} ${scheme} library: ${t} nothing under 12px (${small.slice(0, 3)})`);
    }
    const ids = Object.keys(lib.fonts);
    ok(ids.every((id) => counts[id] === 1) && Object.keys(counts).length === ids.length, `${tag} ${scheme} library: every family in exactly one tab (${ids.length} families)`);
    await lp.close();
  }
  // light/dark: switch on one page, it holds on the next; the Frosting catalog follows
  const p = await ctx.newPage();
  await p.goto(base + 'spec.html'); await p.waitForTimeout(200);
  ok(await p.getAttribute('html', 'data-theme') === 'light', `${tag}: starts in the system's light`);
  await p.click('.mise-nav__theme');
  ok(await p.getAttribute('html', 'data-theme') === 'dark' && /Dark/.test(await p.textContent('.mise-nav__theme')), `${tag}: switch goes dark`);
  const bgDark = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.goto(base + 'frosting/'); await p.waitForTimeout(400);
  ok(await p.getAttribute('html', 'data-theme') === 'dark', `${tag}: dark is remembered on the Frosting page`);
  await p.click('.mise-nav__theme'); await p.waitForTimeout(300);
  ok(await p.getAttribute('html', 'data-theme') === 'light', `${tag}: and switches back there`);
  await p.goto(base + 'steps.html'); await p.waitForTimeout(800);
  ok(await p.$$eval('.mise-shell__tab', (t) => t.length) === 4, `${tag}: the four steps still mount`);
  await p.click('.mise-nav__theme');
  ok(bgDark !== 'rgb(255, 255, 255)', `${tag}: dark actually changes the page (${bgDark})`);
  await ctx.close();
}
await b.close(); server.close();
console.log((fails ? 'FAIL' : 'PASS') + ': the Fournée catalog: one bar on every page, light/dark everywhere, sticky, phone width');
if (fails) process.exit(1);
