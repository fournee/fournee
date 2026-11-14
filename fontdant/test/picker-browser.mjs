// The face picker in the Fontdant tab (v1.4.0): per slot an ARIA tablist (Sans, Serif, Decorative, Mono) over preview cards.
//  - tabs per slot: text = Sans + Serif, display = all four, mono = Mono only
//  - picking a card sets that slot's face; opening a slot selects the tab holding the current face
//  - the dice inside a tab picks any font of that tab, for that slot only
//  - arrow keys, Home and End move between tabs; the user's own fonts sit in the tab that matches them
//  - fonts load when their tab is opened, not up front; no text under 12px
//   node test/picker-browser.mjs   (Chromium and Firefox via Playwright)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try { const d = await readFile(join(root, decodeURIComponent(u.pathname))); res.writeHead(200, { 'content-type': types[extname(u.pathname)] || 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };

const tabsOf = (page, slot) => page.$$eval(`[data-slot="${slot}"] [role="tab"]`, (ts) => ts.map((t) => t.textContent.trim()));
const selectedTab = (page, slot) => page.$eval(`[data-slot="${slot}"] [role="tab"][aria-selected="true"]`, (t) => t.getAttribute('data-tab'));
const facesIn = (page, slot) => page.$$eval(`[data-slot="${slot}"] [role="tabpanel"]:not([hidden]) [data-face]`, (cs) => cs.map((c) => c.getAttribute('data-face')));
const draftFaces = (page) => page.evaluate(() => window.panel.draft().faces || {});
const text = (page, sel) => page.$eval(sel, (c) => c.textContent);

