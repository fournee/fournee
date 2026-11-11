// Measures the fit in real browsers (Chromium and Firefox via Playwright; Safari/iOS are on the later list):
//  - display slot: three faces (Inter, Fraunces, Anton) render the same cap height (within 1%) through their aliases
//  - text slot: three faces (Inter, Geist, Source Serif 4) render the same x-height (within 1%)
//  - line boxes: three lines at line-height 1.2 are the same height for every face (within 0.5px)
//  - CLS (Chromium): the default look as a page, fonts delayed 400ms on first load → ≤ 0.01; cached reload → 0
// Serves fontdant/ over a local http server; `?slow=1` on a font request adds the delay.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
let slowFonts = false;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = join(root, decodeURIComponent(url.pathname));
  try {
    const data = await readFile(p);
    if (slowFonts && url.pathname.startsWith('/fonts/')) await new Promise((r) => setTimeout(r, 400));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream', 'cache-control': 'max-age=3600', 'access-control-allow-origin': '*' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const spread = (vals) => (Math.max(...vals) - Math.min(...vals)) / Math.min(...vals);

async function measure(page, slot, faces) {
  await page.goto(`${base}/test/page.html?slot=${slot}&faces=${faces.join(',')}`);
  await page.waitForFunction(() => window.__done, null, { timeout: 20000 });
  return page.evaluate(() => window.__results);
}

for (const [name, type] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    for (const [slot, faces, label] of [['display', ['inter', 'fraunces', 'anton'], 'cap height'], ['text', ['inter', 'geist', 'source-serif-4'], 'x-height']]) {
      const r = await measure(page, slot, faces);
      const metric = faces.map((f) => r.faces[f].metricPx), raw = faces.map((f) => r.faces[f].rawMetricPx), lines = faces.map((f) => r.faces[f].linesPx);
      const statuses = faces.map((f) => r.faces[f].status.join('/'));
      expect(statuses.every((s) => /loaded/.test(s)), name, slot, 'aliases loaded:', statuses);
      expect(metric.every((v) => v > 4), name, slot, 'measured something', metric);
      expect(spread(metric) <= 0.01, name, slot, label, 'spread', (spread(metric) * 100).toFixed(2) + '%', metric.map((v) => v.toFixed(2)));
      expect(spread(raw) > 0.05, name, slot, 'control: the unadjusted faces should differ by more than 5%', raw.map((v) => v.toFixed(2)));
      expect(Math.max(...lines) - Math.min(...lines) <= 0.5, name, slot, 'line boxes', lines.map((v) => v.toFixed(2)));
      console.log(`${name} ${slot}: ${label} at ${r.px} fitted = ${metric.map((v) => v.toFixed(2)).join(' / ')} px (spread ${(spread(metric) * 100).toFixed(2)}%); unadjusted = ${raw.map((v) => v.toFixed(2)).join(' / ')} px (spread ${(spread(raw) * 100).toFixed(1)}%); 3 lines = ${lines.map((v) => v.toFixed(1)).join(' / ')} px`);
    }

    if (name === 'chromium') {
      const ctx = await browser.newContext();
      const p2 = await ctx.newPage();
      slowFonts = true;
      await p2.goto(`${base}/test/page.html?cls=1`);
      await p2.waitForFunction(() => window.__done, null, { timeout: 20000 });
      const first = await p2.evaluate(() => window.__results);
      slowFonts = false;
      await p2.goto(`${base}/test/page.html?cls=1`);
      await p2.waitForFunction(() => window.__done, null, { timeout: 20000 });
      const second = await p2.evaluate(() => window.__results);
      console.log(`${name} CLS: first load (fonts delayed 400ms) ${first.cls.toFixed(4)}, cached reload ${second.cls.toFixed(4)}; loaded: ${[...new Set(first.loaded)].join(', ')}`);
      expect(first.cls <= 0.01, name, 'first-load CLS', first.cls);
      expect(second.cls === 0, name, 'cached CLS', second.cls);
      await ctx.close();
    }
  } finally { await browser.close(); }
}
server.close();
console.log(fails ? `FAIL: ${fails} browser failures` : 'PASS: browser fit — cap/x height within 1% across faces, line boxes equal, CLS ≤ 0.01 (Chromium, Firefox)');
if (fails) process.exitCode = 1;
