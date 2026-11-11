// The pass, unit checks (Node, the same plain scripts the browser loads):
//  1. defaults pass (light, dark, both modes); every frosting preset and 3,000 lucky looks pass with no hard failure
//  2. a recipe with weight 300 at 10px on muted fails with the right contract names (T5, X4 hard; T7, X3 warn)
//  3. each cross-check X1–X9 fires on its own case and stays quiet on the defaults
//  4. T13 is pending until a rendered result is given, then reports it
//  5. extensions: project roles are checked like core roles; the 12px floor holds for them too (decision, phase 4)
//  6. a HUD gauge (fixture: a desktop app's computed type): numerals pass T7's hard limit, every label fails T5;
//     with the labels at 12px (option A) T5 passes, and with muted fitted to 4.5:1 nothing hard is left
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mise = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/gallery.js', 'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'kitchen/src/store.js', 'kitchen/src/recipe.js', 'kitchen/src/standards.js', 'kitchen/src/pass.js'])
  vm.runInContext(readFileSync(mise + f, 'utf8'), sb, { filename: f });
const { KitchenPass: P, KitchenRecipe: R, FrostingTokens: FT, FrostingGallery: G, FrostingColor: C } = sb;

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const light = { colors: FT.light, scheme: 'Light' }, dark = { colors: FT.dark, scheme: 'Dark' };
const recipe = (r, d = light) => R.clean(r, d);
const run = (r, d, o) => P.run(recipe(r, d), o);
const hard = (res) => P.failing(res, 'hard'), warn = (res) => P.failing(res, 'warn');
const byId = (res, id) => res.results.find((r) => r.id === id);

/* 1 ── defaults, presets, lucky */
for (const [d, label] of [[light, 'light'], [dark, 'dark']]) for (const mode of ['reading', 'dense']) {
  const res = run({ scheme: d.scheme, fontdant: { mode } }, d);
  expect(res.ok, `default ${label} ${mode} passes`, hard(res));
  expect(res.summary.pending === 1 && byId(res, 'T13').pending, `default ${label} ${mode}: only T13 pending without a render`, res.summary);
}
const presets = G.presets();
const presetFails = presets.filter((p) => !run({ scheme: p.scheme, frosting: { colors: p.colors } }).ok).map((p) => p.name);
expect(presets.length >= 26 && !presetFails.length, `every frosting preset passes the pass (${presets.length})`, presetFails);
let luckyFails = 0;
for (let i = 0; i < 3000; i++) { const l = G.lucky(); if (!run({ scheme: l.scheme, frosting: { colors: l.colors } }).ok) luckyFails++; }
expect(luckyFails === 0, '3,000 lucky looks pass the pass', luckyFails);
// frosting's contracts are in the pass unchanged
const fr = run({}).results.filter((r) => r.source === 'frosting');
expect(fr.length === FT.contracts.length && fr.every((r, i) => r.label === FT.contracts[i].label), 'frosting contracts appear unchanged, in order', fr.length);

/* 2 ── the done criterion: weight 300 at 10px on muted */
{
  const res = run({ fontdant: { roles: { caption: { size: '0.625rem', weight: 300, color: 'muted' } } } });
  expect(!res.ok, '300 @ 10px on muted fails');
  expect(same(hard(res), ['T5', 'X4']), '300 @ 10px on muted: hard failures are T5 and X4', hard(res));
  expect(same(warn(res), ['T7', 'X3']), '300 @ 10px on muted: warnings are T7 and X3', warn(res));
  expect(/caption 10px < 12px/.test(byId(res, 'T5').detail), 'T5 names the caption and its size', byId(res, 'T5').detail);
  // and at 200 weight T7 turns hard
  const r2 = run({ fontdant: { roles: { caption: { size: '0.625rem', weight: 200, color: 'muted' } } } });
  expect(hard(r2).includes('T7'), 'weight 200 below 24px is a hard T7', hard(r2));
}

