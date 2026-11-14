// The pass suggests a passing colour (deliverable A, criteria A1-A11), unit checks (Node, the same plain scripts
// the browser loads):
//  1. KitchenPass.suggest on its own: the six worked vectors, the result really passes, hue and saturation hold
//  2. the pass attaches `suggest` to failed or warned colour results (frosting contracts, X-checks) and to nothing else
//  3. Sprinkles loaded: the X4 note stays an info note without a suggestion
//  4. (Sprinkles loaded, as in the shell) nothing fails on the defaults, presets or lucky looks, so no result carries a suggestion, and every result is
//     otherwise identical to the previous pass.js (read from git HEAD)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const mise = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const FILES = ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/gallery.js', 'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'kitchen/src/store.js', 'kitchen/src/recipe.js', 'kitchen/src/standards.js'];
function sandbox({ sprinkles = false, passSource } = {}) {
  const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
  for (const f of FILES) vm.runInContext(readFileSync(mise + f, 'utf8'), sb, { filename: f });
  if (sprinkles) vm.runInContext(readFileSync(mise + 'kitchen/src/sprinkles.js', 'utf8'), sb, { filename: 'sprinkles.js' });
  vm.runInContext(passSource || readFileSync(mise + 'kitchen/src/pass.js', 'utf8'), sb, { filename: 'pass.js' });
  return sb;
}
const sb = sandbox();
const { KitchenPass: P, KitchenRecipe: R, FrostingTokens: FT, FrostingGallery: G, FrostingColor: C } = sb;

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const light = { colors: FT.light, scheme: 'Light' }, dark = { colors: FT.dark, scheme: 'Dark' };
const run = (S, r, d = light, o) => S.KitchenPass.run(S.KitchenRecipe.clean(r, d), o);
const byId = (res, id) => res.results.find((r) => r.id === id);

/* 1 ── the function, A1-A5 */
expect(typeof P.suggest === 'function', 'KitchenPass.suggest is exported');
{
  const v1 = P.suggest('#455768', [['#F2F5F8', 7]], { scheme: 'Light' });
  expect(v1 && v1.to === '#445566' && v1.direction === 'darker' && v1.deltaL === 0.6 && v1.ratio === 7.01 && v1.target === 7 && v1.from === '#455768', 'A1: V1', v1);
  const vectors = [
    ['V2', '#455768', [['#F2F5F8', 7], ['#FBFCFD', 7]], 'Light', '#445566', 'darker', 0.6, 7.01],
    ['V3', '#4A4F5C', [['#0F1115', 4.5], ['#171A21', 4.5]], 'Dark', '#7A8294', 'lighter', 20.4, 4.51],
    ['V4', '#8A92A6', [['#0F1115', 7], ['#171A21', 7]], 'Dark', '#9EA5B5', 'lighter', 6.9, 7.04],
    ['V5', '#9C9C9C', [['#FFFFFF', 4.5], ['#F5F3EF', 4.5]], 'Light', '#6F6F6F', 'darker', 17.6, 4.53],
  ];
  for (const [id, fg, rules, scheme, to, dir, dl, ratio] of vectors) {
    const s = P.suggest(fg, rules, { scheme });
    expect(s && s.to === to && s.direction === dir && s.deltaL === dl && s.ratio === ratio, `A2: ${id}`, s);
  }
  expect(P.suggest('#808080', [['#777777', 7]], { scheme: 'Light' }) === null, 'A3: V6 has no passing lightness (null)');
  // already passing: no move
  const same = P.suggest('#000000', [['#FFFFFF', 7]]);
  expect(same && same.to === '#000000' && same.direction === 'none' && same.deltaL === 0, 'a passing colour is returned unchanged', same);
  // A4 / A5 over a sweep: the result passes on every ground (unrounded), and keeps its hue and saturation
  let n = 0, hueDrift = 0, satDrift = 0, bad4 = 0, bad4Where = null, nulls = 0;
  let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  for (let i = 0; i < 400; i++) {
    const fg = C.hex({ h: rnd() * 360, s: 10 + rnd() * 90, l: 5 + rnd() * 90 });
    const grounds = [C.hex({ h: rnd() * 360, s: rnd() * 40, l: 88 + rnd() * 12 }), C.hex({ h: rnd() * 360, s: rnd() * 40, l: 88 + rnd() * 12 })];
    const rules = grounds.map((g) => [g, [4.5, 7][i % 2]]);
    const s = P.suggest(fg, rules, { scheme: 'Light' });
    if (!s) { nulls++; continue; }
    n++;
    if (!rules.every(([g, m]) => C.contrast(s.to, g) >= m)) { bad4++; bad4Where = bad4Where || [fg, grounds, s.to]; }
    const a = C.hsl(fg), b = C.hsl(s.to), o = C.hsl(s.from);
    if (a.s >= 10 && a.l >= 5 && a.l <= 95 && b.l > 8 && b.l < 92) {   // away from the ends, where 8-bit rounding bites
      hueDrift = Math.max(hueDrift, Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h)));
      satDrift = Math.max(satDrift, Math.abs(a.s - b.s));
    }
  }
  expect(n > 100 && bad4 === 0, 'A4: every suggestion passes every ground', bad4, bad4Where);
  expect(hueDrift <= 2 && satDrift <= 3, 'A5: hue within 2 degrees and saturation within 3 points', hueDrift, satDrift);
}

