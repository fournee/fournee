// The pass in a real browser:
//  - T13 (rendered survival) on the specimen at a 320px viewport, Chromium and Firefox: the default look passes in
//    both modes; a look whose display text is too big to reflow fails with the style named
//  - the pass in the panel (shell test page, "The pass" tab): the tab carries a badge before it is opened; the
//    view shows "Passes" with T13 filled from its hidden specimen frame; picking another preset re-runs it;
//    a recipe with weight 300 at 10px on muted shows T5 and X4 as failing and T7, X3 as warnings
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const { chromium, firefox } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try { const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); const d = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const enc = (o) => encodeURIComponent(JSON.stringify(o));

for (const [name, type] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    const out = [];
    for (const [label, look, want] of [['reading', {}, true], ['dense', { mode: 'dense' }, true], ['scaling 1.25', { scaling: 1.25 }, true], ['display 6rem', { roles: { display: { size: '6rem' } } }, false]]) {
      await page.goto(`${base}/kitchen/src/specimen.html?case=${encodeURIComponent(label)}#${enc(look)}`);   // a new query each time: a hash-only change would not reload
      const r = await page.evaluate(() => window.__ready);
      expect(r.ok === want, `${name} T13 ${label}: ${want ? 'passes' : 'fails'}`, r.detail);
      if (!want) expect(/^display: /.test(r.detail), `${name} T13 ${label}: names the display style`, r.detail);
      out.push(`${label} ${r.ok ? 'pass' : 'fail'}`);
    }
    // the overrides are taken off again after measuring
    expect(await page.evaluate(() => !document.querySelector('style[data-wcag-1412]')), `${name}: 1.4.12 override sheet removed after measuring`);
    expect(errors.length === 0, `${name}: no page errors`, errors);
    console.log(`${name} T13 at 320px: ${out.join(', ')}`);

    if (name !== 'chromium') continue;
    // the pass in the panel
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.goto(`${base}/kitchen/test/shell.html`);
    await page.waitForSelector('.fr-pal__card');
    const pre = await page.$eval('[data-tab="pass"] [data-badge]', (b) => [b.hidden, b.textContent, b.getAttribute('data-level')]);
    expect(!pre[0] && pre[2] !== 'bad', 'the pass tab is badged before it is opened', pre);
    await page.click('[data-tab="pass"]');
    await page.evaluate(() => shell.tab('pass').ready);
    const view = await page.evaluate(() => ({ head: document.querySelector('[data-pass-summary]').textContent, t13: document.querySelector('[data-id="T13"]').getAttribute('data-kind'), level: document.querySelector('[data-pass-summary]').getAttribute('data-level') }));
    expect(/Passes/.test(view.head) && view.t13 === 'ok' && !/pending/.test(view.head), 'panel: default recipe passes, T13 filled by the specimen frame', view);
    // another preset re-runs the pass
    await page.click('[data-tab="frosting"]');
    await page.click('[data-pick="5"]');
    await page.click('[data-tab="pass"]');
    const again = await page.evaluate(() => [shell.tab('pass').result().summary.hard, FrostingGallery.presets()[5].colors.bg.toUpperCase(), shell.tab('pass').result().rows[0].bg]);
    expect(again[0] === 0 && again[1] === again[2], 'panel: picking a preset re-runs the pass on its colours', again);
    // the done criterion, in the panel
    const bad = { roles: { caption: { size: '0.625rem', weight: 300, color: 'muted' } } };
    await page.goto(`${base}/kitchen/test/shell.html?fontdant=${enc(bad)}`);
    await page.waitForSelector('.fr-pal__card');
    const badge = await page.$eval('[data-tab="pass"] [data-badge]', (b) => [b.textContent, b.getAttribute('data-level')]);
    expect(badge[0] === '2 failing' && badge[1] === 'bad', 'panel: tab badge says 2 failing', badge);
    await page.click('[data-tab="pass"]');
    await page.evaluate(() => shell.tab('pass').ready);
    const items = await page.$$eval('.mise-pass__list > .mise-pass__item:not([data-kind="ok"]):not([data-kind="pending"])', (els) => els.map((e) => e.getAttribute('data-id') + ':' + e.getAttribute('data-kind')));
    const want = ['T5:hard', 'X4:hard', 'T7:warn', 'X3:warn'];
    expect(JSON.stringify(items.filter((i) => want.includes(i)).sort()) === JSON.stringify(want.sort()) && items.length === 4, 'panel: T5, X4 failing and T7, X3 warnings are listed', items);
    expect(errors.length === 0, 'panel: no page errors', errors);
    console.log(`chromium panel: tab badge "${pre[1]}" → ${view.head}; 300@10px muted → ${items.join(' ')}`);
  } finally { await browser.close(); }
}
server.close();
console.log(fails ? `FAIL: ${fails} pass browser failures` : 'PASS: the pass rendered (T13, Chromium + Firefox) and in the panel');
if (fails) process.exitCode = 1;
