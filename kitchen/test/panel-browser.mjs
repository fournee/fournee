// Phase 5 in real browsers (Chromium and Firefox):
//  - the Fontdant tab: pick a preset → live on the page (faces, mode); save, publish, reload → the look comes back
//  - before first paint (a test server injects FontdantEmit.head like a Worker would): the published look is in
//    place at DOMContentLoaded (no flash) and CLS stays 0 with the font files delayed 400ms (no jump)
//  - Add a font: drop Alegreya Sans files (MISE_TEST_FONTS) → metrics read in the browser, offered under "Your fonts" for this
//    client only; picking it emits its own @font-face; another client's panel does not offer it
//  - 🎲 lucky gives a fitted look that passes the pass
//  - Sprinkles: switch off → the page wears the Plain grey (7:1); compare shows both; on again → designed grey;
//    prefers-contrast: more → Plain with Sprinkles on; the on-page High contrast switch → Plain, remembered
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const pw = require('playwright');
const only = process.argv[2];   // 'chromium' or 'firefox' to run one
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'fontdant/src/emit.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), sb);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
let delayFonts = 0;
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/firstpaint') {   // a server that writes the published look into the first bytes
    const look = JSON.parse(u.searchParams.get('look') || '{}'), h = sb.FontdantEmit.head(look, { baseUrl: '/fontdant/fonts' });
    const attrs = Object.entries(h.htmlAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><html lang="en"${attrs}><head><meta charset="utf-8"><script>window.__cls=0;try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)window.__cls+=e.value;});}).observe({type:'layout-shift',buffered:true});}catch(e){}</script>
