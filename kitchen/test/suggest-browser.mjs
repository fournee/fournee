// The Pass view shows a suggested colour (criteria A12-A15), in Chromium:
//  - a result with `suggest` lists the hex, the ratio and the ratio asked for, with an aria-hidden swatch in that colour
//  - `suggest: null` says no colour of this hue reaches the target, with no swatch
//  - the "Use this" button exists only when onSuggest is supplied, and calls it once with (result, suggest)
//  - passview.css holds no literal colour and no font-size under 12px, and the suggestion line renders at 12px or more
// The view is mounted on the shell test page over a stubbed KitchenPass.run, so the results are exactly the ones named.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };

/* A15, the stylesheet itself */
{
  const css = readFileSync(join(root, 'kitchen/src/passview.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(!/#[0-9a-fA-F]{3,8}\b/.test(css) && !/\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)\(/i.test(css), 'A15: no literal colour in passview.css');
  expect(!/(?<![-\w])(white|black|red|green|blue|gray|grey|yellow|orange|purple)(?![-\w])/i.test(css), 'A15: no named colour in passview.css');
  const small = [...css.matchAll(/font-size\s*:\s*([\d.]+)(px|rem|em)/g)].filter(([, n, u]) => (u === 'px' && +n < 12) || (u === 'rem' && +n * 16 < 12));
  expect(small.length === 0, 'A15: no font-size under 12px in passview.css', small.map((m) => m[0]));
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/kitchen/test/shell.html`);
  await page.waitForSelector('.fr-pal__card');
  const out = await page.evaluate(() => {
    const suggest = { role: 'muted', from: '#455768', to: '#445566', direction: 'darker', deltaL: 0.6, target: 7, ratio: 7.01, against: [{ role: 'bg', hex: '#F2F5F8', ratio: 7.01, min: 7 }] };
    const mk = (id, s) => ({ id, label: id, level: 'warn', ok: false, pending: false, detail: 'muted on bg 6.81:1', source: 'cross', where: { tab: 'frosting', role: 'muted', fg: '#455768', bg: '#F2F5F8', size: 13, weight: 400, style: 'caption' }, suggest: s });
    const results = [mk('AAA', suggest), Object.assign(mk('BBB', null), { suggestTarget: 7 }), { id: 'CCC', label: 'CCC', level: 'warn', ok: false, pending: false, detail: 'd', source: 'cross', where: null }];
    const real = window.KitchenPass.run;
    window.KitchenPass.run = () => ({ ok: true, results, rows: [], summary: { hard: 0, warn: 3, pending: 0, passed: 0, info: 0 } });
    const seen = [];
    const mount = (opts) => { const el = document.createElement('div'); document.body.appendChild(el); window.KitchenPassView.mount(el, Object.assign({ recipe: () => ({}) }, opts)); return el; };
    const plain = mount({});
    const hooked = mount({ onSuggest: (r, s) => seen.push([r.id, s]), samples: true });
    const describe = (el, id) => {
      const li = el.querySelector(`[data-id="${id}"]`), sw = li.querySelector('.mise-pass__swatch'), line = li.querySelector('.mise-pass__suggest');
      return { text: li.textContent, swatch: sw ? { bg: getComputedStyle(sw).backgroundColor, hidden: sw.getAttribute('aria-hidden'), w: sw.getBoundingClientRect().width } : null, fontPx: line ? parseFloat(getComputedStyle(line).fontSize) : null,
        button: !!li.querySelector('[data-pass-suggest]'), samples: li.querySelectorAll('.mise-pass__sample').length };
    };
    const res = { a: describe(plain, 'AAA'), none: describe(plain, 'BBB'), absent: describe(plain, 'CCC'), hooked: describe(hooked, 'AAA') };
    hooked.querySelector('[data-pass-suggest]').click();
    res.seen = seen;
    window.KitchenPass.run = real;
    return res;
  });
  expect(/#445566/.test(out.a.text) && /7\.01:1/.test(out.a.text) && /7:1/.test(out.a.text), 'A12: hex, ratio and the ratio asked for are in the item', out.a.text);
  expect(out.a.swatch && out.a.swatch.bg === 'rgb(68, 85, 102)' && out.a.swatch.hidden === 'true' && out.a.swatch.w > 0, 'A12: an aria-hidden swatch in the suggested colour', out.a.swatch);
  expect(/No colour of this hue reaches 7:1 here\. Change the background or the hue\./.test(out.none.text), 'A13: suggest null says so, with the ratio', out.none.text);
  expect(out.none.swatch === null, 'A13: no swatch for null', out.none.swatch);
  expect(out.absent.swatch === null && !/Try #|No colour of this hue/.test(out.absent.text), 'a result without the field shows nothing extra', out.absent.text);
  expect(!out.a.button && !out.none.button, 'A14: no "Use this" button without onSuggest');
  expect(out.hooked.button, 'A14: "Use this" with onSuggest');
  expect(out.seen.length === 1 && out.seen[0][0] === 'AAA' && out.seen[0][1].to === '#445566', 'A14: onSuggest called once with (result, suggest)', out.seen);
  expect(out.a.fontPx >= 12 && out.hooked.fontPx >= 12, 'A15: the suggestion line is 12px or more', out.a.fontPx);
  expect(out.hooked.samples === 2 && out.a.samples === 0, 'with samples on, the suggestion has a sample of its own', [out.hooked.samples, out.a.samples]);
  expect(errors.length === 0, 'no page errors', errors);
  console.log('chromium Pass view: suggestion line with swatch, null sentence, Use this hook');
} finally { await browser.close(); }
server.close();
console.log(fails ? `FAIL: ${fails} suggest browser failures` : 'PASS: the Pass view shows the suggested colour (A12-A15)');
process.exit(fails ? 1 : 0);
