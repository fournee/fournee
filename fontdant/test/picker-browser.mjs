// The Faces picker in the Fontdant tab: ONE picker. "Choosing for" Headings / Body / Code over one row of four tabs
//  (Sans, Serif, Decorative, Mono; tabs the slot cannot use are disabled, not hidden) over preview cards.
//  - picking a card sets the chosen slot face; opening a slot selects the tab holding its current face
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

const P = '[data-pick]';
const slotSel = (page, slot) => page.click(`${P} [data-slotsel="${slot}"]`);
const tabInfo = (page) => page.$$eval(`${P} [role="tab"]`, (ts) => ts.map((t) => ({ label: t.textContent.trim(), disabled: t.getAttribute('aria-disabled') === 'true', top: Math.round(t.getBoundingClientRect().top), title: t.getAttribute('title') })));
const enabledTabs = async (page) => (await tabInfo(page)).filter((t) => !t.disabled).map((t) => t.label);
const selectedTab = (page) => page.$eval(`${P} [role="tab"][aria-selected="true"]`, (t) => t.getAttribute('data-tab'));
const facesIn = (page) => page.$$eval(`${P} [role="tabpanel"] [data-face]`, (cs) => cs.map((c) => c.getAttribute('data-face')));
const draftFaces = (page) => page.evaluate(() => window.panel.draft().faces || {});
const text = (page, sel) => page.$eval(sel, (c) => c.textContent);
const rowOf = (page) => page.$$eval(`${P} [role="tabpanel"] [data-face]`, (cs) => { const top = cs[0].getBoundingClientRect().top; return cs.filter((c) => Math.abs(c.getBoundingClientRect().top - top) < 4).length; });

