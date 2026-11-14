// New roles in the kitchen (v1.3.0, deliverable C), Node, the same plain scripts the browser loads:
//  C14-C17 KitchenRecipe.clean: overrides (kept, cleaned, followed by dependants), old recipes and stale caches recomputed
//  C18     a failing override is a normal hard failure with a suggestion
//  C19     toLook / fromLook keep overrides
//  C22     standards: the text minimum reaches the new text roles; fit() meets every new contract and moves a calculated
//          role only by re-running complete()
//  C25     Sprinkles off: the new roles come from the designed colours; Plain still changes only muted
//  A10-style: the defaults and every preset pass the pass with the 23 new contracts in it
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mise = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js', 'frosting/src/gallery.js', 'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'kitchen/src/store.js', 'kitchen/src/recipe.js', 'kitchen/src/sprinkles.js', 'kitchen/src/standards.js', 'kitchen/src/pass.js'])
  vm.runInContext(readFileSync(mise + f, 'utf8'), sb, { filename: f });
const { KitchenPass: P, KitchenRecipe: R, KitchenStandards: K, KitchenSprinkles: S, FrostingTokens: FT, FrostingColor: C, FrostingGallery: G } = sb;

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; if (fails < 40) console.log('FAIL', ...m); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const light = { colors: FT.light, scheme: 'Light' }, dark = { colors: FT.dark, scheme: 'Dark' };
const CALC = FT.roles.filter((r) => r.calc).map((r) => r.name);
const NEW = FT.contracts.slice(37);
const v12 = (colors) => { const o = {}; FT.roles.filter((r) => !r.calc).forEach((r) => { o[r.name] = colors[r.name]; }); return o; };

expect(CALC.length === 13, 'thirteen calculated roles', CALC.length);

/* C14: an override is kept, exactly, and roles that depend on it follow it */
{
  const r = R.clean({ frosting: { colors: {}, overrides: { 'border-strong': '#7A766F' } } }, light);
  expect(r.frosting.colors['border-strong'] === '#7A766F', 'C14: the override is the colour', r.frosting.colors['border-strong']);
  expect(same(r.frosting.overrides, { 'border-strong': '#7A766F' }), 'C14: frosting.overrides holds exactly that entry', r.frosting.overrides);
  const t = R.clean({ frosting: { colors: {}, overrides: { 'bad-soft': '#F2C9C4' } } }, light);
  expect(t.frosting.colors['bad-soft'] === '#F2C9C4' && t.frosting.colors['bad-text'] === C.complete(FT.light, { overrides: { 'bad-soft': '#F2C9C4' } })['bad-text'] && C.contrast(t.frosting.colors['bad-text'], '#F2C9C4') >= 4.5,
    'C14: bad-text is recomputed against the overridden bad-soft', t.frosting.colors['bad-text']);
  expect(!('overrides' in R.clean({}, light).frosting), 'C14: no overrides key when there are none');
}

/* C15: unknown roles, non-calculated roles and bad hex are dropped; hex is uppercased */
{
  const r = R.clean({ frosting: { overrides: { nope: '#111111', bg: '#000000', 'ok-soft': 'green', 'warn-soft': '#fbe9d5', 'ok-text': '#12345' } } }, light);
  expect(same(r.frosting.overrides, { 'warn-soft': '#FBE9D5' }), 'C15: only the valid calculated entry survives, uppercased', r.frosting.overrides);
  expect(r.frosting.colors.bg === FT.light.bg && r.frosting.colors['warn-soft'] === '#FBE9D5', 'C15: the dropped bg override did nothing');
}

/* C16: a recipe from before v1.3.0 gets every new role calculated from its own roles */
{
  const colors = Object.assign(v12(FT.light), { accent: '#7B2CBF', 'accent-text': '#5A1F8C', bad: '#A1123F' });
  const r = R.clean({ frosting: { colors } }, light), c = r.frosting.colors, want = C.complete(c, { overrides: {} });
  expect(CALC.every((n) => c[n] === want[n]), 'C16: every new role is complete() of the recipe', CALC.filter((n) => c[n] !== want[n]));
  expect(c['accent-text-hover'] !== FT.light['accent-text-hover'] && c['bad-text'] !== FT.light['bad-text'], 'C16: not the static defaults');
  expect(Object.keys(c).length === FT.roles.length, 'C16: the colours map has every role');
}

