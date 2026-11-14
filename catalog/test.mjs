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
// The Faces picker on the real steps page (Fontdant step): one picker, four tabs in one row, several cards per row,
// beside nothing narrow, nothing under 12px, light and dark.
async function checkFaces(ctx, w, tag) {
  for (const scheme of ['light', 'dark']) {
    const p = await ctx.newPage(); await p.emulateMedia({ colorScheme: scheme });
    await p.goto(base + 'steps.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    await p.click('.mise-shell__tab[data-tab="fontdant"]');
    await p.waitForSelector('[data-body="fontdant"] [data-pick] [data-face]');
    const g = await p.evaluate(() => {
      const body = document.querySelector('[data-body="fontdant"]'), pick = body.querySelector('[data-pick]');
      const tabs = [...pick.querySelectorAll('[role="tab"]')], cards = [...pick.querySelectorAll('[role="tabpanel"] [data-face]')];
      const top0 = cards[0].getBoundingClientRect().top, pr = pick.getBoundingClientRect(), bw = body.getBoundingClientRect(), prev = body.querySelector('.fd-pal__preview').getBoundingClientRect();
      const small = [...pick.querySelectorAll('*')].filter((e) => e.offsetParent !== null && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.className);
      return { lists: body.querySelectorAll('[role="tablist"]').length, tabs: tabs.map((t) => t.textContent.trim()).join(), tops: new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size,
        per: cards.filter((c) => Math.abs(c.getBoundingClientRect().top - top0) < 4).length, wide: pr.width >= bw.width - 40, above: pr.bottom <= prev.top + 1, over: document.documentElement.scrollWidth - innerWidth, small };
    });
    ok(g.lists === 1 && g.tabs === 'Sans,Serif,Decorative,Mono' && g.tops === 1, `${tag} ${scheme} steps Faces: one tablist, four tabs on one row (${JSON.stringify(g)})`);
    ok(g.per >= (w >= 700 ? 3 : 2), `${tag} ${scheme} steps Faces: cards per row (${g.per})`);
    ok(g.wide && g.above, `${tag} ${scheme} steps Faces: full panel width, above the live preview`);
    ok(g.over <= 0 && !g.small.length, `${tag} ${scheme} steps Faces: no sideways scroll, nothing under 12px (${g.over}, ${g.small})`);
    await p.close();
  }
}
// The Mode switch on the steps page (Fontdant step): the selected segment is readable (text on its own fill, 4.5:1)
// in light and dark, and the whole switch is visible: not clipped, inside its column, clear of the live preview.
async function checkMode(ctx, w, tag) {
  for (const scheme of ['light', 'dark']) {
    const p = await ctx.newPage(); await p.emulateMedia({ colorScheme: scheme });
    await p.goto(base + 'steps.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
    if (await p.evaluate(() => document.documentElement.getAttribute('data-theme')) !== scheme) await p.click('.mise-nav__theme');   // the catalog's own switch sets data-theme (and remembers it)
    await p.waitForTimeout(200); const th = await p.evaluate(() => document.documentElement.getAttribute('data-theme')); ok(th === scheme, `${tag} ${scheme} Mode: page really is ${scheme} (${th})`);
    // the steps page wears a look, which pins roles inline; in dark, wear Frosting's dark roles on the demo the way a dark look does
    if (scheme === 'dark') await p.evaluate(() => Object.entries({ bg: '#0F1115', surface: '#171A21', border: '#262B36', text: '#E6E8EE', muted: '#8A92A6', accent: '#9D7BFF' }).forEach(([k, v]) => document.querySelector('.demo').style.setProperty('--fr-' + k, v)));
    await p.click('.mise-shell__tab[data-tab="fontdant"]');
    await p.waitForSelector('[data-body="fontdant"] [data-modes] button');
    const g = await p.evaluate(() => {
      const body = document.querySelector('[data-body="fontdant"]'), seg = body.querySelector('[data-modes]'), sel = seg.querySelector('button[aria-checked="true"]');
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
      const rgb = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
      const cs = getComputedStyle(sel), a = lum(rgb(cs.color)), b = lum(rgb(cs.backgroundColor));
      const r = seg.getBoundingClientRect(), box = seg.closest('.fd-pal__controls').getBoundingClientRect(), prev = body.querySelector('.fd-pal__preview').getBoundingClientRect();
      const btns = [...seg.querySelectorAll('button')].map((x) => x.getBoundingClientRect());
      const overlap = !(r.right <= prev.left + 1 || r.left >= prev.right - 1 || r.bottom <= prev.top + 1 || r.top >= prev.bottom - 1);
      return { n: btns.length, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05), clipped: seg.scrollWidth > seg.clientWidth, inside: r.left >= box.left - 1 && r.right <= box.right + 1 && btns.every((x) => x.right <= r.right + 1 && x.left >= r.left - 1), overlap };
    });
    ok(g.n === 2 && g.contrast >= 4.5, `${tag} ${scheme} Mode: selected segment contrast ${g.contrast.toFixed(2)} (need 4.5)`);
    ok(!g.clipped && g.inside && !g.overlap, `${tag} ${scheme} Mode: not clipped, inside its column, clear of the preview (${JSON.stringify(g)})`);
    await p.close();
  }
}
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
    const tabs = await lp.$$eval('#lib-tabs [role="tab"]', (t) => t.map((x) => x.firstChild.textContent));
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
    // #library lands with the tablist fully visible below the sticky nav; the library comes before Type presets; tabs are at least h-sm
    const hp = await ctx.newPage(); await hp.emulateMedia({ colorScheme: scheme });
    await hp.goto(base + 'fontdant.html#library', { waitUntil: 'networkidle' }); await hp.waitForTimeout(400);
    const g = await hp.evaluate(() => {
      const nav = document.querySelector('.mise-nav').getBoundingClientRect(), tl = document.getElementById('lib-tabs').getBoundingClientRect();
      const probe = document.createElement('div'); probe.style.fontSize = 'var(--fd-step-h-sm)'; document.body.appendChild(probe); const hsm = parseFloat(getComputedStyle(probe).fontSize); probe.remove();
      const tabPx = [...document.querySelectorAll('#lib-tabs [role="tab"]')].map((t) => parseFloat(getComputedStyle(t).fontSize));
      const lib = document.getElementById('library-section'), pre = document.getElementById('presets');
      return { navB: nav.bottom, top: tl.top, bottom: tl.bottom, vh: innerHeight, hsm, tabPx, before: !!(lib.compareDocumentPosition(pre) & Node.DOCUMENT_POSITION_FOLLOWING) };
    });
    ok(g.top >= g.navB - 1 && g.bottom <= g.vh, `${tag} ${scheme} #library: tablist visible below the nav (nav ${g.navB}, tabs ${g.top}-${g.bottom}, vh ${g.vh})`);
    ok(g.tabPx.length === 4 && g.tabPx.every((x) => x >= g.hsm - 0.5), `${tag} ${scheme} library: tabs at least the h-sm step (${g.tabPx} vs ${g.hsm})`);
    ok(g.before, `${tag} ${scheme} library: comes before Type presets`);
    await hp.close();
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
  await checkFaces(ctx, w, tag);
  await checkMode(ctx, w, tag);
  await ctx.close();
}
{ const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); await checkFaces(c, 1440, 'wide'); await checkMode(c, 1440, 'wide'); await c.close(); }
await b.close(); server.close();
console.log((fails ? 'FAIL' : 'PASS') + ': the Fournée catalog: one bar on every page, light/dark everywhere, sticky, phone width');
if (fails) process.exit(1);
