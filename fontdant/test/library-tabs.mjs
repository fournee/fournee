// Font tabs (v1.4.0): every library family carries a curated tab, slots follow the tab, the 24 new families are
// fetched and measured, and nothing that existed changed except the new `tab` field and mono's extra display slot.
//   node test/library-tabs.mjs   (run after build-library.mjs)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const lib = JSON.parse(read('../fonts/library.json'));
const base = JSON.parse(read('./fixtures/library-v1.3-baseline.json'));
const decisions = JSON.parse(read('../../docs/design/font-tabs/decisions.json'));
const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
vm.runInNewContext(read('../dist/library.js'), sandbox);
const dist = sandbox.window.FontdantLibrary;

let fails = 0;
const expect = (cond, ...m) => { if (!cond) { fails++; console.log('FAIL', ...m); } };
const TABS = ['sans', 'serif', 'decorative', 'mono'];
const fonts = Object.values(lib.fonts);

// 1. every family has a valid tab, and the tabs map says which slots each tab serves
for (const f of fonts) expect(TABS.includes(f.tab), f.id, 'has a valid tab, got', f.tab);
expect(JSON.stringify(Object.keys(lib.tabs || {})) === JSON.stringify(TABS), 'tabs map has the four tabs in order', Object.keys(lib.tabs || {}));
const tabs = lib.tabs || {};
expect(JSON.stringify((tabs.sans || {}).slots) === JSON.stringify(['text', 'display']), 'sans serves text + display');
expect(JSON.stringify((tabs.serif || {}).slots) === JSON.stringify(['text', 'display']), 'serif serves text + display');
expect(JSON.stringify((tabs.decorative || {}).slots) === JSON.stringify(['display']), 'decorative serves display only');
expect(JSON.stringify((tabs.mono || {}).slots) === JSON.stringify(['mono', 'display']), 'mono serves mono + display');
for (const t of TABS) expect(typeof (tabs[t] || {}).label === 'string', t, 'has a label');

// 2. slot rules by tab
for (const f of fonts) {
  if (f.tab === 'decorative') expect(f.slots.join() === 'display', f.id, 'decorative is display-only, got', f.slots);
  if (f.tab === 'mono') expect(f.slots.includes('mono') && f.slots.includes('display') && !f.slots.includes('text'), f.id, 'mono has mono+display, never text, got', f.slots);
  if (f.tab !== 'mono') expect(!f.slots.includes('mono'), f.id, 'only mono-tab families take the mono slot');
}

// 3. the owner's placements for the existing families, and the 24 additions
for (const e of decisions.existing) expect(lib.fonts[e.id] && lib.fonts[e.id].tab === e.tab, e.id, 'tab is', e.tab, 'got', lib.fonts[e.id] && lib.fonts[e.id].tab);
expect(decisions.add.length === 24, '24 families to add');
for (const a of decisions.add) {
  const f = lib.fonts[a.id];
  expect(!!f, a.id, 'exists in the library');
  if (!f) continue;
  expect(f.family === a.family && f.tab === a.tab, a.id, 'family and tab as decided');
  expect(f.slots.join() === a.slots.join(), a.id, 'slots as decided', f.slots, a.slots);
  expect(f.lucky === (a.tab !== 'decorative'), a.id, 'lucky true for sans/serif, false for decorative');
  expect(f.metrics && f.metrics.unitsPerEm > 0 && f.metrics.capHeight > 0 && f.metrics.xHeight > 0 && f.metrics.xWidthAvg > 0, a.id, 'measured');
  expect(f.licence && ['OFL-1.1', 'Apache-2.0'].includes(f.licence.id) && f.licence.self_host === 'allowed', a.id, 'open licence (OFL-1.1 or Apache-2.0), self-hosting allowed', f.licence && f.licence.id);
  expect(f.files.length > 0 && f.files.every((x) => x.bytes > 0), a.id, 'has fetched files');
}
expect(fonts.length === Object.keys(base.fonts).length + 24, 'library grew by exactly 24, got', fonts.length);

// 4. nothing that existed changed apart from tab (and mono's display slot)
for (const [id, old] of Object.entries(base.fonts)) {
  const now = JSON.parse(JSON.stringify(lib.fonts[id] || {}));
  const was = JSON.parse(JSON.stringify(old));
  delete now.tab;
  if (was.shelf === 'mono') was.slots = ['mono', 'display'];
  expect(JSON.stringify(now) === JSON.stringify(was), id, 'unchanged apart from tab / mono display slot');
}
expect(JSON.stringify(lib.defaultLook) === JSON.stringify(base.defaultLook), 'default look unchanged');
for (const [k, v] of Object.entries(base.shelves)) if (k !== 'mono') expect(JSON.stringify(lib.shelves[k]) === JSON.stringify(v), 'shelf', k, 'unchanged');
expect(JSON.stringify(lib.systemFallbacks) === JSON.stringify(base.systemFallbacks), 'system fallbacks unchanged');

// 5. dist/library.js carries tab and the tabs map
expect(JSON.stringify(dist.tabs) === JSON.stringify(lib.tabs), 'dist/library.js carries the tabs map');
expect(Object.values(dist.fonts).every((f) => TABS.includes(f.tab)), 'dist/library.js entries carry tab');

console.log(fails ? `FAIL: ${fails} failures` : `PASS: ${fonts.length} families, every one tabbed; 24 additions measured; existing entries unchanged`);
process.exit(fails ? 1 : 0);