/* 2 ── the pass attaches it, A6, A7, A8 */
const consumer = { frosting: { colors: { bg: '#F2F5F8', surface: '#FBFCFD', muted: '#455768' } } };
{
  const res = run(sb, consumer);
  const x4 = byId(res, 'X4');
  expect(x4 && x4.ok === false && x4.level === 'warn', 'A6: X4 warns on the consumer recipe', x4);
  expect(x4.suggest && x4.suggest.to === '#445566' && x4.suggest.role === 'muted' && x4.suggest.target === 7, 'A6: X4 carries the suggestion', x4.suggest);
  expect(x4.suggest.against.every((a) => a.ratio >= a.min) && x4.suggest.against.some((a) => a.role === 'bg') && x4.suggest.against.some((a) => a.role === 'surface'), 'A6: it names the grounds it was checked on', x4.suggest.against);
}
{
  // a failing frosting contract: muted too faint on a dark bg
  const res = run(sb, { scheme: 'Dark', frosting: { colors: { muted: '#3A4050' } } }, dark);
  const q = byId(res, 'Quiet text');
  expect(q && !q.ok && q.level === 'hard', 'A7: Quiet text fails', q);
  const s = q && q.suggest;
  expect(s && s.role === 'muted' && s.direction === 'lighter' && s.target === 4.5, 'A7: the suggestion moves muted lighter', s);
  const colors = res.colors;
  expect(s && C.contrast(s.to, colors.bg) >= 4.5 && C.contrast(s.to, colors.surface) >= 4.5, 'A7: it also passes Quiet text on surfaces', s);
  // the suggestion is fed back: the two Quiet text contracts pass
  const back = run(sb, { scheme: 'Dark', frosting: { colors: { muted: s.to } } }, dark);
  expect(byId(back, 'Quiet text').ok && byId(back, 'Quiet text on surfaces').ok, 'A7: applying the suggestion fixes both contracts');
  // other kinds of result never get one
  const noisy = run(sb, { scheme: 'Dark', frosting: { colors: { muted: '#3A4050' } }, fontdant: { roles: { caption: { size: '0.625rem', weight: 300, color: 'muted' } } } }, dark);
  for (const r of noisy.results) if (r.ok || r.pending || r.level === 'info') expect(!('suggest' in r), 'A8: ok, pending and info results have no suggest property', r.id);
  expect(noisy.results.filter((r) => r.source === 'fontdant').every((r) => !('suggest' in r)), 'A8: fontdant results have no suggest');
}
{
  // gradient fill result: no single colour, so no suggestion
  const fills = { surface: { stops: [{ color: '#FFFFFF', at: 0 }, { color: '#000000', at: 100 }], angle: 90 } };
  const res = run(sb, { frosting: { fills } });
  expect(res.results.filter((r) => /across the fill/.test(r.detail || '')).every((r) => !('suggest' in r)), 'A8: gradient-fill results have no suggest');
}

