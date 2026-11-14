// New roles in delivery (v1.3.0, deliverable C):
//  C24 MiseApply.css(recipe) declares every role (39) as #RRGGBB in its :root:root:root block, fitted from the recipe;
//      the DTCG export has a color.<role> token with a $description for each
//  overrides flow through (frosting.overrides beats the calculated value); delivery/dist/mise.css carries the
//  calculated roles as color-mix() expressions, like frosting.css
//  X1 (delivery half) is delivery/test/backcompat.mjs: the v1.2.0 lines of MiseApply.css are unchanged
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { loadSources, mise, RECIPE } from './sources.mjs';

const sb = loadSources();
vm.runInContext(readFileSync(join(mise, 'delivery/src/dtcg.js'), 'utf8'), sb);
const M = sb.MiseApply, D = sb.MiseDTCG, T = sb.FrostingTokens, C = sb.FrostingColor;
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; if (fails < 30) console.log('FAIL', ...m); } };
const block = (css) => css.slice(css.indexOf(':root:root:root {'), css.indexOf('}', css.indexOf(':root:root:root {')));
const decl = (css, role) => { const m = new RegExp(`--fr-${role}: ([^;]+);`).exec(block(css)); return m ? m[1] : null; };
const CALC = T.roles.filter((r) => r.calc).map((r) => r.name);

expect(T.roles.length === 39 && CALC.length === 13, 'tokens: 39 roles, 13 calculated', T.roles.length, CALC.length);
const variants = { 'recipe.json': RECIPE, light: { name: 'L', scheme: 'Light' }, dark: { name: 'D', scheme: 'Dark' },
  accent: { name: 'A', scheme: 'Light', frosting: { colors: { accent: '#7B2CBF', 'accent-text': '#5A1F8C', bad: '#A1123F' } } } };
for (const [k, r] of Object.entries(variants)) {
  const css = M.css(r, { baseUrl: 'fonts' }), clean = M.clean(r);
  const missing = T.roles.filter((x) => !/^#[0-9A-F]{6}$/.test(decl(css, x.name) || ''));
  expect(!missing.length, `C24 ${k}: every role is declared as #RRGGBB in :root:root:root`, missing.map((x) => x.name));
  const want = C.complete(clean.frosting.colors, { overrides: {} });
  expect(CALC.every((n) => decl(css, n) === want[n]), `C24 ${k}: the calculated roles are fitted from the recipe`, CALC.filter((n) => decl(css, n) !== want[n]));
  expect(C.check(clean.frosting.colors, T.contracts.slice(37)).every((x) => x.ok), `C24 ${k}: the emitted roles pass the 23 new contracts`);
  const doc = D.export(r);
  const noDesc = T.roles.filter((x) => !(doc.color && doc.color[x.name] && doc.color[x.name].$value && doc.color[x.name].$description));
  expect(!noDesc.length, `C24 ${k}: DTCG has color.<role> with a $description for every role`, noDesc.map((x) => x.name));
}
// the accent variant really moved the calculated roles
expect(decl(M.css(variants.accent), 'accent-text-hover') !== T.light['accent-text-hover'], 'C24: a recipe accent moves accent-text-hover');
// overrides
{
  const css = M.css({ name: 'O', scheme: 'Light', frosting: { colors: {}, overrides: { 'border-strong': '#7a766f', bg: '#000000' } } });
  expect(decl(css, 'border-strong') === '#7A766F' && decl(css, 'bg') === T.light.bg, 'overrides: border-strong is pinned, a bg override is dropped');
}
// head() and apply() go through the same colours
expect(decl(M.head(variants.accent).css, 'bad-text') === decl(M.css(variants.accent), 'bad-text'), 'head(recipe).css carries the same calculated roles');
// the built stylesheet
{
  const css = readFileSync(join(mise, 'delivery/dist/mise.css'), 'utf8').replace(/\r/g, '');
  const missing = T.roles.filter((r) => r.calc).filter((r) => !css.includes(`--fr-${r.name}: color-mix(in srgb, var(--fr-${r.calc.to}) ${r.calc.weight}%, var(--fr-${r.calc.from}));`));
  expect(!missing.length, 'delivery/dist/mise.css declares every calculated role as color-mix() (rebuild with npm run build)', missing.map((r) => r.name));
}

console.log(fails ? `FAIL: ${fails} delivery roles checks` : `PASS: delivery/test/roles.mjs - MiseApply.css declares ${T.roles.length} roles (13 fitted), DTCG describes each, overrides flow, mise.css (C24)`);
process.exit(fails ? 1 : 0);
