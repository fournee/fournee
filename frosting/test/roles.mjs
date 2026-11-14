// New roles (v1.3.0, deliverable C) and their removal guard.
//  Guard (X2): the 13 calculated roles, their 23 contracts and the 3 accent channels are hard-coded here, NOT read from
//  tokens.json, so removing any of them from tokens.json (or from a generated file) fails this test and names it.
//  C1-C13, C19 (store half), C21: the roles' shape, defaults (drift guard), CSS, fitting over every preset and thousands
//  of lucky looks, overrides, missing inputs, and spread() cards.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), mise = join(root, '..');
const sandbox = { console }; sandbox.window = sandbox; sandbox.globalThis = sandbox; vm.createContext(sandbox);
for (const f of ['dist/tokens.js', 'src/readability.js', 'src/fills.js', 'src/gallery.js', 'dist/store.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox);
const C = sandbox.FrostingColor, G = sandbox.FrostingGallery, T = sandbox.FrostingTokens, S = sandbox.FrostingStore;
const json = JSON.parse(readFileSync(join(root, 'tokens.json'), 'utf8'));
const fx = JSON.parse(readFileSync(join(here, 'fixtures', 'roles-v1.2.json'), 'utf8'));

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; if (fails < 40) console.log('FAIL', ...m); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── the guard lists (hard-coded on purpose) ── */
const CORE = ['text-secondary', 'accent-text-hover', 'button-hover', 'border-strong'];
const STATUS = ['ok-soft', 'ok-text', 'ok-border', 'warn-soft', 'warn-text', 'warn-border', 'bad-soft', 'bad-text', 'bad-border'];
const ROLES = CORE.concat(STATUS);
const CONTRACTS = [
  ['Secondary text', 'text-secondary', 'bg', 7], ['Secondary text on surfaces', 'text-secondary', 'surface', 7],
  ['Accent text hover', 'accent-text-hover', 'bg', 4.5], ['Accent text hover on surfaces', 'accent-text-hover', 'surface', 4.5],
  ['Button hover shape', 'button-hover', 'bg', 3], ['Button hover text', 'button-text', 'button-hover', 4.5],
  ['Strong border', 'border-strong', 'bg', 3], ['Strong border on surfaces', 'border-strong', 'surface', 3],
  ['OK text', 'ok-text', 'bg', 4.5], ['OK text on surfaces', 'ok-text', 'surface', 4.5], ['OK text on tint', 'ok-text', 'ok-soft', 4.5],
  ['Text on OK tint', 'ok-soft', 'text', 7], ['OK border', 'ok-border', 'bg', 3],
  ['Warning text', 'warn-text', 'bg', 4.5], ['Warning text on surfaces', 'warn-text', 'surface', 4.5], ['Warning text on tint', 'warn-text', 'warn-soft', 4.5],
  ['Text on warning tint', 'warn-soft', 'text', 7], ['Warning border', 'warn-border', 'bg', 3],
  ['Bad text', 'bad-text', 'bg', 4.5], ['Bad text on surfaces', 'bad-text', 'surface', 4.5], ['Bad text on tint', 'bad-text', 'bad-soft', 4.5],
  ['Text on bad tint', 'bad-soft', 'text', 7], ['Bad border', 'bad-border', 'bg', 3],
];
const CHANNELS = ['accent-h', 'accent-s', 'accent-l'];
const NEW_CONTRACTS = T.contracts.slice(37);

const css = readFileSync(join(root, 'dist', 'frosting.css'), 'utf8').replace(/\r/g, '');
const miseCss = readFileSync(join(mise, 'delivery', 'dist', 'mise.css'), 'utf8').replace(/\r/g, '');
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'));
const darkBlocks = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('/* Gradient fills'));

/* ── X2 + C2: every role, in tokens.json and everywhere a look is made ── */
const presets = G.presets(), luckies = [];
for (let s = 0; s < 300; s++) luckies.push(G.lucky(s));
ROLES.forEach((n) => {
  const r = json.roles.find((x) => x.name === n);
  expect(r, `role ${n} is missing from tokens.json roles`);
  if (!r) return;
  expect(r.calc && r.calc.from && r.calc.to && typeof r.calc.weight === 'number' && Array.isArray(r.calc.rules) && r.calc.rules.length, `role ${n}: calc block`);
  expect(C.HEX.test(r.light || '') && C.HEX.test(r.dark || ''), `role ${n}: light and dark hex`);
  expect(typeof r.label === 'string' && r.label.trim() && typeof r.use === 'string' && r.use.trim(), `role ${n}: label and use`);
  expect(r.group === (CORE.includes(n) ? 'core' : 'status'), `role ${n}: group ${r.group}`);
  expect(C.HEX.test(T.light[n] || '') && C.HEX.test(T.dark[n] || ''), `role ${n}: in FrostingTokens.light and .dark`);
  expect(C.HEX.test(G.defaults('light')[n] || '') && C.HEX.test(G.defaults('dark')[n] || ''), `role ${n}: in FrostingGallery.defaults()`);
  expect(presets.every((p) => C.HEX.test(p.colors[n] || '')), `role ${n}: in every preset and brand look`);
  expect(luckies.every((l) => C.HEX.test(l.colors[n] || '')), `role ${n}: in 300 lucky looks`);
  expect(lightBlock.includes(`--fr-${n}:`), `role ${n}: a --fr-${n} line in dist/frosting.css`);
  expect(miseCss.includes(`--fr-${n}:`), `role ${n}: a --fr-${n} line in delivery/dist/mise.css`);
});
// X2 + C3: every contract triple, with its label and at least its minimum
CONTRACTS.forEach(([label, role, against, min]) => {
  const c = T.contracts.find((x) => x.role === role && x.against === against && x.min >= min);
  expect(c, `contract ${role} on ${against} >= ${min} is missing from FrostingTokens.contracts`);
  expect(c && c.label === label, `contract ${role} on ${against}: label "${label}"`, c && c.label);
});
// X2: the accent channels
CHANNELS.forEach((k) => {
  expect(json.channels && json.channels[k], `channel ${k} is missing from tokens.json channels`);
  expect(new RegExp(`--fr-${k}:`).test(lightBlock) && (darkBlocks.match(new RegExp(`--fr-${k}:`, 'g')) || []).length === 2, `channel ${k}: --fr-${k} lines in dist/frosting.css`);
});
// count floor
expect(json.roles.length >= 39 && T.roles.length >= 39, `at least 39 roles, got ${json.roles.length}`);
expect(json.contracts.length >= 60 && T.contracts.length >= 60, `at least 60 contracts, got ${json.contracts.length}`);

/* ── C1: exact counts, the old entries first and untouched, the new ones appended in the order of section 3.8 ── */
expect(json.roles.length === 39 && json.contracts.length === 60, 'C1: 39 roles and 60 contracts', json.roles.length, json.contracts.length);
expect(fx.roles.every((r, i) => same(json.roles[i], r)), 'C1: the first 26 roles equal the v1.2.0 entries');
expect(fx.contracts.every((c, i) => same(json.contracts[i], c)), 'C1: the first 37 contracts equal the v1.2.0 ones');
expect(same(json.roles.slice(26).map((r) => r.name), ROLES), 'C1: the 13 roles are appended in order', json.roles.slice(26).map((r) => r.name));
expect(same(NEW_CONTRACTS.map((c) => [c.label, c.role, c.against, c.min]), CONTRACTS), 'C3: the 23 contracts are appended in order');

/* ── C4: the defaults pass all 60 ── */
['light', 'dark'].forEach((m) => {
  const bad = C.check(T[m]).filter((r) => !r.ok);
  expect(!bad.length && C.check(T[m]).length >= 60, `C4: ${m} defaults pass every contract`, bad.map((r) => r.label));
});

/* ── C6: the drift guard: complete() of the default base roles gives the stored hex, at the nominal weight ── */
['light', 'dark'].forEach((m) => {
  const bases = {}; json.roles.filter((r) => !r.calc).forEach((r) => { bases[r.name] = r[m]; });
  const done = C.complete(bases);
  ROLES.forEach((n) => {
    const r = json.roles.find((x) => x.name === n); if (!r) return;
    expect(done[n] === r[m], `C6: complete() of the ${m} defaults gives ${n} = ${r[m]}`, done[n]);
    // no search: the nominal mix already is the stored value (needs the resolved inputs, which are the stored defaults)
    expect(C.mix(T[m][r.calc.from], T[m][r.calc.to], r.calc.weight / 100) === r[m], `C6: ${m} ${n} is the nominal ${r.calc.weight}% mix`);
  });
});

/* ── C7: the CSS writes each calculated role as a color-mix() in :root, never in the dark blocks ── */
json.roles.filter((r) => r.calc).forEach((r) => {
  const want = `  --fr-${r.name}: color-mix(in srgb, var(--fr-${r.calc.to}) ${r.calc.weight}%, var(--fr-${r.calc.from}));`;
  expect(lightBlock.split('\n').includes(want), `C7: :root declares ${want.trim()}`);
  expect(!darkBlocks.includes(`--fr-${r.name}:`), `C7: ${r.name} is not declared in a dark block`);
});

/* ── C8, C10, C11: every preset, 3,000 lucky looks and lucky looks on locked backgrounds pass all 23 ── */
const looks = presets.map((p) => ['preset ' + p.name, p.colors]);
for (let s = 0; s < 3000; s++) looks.push(['lucky ' + s, G.lucky(s).colors]);
['#FFFFFF', '#000000', '#F5F0E6', '#0A2540', '#B3261E', '#1F3FBF', '#FFE36E', '#2E7D4F', '#3B0A45', '#E6F4FF', '#0F1115'].forEach((bg) => {
  if (C.bgHeadroom(bg) < 7) return;
  G.presets(bg).forEach((p) => looks.push([`preset ${p.name} on ${bg}`, p.colors]));
  for (let s = 0; s < 300; s++) looks.push([`lucky ${s} on ${bg}`, G.lucky(s, bg).colors]);
});
let c8 = 0, c10 = 0, rule5 = 0, c11 = 0;
looks.forEach(([name, l]) => {
  const bad = C.check(l, NEW_CONTRACTS).filter((r) => !r.ok);
  if (bad.length) { c8++; if (c8 < 6) console.log('  C8', name, bad.map((r) => `${r.label} ${r.ratio}<${r.min}`).join('; ')); }
  const k = (role) => C.contrast(l[role], l.bg);
  if (!(k('text-secondary') >= k('muted') - 1e-9 && k('text-secondary') <= k('text') + 1e-9 && k('accent-text-hover') >= k('accent-text') - 1e-9)) { c10++; if (c10 < 4) console.log('  C10', name); }
  if (l['button-hover'] === l.button) rule5++;
  if (!(C.contrast(l['button-hover'], l.bg) >= 3 && C.contrast(l['button-hover'], l['button-text']) >= 4.5)) c11++;
});
expect(c8 === 0, `C8: all 23 new contracts pass on ${looks.length} looks`, c8 + ' looks fail');
expect(c10 === 0, 'C10: text-secondary sits between muted and text on bg; accent-text-hover is at least accent-text', c10);
expect(c11 === 0, 'C11: button-hover passes both its rules', c11);
expect(rule5 / looks.length <= 0.08, `C11: button-hover equals button (no visible hover) in at most 8% of looks: ${rule5} of ${looks.length}`);

/* ── C9: a changed accent / status colour re-fits the roles that depend on it ── */
{
  const base = Object.assign({}, T.light, { accent: '#7B2CBF', 'accent-text': '#5A1F8C', ok: '#1F6F8B', warn: '#8C5A00', bad: '#A1123F' });
  const done = C.complete(base);
  expect(done['accent-text-hover'] !== T.light['accent-text-hover'] && C.hsl(done['accent-text-hover']).h > 240, 'C9: accent-text-hover follows a new accent-text', done['accent-text-hover']);
  ['ok', 'warn', 'bad'].forEach((s) => expect(['soft', 'text', 'border'].every((v) => done[`${s}-${v}`] !== T.light[`${s}-${v}`]), `C9: ${s}-soft/-text/-border follow a new ${s}`));
  expect(C.check(done, NEW_CONTRACTS).every((r) => r.ok), 'C9: the re-fitted roles pass their contracts', C.check(done, NEW_CONTRACTS).filter((r) => !r.ok).map((r) => r.label));
}

/* ── C12: base roles that already fail: a full map, no throw ── */
{
  let out = null, threw = null;
  try { out = C.complete(Object.assign({}, T.light, { text: '#FFFFFF', bg: '#FFFFFF', surface: '#FFFFFF' })); } catch (e) { threw = e; }
  expect(!threw && out && ROLES.every((n) => C.HEX.test(out[n] || '')), 'C12: complete() returns a full map on a broken look', threw && threw.message);
}

/* ── C13: a missing input gives that role its static default for the scheme; the others are unaffected ── */
{
  const full = C.complete(T.dark), gone = Object.assign({}, T.dark); delete gone.muted;
  const out = C.complete(gone);
  expect(out['text-secondary'] === json.roles.find((r) => r.name === 'text-secondary').dark, 'C13: text-secondary falls back to its dark default without muted', out['text-secondary']);
  expect(out['border-strong'] === json.roles.find((r) => r.name === 'border-strong').dark, 'C13: border-strong falls back to its dark default without muted');
  expect(ROLES.filter((n) => !['text-secondary', 'border-strong'].includes(n)).every((n) => out[n] === full[n]), 'C13: the other roles are unaffected');
  expect(!('muted' in out), 'C13: complete() does not invent a base role');
}

/* ── overrides in complete(): pinned, uppercased, followed by dependants; only calculated roles ── */
{
  const out = C.complete(T.light, { overrides: { 'bad-soft': '#fbe4e1' } });
  expect(out['bad-soft'] === '#FBE4E1', 'override: bad-soft is pinned and uppercased', out['bad-soft']);
  expect(C.contrast(out['bad-text'], out['bad-soft']) >= 4.5, 'override: bad-text is fitted against the overridden bad-soft');
  const viaColors = C.complete(Object.assign({}, T.light, { overrides: { 'border-strong': '#7A766F' } }));
  expect(viaColors['border-strong'] === '#7A766F', 'override: colors.overrides is read by default');
  expect(same(C.cleanOverrides({ 'border-strong': '#7a766f', bg: '#000000', nope: '#111111', 'ok-soft': 'red' }), { 'border-strong': '#7A766F' }), 'cleanOverrides keeps only calculated roles with #RRGGBB, uppercased');
  const stale = Object.assign({}, T.light, { accent: '#C2185B', 'accent-text': '#9C1449', 'accent-text-hover': T.light['accent-text-hover'] });
  expect(C.complete(stale)['accent-text-hover'] !== T.light['accent-text-hover'], 'complete() recomputes a stale cached calculated value');
}

/* ── a gradient on a ground: the calculated roles that sit on it hold at its worst point ── */
{
  const F = sandbox.FrostingFills, fills = { surface: { stops: ['role:surface', '#EDE8E0'], angle: 135, space: 'oklab' } };
  const out = C.complete(Object.assign({}, T.light, { fills }));
  const bad = F.check(out, fills, NEW_CONTRACTS).filter((r) => !r.ok);
  expect(!bad.length, 'fills: every new contract on a surface gradient passes at its worst point', bad.map((r) => `${r.label} ${r.ratio}`));
  expect(same(C.complete(T.light), C.complete(T.light, { fills: {} })), 'fills: no fills, no change');
}

/* ── C19 (store half): FrostingStore.clean completes a look from its own base roles and keeps valid overrides ── */
{
  const old = {}; json.roles.slice(0, 26).forEach((r) => { old[r.name] = T.light[r.name]; });
  old.accent = '#7B2CBF'; old['accent-text'] = '#5A1F8C';
  const c = S.clean(old, T.light);
  expect(c['accent-text-hover'] === C.complete(c)['accent-text-hover'] && c['accent-text-hover'] !== T.light['accent-text-hover'], 'C19: a v1.2.0 look gets its new roles calculated, not the static defaults', c['accent-text-hover']);
  expect(!('overrides' in c), 'C19: no overrides key when there are none');
  const o = S.clean(Object.assign({}, old, { overrides: { 'border-strong': '#7a766f', bg: '#000000' } }), T.light);
  expect(same(o.overrides, { 'border-strong': '#7A766F' }) && o['border-strong'] === '#7A766F', 'C19: FrostingStore.clean keeps colors.overrides (valid entries only) and applies them', o.overrides);
  expect(same(S.clean(T.dark, T.dark), T.dark), 'FrostingStore.clean of the defaults is the defaults');
}

/* ── C21: spread() cards carry their own accent-text-hover, readable on the page ── */
for (const page of [{ ...T.dark, bg: '#0D0D0D', surface: '#171717', text: '#ECECEC', accent: '#8FD0E1' }, T.light]) {
  const sp = G.spread(80, page);
  const bad = sp.filter((o) => !(C.HEX.test(o['accent-text-hover'] || '') && C.contrast(o['accent-text-hover'], page.bg) >= 4.5 && C.contrast(o['accent-text-hover'], page.surface) >= 4.5));
  expect(!bad.length, `C21: every spread card's accent-text-hover passes on the page (${page.bg})`, bad.length);
  expect(sp.every((o) => o['accent-text-hover'] === C.complete(Object.assign({}, page, { accent: o.accent, 'accent-text': o['accent-text'] }), { overrides: {} })['accent-text-hover']), 'C21: the card hover is complete() over the page plus the card accent');
}

console.log(fails ? `FAIL: ${fails} roles checks` : `PASS: roles.mjs - ${ROLES.length} roles, ${CONTRACTS.length} contracts, ${CHANNELS.length} channels guarded; drift guard; ${looks.length} looks fitted (button-hover = button in ${rule5})`);
process.exit(fails ? 1 : 0);