/* 2b ── a null suggestion still says which ratio it was judged against (suggestTarget) */
{
  const mid = run(sb, { frosting: { colors: { bg: '#777777', surface: '#777777', muted: '#808080' } } });
  const t = byId(mid, 'Text on background');
  expect(t && t.suggest === null && t.suggestTarget === 7, 'suggestTarget: a null suggestion carries the ratio asked for', t);
  const x2 = byId(mid, 'X2');
  expect(x2 && x2.suggest === null && x2.suggestTarget === 7, 'suggestTarget: the strictest target that could not be met', x2 && x2.suggestTarget);
  for (const r of mid.results) if (r.suggest !== null) expect(!('suggestTarget' in r), 'suggestTarget: only on null suggestions', r.id);
  const withS = byId(run(sb, consumer), 'X4');
  expect(withS.suggest && !('suggestTarget' in withS), 'suggestTarget: absent when there is a suggestion');
}

/* 3 ── Sprinkles loaded, A9 */
{
  const sp = sandbox({ sprinkles: true });
  const res = run(sp, consumer);
  const x4 = byId(res, 'X4');
  expect(x4.ok === true && x4.level === 'info' && !('suggest' in x4), 'A9: with Sprinkles the X4 note is info and has no suggest', x4);
}

/* 4 ── A10, A11: nothing fails on good looks; existing fields are identical to the previous pass.js */
{
  let headSource = null;
  try { headSource = execFileSync('git', ['show', 'HEAD:kitchen/src/pass.js'], { cwd: mise, encoding: 'utf8', windowsHide: true }); } catch { /* no git: skip the comparison */ }
  // with Sprinkles loaded, as in the shell: without it the defaults' 7:1 quiet-text advice is a legitimate X4 warning
  const sp = sandbox({ sprinkles: true });
  const old = headSource ? sandbox({ sprinkles: true, passSource: headSource }) : null;
  const looks = [light, dark, ...G.presets().map((p) => ({ colors: p.colors, scheme: p.scheme }))];
  for (let i = 0; i < 3000; i++) { const l = G.lucky(); looks.push({ colors: l.colors, scheme: l.scheme }); }
  let withSuggest = 0, drift = 0;
  const KEYS = ['id', 'label', 'level', 'ok', 'pending', 'detail', 'source', 'where'];
  looks.forEach((l, i) => {
    const r = { scheme: l.scheme, frosting: { colors: l.colors } };
    const res = run(sp, r, l.scheme === 'Dark' ? dark : light);
    withSuggest += res.results.filter((x) => 'suggest' in x).length;
    if (old && (i < 60 || i % 50 === 0)) {
      const was = run(old, r, l.scheme === 'Dark' ? dark : light);
      const a = res.results.map((x) => KEYS.map((k) => JSON.stringify(x[k])).join('|')), b = was.results.map((x) => KEYS.map((k) => JSON.stringify(x[k])).join('|'));
      if (a.length !== b.length || a.some((x, j) => x !== b[j])) drift++;
    }
  });
  expect(withSuggest === 0, 'A10: no result on a passing look carries a suggest', withSuggest);
  expect(old ? drift === 0 : true, 'A11: id, label, level, ok, pending, detail, source and where are unchanged', drift);
  if (old) {
    // and on a failing recipe too
    const a = run(sp, consumer), b = run(old, consumer);
    expect(a.results.length === b.results.length && a.results.every((x, j) => KEYS.every((k) => JSON.stringify(x[k]) === JSON.stringify(b.results[j][k]))), 'A11: unchanged fields on the consumer recipe');
    expect(JSON.stringify(a.summary) === JSON.stringify(b.summary), 'A11: summary unchanged');
    // Sprinkles absent, where X4 really warns and the new field appears
    const oldPlain = sandbox({ passSource: headSource }), c = run(sb, consumer), d = run(oldPlain, consumer);
    expect(c.results.length === d.results.length && c.results.every((x, j) => KEYS.every((k) => JSON.stringify(x[k]) === JSON.stringify(d.results[j][k]))), 'A11: unchanged fields where X4 warns');
    expect(c.results.filter((x) => 'suggest' in x).map((x) => x.id).join() === 'X4', 'only X4 gains a suggest on the consumer recipe', c.results.filter((x) => 'suggest' in x).map((x) => x.id));
  }
}

console.log(fails ? `FAIL: ${fails} suggest failures` : 'PASS: the pass suggests a passing colour (A1-A11)');
process.exit(fails ? 1 : 0);