for (const [name, type] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await page.goto(`${base}/fontdant/test/picker.html`);
    await page.evaluate(() => window.panel.ready);

    // tab visibility per slot
    expect(JSON.stringify(await tabsOf(page, 'text')) === '["Sans","Serif"]', name, 'text slot tabs', await tabsOf(page, 'text'));
    expect(JSON.stringify(await tabsOf(page, 'display')) === '["Sans","Serif","Decorative","Mono"]', name, 'display slot tabs', await tabsOf(page, 'display'));
    expect(JSON.stringify(await tabsOf(page, 'mono')) === '["Mono"]', name, 'mono slot tabs', await tabsOf(page, 'mono'));
    expect(await page.$('select[data-slot]') === null, name, 'the face <select> is gone');
    expect(await page.$$eval('[role="tablist"]', (l) => l.length) === 3, name, 'one tablist per slot');

    // opening a slot selects the tab holding the current face
    await page.evaluate(() => window.panel.wear({ faces: { display: 'anton', text: 'lora', mono: 'jetbrains-mono' } }));
    expect(await selectedTab(page, 'display') === 'decorative', name, 'display on Anton opens Decorative', await selectedTab(page, 'display'));
    expect(await selectedTab(page, 'text') === 'serif', name, 'text on Lora opens Serif', await selectedTab(page, 'text'));
    expect((await facesIn(page, 'display')).includes('anton'), name, 'the Decorative panel lists Anton');
    expect(await page.$eval('[data-slot="display"] [data-face="anton"]', (c) => c.getAttribute('aria-pressed')) === 'true', name, 'the current face card is pressed');
    const bungee = await page.evaluate(() => window.FontdantLibrary.fonts.bungee.lucky);
    const bungeeCard = await text(page, '[data-slot="display"] [data-face="bungee"]');
    expect(bungee === false && /Bungee/.test(bungeeCard) && /Aa/.test(bungeeCard) && /maybe/.test(bungeeCard), name, 'a non-lucky card shows name, Aa and (maybe)', bungeeCard);
    expect(!/maybe/.test(await text(page, '[data-slot="display"] [data-face="anton"]')) === (await page.evaluate(() => window.FontdantLibrary.fonts.anton.lucky)), name, 'a lucky card carries no (maybe)');

    // picking a card sets the face (and nothing else)
    await page.click('[data-slot="display"] [role="tab"][data-tab="serif"]');
    await page.click('[data-slot="display"] [data-face="fraunces"]');
    const f1 = await draftFaces(page);
    expect(f1.display === 'fraunces' && f1.text === 'lora' && f1.mono === 'jetbrains-mono', name, 'picking Fraunces sets display only', f1);
    expect(await page.$eval('[data-slot="display"] [data-face="fraunces"]', (c) => c.getAttribute('aria-pressed')) === 'true', name, 'the picked card is pressed');
    // a font that cannot serve a slot is not offered there
    await page.click('[data-slot="text"] [role="tab"][data-tab="sans"]');
    const textFaces = await facesIn(page, 'text');
    expect(textFaces.length > 5 && !textFaces.includes('anton') && !textFaces.includes('jetbrains-mono'), name, 'text slot offers no decorative or mono', textFaces);

    // dice: any font in this tab, for this slot only
    const tabIds = await page.evaluate(() => Object.values(window.FontdantLibrary.fonts).reduce((o, e) => { if (e.slots.includes('display')) (o[e.tab] = o[e.tab] || []).push(e.id); return o; }, {}));
    const seen = new Set();
    await page.click('[data-slot="display"] [role="tab"][data-tab="decorative"]');
    for (let i = 0; i < 25; i++) { await page.click('[data-slot="display"] [data-dice]'); seen.add((await draftFaces(page)).display); }
    expect([...seen].every((id) => tabIds.decorative.includes(id)), name, 'dice stays inside the Decorative tab', [...seen]);
    expect(seen.size > 1, name, 'dice varies (and reaches non-lucky fonts)', [...seen]);
    const f2 = await draftFaces(page);
    expect(f2.text === 'lora' && f2.mono === 'jetbrains-mono', name, 'dice leaves the other slots alone', f2);
    expect(await selectedTab(page, 'display') === 'decorative', name, 'still in the Decorative tab after rolling');
    const seenText = new Set();
    await page.click('[data-slot="text"] [role="tab"][data-tab="sans"]');
    for (let i = 0; i < 15; i++) { await page.click('[data-slot="text"] [data-dice]'); seenText.add((await draftFaces(page)).text); }
    const textSans = await page.evaluate(() => Object.values(window.FontdantLibrary.fonts).filter((e) => e.tab === 'sans' && e.slots.includes('text')).map((e) => e.id));
    expect([...seenText].every((id) => textSans.includes(id)), name, 'text dice stays in Sans for the text slot', [...seenText]);

    // keyboard: arrows, Home, End on the tablist
    await page.click('[data-slot="display"] [role="tab"][data-tab="sans"]');
    await page.focus('[data-slot="display"] [role="tab"][aria-selected="true"]');
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page, 'display') === 'serif', name, 'ArrowRight to Serif', await selectedTab(page, 'display'));
    expect(await page.evaluate(() => document.activeElement.getAttribute('data-tab')) === 'serif', name, 'focus follows the tab');
    await page.keyboard.press('End');
    expect(await selectedTab(page, 'display') === 'mono', name, 'End to Mono');
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page, 'display') === 'sans', name, 'ArrowRight wraps to Sans');
    await page.keyboard.press('ArrowLeft');
    expect(await selectedTab(page, 'display') === 'mono', name, 'ArrowLeft wraps to Mono');
    await page.keyboard.press('Home');
    expect(await selectedTab(page, 'display') === 'sans', name, 'Home to Sans');
    expect(await page.$$eval('[data-slot="display"] [role="tab"]', (ts) => ts.map((t) => t.tabIndex).join()) === '0,-1,-1,-1', name, 'roving tabindex');
    expect(await page.$eval('[data-slot="display"] [role="tab"][aria-selected="true"]', (t) => !!document.getElementById(t.getAttribute('aria-controls'))), name, 'tab controls its panel');

    // fonts load with their tab, not up front
    const p2 = await browser.newPage();
    await p2.goto(`${base}/fontdant/test/picker.html`); await p2.evaluate(() => window.panel.ready);
    const css = () => p2.evaluate(() => (document.getElementById('fontdant-picker') || { textContent: '' }).textContent);   // the picker's own @font-face style
    const before = await css();
    expect(!/"Bungee fd-display"/.test(before) && !/"Anton fd-display"/.test(before), name, 'Decorative families are not loaded before their tab is opened');
    await p2.click('[data-slot="display"] [role="tab"][data-tab="decorative"]');
    expect(/"Bungee fd-display"/.test(await css()), name, 'opening Decorative loads its families');
    await p2.close();

    // the user's own fonts sit in the matching tab
    const p3 = await browser.newPage();
    await p3.goto(`${base}/fontdant/test/picker.html?own=1`); await p3.evaluate(() => window.panel.ready);
    await p3.click('[data-slot="display"] [role="tab"][data-tab="serif"]');
    expect((await facesIn(p3, 'display')).includes('my-serif'), name, 'own serif font is in the Serif tab');
    const grp = await p3.$$eval('[data-slot="display"] [role="tabpanel"]:not([hidden]) [role="group"]', (gs) => gs.map((g) => ({ label: document.getElementById(g.getAttribute('aria-labelledby'))?.textContent, faces: [...g.querySelectorAll('[data-face]')].map((f) => f.getAttribute('data-face')), name: g.querySelector('.fd-face__name')?.textContent })));
    expect(grp.length === 1 && grp[0].label === 'Your fonts · Acme' && grp[0].faces.join() === 'my-serif', name, 'it sits in a "Your fonts · Acme" group, alone', grp);
    expect(!/Your fonts/.test(grp[0]?.name || ''), name, 'the card name carries no Your fonts suffix', grp);
    const order = await p3.evaluate(() => { const c = [...document.querySelectorAll('[data-slot="display"] [role="tabpanel"]:not([hidden]) [data-face]')]; return c.findIndex((x) => x.closest('[role="group"]')) > c.findIndex((x) => !x.closest('[role="group"]')); });
    expect(order, name, 'the group follows the library cards');
    await p3.click('[data-slot="display"] [role="tab"][data-tab="sans"]');
    expect(!(await facesIn(p3, 'display')).includes('my-serif'), name, 'own serif font is not in Sans');
    await p3.click('[data-slot="display"] [role="tab"][data-tab="serif"]');
    await p3.click('[data-slot="display"] [data-face="my-serif"]');
    expect((await draftFaces(p3)).display === 'my-serif', name, 'picking the own font sets the face');
    await p3.close();

    // compact cards: several per row at the playground's slot-picker width
    const p5 = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await p5.goto(`${base}/fontdant/test/picker.html`); await p5.evaluate(() => window.panel.ready);
    await p5.click('[data-slot="text"] [role="tab"][data-tab="sans"]');
    for (const w of [266, 560]) {
      await p5.addStyleTag({ content: `.fd-pick[data-slot="text"], [data-slot="text"] > .fd-pick { width: ${w}px !important; }` });
      const perRow = await p5.$$eval('[data-slot="text"] [role="tabpanel"]:not([hidden]) [data-face]', (cs) => { const top = cs[0].getBoundingClientRect().top; return cs.filter((c) => Math.abs(c.getBoundingClientRect().top - top) < 4).length; });
      expect(perRow >= (w > 400 ? 3 : 2), name, `cards per row at ${w}px`, perRow);
    }
    await p5.close();

    // nothing under 12px, light and dark (visible picker text)
    for (const scheme of ['light', 'dark']) {
      const p4 = await browser.newPage({ colorScheme: scheme });
      await p4.goto(`${base}/fontdant/test/picker.html`); await p4.evaluate(() => window.panel.ready);
      if (scheme === 'dark') await p4.evaluate(() => { var T = window.FrostingTokens; if (T && T.dark) Object.keys(T.dark).forEach((k) => document.documentElement.style.setProperty('--fr-' + k, T.dark[k])); });
      const small = await p4.$$eval('[data-slot] *', (els) => els.filter((e) => e.offsetParent !== null && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.className + ' ' + getComputedStyle(e).fontSize));
      expect(small.length === 0, name, scheme, 'text under 12px in the picker', small.slice(0, 5));
      await p4.close();
    }
    console.log(`${name}: picker tabs, cards, dice, keyboard, own fonts, lazy load, 12px floor checked`);
  } finally { await browser.close(); }
}
server.close();
console.log(fails ? `FAIL: ${fails} picker failures` : 'PASS: face picker tabs (Chromium, Firefox)');
if (fails) process.exitCode = 1;