for (const [name, type] of [['chromium', chromium], ['firefox', firefox]]) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await page.goto(`${base}/fontdant/test/picker.html`);
    await page.evaluate(() => window.panel.ready);

    // ONE picker: one tablist, four tabs in a single row, disabled (not hidden) per slot, "Choosing for" switch
    expect(await page.$$eval('[role="tablist"]', (l) => l.length) === 1, name, 'exactly one tablist');
    expect(await page.$('select[data-slot]') === null, name, 'the face <select> is gone');
    const sw = await page.$$eval(`${P} [data-slotsel]`, (b) => b.map((x) => x.querySelector('span').textContent));
    expect(sw.join() === 'Headings,Body,Code', name, 'Choosing for: Headings, Body, Code', sw);
    expect(JSON.stringify((await tabInfo(page)).map((t) => t.label)) === '["Sans","Serif","Decorative","Mono"]', name, 'always four tabs', await tabInfo(page));
    const rowTops = (await tabInfo(page)).map((t) => t.top);
    expect(new Set(rowTops).size === 1, name, 'four tabs share one row', rowTops);
    expect(JSON.stringify(await enabledTabs(page)) === '["Sans","Serif","Decorative","Mono"]', name, 'Headings: all four tabs enabled');
    await slotSel(page, 'text');
    expect(JSON.stringify(await enabledTabs(page)) === '["Sans","Serif"]', name, 'Body: Sans and Serif enabled', await tabInfo(page));
    const dis = (await tabInfo(page)).filter((t) => t.disabled);
    expect(dis.length === 2 && dis.every((t) => /Body/.test(t.title || '')), name, 'Body: Decorative and Mono disabled with a title', dis);
    expect(await page.$$eval(`${P} [role="tab"][aria-disabled="true"]`, (ts) => ts.every((t) => t.tabIndex === -1)), name, 'disabled tabs are not focusable');
    await slotSel(page, 'mono');
    expect(JSON.stringify(await enabledTabs(page)) === '["Mono"]' && (await selectedTab(page)) === 'mono', name, 'Code: only Mono, and it is selected', await tabInfo(page));
    await slotSel(page, 'display');
    // a click on a disabled tab does nothing
    await slotSel(page, 'text'); await page.click(`${P} [role="tab"][data-tab="decorative"]`, { force: true });
    expect((await selectedTab(page)) !== 'decorative', name, 'a disabled tab cannot be opened');
    await slotSel(page, 'display');

    // opening a slot selects the tab holding that slot's current face
    await page.evaluate(() => window.panel.wear({ faces: { display: 'anton', text: 'lora', mono: 'jetbrains-mono' } }));
    expect(await selectedTab(page) === 'decorative', name, 'Headings on Anton opens Decorative', await selectedTab(page));
    expect((await facesIn(page)).includes('anton'), name, 'the Decorative panel lists Anton');
    expect(await page.$eval(`${P} [data-face="anton"]`, (c) => c.getAttribute('aria-pressed')) === 'true', name, 'the current face card is pressed');
    const nameShown = await page.$eval(`${P} [data-slotsel="display"] small`, (n) => n.textContent);
    expect(/Anton/.test(nameShown), name, 'the switch shows the current face name', nameShown);
    const bungee = await page.evaluate(() => window.FontdantLibrary.fonts.bungee.lucky);
    const bungeeCard = await text(page, `${P} [data-face="bungee"]`);
    expect(bungee === false && /Bungee/.test(bungeeCard) && /Aa Gg/.test(bungeeCard) && /maybe/.test(bungeeCard), name, 'a non-lucky card shows name, Aa Gg and (maybe)', bungeeCard);
    expect(!/maybe/.test(await text(page, `${P} [data-face="anton"]`)) === (await page.evaluate(() => window.FontdantLibrary.fonts.anton.lucky)), name, 'a lucky card carries no (maybe)');
    await slotSel(page, 'text');
    expect(await selectedTab(page) === 'serif', name, 'Body on Lora opens Serif', await selectedTab(page));
    await slotSel(page, 'display');

    // picking a card sets the chosen slot's face (and nothing else)
    await page.click(`${P} [role="tab"][data-tab="serif"]`);
    await page.click(`${P} [data-face="fraunces"]`);
    const f1 = await draftFaces(page);
    expect(f1.display === 'fraunces' && f1.text === 'lora' && f1.mono === 'jetbrains-mono', name, 'picking Fraunces sets headings only', f1);
    expect(await page.$eval(`${P} [data-face="fraunces"]`, (c) => c.getAttribute('aria-pressed')) === 'true', name, 'the picked card is pressed');
    // switching slot changes which face a click sets
    await slotSel(page, 'text');
    await page.click(`${P} [role="tab"][data-tab="sans"]`);
    const textFaces = await facesIn(page);
    expect(textFaces.length > 5 && !textFaces.includes('anton') && !textFaces.includes('jetbrains-mono'), name, 'Body offers no decorative or mono', textFaces);
    const pickText = textFaces.find((id) => id !== 'lora');
    await page.click(`${P} [data-face="${pickText}"]`);
    const f1b = await draftFaces(page);
    expect(f1b.text === pickText && f1b.display === 'fraunces', name, 'with Body chosen, a click sets the text face only', f1b);
    await slotSel(page, 'mono');
    const monoFaces = await facesIn(page);
    expect(monoFaces.length > 1 && !monoFaces.includes('lora'), name, 'Code lists mono faces', monoFaces);
    await slotSel(page, 'display');

    // dice: any font in this tab, for the chosen slot only
    const tabIds = await page.evaluate(() => Object.values(window.FontdantLibrary.fonts).reduce((o, e) => { if (e.slots.includes('display')) (o[e.tab] = o[e.tab] || []).push(e.id); return o; }, {}));
    const seen = new Set();
    await page.click(`${P} [role="tab"][data-tab="decorative"]`);
    const before = await draftFaces(page);
    for (let i = 0; i < 25; i++) { await page.click(`${P} [data-dice]`); seen.add((await draftFaces(page)).display); }
    expect([...seen].every((id) => tabIds.decorative.includes(id)), name, 'dice stays inside the Decorative tab', [...seen]);
    expect(seen.size > 1, name, 'dice varies (and reaches non-lucky fonts)', [...seen]);
    const f2 = await draftFaces(page);
    expect(f2.text === before.text && f2.mono === before.mono, name, 'dice leaves the other slots alone', f2);
    expect(await selectedTab(page) === 'decorative', name, 'still in the Decorative tab after rolling');
    const dice = await page.$$eval(`${P} [data-dice]`, (d) => d.length);
    expect(dice === 1 && await page.$eval(`${P} [data-dice]`, (d) => { const l = d.parentNode.getBoundingClientRect(), r = d.getBoundingClientRect(); return l.right - r.right < 8; }), name, 'one dice, at the right end of the tab row');
    await slotSel(page, 'text');
    await page.click(`${P} [role="tab"][data-tab="sans"]`);
    const seenText = new Set();
    for (let i = 0; i < 15; i++) { await page.click(`${P} [data-dice]`); seenText.add((await draftFaces(page)).text); }
    const textSans = await page.evaluate(() => Object.values(window.FontdantLibrary.fonts).filter((e) => e.tab === 'sans' && e.slots.includes('text')).map((e) => e.id));
    expect([...seenText].every((id) => textSans.includes(id)), name, 'text dice stays in Sans for the text slot', [...seenText]);
    await slotSel(page, 'display');

    // keyboard: arrows, Home, End on the tablist
    await page.click(`${P} [role="tab"][data-tab="sans"]`);
    await page.focus(`${P} [role="tab"][aria-selected="true"]`);
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page) === 'serif', name, 'ArrowRight to Serif', await selectedTab(page));
    expect(await page.evaluate(() => document.activeElement.getAttribute('data-tab')) === 'serif', name, 'focus follows the tab');
    await page.keyboard.press('End');
    expect(await selectedTab(page) === 'mono', name, 'End to Mono');
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page) === 'sans', name, 'ArrowRight wraps to Sans');
    await page.keyboard.press('ArrowLeft');
    expect(await selectedTab(page) === 'mono', name, 'ArrowLeft wraps to Mono');
    await page.keyboard.press('Home');
    expect(await selectedTab(page) === 'sans', name, 'Home to Sans');
    expect(await page.$$eval(`${P} [role="tab"]`, (ts) => ts.map((t) => t.tabIndex).join()) === '0,-1,-1,-1', name, 'roving tabindex');
    expect(await page.$eval(`${P} [role="tab"][aria-selected="true"]`, (t) => !!document.getElementById(t.getAttribute('aria-controls'))), name, 'tab controls its panel');
    // arrow keys skip disabled tabs
    await slotSel(page, 'text'); await page.click(`${P} [role="tab"][data-tab="sans"]`);
    await page.focus(`${P} [role="tab"][aria-selected="true"]`);
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page) === 'serif', name, 'Body: ArrowRight to Serif');
    await page.keyboard.press('ArrowRight');
    expect(await selectedTab(page) === 'sans', name, 'Body: ArrowRight skips disabled Decorative and Mono, wrapping to Sans', await selectedTab(page));
    await page.keyboard.press('End');
    expect(await selectedTab(page) === 'serif', name, 'Body: End goes to the last enabled tab');
    await slotSel(page, 'display');

    // fonts load with their tab, not up front
    const p2 = await browser.newPage();
    await p2.goto(`${base}/fontdant/test/picker.html`); await p2.evaluate(() => window.panel.ready);
    const css = () => p2.evaluate(() => (document.getElementById('fontdant-picker') || { textContent: '' }).textContent);   // the picker's own @font-face style
    const cssBefore = await css();
    expect(!/"Bungee fd-display"/.test(cssBefore) && !/"Anton fd-display"/.test(cssBefore), name, 'Decorative families are not loaded before their tab is opened');
    await p2.click(`${P} [role="tab"][data-tab="decorative"]`);
    expect(/"Bungee fd-display"/.test(await css()), name, 'opening Decorative loads its families');
    await p2.close();

    // the user's own fonts sit in the matching tab
    const p3 = await browser.newPage();
    await p3.goto(`${base}/fontdant/test/picker.html?own=1`); await p3.evaluate(() => window.panel.ready);
    await p3.click(`${P} [role="tab"][data-tab="serif"]`);
    expect((await facesIn(p3)).includes('my-serif'), name, 'own serif font is in the Serif tab');
    const grp = await p3.$$eval(`${P} [role="tabpanel"] [role="group"]`, (gs) => gs.map((g) => ({ label: document.getElementById(g.getAttribute('aria-labelledby'))?.textContent, faces: [...g.querySelectorAll('[data-face]')].map((f) => f.getAttribute('data-face')), name: g.querySelector('.fd-face__name')?.textContent })));
    expect(grp.length === 1 && grp[0].label === 'Your fonts · Acme' && grp[0].faces.join() === 'my-serif', name, 'it sits in a "Your fonts · Acme" group, alone', grp);
    expect(!/Your fonts/.test(grp[0]?.name || ''), name, 'the card name carries no Your fonts suffix', grp);
    const order = await p3.evaluate(() => { const c = [...document.querySelectorAll('[data-pick] [role="tabpanel"] [data-face]')]; return c.findIndex((x) => x.closest('[role="group"]')) > c.findIndex((x) => !x.closest('[role="group"]')); });
    expect(order, name, 'the group follows the library cards');
    await p3.click(`${P} [role="tab"][data-tab="sans"]`);
    expect(!(await facesIn(p3)).includes('my-serif'), name, 'own serif font is not in Sans');
    await p3.click(`${P} [role="tab"][data-tab="serif"]`);
    await p3.click(`${P} [data-face="my-serif"]`);
    expect((await draftFaces(p3)).display === 'my-serif', name, 'picking the own font sets the face');
    await p3.close();

    // layout at real widths: the steps page panel (1280 and 1440 desktops, 390 phone) and the kitchen playground slot width
    for (const [vw, panelW, minPer] of [[1280, 520, 3], [1440, 520, 3], [390, 358, 2], [1100, 266, 2]]) {
      const p5 = await browser.newPage({ viewport: { width: Math.max(vw, 320), height: 900 } });
      await p5.goto(`${base}/fontdant/test/picker.html`); await p5.evaluate(() => window.panel.ready);
      await p5.addStyleTag({ content: `#mount { width: ${panelW}px; }` });
      await p5.click(`${P} [role="tab"][data-tab="sans"]`);
      const tops = (await tabInfo(p5)).map((t) => t.top);
      expect(new Set(tops).size === 1, name, `${vw}/${panelW}: four tabs in one row`, tops);
      expect(await p5.$$eval(`${P} [role="tab"]`, (ts) => { const r = ts[0].parentNode.getBoundingClientRect(); return ts.every((t) => t.getBoundingClientRect().right <= r.right + 1); }), name, `${vw}/${panelW}: tabs stay inside the tab row`);
      const per = await rowOf(p5);
      expect(per >= minPer, name, `${vw}/${panelW}: cards per row`, per);
      expect(await p5.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name, `${vw}/${panelW}: no sideways scroll`);
      await p5.close();
    }

    // nothing under 12px, light and dark (visible picker text)
    for (const scheme of ['light', 'dark']) {
      const p4 = await browser.newPage({ colorScheme: scheme });
      await p4.goto(`${base}/fontdant/test/picker.html`); await p4.evaluate(() => window.panel.ready);
      if (scheme === 'dark') await p4.evaluate(() => { var T = window.FrostingTokens; if (T && T.dark) Object.keys(T.dark).forEach((k) => document.documentElement.style.setProperty('--fr-' + k, T.dark[k])); });
      const small = await p4.$$eval('[data-pick] *', (els) => els.filter((e) => e.offsetParent !== null && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => e.className + ' ' + getComputedStyle(e).fontSize));
      expect(small.length === 0, name, scheme, 'text under 12px in the picker', small.slice(0, 5));
      await p4.close();
    }
    console.log(`${name}: one picker, four tabs, slot switch, cards, dice, keyboard, own fonts, lazy load, widths, 12px floor checked`);
  } finally { await browser.close(); }
}
server.close();
console.log(fails ? `FAIL: ${fails} picker failures` : 'PASS: face picker tabs (Chromium, Firefox)');
if (fails) process.exitCode = 1;