<link rel="stylesheet" href="/fontdant/dist/fontdant.css">${h.html}
<script>window.__rects=function(){return [].map.call(document.querySelectorAll('body > *'),function(e){var r=e.getBoundingClientRect();return [r.top,r.height,r.width];});};</script><script>document.addEventListener('DOMContentLoaded',function(){window.__atDcl=getComputedStyle(document.documentElement).getPropertyValue('--fd-face-display');window.__rects0=window.__rects();window.__fontsAtDcl=[].filter.call(document.fonts,function(f){return f.status==='loaded'&&/fd-/.test(f.family)}).length;});</script></head>
<body style="margin:16px;width:600px"><h1 class="fd-heading-xl">Corner Bakery opens at seven</h1><p class="fd-body">Our sourdough rests for two days before it is baked. Ask at the counter which loaves are still warm, and which are for tomorrow.</p><p class="fd-caption">Updated 8 Nov 2026</p><div class="fd-metric">$1,284.50</div></body></html>`);
    return;
  }
  try {
    const p = join(root, decodeURIComponent(u.pathname)); const d = await readFile(p);
    if (delayFonts && /\.woff2$/.test(p)) await new Promise((r) => setTimeout(r, delayFonts));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(d);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
try { process.loadEnvFile(join(root, '.env')); } catch {}   // optional; see .env.example
const gfeFonts = process.env.MISE_TEST_FONTS || '';   // folder with alegreya-sans-latin-{500,700,800}-normal.woff2; skipped if unset

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const results = [];

for (const bt of ['chromium', 'firefox'].filter((b) => !only || b === only)) {
const log = [];
const browser = await pw[bt].launch();
const failsBefore = fails;
try {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${base}/kitchen/test/shell.html`);
  await page.click('[data-tab="fontdant"]');
  await page.evaluate(() => shell.tab('fontdant').ready);

  /* pick a preset: live */
  const ed = await page.evaluate(() => FontdantGallery.PRESETS.findIndex((p) => p.name === 'Workbench'));
  await page.click(`[data-fdpick="${ed}"]`);
  const live = await page.evaluate(() => ({ disp: getComputedStyle(document.documentElement).getPropertyValue('--fd-face-display'), mode: document.documentElement.getAttribute('data-fd-mode'), name: document.querySelector('.fd-pal [data-name]').textContent }));
  expect(/Archivo fd-display/.test(live.disp) && live.mode === 'dense' && live.name === 'Workbench', 'a preset is live on the page (faces + mode)', live);
  await page.evaluate(() => document.fonts.ready);
  const used = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  expect(used.some((f) => /Archivo fd-display/.test(f)), 'its alias actually loads', used);
  await page.click('.fd-pal [data-save]'); await page.click('.fd-pal [data-publish]');
  await page.waitForFunction(() => /Published/.test(document.querySelector('.fd-pal [data-flash]').textContent));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kitchen-test.type')));
  expect(stored.faces.display === 'archivo' && stored.mode === 'dense', 'published through the kitchen store', stored);
  await page.reload(); await page.click('[data-tab="fontdant"]'); await page.evaluate(() => shell.tab('fontdant').ready);
  const back = await page.evaluate(() => [getComputedStyle(document.documentElement).getPropertyValue('--fd-face-display'), shell.tab('fontdant').draft().faces.display]);
  expect(/Archivo fd-display/.test(back[0]) && back[1] === 'archivo', 'after reload the draft is back on the page', back);
  log.push('preset Workbench live → published → reload kept');

  /* lucky */
  await page.click('.fd-pal [data-lucky]');
  const lucky = await page.evaluate(() => { const r = KitchenPass.run(currentRecipe()); return { faces: shell.tab('fontdant').draft().faces, hard: KitchenPass.failing(r, 'hard'), note: document.querySelector('.fd-pal [data-notes]').textContent }; });
  expect(lucky.faces.display && !lucky.hard.length && /rolled/.test(lucky.note), '🎲 lucky: a fitted look that passes the pass', lucky);

  /* Add a font: Alegreya Sans from MISE_TEST_FONTS */
  if (existsSync(gfeFonts)) {
    await page.click('.fd-pal [data-add]');
    await page.setInputFiles('[data-add-files]', ['500', '700', '800'].map((w) => `${gfeFonts}/alegreya-sans-latin-${w}-normal.woff2`));
    await page.waitForSelector('[data-add-family]');
    const read = await page.evaluate(() => ({ fam: document.querySelector('[data-add-family]').value, text: document.querySelector('[data-add-read]').textContent }));
    expect(read.fam === 'Alegreya Sans' && /500, 700, 800/.test(read.text) && /display/.test(read.text) && /hhea and typo differ/.test(read.text), 'Add a font reads family, weights, slots and the F5 warning in the browser', read);
    await page.click('[data-add-go]');
    await page.waitForFunction(() => /Added Alegreya Sans/.test(document.querySelector('.fd-pal [data-flash]').textContent));
    const opt = await page.$$eval('.fd-pal [data-slot="display"] optgroup', (gs) => gs.map((g) => g.label + ':' + [...g.querySelectorAll('option')].map((o) => o.textContent).join('|')).filter((s) => /Your fonts/.test(s)));
    expect(opt.length === 1 && /Corner Bakery/.test(opt[0]) && /Alegreya Sans/.test(opt[0]), 'it is offered under "Your fonts · Corner Bakery"', opt);
    await page.selectOption('.fd-pal [data-slot="display"]', 'alegreya-sans');
    const css = await page.evaluate(() => document.getElementById('fontdant-live').textContent);
    expect(/font-family: "Alegreya Sans fd-display";\n  src: url\("data:[^;"]*;base64,[^"]+"\) format\("woff2"\)/.test(css) && /font-weight: 800;/.test(css), 'picking it emits its own @font-face (inline files: no saveFontFile here)', css.slice(0, 200));
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => [...document.fonts].some((f) => /Alegreya Sans fd-display/.test(f.family) && f.status === 'loaded'));
    expect(loaded, 'the added font loads and renders');
    const pass = await page.evaluate(() => { const r = KitchenPass.run(currentRecipe()); return { hard: KitchenPass.failing(r, 'hard'), L1: r.results.find((x) => x.id === 'L1') }; });
    expect(!pass.hard.length && pass.L1.ok, 'the pass is clean in Corner Bakery\'s own recipe', pass);
    // another client's panel does not offer it
    const other = await ctx.newPage();
    await other.goto(`${base}/kitchen/test/shell.html?client=${encodeURIComponent('Other Client')}`);
    await other.click('[data-tab="fontdant"]'); await other.evaluate(() => shell.tab('fontdant').ready);
    const otherOpts = await other.$$eval('.fd-pal [data-slot="display"] option', (os) => os.map((o) => o.value));
    expect(!otherOpts.includes('alegreya-sans'), 'another client\'s Fontdant tab does not offer it');
    await other.close();
    log.push('Add a font: Alegreya Sans read in-browser (500/700/800, display, F5), Corner Bakery only');
  } else log.push('Add a font: MISE_TEST_FONTS not set, skipped');

  /* Sprinkles */
  await page.click('[data-tab="frosting"]');
  const designed = await page.evaluate(() => (window.draft || FrostingTokens.light).muted.toUpperCase());
  const plainHex = await page.evaluate(() => KitchenSprinkles.plain(window.draft || FrostingTokens.light).colors.muted);
  const muted = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fr-muted').trim().toUpperCase());
  expect(await muted() === designed, 'Sprinkles on: the designed grey', await muted());
  await page.click('[data-sprinkles]');
  expect(await muted() === plainHex, 'Sprinkles off: the page wears the Plain grey', await muted(), plainHex);
  const offPass = await page.evaluate(() => { const r = KitchenPass.run(currentRecipe()); return [r.sprinkles, r.results.find((x) => x.id === 'X4')]; });
  expect(offPass[0] === false && offPass[1].ok && offPass[1].level !== 'info', 'the pass checks Plain: X4 passes outright', offPass);
  await page.click('[data-sprinkles-compare]');
  const cmp = await page.evaluate(() => [...document.querySelectorAll('.mise-spr__mini')].map((m) => m.textContent));
  expect(cmp.length === 2 && /Sprinkles/.test(cmp[0]) && /Plain \(on\)/.test(cmp[1]) && cmp[1].includes(plainHex), 'compare shows both side by side', cmp);
  await page.click('[data-sprinkles-compare]');
  // J5: Sprinkles waits for Publish, like colours and type
  const sprState = () => page.evaluate(() => ({ pending: !document.querySelector('[data-sprinkles-pending]').hidden, pub: localStorage.getItem('kitchen-test.sprinkles'), draft: localStorage.getItem('kitchen-test.sprinkles.draft') }));
  let ss = await sprState();
  expect(ss.pending && ss.pub !== 'false' && ss.draft === 'false', 'Sprinkles off is a draft: "Not published yet", visitors still get Sprinkles', ss);
  await page.reload(); await page.waitForFunction(() => window.spr && !document.querySelector('[data-sprinkles]').checked);
  expect(await muted() === plainHex && (await sprState()).pending, 'the draft survives a reload (still off, still unpublished)');
  await page.click('[data-tab="fontdant"]'); await page.evaluate(() => shell.tab('fontdant').ready);
  await page.click('.fd-pal [data-publish]'); await page.waitForFunction(() => document.querySelector('[data-sprinkles-pending]').hidden);
  ss = await sprState();
  expect(!ss.pending && ss.pub === 'false', 'Publish publishes Sprinkles with the type', ss);
  await page.click('[data-tab="frosting"]');
  await page.click('[data-sprinkles]');
  expect((await sprState()).pending, 'turning it back on is a draft again');
  await page.click('[data-tab="fontdant"]'); await page.click('.fd-pal [data-publish]'); await page.waitForFunction(() => document.querySelector('[data-sprinkles-pending]').hidden);
  await page.click('[data-tab="frosting"]');
  expect(await muted() === designed, 'Sprinkles on again: the designed grey');
  const onPass = await page.evaluate(() => KitchenPass.run(currentRecipe()).results.find((x) => x.id === 'X4'));
  expect(onPass.level === 'info' && /Plain version available/.test(onPass.detail), 'Sprinkles on: X4 is the note "Plain version available"', onPass);
  // set before a load: Playwright's Firefox matches the query at runtime but does not restyle until the next load
  await page.emulateMedia({ contrast: 'more' }); await page.reload(); await page.waitForFunction(() => window.spr);
  expect(await muted() === plainHex, 'prefers-contrast: more gets Plain automatically', await muted());
  await page.emulateMedia({ contrast: 'no-preference' }); await page.reload(); await page.waitForFunction(() => window.spr);
  log.push(`Sprinkles: ${designed} ⇄ Plain ${plainHex}; prefers-contrast: more → Plain`);

  /* the on-page High contrast switch */
  await page.goto(`${base}/kitchen/test/shell.html?hc=1`);
  await page.waitForSelector('.mise-contrast');
  expect(await muted() === designed, 'High contrast off: designed grey');
  await page.click('.mise-contrast');
  expect(await muted() === plainHex && await page.getAttribute('.mise-contrast', 'aria-pressed') === 'true', 'High contrast on: Plain grey, pressed');
  await page.reload(); await page.waitForSelector('.mise-contrast');
  expect(await muted() === plainHex, 'the choice is remembered on reload');
  await page.click('.mise-contrast');
  expect(await muted() === designed, 'and switches back');
  expect(errors.length === 0, 'no page errors', errors);

  /* before first paint: no flash, no jump */
  const look = { faces: { display: 'fraunces', text: 'source-sans-3', mono: 'ibm-plex-mono' }, mode: 'dense' };
  const fp = await browser.newPage({ viewport: { width: 700, height: 600 } });
  delayFonts = 400;
  await fp.goto(`${base}/firstpaint?look=${encodeURIComponent(JSON.stringify(look))}`);
  await fp.evaluate(() => document.fonts.ready); await fp.waitForTimeout(300);
  const first = await fp.evaluate(() => ({ dcl: window.__atDcl, cls: window.__cls, shift: Math.max(...window.__rects().flatMap((r, i) => [Math.abs(r[0] - window.__rects0[i][0]), Math.abs(r[1] - window.__rects0[i][1])])), fontsAtDcl: window.__fontsAtDcl, mode: document.documentElement.getAttribute('data-fd-mode'), loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family) }));
  expect(/Fraunces fd-display/.test(first.dcl), 'the look is in place at DOMContentLoaded (no flash of the default look)', first.dcl);
  expect(first.mode === 'dense' && first.loaded.some((f) => /Fraunces fd-display$/.test(f)), 'mode attribute and real fonts', first);
  expect(first.cls <= 0.01, 'CLS ≤ 0.01 on first load with fonts delayed 400ms (no jump)', first.cls);
  expect(first.fontsAtDcl === 0, 'the geometry check is real: no fontdant font had loaded at DOMContentLoaded', first.fontsAtDcl);
  expect(first.shift <= 2, 'no jump by geometry: text blocks move ≤ 2px between DOMContentLoaded (fallbacks) and the real fonts', first.shift);
  delayFonts = 0;
  await fp.reload(); await fp.evaluate(() => document.fonts.ready); await fp.waitForTimeout(200);
  const cached = await fp.evaluate(() => window.__cls);
  expect(cached === 0, 'CLS 0 on a cached reload', cached);
  log.push(`first paint: look in place at DOMContentLoaded; CLS ${bt === 'firefox' ? 'n/a (no layout-shift API)' : first.cls.toFixed(4)}, max move ${first.shift.toFixed(2)}px first load (fonts +400ms), ${bt === 'firefox' ? '' : cached.toFixed(4) + ' '}cached`);
} catch (e) { fail(bt + ' crashed:', e.message.split('\n').slice(0, 3).join(' | ')); } finally { await browser.close(); }
console.log(bt + ': ' + log.join('; '));
results.push(bt + (fails === failsBefore ? ' ✓' : ' ✗'));
}
server.close();
console.log(fails ? `FAIL: ${fails} panel failures (${results.join(', ')})` : `PASS: the Fontdant tab, Add a font, Sprinkles and first paint (${results.join(', ')})`);
if (fails) process.exitCode = 1;
