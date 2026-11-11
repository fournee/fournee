// Loads the plain-script parts into one sandbox (the way a browser would) and checks:
//  - the light and dark defaults in tokens.json pass every contract
//  - every preset and thousands of lucky looks pass every contract, with and without a locked background
//  - the store validates and round-trips
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
// store: the shipped bundle (kitchen's engine + frosting's face), since Fournée phase 1
for (const f of ['dist/tokens.js', 'src/readability.js', 'src/fills.js', 'src/gallery.js', 'dist/store.js']) {
  vm.runInNewContext(readFileSync(new URL('../' + f, import.meta.url), 'utf8'), sandbox);
}
const W = sandbox.window, F = W.FrostingFills, C = W.FrostingColor, G = W.FrostingGallery, S = W.FrostingStore, T = W.FrostingTokens;
let fails = 0;
const bad = (label, theme) => {
  const f = C.check(theme).filter((c) => !c.ok);
  if (f.length) { fails++; if (fails < 15) console.log('FAIL', label, f.map((c) => `${c.label} ${c.ratio}<${c.min}`).join('; ')); }
};

bad('tokens.json light defaults', T.light);
bad('tokens.json dark defaults', T.dark);
G.presets().forEach((p) => bad('preset ' + p.name, p.colors));
for (let s = 0; s < 3000; s++) bad('lucky ' + s, G.lucky(s).colors);
const locks = ['#FFFFFF', '#000000', '#F5F0E6', '#0A2540', '#B3261E', '#1F3FBF', '#FFE36E', '#2E7D4F', '#3B0A45', '#E6F4FF', '#0F1115'];
locks.forEach((bg) => {
  if (C.bgHeadroom(bg) < 7) return;
  G.presets(bg).forEach((p) => bad(`preset ${p.name} on ${bg}`, p.colors));
  for (let s = 0; s < 300; s++) bad(`lucky ${s} on ${bg}`, G.lucky(s, bg).colors);
});
const names = new Set(G.PRESETS.map((p) => p.name));
if (names.size !== G.PRESETS.length) { fails++; console.log('FAIL preset names must be unique'); }
const roleNames = T.roles.map((r) => r.name);
G.presets().forEach((p) => { const missing = roleNames.filter((r) => !p.colors[r]); if (missing.length) { fails++; console.log('FAIL preset', p.name, 'missing', missing); } });

// store
const store = S.createStore(S.memoryAdapter(), T.dark);
const first = await store.load();
if (JSON.stringify(first.theme) !== JSON.stringify(T.dark)) { fails++; console.log('FAIL empty store should yield defaults'); }
await store.saveDraft({ bg: '#123456', bogus: '#000000', text: 'red' });
const after = await store.load();
if (after.draft.bg !== '#123456' || 'bogus' in after.draft || after.draft.text !== T.dark.text) { fails++; console.log('FAIL draft validation', after.draft); }
if (after.theme.bg !== T.dark.bg) { fails++; console.log('FAIL draft must not touch the published look'); }
await store.publish();
if ((await store.load()).theme.bg !== '#123456') { fails++; console.log('FAIL publish'); }
const favs = await store.saveFavorites([{ name: '  <b>Hi</b>  ', colors: { bg: '#000000' } }, { colors: {} }]);
if (favs[0].name !== 'b Hi /b' || favs[1].name !== 'Saved palette' || favs[0].colors.bg !== '#000000') { fails++; console.log('FAIL favorites', favs); }

