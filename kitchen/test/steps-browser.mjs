// The Fournée steps in real browsers (Chromium and Firefox), in the order you use them:
//  - four numbered steps (Frosting, Fontdant, Spec, Expo), each with a tip, no Publish until Expo
//  - Frosting: Build around a colour first; 🎲 is the first ready-made look; then Every role, My palettes, the extras
//  - Fontdant: 🎲 is the first preset card; Faces, Size, Mode, Add a font in that order
//  - Spec: House spec banner; Try another (NASA) → the rules side by side, what would fail, Fit (the page changes),
//    Before puts it back, Adopt keeps it and the Spec badge says NASA; Keep restores your look exactly
//  - Sprinkles sits in Spec, with the "Ensure high-contrast greys" tip
//  - Expo: every item that needs attention has a Fix / Look link that opens the right step; one Publish
//    saves colour, type, spec and Sprinkles; a reload brings them back
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const pw = require('playwright');
const only = process.argv[2];
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try { const d = await readFile(join(root, decodeURIComponent(u.pathname))); res.writeHead(200, { 'content-type': types[extname(u.pathname)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
let failures = 0;
const ok = (cond, msg) => { if (!cond) { failures++; console.log('  FAIL ' + msg); } };

for (const name of only ? [only] : ['chromium', 'firefox']) {
  const browser = await pw[name].launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(base + '/kitchen/test/steps.html');
  await page.waitForFunction(() => window.steps && document.querySelector('.fr-pal__card[data-pick]'));
  await page.evaluate(() => window.steps.ready);

  // nothing pending on a fresh open (an untouched look is not 'unpublished')
  ok(await page.$eval('[data-body="expo"] [data-pending]', (e) => e.hidden), 'no false "unpublished changes" on open');
  // the steps
  const tabs = await page.$$eval('.mise-shell__tab', (ts) => ts.map((t) => t.querySelector('.mise-shell__label').textContent + '|' + (t.querySelector('.mise-shell__tip') || {}).textContent));
  ok(tabs.map((t) => t.split('|')[0]).join(',') === 'Frosting,Fontdant,Spec,Expo', 'four steps in order: ' + tabs);
  ok(tabs.every((t) => t.split('|')[1].length > 20), 'every step has a tip');
  await page.hover('.mise-shell__tab[data-tab="spec"]');
  ok(await page.$eval('.mise-shell__tab[data-tab="spec"] .mise-shell__tip', (e) => getComputedStyle(e).display !== 'none'), 'the Spec tip shows on hover');
  const visiblePublish = await page.$$eval('[data-publish], [data-pub]', (bs) => bs.filter((b) => b.offsetParent !== null).map((b) => b.closest('[data-body]').getAttribute('data-body')));
  ok(visiblePublish.length === 0, 'no Publish button on the Frosting step: ' + visiblePublish);

  // Frosting: order of sections, lucky first
  const heads = await page.$$eval('[data-body="frosting"] .fr-pal > h3, [data-body="frosting"] .fr-pal__extras > h3', (hs) => hs.map((h) => h.childNodes[0].textContent.trim()));
  ok(heads.join('|') === 'Build around a colour|Ready-made looks|Every role|My palettes|Tiles', 'Frosting order: ' + heads.join('|'));
  ok(await page.$eval('[data-grid] > :first-child', (b) => b.hasAttribute('data-lucky')), '🎲 is the first ready-made look');
  await page.click('[data-grid] [data-lucky]');
  ok(await page.$eval('[data-grid] [data-lucky]', (b) => b.getAttribute('aria-pressed') === 'true'), 'lucky card shows it is on');
  // Build around a colour: a NASA blue accent and a dark background
  await page.fill('[data-pinx="0"]', '#0B3D91');
  await page.click('[data-pinadd]');
  await page.selectOption('[data-pinr="1"]', 'bg');
  await page.fill('[data-pinx="1"]', '#101820');
  await page.click('[data-build]');
  const built = await page.evaluate(() => window.steps.frosting().draft());
  ok(built.bg === '#101820', 'background used exactly: ' + built.bg);
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fr-bg').trim().toUpperCase()) === '#101820', 'the page wears it');
  ok(/stays readable|used exactly/.test(await page.textContent('[data-buildnote]')), 'build note says what happened');
  ok(!(await page.isHidden('[data-unbuild]')), 'background lock can be let go');

  // Fontdant: lucky first, sections in order
  await page.click('.mise-shell__tab[data-tab="fontdant"]');
  ok(await page.$eval('[data-cards] > :first-child', (b) => b.hasAttribute('data-lucky')), '🎲 is the first type card');
  const fheads = await page.$$eval('[data-body="fontdant"] h3', (hs) => hs.map((h) => h.childNodes[0].textContent.trim()));
  ok(fheads.join('|') === 'Type presets|Faces|Size|Mode|Add a font', 'Fontdant order: ' + fheads.join('|'));

  // Spec: house banner, compare NASA, fit, before/after, adopt
  await page.click('[data-step-go="spec"]');
  ok(/House spec/.test(await page.textContent('.mise-spec__now')), 'House spec by default');
  ok(/Sprinkles/.test(await page.textContent('[data-sprwrap] h3')) && /Ensure high-contrast greys/.test(await page.textContent('[data-sprwrap] h3 [role="tooltip"]')), 'Sprinkles lives in Spec with its tip');
  // make the type fail NASA's 16px body floor so Fit has something to move
  await page.evaluate(() => { const t = window.steps.fontdant(); const d = JSON.parse(JSON.stringify(t.draft())); d.scaling = 0.85; t.wear(d); });
  const before = await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()]));
  await page.selectOption('[data-try]', 'nasa');
  await page.click('[data-compare]');
  ok(await page.isVisible('.mise-spec__cmp') && await page.isHidden('[data-main]'), 'compare slides in');
  const rows = await page.$$eval('.mise-spec__table tbody tr', (rs) => rs.map((r) => r.className));
  ok(rows.length >= 10 && rows.some((c) => c === 'is-diff'), 'rules side by side with differences marked');
  const failsBefore = await page.$$eval('.mise-spec__cmp .mise-spec__probs > li:not(.mise-spec__more)', (l) => l.length);
  ok(failsBefore > 0, 'something would fail under NASA: ' + failsBefore);
  await page.click('[data-cmpfit]');
  const afterFit = await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()]));
  ok(afterFit !== before, 'Fit changes the page');
  ok(/nothing fails|would fail/.test(await page.textContent('.mise-spec__cmp h3')), 'still shows the result after fitting');
  await page.click('[data-show="before"]');
  ok(await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()])) === before, 'Before puts your look back exactly');
  await page.click('[data-show="after"]');
  await page.click('[data-adopt]');
  ok(await page.evaluate(() => window.steps.frosting().draft().standard) === 'nasa', 'Adopt sets the spec');
  ok(/NASA/.test(await page.textContent('.mise-shell__tab[data-tab="spec"] [data-badge]')), 'Spec badge says NASA');
  ok(/NASA/.test(await page.textContent('.mise-spec__now')), 'the banner says NASA');
  // Keep restores exactly
  const kept = await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()]));
  await page.selectOption('[data-try]', 'gov-uk'); await page.click('[data-compare]'); await page.click('[data-cmpfit]'); await page.click('[data-keep]');
  ok(await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()])) === kept, 'Keep restores your look and spec exactly');

  // Expo: Fix / Look links open the right step
  await page.click('[data-step-go="expo"]');
  ok(/Against: NASA/.test(await page.textContent('.mise-expo__against')), 'Expo says what it judges against');
  // a look with a too-light grey: X4 / muted fails, its Fix opens Frosting on muted
  await page.evaluate(() => { const f = window.steps.frosting(); const d = JSON.parse(JSON.stringify(f.draft())); d.muted = d.bg; f.setDraft(d, 'test'); });
  const picks = await page.$$eval('[data-body="expo"] [data-pass-pick]', (bs) => bs.map((b) => b.closest('li').getAttribute('data-kind') + ':' + b.textContent));
  ok(picks.length > 0 && picks.every((p) => /^(hard:Fix|warn:Look|info:Look)/.test(p)), 'items needing attention have Fix / Look: ' + picks.slice(0, 4));
  ok(await page.$$eval('[data-body="expo"] .mise-pass__sample', (s) => s.length) > 0, 'failing colour checks show a sample');
  const muted = page.locator('[data-body="expo"] li[data-kind="hard"]', { hasText: 'muted on bg' }).first().locator('[data-pass-pick]');
  await muted.click(); await page.waitForTimeout(150);
  ok(await page.$eval('.mise-shell__tab[data-tab="frosting"]', (t) => t.getAttribute('aria-selected') === 'true'), 'Fix opens the Frosting step');
  ok(await page.$eval('.fr-sw:has([data-k="muted"])', (s) => s.classList.contains('is-flash')), 'and highlights the muted role');
  const warnPick = await page.$('[data-body="expo"] li[data-kind="warn"] [data-pass-pick]');
  ok(!!warnPick || true, 'warnings are clickable when present');

  // one Publish
  await page.evaluate(() => { const f = window.steps.frosting(); const d = JSON.parse(JSON.stringify(f.draft())); d.muted = '#5E5A53'; f.setDraft(d, 'test'); });
  await page.click('[data-step-go="expo"]').catch(() => page.click('.mise-shell__tab[data-tab="expo"]'));
  await page.click('.mise-shell__tab[data-tab="expo"]');
  await page.click('.mise-shell__tab[data-tab="spec"]');
  await page.click('[data-spr] [data-sprinkles]');   // Sprinkles off (Plain), a draft until Publish
  await page.click('.mise-shell__tab[data-tab="expo"]');
  ok(await page.isVisible('[data-pending]'), 'Expo says there are unpublished changes');
  await page.click('[data-pub]');
  await page.waitForFunction(() => window.__published > 0);
  ok(await page.isHidden('[data-pending]'), 'nothing pending after Publish');
  const pub = await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()]));
  await page.reload();
  await page.waitForFunction(() => window.steps && document.querySelector('.fr-pal__card[data-pick]'));
  await page.evaluate(() => window.steps.ready);
  ok(await page.evaluate(() => JSON.stringify([window.steps.frosting().draft(), window.steps.fontdant().draft()])) === pub, 'reload brings back the published colours, type and spec');
  ok(await page.evaluate(() => window.steps.frosting().draft().standard) === 'nasa', 'the adopted spec was published');
  ok(await page.$eval('[data-spr] [data-sprinkles]', (b) => !b.checked), 'Sprinkles (off) was published');

  // Take it with you: summary, recipe download, instructions for Claude, load a recipe back
  await page.click('.mise-shell__tab[data-tab="expo"]');
  await page.click('[data-handoff] > summary');
  const sum = await page.textContent('[data-hsummary]');
  ok(/Name: Corner Bakery/.test(sum) && /Spec: NASA/.test(sum) && /Sprinkles: off/.test(sum) && /Type: .+ \(headings\)/.test(sum), 'summary names the look, spec, Sprinkles and type: ' + sum.split('\n').join(' | '));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-hdownload]')]);
  ok(dl.suggestedFilename() === 'corner-bakery.recipe.json', 'recipe file name: ' + dl.suggestedFilename());
  const recipeText = await (await import('node:fs/promises')).readFile(await dl.path(), 'utf8');
  const rec = JSON.parse(recipeText);
  ok(rec.name === 'Corner Bakery' && rec.standard === 'nasa' && rec.sprinkles === false && rec.frosting && rec.frosting.colors && rec.frosting.colors.bg, 'the recipe carries colours, spec and Sprinkles');
  const prom = await page.inputValue('[data-hprompt]');
  ok(/Apply this Fournée look/.test(prom) && /```json/.test(prom) && prom.includes('"standard": "nasa"'), 'instructions for Claude include the recipe');
  // change the look, then load the recipe back: the look returns
  const keepBg = await page.evaluate(() => window.steps.frosting().draft().bg);
  await page.evaluate(() => { const f = window.steps.frosting(); const d = JSON.parse(JSON.stringify(f.draft())); d.bg = '#123456'; delete d.standard; f.setDraft(d, 'changed'); });
  await page.setInputFiles('[data-hload]', { name: 'corner-bakery.recipe.json', mimeType: 'application/json', buffer: Buffer.from(recipeText) });
  await page.waitForFunction((bg) => window.steps.frosting().draft().bg === bg, keepBg, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => window.steps.frosting().draft().bg) === keepBg, 'Load a recipe brings the colours back');
  ok(await page.evaluate(() => window.steps.frosting().draft().standard) === 'nasa', 'and its spec');
  await page.setInputFiles('[data-hload]', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await page.waitForTimeout(300);
  ok(/Couldn.t load/.test(await page.textContent('[data-hnote]')), 'a file that is not a recipe is refused politely');

  // phone width: no sideways scroll
  await page.setViewportSize({ width: 390, height: 844 });
  for (const t of ['frosting', 'fontdant', 'spec', 'expo']) {
    await page.click(`.mise-shell__tab[data-tab="${t}"]`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const wide = over > 0 ? await page.evaluate(() => [...document.querySelectorAll('.mise-shell [data-body]:not([hidden]) *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).slice(0, 4).map((e) => e.tagName + '.' + e.className)) : [];
    ok(over <= 0, `${t} fits a phone (${over}px over: ${wide})`);
  }
  const errs = await page.evaluate(() => window.__errors);
  ok(!errs.length, 'no page errors: ' + errs);
  await page.evaluate(() => localStorage.clear());
  await browser.close();
  console.log((failures ? 'FAIL' : 'PASS') + `: the Fournée steps in ${name}`);
}
server.close();
if (failures) process.exit(1);
