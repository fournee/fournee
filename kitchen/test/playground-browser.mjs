// The playground (scripts/try-the-panel.cmd → scripts/playground.mjs → kitchen/demo/), in Chromium and Firefox:
// the server starts, the sample page and all three tabs load with no errors, a type preset and a colour look reach
// the bakery page, Sprinkles waits for Publish, High contrast works, and "Start over" clears everything.
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const pw = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const srv = spawn(process.execPath, [join(root, 'scripts', 'playground.mjs'), '--no-open', '--port', '4700'], { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
const url = await new Promise((resolve, reject) => {
  let out = ''; const t = setTimeout(() => reject(new Error('playground did not start: ' + out)), 15000);
  srv.stdout.on('data', (d) => { out += d; const m = out.match(/running at (\S+)/); if (m) { clearTimeout(t); resolve(m[1]); } });
  srv.on('exit', (c) => reject(new Error('playground exited ' + c + ': ' + out)));
});

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const results = [];
try {
  for (const bt of ['chromium', 'firefox']) {
    const before = fails;
    const browser = await pw[bt].launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
      await page.goto(url); await page.waitForFunction(() => window.shell && window.spr);
      const h1Font = () => page.evaluate(() => getComputedStyle(document.querySelector('.cb-hero h1')).fontFamily);
      const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const muted = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fr-muted').trim().toUpperCase());

      // type: a preset reaches the bakery page
      await page.click('[data-tab="fontdant"]'); await page.evaluate(() => shell.tab('fontdant').ready);
      const fontBefore = await h1Font();
      const i = await page.evaluate(() => FontdantGallery.PRESETS.findIndex((p) => p.name === 'Editorial'));
      await page.click(`[data-fdpick="${i}"]`);
      expect(/Fraunces/.test(await h1Font()) && (await h1Font()) !== fontBefore, bt + ': a type preset reaches the bakery headline', await h1Font());

      // colours: a frosting look reaches the page
      await page.click('[data-tab="frosting"]');
      const bg0 = await bg();
      const cards = await page.$$('.fr-pal [data-pick]');
      for (const c of cards.slice(1)) { await c.click(); if ((await bg()) !== bg0) break; }
      expect((await bg()) !== bg0, bt + ': a colour look reaches the bakery page', bg0, await bg());

      // Sprinkles waits for Publish
      const designed = await muted();
      await page.click('[data-sprinkles]');
      const pending = await page.evaluate(() => !document.querySelector('[data-sprinkles-pending]').hidden);
      expect(pending && (await muted()) !== designed, bt + ': Sprinkles off shows Plain here, marked "Not published yet"');
      await page.click('.fr-pal [data-publish]');
      await page.waitForFunction(() => document.querySelector('[data-sprinkles-pending]').hidden, null, { timeout: 5000 }).catch(() => {});
      expect(await page.evaluate(() => localStorage.getItem('mise-playground.sprinkles')) === 'false', bt + ': the colours\' Publish publishes Sprinkles too');

      // the pass tab renders a verdict
      await page.click('[data-tab="pass"]');
      await page.waitForFunction(() => document.querySelector('[data-tab="pass"]').textContent.match(/ok|warn|failing/), null, { timeout: 15000 });
      expect(true);

      // High contrast switch
      await page.click('.mise-contrast');
      expect(await page.getAttribute('html', 'data-mise-contrast') === 'more', bt + ': High contrast switch sets the page to more');

      // Start over clears everything
      await page.click('[data-pg-reset]'); await page.waitForFunction(() => window.shell && window.spr);
      const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('mise-playground')));
      expect(left.length === 0 && (await bg()) === bg0, bt + ': "Start over" clears the playground', left);

      // phone width: no sideways scroll
      await page.setViewportSize({ width: 390, height: 800 });
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways <= 0, bt + ': no sideways scroll at 390px', sideways);

      expect(!errors.length, bt + ': no page errors', errors);
    } catch (e) { fails++; console.log('FAIL', bt, 'crashed:', e.message.split('\n')[0]); }
    finally { await browser.close(); }
    results.push(bt + (fails === before ? ' ✓' : ' ✗'));
  }
} finally { srv.kill(); }
console.log(fails ? `FAIL: ${fails} playground failures (${results.join(', ')})` : `PASS: the playground: server, sample page, three tabs, Sprinkles publish, High contrast, start over, 390px (${results.join(', ')})`);
if (fails) process.exitCode = 1;
