// The numeric accent in a real browser (v1.3.0, deliverable B), Chromium:
//  B11 the Frosting panel sets --fr-accent-h/-s/-l on the page whenever the draft's accent changes: a typed hex, a
//      ready-made look, and Reset (back to the defaults)
//  B12 a page whose own CSS reads var(--fr-accent-h) follows the accent with no script
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
const C = sb.FrostingColor, G = sb.FrostingGallery, T = sb.FrostingTokens;
const want = (hex) => C.channelVars({ accent: hex }, 'fr');

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/kitchen/test/shell.html`);
  await page.waitForSelector('.fr-pal__card');
  const read = () => page.evaluate(() => { const s = getComputedStyle(document.documentElement); return ['h', 's', 'l'].map((k) => s.getPropertyValue('--fr-accent-' + k).trim()); });
  const wantList = (hex) => Object.values(want(hex));
  const sameList = (a, b) => a.join() === b.join();

  // B11: a typed accent
  await page.fill('[data-hex="accent"]', '#FF0000');
  let got = await read();
  expect(sameList(got, wantList('#FF0000')) && got.join() === '0,100%,50%', 'B11: typing #FF0000 sets hue 0, 100%, 50%', got);
  // B11: a ready-made look
  await page.click('[data-pick="5"]');
  const lookAccent = G.presets()[5].colors.accent;
  got = await read();
  expect(sameList(got, wantList(lookAccent)), 'B11: picking a look sets the channels from its accent', got, wantList(lookAccent));
  // B12: CSS that reads the hue follows it, no script
  await page.addStyleTag({ content: ':root { --hue: var(--fr-accent-h, 210); } #probe { background: hsl(var(--hue), 40%, 92%); }' });
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'probe'; document.body.appendChild(d); });
  const hueOf = () => page.evaluate(() => {
    const m = getComputedStyle(document.getElementById('probe')).backgroundColor.match(/[\d.]+/g).map(Number), [r, g, b] = m.map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0;
    const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h * 60;
  });
  const h1 = await hueOf();
  await page.fill('[data-hex="accent"]', '#0000FF');
  const h2 = await hueOf();
  expect(Math.abs(h1 - C.accentParts(lookAccent).h) < 3 && Math.abs(h2 - 240) < 3, 'B12: the page hue follows the accent hue', h1, h2);
  // B11: Reset goes back to the defaults
  await page.click('[data-reset]');
  got = await read();
  expect(sameList(got, wantList(T.light.accent)), 'B11: Reset puts the default accent channels back', got, wantList(T.light.accent));
  expect(errors.length === 0, 'no page errors', errors);
} finally { await browser.close(); server.close(); }

console.log(fails ? `FAIL: ${fails} accent-browser checks` : 'PASS: accent-browser.mjs - the panel keeps --fr-accent-h/-s/-l in step with the accent (B11, B12)');
process.exit(fails ? 1 : 0);