/* 3 ── each cross-check on its own */
{
  const base = run({});
  expect(byId(base, 'X1').ok && /display|heading/.test(byId(base, 'X1').detail), 'X1 lists the large styles', byId(base, 'X1').detail);
  // X2: a grey that clears 4.5 but not 7 is fine as heading-xl's colour (large) but not as body's
  const grey = C.fit('#777777', [[FT.light.bg, 4.6], [FT.light.surface, 4.6]]);
  const asHeading = run({ frosting: { colors: { ...FT.light, 'grey': grey } }, fontdant: { roles: { 'heading-xl': { color: grey } } } });
  expect(byId(asHeading, 'X2').ok, 'X2: large heading at 4.5:1 passes', byId(asHeading, 'X2').detail);
  const asBody = run({ fontdant: { roles: { body: { color: grey } } } });
  expect(!byId(asBody, 'X2').ok && /^body /.test(byId(asBody, 'X2').detail), 'X2: body at 4.5:1 fails (7:1 whatever its size)', byId(asBody, 'X2').detail);
  // X3: thin small text under 7:1
  const x3 = run({ fontdant: { roles: { 'ui-sm': { weight: 300, color: 'muted' } } } });
  expect(!byId(x3, 'X3').ok, 'X3: weight 300 small text in muted warns', byId(x3, 'X3').detail);
  // X4: muted at 12–13px passes hard, warns below 7:1 (the defaults' only warning)
  expect(byId(base, 'X4').ok === false && byId(base, 'X4').level === 'warn', 'X4: default muted captions are a warning (7:1 recommended), not a failure', byId(base, 'X4'));
  // X5: accent-text as body colour
  const x5 = run({ fontdant: { roles: { body: { color: 'accent-text' } } } });
  expect(!byId(x5, 'X5').ok && byId(x5, 'X5').level === 'warn', 'X5: accent-text as body warns', byId(x5, 'X5').detail);
  // X6: button weight and size
  const x6 = run({ fontdant: { roles: { 'ui-button': { weight: 400 } } } });
  expect(!byId(x6, 'X6').ok && /weight 400 < 500/.test(byId(x6, 'X6').detail), 'X6: a 400-weight button warns', byId(x6, 'X6').detail);
  expect(byId(base, 'X6').ok, 'X6: default button passes', byId(base, 'X6').detail);
  // X7: thin type on a dark scheme, at any size
  const x7 = run({ scheme: 'Dark', fontdant: { roles: { display: { weight: 300 } } } }, dark);
  expect(!byId(x7, 'X7').ok && /^display 300/.test(byId(x7, 'X7').detail), 'X7: 300 weight on dark warns', byId(x7, 'X7').detail);
  const x7l = run({ fontdant: { roles: { display: { weight: 300 } } } });
  expect(byId(x7l, 'X7').ok, 'X7: the same on light is quiet');
  // X8: a placeholder colour under 3:1
  const x8 = run({ frosting: { colors: { ...FT.light, placeholder: '#DDDDDD' } } });
  const x8c = recipe({ frosting: { colors: { ...FT.light, placeholder: '#DDDDDD' } } });
  if (x8c.frosting.colors.placeholder) expect(!byId(x8, 'X8').ok, 'X8: placeholder at 1.4:1 warns', byId(x8, 'X8').detail);
  else { const raw = P.run({ scheme: 'Light', frosting: { colors: { ...FT.light, placeholder: '#DDDDDD' } }, fontdant: {} }); expect(!byId(raw, 'X8').ok, 'X8: placeholder at 1.4:1 warns', byId(raw, 'X8').detail); }
  // X9: every colour record carries fg, bg, size, weight, face
  expect(byId(base, 'X9').ok && base.rows.length > 40 && base.rows.every((r) => r.fg && r.bg && r.size > 0 && r.weight && r.face), 'X9: every record has (fg, bg, size, weight, face)', base.rows.length);
}

/* 4 ── T13 from a rendered run */
{
  const ok = run({}, light, { rendered: { ok: true, detail: '21 styles survive' } });
  expect(!byId(ok, 'T13').pending && byId(ok, 'T13').ok && ok.summary.pending === 0, 'T13 filled from a passing render');
  const bad = run({}, light, { rendered: { ok: false, detail: 'mono: runs past a 320px viewport' } });
  expect(hard(bad).includes('T13'), 'a failing render is a hard T13', hard(bad));
}

