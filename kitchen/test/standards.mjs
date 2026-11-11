// The standards dial (kitchen/src/standards.js) and gradient fills in the pass:
//  1. every profile is well formed; the house rules stay on top unless house: false
//  2. WCAG 2.0 profiles turn UI contrast into a warning; the UN raises text to 7:1; GOV.UK raises the type floors
//  3. the profile checks S1–S5 fire on their own cases (input borders, focus ring, targets once rendered, APCA, leading)
//  4. APCA matches the published reference values; a fill that fails at its middle fails the pass
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mise = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js', 'frosting/src/gallery.js', 'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'kitchen/src/store.js', 'kitchen/src/recipe.js', 'kitchen/src/standards.js', 'kitchen/src/pass.js'])
  vm.runInContext(readFileSync(mise + f, 'utf8'), sb, { filename: f });
const { KitchenPass: P, KitchenRecipe: R, KitchenStandards: K, FrostingTokens: FT, FrostingColor: C, FrostingGallery: G } = sb;

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const light = { colors: FT.light, scheme: 'Light' }, dark = { colors: FT.dark, scheme: 'Dark' };
const run = (r, o, d = light) => P.run(R.clean(r, d), o);
const byId = (res, id) => res.results.find((r) => r.id === id);
const hard = (res) => P.failing(res, 'hard');

/* 1 ── profiles */
const ids = new Set();
for (const p of K.list()) {
  expect(/^[a-z0-9-]+$/.test(p.id) && !ids.has(p.id), 'profile id', p.id); ids.add(p.id);
  expect(p.label && p.region && p.note && p.src && typeof p.text === 'number' && (p.ui === null || typeof p.ui === 'number'), 'profile fields', p.id);
  expect(['2.0', '2.1', '2.2', '3 draft'].includes(p.wcag), 'wcag version', p.id);
}
for (const id of ['wcag22-aa', 'wcag21-aa', 'wcag20-aa', 'us-federal', 'canada-federal', 'quebec', 'eu-eaa', 'uk-public', 'gov-uk', 'nhs', 'un', 'nasa', 'cern', 'japan-gov', 'korea-gov', 'apca-bronze'])
  expect(K.get(id), 'missing profile', id);
const base = C.contracts();
const strict = K.contracts('wcag22-aa', base, true), loose = K.contracts('wcag22-aa', base, false);
expect(strict.every((c, i) => c.min === base[i].min), 'house + WCAG 2.2 AA keeps the house numbers (house is stricter)');
expect(loose.find((c) => c.role === 'text').min === 4.5 && loose.find((c) => c.role === 'accent').min === 3, 'standard only: text 4.5, shapes 3');
const w20 = K.contracts('wcag20-aa', base, false);
expect(w20.filter((c) => !K.isText(c.role)).every((c) => c.level === 'warn') && w20.filter((c) => K.isText(c.role)).every((c) => c.level !== 'warn'), 'WCAG 2.0: UI contrast is a warning');

/* 2 ── the pass under profiles */
for (const d of [light, dark]) {
  const res = run({ scheme: d.scheme, standard: 'wcag22-aa' }, {}, d);
  expect(res.standard === 'wcag22-aa' && !hard(res).length, 'defaults pass WCAG 2.2 AA', d.scheme, hard(res));
}
G.presets().forEach((p) => { const res = P.run(R.clean({ frosting: { colors: p.colors }, standard: 'wcag22-aa' }, light)); expect(!hard(res).filter((h) => !/^S/.test(h)).length, 'preset under WCAG 2.2 AA', p.name, hard(res)); });
const un = run({ standard: 'un' }, { house: false });
expect(un.results.filter((r) => r.source === 'frosting' && /Quiet text/.test(r.label)).every((r) => /min 7\)/.test(r.detail)), 'UN: quiet text held to 7:1');
const govuk = run({ standard: 'gov-uk', fontdant: { mode: 'reading' } });
expect(!byId(govuk, 'T5').ok && /19px/.test(byId(govuk, 'T5').detail), 'GOV.UK: body under 19px fails T5', byId(govuk, 'T5').detail);
expect(byId(run({ standard: 'wcag22-aa' }), 'T5').ok, 'WCAG 2.2 AA alone sets no px floor');
const open = run({ standard: 'gov-uk', fontdant: { mode: 'reading', dials: { steps: { lg: '1.1875rem', 'h-sm': '1.25rem', 'h-md': '1.5rem' } } } });
expect(byId(open, 'T5').ok || !/body /.test(byId(open, 'T5').detail), 'GOV.UK: a 19px body passes the body floor', byId(open, 'T5').detail);