// fills (gradients on roles)
const must = (ok, msg) => { if (!ok) { fails++; console.log('FAIL fills:', msg); } };
['#8FD0E1', '#123456', '#FFFFFF', '#000000', '#EE5555', '#00FF00'].forEach((h) => must(F.fromOklab(F.oklab(h)) === h, 'oklab round trip ' + h));
const mg = { stops: ['#FF00FF', '#00FF00'], angle: 90, space: 'oklab' };
must(Math.abs(F.worst(mg, '#000000', {}) - C.contrast('#FF00FF', '#000000')) < 0.01, 'oklab magenta→green stays at its worse end on black');
must(F.sample(mg, {}).length === F.SAMPLES, 'samples');
const cl = F.clean({ surface: { stops: ['#fff'] }, bg: { stops: ['#000000', '#ffffff', '#111111', '#222222'], angle: 400 }, nope: { stops: ['#000000', '#111111'] }, text: { stops: ['role:accent', 'role:nope', '#000000'], space: 'srgb' } }, T.roles.map((r) => r.name));
must(!cl.surface && !cl.nope && cl.bg.stops.length === 3 && cl.bg.angle === 40 && cl.text.stops.join() === 'role:accent,#000000' && cl.text.space === 'oklab', 'clean ' + JSON.stringify(cl));
must(F.css(cl.text) === 'linear-gradient(180deg in oklab, var(--fr-accent), #000000)', 'css ' + F.css(cl.text));
for (let s = 0; s < 300; s++) {
  const base = G.lucky(s).colors.accent, g = F.lucky(base, s), a = F.oklch(g.stops[0]), b = F.oklch(g.stops[1]);
  let dh = Math.abs(a[2] - b[2]); if (dh > 180) dh = 360 - dh;
  const chroma = F.sample(g, {}).map((h) => F.oklch(h)[1]), minEnd = Math.min(a[1], b[1]);
  if (minEnd > 0.04) must(dh >= 15 && dh <= 65, `lucky ${s} hue gap ${dh.toFixed(0)}`);
  must(Math.min(...chroma) >= minEnd * 0.6, `lucky ${s} grey middle`);
  const fitted = F.fit(g, {}, [['#FFFFFF', 4.5]]);
  must(!fitted || F.worst(fitted, '#FFFFFF', {}) >= 4.5, `fit ${s}`);
}
const look = Object.assign({}, T.dark, { fills: { surface: { stops: ['role:surface', '#202430'], angle: 135 } } });
const fr = F.check(look, look.fills);
must(fr.length > 0 && fr.every((r) => r.fill && r.range.length === 2), 'check over fills');
const fstore = S.createStore(S.memoryAdapter(), T.dark);
await fstore.saveDraft(look);
const fl = (await fstore.load()).draft;
must(fl.fills && fl.fills.surface && fl.fills.surface.stops[0] === 'role:surface', 'store keeps fills ' + JSON.stringify(fl.fills));
await fstore.saveDraft(T.dark);
must(!(await fstore.load()).draft.fills, 'store drops fills when the look has none');

// spread: 80 cards on a dark page (a dark app skin) and on the light defaults
for (const page of [{ ...T.dark, bg: '#0D0D0D', surface: '#171717', text: '#ECECEC', accent: '#8FD0E1' }, T.light]) {
  const sp = G.spread(80, page), hues = new Set();
  must(sp.length === 80, 'spread count');
  sp.forEach((o, i) => {
    const look = Object.assign({}, page, o);
    const bad = C.check(look).filter((c) => !c.ok && ['accent', 'accent-text'].includes(c.role));
    must(!bad.length, `spread ${i} accent`, bad.map((c) => c.label));
    if (o.fills) must(F.worst(o.fills.surface, page.text, look) >= 7 && F.worst(o.fills.surface, o.accent, look) >= 3, `spread ${i} fill readable`);
    hues.add(Math.round(C.hsl(o.accent).h / 10));
  });
  must(hues.size >= 8, 'spread: at least 8 hue families, got ' + hues.size);
  must(sp.filter((o) => o.fills).length >= 70, 'spread: most cards get a fill, got ' + sp.filter((o) => o.fills).length);
}

console.log(fails ? `FAIL: ${fails} failures` : `PASS: ${G.PRESETS.length} presets, 3000 lucky, ${locks.length} locked backgrounds, defaults, store; fills: Oklab, clean, css, 300 lucky gradients (hue gap, no grey middle, fit), sampled checks, store; spread: 80 cards × 2 pages, 8+ hue families, readable fills`);
if (fails) process.exitCode = 1;