/* 5 ── extensions */
{
  const ext = { roles: [{ name: 'price', face: 'display', size: '1.5rem', weight: 'title', leading: 1.2, color: 'accent-text' }, { name: 'gauge-label', face: 'mono', size: '0.625rem', case: 'upper', tracking: '0.1em', color: 'muted', floor: 8 }, { name: 'body', size: '0.5rem' }] };
  const r = recipe({ fontdant: { extensions: ext } });
  expect(r.fontdant.extensions && r.fontdant.extensions.roles.length === 3, 'the recipe keeps extensions');
  const res = P.run(r);
  const styles = sb.FontdantCheck.resolve(r.fontdant).styles;
  expect(styles.some((s) => s.name === 'price' && s.extension), 'extension roles resolve');
  expect(styles.filter((s) => s.name === 'body').length === 1 && styles.find((s) => s.name === 'body').sizePx === sb.FontdantCheck.resolve({}).styles.find((s) => s.name === 'body').sizePx, 'an extension cannot replace a core role');
  expect(/gauge-label 10px < 12px/.test(byId(res, 'T5').detail), 'the 12px floor holds for extension roles (a floor key is ignored)', byId(res, 'T5').detail);
  expect(res.rows.some((x) => x.style === 'price' && x.fgRole === 'accent-text'), 'extension roles get colour records');
}

/* 6 ── a HUD gauge */
{
  const fx = JSON.parse(readFileSync(mise + 'kitchen/test/fixtures/hud-gauge.recipe.json', 'utf8')).recipe;
  const d = { colors: FT.dark, scheme: 'Dark' };
  const res = P.run(R.clean(fx, d));
  const roles = fx.fontdant.extensions.roles, labels = roles.filter((x) => x.base !== 'metric');
  const t7 = byId(res, 'T7'), t5 = byId(res, 'T5');
  expect(t7.level !== 'hard', 'HUD gauge: the 300-weight numerals pass T7 (at most a warning below 24px)', t7);
  expect(!/hud-usd /.test(t7.detail), 'HUD gauge: the 31px figure is clean on T7', t7.detail);
  const unfloored = labels.filter((l) => !new RegExp(l.name + ' [\\d.]+px < 12px').test(t5.detail)).map((l) => l.name);
  expect(labels.length >= 12 && !unfloored.length, `HUD gauge: every label (${labels.length}) fails T5`, unfloored);
  // option A: labels at 12px
  const a = JSON.parse(JSON.stringify(fx));
  a.fontdant.extensions.roles.forEach((x) => { if (x.base !== 'metric' && parseFloat(x.size) < 0.75) x.size = '0.75rem'; });
  const ra = P.run(R.clean(a, d));
  expect(byId(ra, 'T5').ok, 'HUD option A: T5 passes with labels at 12px', byId(ra, 'T5').detail);
  // its grey still fails contrast; fitted to 4.5:1 on both grounds nothing hard is left
  expect(same(hard(ra), ['Quiet text', 'Quiet text on surfaces', 'X2', 'X4']), 'HUD option A: only the muted grey\'s contrast is left', hard(ra));
  const c = a.frosting.colors; c.muted = C.fit(c.muted, [[c.bg, 4.5], [c.surface, 4.5]]);
  a.fontdant.extensions.roles.forEach((x) => { if (x.color === '#475569') x.color = 'muted'; });
  const rb = P.run(R.clean(a, d));
  expect(rb.ok, `HUD option A + muted fitted to ${c.muted}: no hard failures`, hard(rb));
}

if (fails) { console.log(`\n${fails} pass check(s) failed`); process.exit(1); }
console.log(`PASS: the pass — defaults, ${presets.length} presets, 3000 lucky; 300@10px muted → T5 X4 (+T7 X3 warn); X1–X9; T13 rendered; extensions keep the 12px floor; HUD gauge numerals pass, labels fail T5`);
