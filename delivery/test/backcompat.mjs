// Back-compat (v1.3.0): MiseApply.css(recipe) for the fixture recipe, a light default and a dark default is the v1.2.0
// output (fixtures/css-v1.2.css, frozen from the unchanged tree) once the v1.3.0 additions are taken out: the three
// accent channel properties and the lines of any role added after v1.2.0.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSources, mise, RECIPE } from './sources.mjs';

const sb = loadSources(), M = sb.MiseApply;
const V12 = 26;   // roles in v1.2.0: the first 26 entries of tokens.json
const added = sb.FrostingTokens.roles.slice(V12).map((r) => r.name);
const variants = { 'recipe.json (dark)': RECIPE, 'light defaults': { name: 'L', scheme: 'Light' }, 'dark defaults': { name: 'D', scheme: 'Dark' } };
const css = Object.entries(variants).map(([k, r]) => `/* === ${k} === */\n` + M.css(r, { baseUrl: 'fonts' })).join('\n');
const drop = (l) => /^\s*--fr-accent-[hsl]:/.test(l) || added.some((n) => l.trim().startsWith(`--fr-${n}:`) || l.trim().startsWith(`--fr-${n}-fill:`));
const now = css.replace(/\r/g, '').split('\n').filter((l) => !drop(l)).join('\n');
const was = readFileSync(join(mise, 'delivery/test/fixtures/css-v1.2.css'), 'utf8').replace(/\r/g, '');
let fails = 0;
if (now !== was) {
  fails++;
  const a = now.split('\n'), b = was.split('\n'), i = a.findIndex((l, j) => l !== b[j]);
  console.log('FAIL MiseApply.css differs from the v1.2.0 fixture at line', i + 1, '\n  now:', a[i], '\n  was:', b[i]);
}
console.log(fails ? 'FAIL: 1 backcompat check' : `PASS: backcompat.mjs - MiseApply.css equals the v1.2.0 fixture (${was.length} chars, ${Object.keys(variants).length} recipes)`);
process.exit(fails ? 1 : 0);
