// Phase 6, the web targets in Chromium and Firefox: plain HTML (head written by a server), a <head> boot script,
// React and Svelte all render the same recipe identically (every style's computed font, size, weight, leading,
// tracking, case and height; the colours; the mode; the fonts loaded), with the look in place when the specimen first
// appears (no flash) and no jump when fonts arrive late.
import { createRequire } from 'node:module';
import { measure, settle, diff } from './specimen.mjs';
import { startServer, bundles, MiseApply, RECIPE } from './server.mjs';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const pw = require('playwright');
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const log = [];

await bundles();
const srv = await startServer();
try {
  for (const bt of ['chromium', 'firefox']) {
    const browser = await pw[bt].launch();
    try {
      const results = {};
      for (const kind of ['plain', 'boot', 'react', 'svelte']) {
        const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
        const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        await page.goto(`${srv.base}/${kind}`);
        await settle(page);
        results[kind] = await page.evaluate(measure);
        const first = await page.waitForFunction(() => window.__firstSeen).then((h) => h.jsonValue());
        expect(/Fraunces fd-display/.test(first || ''), `${bt} ${kind}: the look is in place when the specimen first appears (no flash)`, first);
        expect(!errors.length, `${bt} ${kind}: no page errors`, errors);
        await page.close();
      }
      const ref = results.plain;
      expect(Object.keys(ref.styles).length >= 21 && ref.mode === 'dense' && ref.fonts.some((f) => f === 'Fraunces fd-display') && ref.fonts.some((f) => f === 'Source Sans 3 fd-text') && ref.fonts.some((f) => f === 'IBM Plex Mono fd-mono'),
        `${bt}: the reference renders the recipe (dense, Fraunces / Source Sans 3 / IBM Plex Mono loaded)`, ref.mode, ref.fonts);
      expect(ref.colors.muted.toUpperCase() === globalThis.KitchenSprinkles.effective(MiseApply.clean(RECIPE)).muted.toUpperCase() && ref.colors.muted.toUpperCase() !== RECIPE.frosting.colors.muted, `${bt}: Sprinkles off → Plain grey`, ref.colors.muted);
      const dt = ref.styles['deck-time'];
      expect(dt && dt.className === 'fd-deck-time' && /Fraunces fd-display/.test(dt.fontFamily) && parseFloat(dt.fontSize) >= 24 && parseFloat(dt.fontSize) <= 38 && dt.fontWeight === '600' && dt.fontVariantNumeric === 'tabular-nums', `${bt}: an extension role (deck-time, fluid) gets its own class and values`, dt);
      expect(ref.styles['heading-xl'].fontWeight === '650', `${bt}: the title weight dial (650) reaches the headings`, ref.styles['heading-xl'].fontWeight);
      for (const kind of ['boot', 'react', 'svelte']) {
        const d = diff(ref, results[kind]);
        expect(!d.length, `${bt} ${kind}: renders the same recipe as plain HTML`, d.slice(0, 6));
      }

      // the recipe's colours hold on a dark-mode system (frosting.css has its own dark defaults)
      const dctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, colorScheme: 'dark' });
      for (const kind of ['plain', 'react']) {
        const dp = await dctx.newPage(); await dp.goto(`${srv.base}/${kind}`); await settle(dp);
        const d = diff(ref, await dp.evaluate(measure));
        expect(!d.length, `${bt} ${kind}: same recipe on a dark-mode system`, d.slice(0, 4));
      }
      await dctx.close();

      // no jump: fonts delayed 400ms on the boot page (what a Python-built page uses)
      srv.state.delayFonts = 400;
      const jctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });   // a fresh font cache
      const page = await jctx.newPage();
      await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { window.__r0 = [...document.querySelectorAll('#spec > *')].map((e) => { const r = e.getBoundingClientRect(); return [r.top, r.height]; }); window.__f0 = [...document.fonts].filter((f) => f.status === 'loaded' && / fd-/.test(f.family) && !/fallback/.test(f.family)).length; }); });
      await page.goto(`${srv.base}/boot`); await settle(page); await page.waitForTimeout(200);
      const jump = await page.evaluate(() => ({ cls: window.__cls, f0: window.__f0, move: Math.max(...[...document.querySelectorAll('#spec > *')].map((e, i) => { const r = e.getBoundingClientRect(); return Math.max(Math.abs(r.top - window.__r0[i][0]), Math.abs(r.height - window.__r0[i][1])); })) }));
      srv.state.delayFonts = 0; await jctx.close();
      expect(jump.f0 === 0, `${bt}: the jump check is real (no fontdant font loaded at DOMContentLoaded)`, jump.f0);
      expect(jump.move <= 2 && jump.cls <= 0.01, `${bt}: no jump when fonts arrive 400ms late (boot page)`, jump);
      log.push(`${bt}: plain = boot = React = Svelte across ${Object.keys(ref.styles).length} styles; no flash; late fonts move ${jump.move.toFixed(2)}px${bt === 'chromium' ? ', CLS ' + jump.cls.toFixed(4) : ''}`);
    } finally { await browser.close(); }
  }
} finally { srv.close(); }
console.log(log.join('\n'));
console.log(fails ? `FAIL: ${fails} web delivery failures` : 'PASS: web delivery — plain HTML, head boot script, React and Svelte render the same recipe (Chromium, Firefox)');
if (fails) process.exitCode = 1;
