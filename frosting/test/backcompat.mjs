// Back-compat (v1.3.0): nothing that existed in v1.2.0 may change. Compared with fixtures frozen from the unchanged tree
// (fixtures/roles-v1.2.json, fixtures/frosting-v1.2.css): the 26 role values per look, the 37 contracts in order, the
// light and dark defaults, the role entries, and the generated CSS once the v1.3.0 additions are taken out.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const sandbox = { console }; sandbox.window = sandbox; sandbox.globalThis = sandbox; vm.createContext(sandbox);
for (const f of ['dist/tokens.js', 'src/readability.js', 'src/fills.js', 'src/gallery.js']) vm.runInContext(readFileSync(join(root, f), 'utf8'), sandbox);
const C = sandbox.FrostingColor, G = sandbox.FrostingGallery, T = sandbox.FrostingTokens;
const fx = JSON.parse(readFileSync(join(here, 'fixtures', 'roles-v1.2.json'), 'utf8'));
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; if (fails < 20) console.log('FAIL', ...m); } };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// the 26 role entries, unedited and in order (new roles, if any, come after)
expect(T.roles.length >= fx.roles.length && fx.roles.every((r, i) => same(T.roles[i], r)), 'the v1.2.0 role entries are unchanged and still first');
// the 37 contracts, unedited and in order
expect(T.contracts.length >= fx.contracts.length && fx.contracts.every((c, i) => same(T.contracts[i], c)), 'the v1.2.0 contracts are unchanged and still first');
const names = fx.roles.map((r) => r.name);
expect(names.every((n) => T.light[n] === fx.light[n] && T.dark[n] === fx.dark[n]), 'light and dark defaults are unchanged');
// every look keeps its 26 values, and the old contracts give the same results
const looks = {};
G.presets().forEach((p) => { looks['preset:' + p.name] = p.colors; });
for (let s = 0; s < 300; s++) looks['lucky:' + s] = G.lucky(s).colors;
expect(same(Object.keys(looks), Object.keys(fx.looks)), 'the same looks exist');
Object.entries(fx.looks).forEach(([k, want]) => {
  const got = looks[k]; if (!got) return;
  expect(names.every((n) => got[n] === want[n]), `look ${k}: the 26 role values are unchanged`);
  expect(same(C.check(want, fx.contracts), C.check(got, fx.contracts)), `look ${k}: the 37 contracts give the same results`);
});
// the generated CSS: take out the v1.3.0 additions and what is left is the v1.2.0 file
const names13 = T.roles.map((r) => r.name).filter((n) => !names.includes(n));
const additions = (l) => /^\s*--fr-accent-[hsl]:/.test(l) || /^\s*\/\* ── channels ──/.test(l) || names13.some((n) => l.includes(`--fr-${n}:`) || l.includes(`--fr-${n}-fill:`));
// the banner line carries the version, which is meant to change: compare it as "vX"
const unversioned = (t) => t.replace(/^(\/\* frosting tokens )v\d+\.\d+\.\d+/, '$1vX');
const now = unversioned(readFileSync(join(root, 'dist', 'frosting.css'), 'utf8')).replace(/\r/g, '').split('\n').filter((l) => !additions(l)).join('\n');
expect(now === unversioned(readFileSync(join(here, 'fixtures', 'frosting-v1.2.css'), 'utf8')).replace(/\r/g, ''),'dist/frosting.css, less the v1.3.0 additions, equals the v1.2.0 file');

console.log(fails ? `FAIL: ${fails} backcompat checks` : `PASS: backcompat.mjs - ${names.length} roles x ${Object.keys(looks).length} looks, ${fx.contracts.length} contracts, frosting.css`);
process.exit(fails ? 1 : 0);