/* 3 ── S1–S5 */
const s = run({ standard: 'quebec' });
expect(byId(s, 'S1') && byId(s, 'S2') && byId(s, 'S3') && byId(s, 'S3').pending, 'Québec brings S1, S2 and a pending S3');
const rendered = run({ standard: 'quebec' }, { rendered: { targets: [{ name: 'button', w: 40, h: 40 }, { name: 'chip', w: 30, h: 18 }] } });
expect(!byId(rendered, 'S3').ok && /chip 30×18/.test(byId(rendered, 'S3').detail), 'S3 names the small target', byId(rendered, 'S3').detail);
const pale = run({ standard: 'wcag22-aa', frosting: { colors: Object.assign({}, FT.light, { accent: '#C9E4F0' }) } });
expect(!byId(pale, 'S2').ok, 'S2: a pale accent fails as a focus ring', byId(pale, 'S2').detail);
expect(byId(run({ standard: 'apca-bronze' }), 'S4'), 'APCA profile runs S4');
expect(byId(run({ standard: 'us-federal' }), 'S5'), 'USWDS leading check S5');
expect(Math.round(K.apca('#000000', '#FFFFFF') * 100) === 10604 && Math.round(Math.abs(K.apca('#FFFFFF', '#000000')) * 100) === 10788 && Math.round(K.apca('#888888', '#FFFFFF') * 100) === 6306, 'APCA reference values');

/* 4 ── fills in the pass */
const okFill = run({ frosting: { colors: FT.light, fills: { surface: { stops: ['role:surface', '#EDE8E0'], angle: 135 } } } });
expect(okFill.results.some((r) => /\(gradient\)/.test(r.label)) && !hard(okFill).length, 'a gentle surface fill passes', hard(okFill));
const badFill = run({ frosting: { colors: FT.light, fills: { surface: { stops: ['role:surface', '#3A3A3A'], angle: 90 } } } });
expect(hard(badFill).some((h) => /gradient/.test(h)), 'a dark end under dark text fails the pass', hard(badFill));

/* 5 ── fit: every profile × Frosting's defaults, presets and 200 lucky looks meets the profile after fit (no hard failures) */
{
  const looks = [FT.light, FT.dark, ...G.presets().map((p) => p.colors)];
  for (let s = 0; s < 200; s++) looks.push(G.lucky(s).colors);
  let n = 0, bad = 0;
  for (const p of K.list()) for (const colors of looks) {
    n++;
    const f = K.fit(p.id, { colors, type: { mode: 'reading' } });
    const after = P.run(R.clean({ frosting: { colors: f.colors }, fontdant: f.type, standard: p.id }, light));
    if (hard(after).length) { bad++; if (bad < 5) expect(false, 'fit leaves failures', p.id, hard(after), f.left); }
  }
  expect(!bad, `fit: ${bad} of ${n} still fail`);
  const un = K.fit('un', { colors: FT.light, type: { mode: 'reading' } });
  expect(un.changes.some((c) => c.what === 'muted') && un.colors.bg === FT.light.bg, 'UN fit moves quiet text, never the background', JSON.stringify(un.changes));
  const gov = K.fit('gov-uk', { colors: FT.light, type: { mode: 'reading' } });
  expect(gov.changes.some((c) => c.kind === 'type' && /step lg/.test(c.what) && /^19|^2/.test(c.to)), 'GOV.UK fit raises body to 19px+', JSON.stringify(gov.changes.filter((c) => c.kind === 'type')));
  const none = K.fit('wcag21-aa', { colors: FT.light, type: { mode: 'reading' } });
  expect(!none.changes.length, 'a look that already meets the profile is left alone', JSON.stringify(none.changes));
  const fillFit = K.fit('wcag22-aa', { colors: FT.light, fills: { surface: { stops: ['role:surface', '#3A3A3A'], angle: 90, space: 'oklab' } } });
  expect(fillFit.changes.some((c) => c.kind === 'gradient'), 'a failing fill is fitted or made solid', JSON.stringify(fillFit.changes));
}

console.log(fails ? `FAIL: ${fails} failures` : `PASS: standards dial — ${K.list().length} profiles, house on/off, WCAG 2.0 warnings, UN 7:1, GOV.UK floors, S1–S5, APCA reference values, fills in the pass, fit (21 profiles × 228 looks meet their profile)`);
if (fails) process.exitCode = 1;