/* C17: a stale cached calculated value is recomputed, not kept */
{
  const colors = Object.assign({}, FT.light, { accent: '#C2185B', 'accent-text': '#9C1449' });   // accent-text-hover still the old cache
  const c = R.clean({ frosting: { colors } }, light).frosting.colors;
  expect(c['accent-text-hover'] !== FT.light['accent-text-hover'] && c['accent-text-hover'] === C.complete(colors, { overrides: {} })['accent-text-hover'], 'C17: the stale accent-text-hover is recomputed', c['accent-text-hover']);
  const hand = Object.assign({}, FT.light, { 'border-strong': '#123456' });   // a hand-set value without overrides is a cache too
  expect(R.clean({ frosting: { colors: hand } }, light).frosting.colors['border-strong'] === FT.light['border-strong'], 'C17: an unnamed stored value does not pin the role');
}

/* C18: a failing override fails hard, with a suggestion */
{
  const res = P.run(R.clean({ frosting: { colors: {}, overrides: { 'border-strong': '#E3DED6' } } }, light));
  const r = res.results.find((x) => x.source === 'frosting' && x.label === 'Strong border');
  expect(r && r.ok === false && r.level === 'hard', 'C18: "Strong border" fails at level hard', r && { ok: r.ok, level: r.level });
  expect(r && r.suggest && r.suggest.role === 'border-strong' && C.contrast(r.suggest.to, FT.light.bg) >= 3, 'C18: it carries a suggest for border-strong', r && r.suggest);
}

/* C19: toLook then fromLook keeps overrides (on disk they ride as colors.overrides) */
{
  const r = R.clean({ name: 'Harbor', frosting: { colors: { bg: '#F4F7FA' }, overrides: { 'border-strong': '#7A766F', 'bad-soft': '#FBE4E1' } } }, light);
  const look = R.toLook(r);
  expect(same(look.colors.overrides, { 'border-strong': '#7A766F', 'bad-soft': '#FBE4E1' }), 'C19: toLook writes colors.overrides', look.colors.overrides);
  const back = R.fromLook(JSON.parse(JSON.stringify(look)), light);
  expect(same(back.frosting.overrides, r.frosting.overrides) && same(back.frosting.colors, r.frosting.colors), 'C19: fromLook reads them back');
  expect(!('overrides' in R.toLook(R.clean({}, light)).colors), 'C19: no colors.overrides when there are none');
  // a look-shaped colours map (a panel draft) may carry its overrides inside colors
  expect(R.clean({ frosting: { colors: { overrides: { 'border-strong': '#7A766F' } } } }, light).frosting.colors['border-strong'] === '#7A766F', 'C19: colors.overrides is read as a fallback');
}

/* C22: standards */
{
  const ROLES_TEXT = ['text-secondary', 'accent-text-hover', 'ok-text', 'warn-text', 'bad-text'];
  ROLES_TEXT.forEach((n) => expect(K.isText(n), `C22: ${n} is a text role`));
  ['button-hover', 'border-strong', 'ok-soft', 'ok-border'].forEach((n) => expect(!K.isText(n), `C22: ${n} is a shape role`));
  const un = K.contracts('un', C.contracts(), true);
  expect(un.filter((c) => ROLES_TEXT.includes(c.role)).every((c) => c.min === 7), 'C22: under the UN profile (text 7) the new text roles need 7:1');
  // a profile with shapes at 4.5 (none ships with one; added for the test)
  K.PROFILES.push({ id: 'test-shape45', label: 'Shapes 4.5', group: 'Test', region: 'World', wcag: '2.2', level: 'AA', text: 4.5, ui: 4.5, note: 'test', src: 'test' });
  const sh = K.contracts('test-shape45', C.contracts(), true);
  expect(sh.filter((c) => ['button-hover', 'border-strong', 'ok-border'].includes(c.role)).every((c) => c.min >= 4.5), 'C22: shapes at 4.5 reach the new shape roles');
  const looks = [['light', FT.light], ['dark', FT.dark], ...G.presets().map((p) => [p.name, p.colors])];
  for (let s = 0; s < 40; s++) looks.push(['lucky ' + s, G.lucky(s).colors]);
  let bad = 0, moved = 0, n = 0;
  for (const id of ['un', 'wcag22-aaa', 'test-shape45']) for (const [name, colors] of looks) {
    n++;
    const list = K.contracts(id, C.contracts(), true).filter((c) => c.level !== 'warn');
    const f = K.fit(id, { colors, type: { mode: 'reading' } });
    const failing = C.check(f.colors, list.slice(37)).filter((r) => !r.ok);
    if (failing.length && C.check(f.colors, list.slice(0, 37)).every((r) => r.ok)) { bad++; if (bad < 4) console.log('  C22', id, name, failing.map((r) => `${r.label} ${r.ratio}<${r.min}`).join('; ')); }
    const again = C.complete(f.colors, { overrides: {}, contracts: list });
    if (CALC.some((k) => f.colors[k] !== again[k]) || f.changes.some((c) => CALC.includes(c.what))) moved++;
    // the fitted look survives a clean under the same standard (the pass judges it the same way)
    const re = R.clean({ frosting: { colors: f.colors }, standard: id }, light).frosting.colors;
    if (CALC.some((k) => re[k] !== f.colors[k])) moved++;
  }
  expect(!bad, `C22: fit leaves every new contract passing (${bad} of ${n} looks whose base roles fit still fail one)`);
  expect(!moved, `C22: fit moves calculated roles only through complete() (${moved})`);
  const kept = K.fit('un', { colors: FT.light, overrides: { 'border-strong': '#7A766F' } });
  expect(kept.colors['border-strong'] === '#7A766F', 'C22: fit keeps an override', kept.colors['border-strong']);
  K.PROFILES.pop();
}

/* C25: Sprinkles off: new roles from the designed colours; muted is the only role Plain changes */
for (const d of [light, dark]) {
  const designed = Object.assign({}, d.colors, { muted: d.scheme === 'Light' ? '#77726A' : '#6F7689' });
  const r = R.clean({ scheme: d.scheme, frosting: { colors: designed }, sprinkles: false }, d), seen = S.effective(r);
  const changed = Object.keys(seen).filter((k) => seen[k] !== r.frosting.colors[k]);
  expect(same(changed, ['muted']), `C25 ${d.scheme}: Plain changes only muted`, changed);
  expect(CALC.every((k) => seen[k] === C.complete(r.frosting.colors, { overrides: {} })[k]), `C25 ${d.scheme}: the new roles are computed from the designed colours`);
  expect(seen['text-secondary'] !== C.complete(Object.assign({}, r.frosting.colors, { muted: seen.muted }), { overrides: {} })['text-secondary'] || seen.muted === designed.muted, `C25 ${d.scheme}: text-secondary is not taken from the Plain muted`);
}

/* A10-style: defaults and presets pass with the new contracts in the pass, and none of them gets a suggestion */
{
  for (const d of [light, dark]) {
    const res = P.run(R.clean({ scheme: d.scheme }, d));
    const fr = res.results.filter((x) => x.source === 'frosting');
    expect(fr.length === 60 && NEW.every((c, i) => fr[37 + i].label === c.label), `A10 ${d.scheme}: the pass lists the 23 new contracts after the 37`, fr.length);
    expect(fr.slice(37).every((x) => x.ok && !('suggest' in x)), `A10 ${d.scheme}: the new contracts pass, no suggestion`);
  }
  const presetFails = G.presets().filter((p) => P.run(R.clean({ frosting: { colors: p.colors } }, light)).results.some((x) => x.source === 'frosting' && !x.ok)).map((p) => p.name);
  expect(!presetFails.length, 'A10: every preset passes every frosting contract in the pass', presetFails);
}

console.log(fails ? `FAIL: ${fails} kitchen roles checks` : 'PASS: kitchen/test/roles.mjs - recipe overrides, old and stale recipes, failing overrides, look round trip, standards fit, Sprinkles, pass (C14-C19, C22, C25)');
process.exit(fails ? 1 : 0);
