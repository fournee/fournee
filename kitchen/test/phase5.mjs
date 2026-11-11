// Phase 5 unit checks (Node, the same plain scripts the browser loads):
//  1. gallery: every preset is fitted and passes the pass; 3,000 lucky looks pass the pass
//  2. lucky never proposes an unlicensed font (a commercial font licensed to someone else is never rolled;
//     licensed to this client and domain, it can be)
//  3. licence checks L1–L6 fire on their own cases; open fonts pass; an added font (H3) only warns
//  4. a client font: registered from look.fonts, emitted with its own src, offered per client; using it in
//     another client's recipe is a warning; licence forbidding metric overrides → no fit
//  5. before-first-paint emission: preloads, @font-face, :root variables, mode attribute, kit links
//  6. Sprinkles: Plain reaches 7:1 keeping the hue; X4 becomes an info note when Plain exists; sprinkles off →
//     the pass checks the Plain colours; the prefers-contrast CSS
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mise = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
for (const f of ['frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/gallery.js', 'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js',
  'fontdant/src/licence.js', 'fontdant/src/gallery.js', 'fontdant/src/emit.js', 'kitchen/src/store.js', 'kitchen/src/recipe.js', 'kitchen/src/sprinkles.js', 'kitchen/src/standards.js', 'kitchen/src/pass.js'])
  vm.runInContext(readFileSync(mise + f, 'utf8'), sb, { filename: f });
const { KitchenPass: P, KitchenRecipe: R, KitchenSprinkles: S, FrostingTokens: FT, FrostingColor: C, FontdantGallery: G, FontdantLicence: Lic, FontdantFonts: F, FontdantEmit: E, FontdantLibrary: L, FontdantCheck: K } = sb;

let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const light = { colors: FT.light, scheme: 'Light' };
const run = (r, o) => P.run(R.clean(r, light), o);
const byId = (res, id) => res.results.find((r) => r.id === id);
const hard = (res) => P.failing(res, 'hard');

/* 1 ── gallery */
const presets = G.presets();
expect(presets.length >= 12 && presets[0].name === 'Default' && presets[0].look.faces.display === 'inter' && presets[0].look.faces.text === 'inter' && presets[0].look.faces.mono === 'jetbrains-mono', 'Default preset = Inter / Inter / JetBrains Mono, first');
const presetFails = presets.filter((p) => !run({ client: 'Corner Bakery', fontdant: p.look }).ok).map((p) => p.name + ': ' + hard(run({ client: 'Corner Bakery', fontdant: p.look })));
expect(!presetFails.length, `every type preset passes the pass (${presets.length})`, presetFails);
const poster = presets.find((p) => p.name === 'Poster');
expect(poster.notes.some((n) => /snapped to 400/.test(n)), 'Poster (Anton) is fitted: weights snapped and badged', poster.notes);
let luckyFails = [], faceSet = new Set();
for (let i = 0; i < 3000; i++) {
  const l = G.lucky({ client: 'Corner Bakery', domain: 'cornerbakery.example' });
  faceSet.add(l.look.faces.display); faceSet.add(l.look.faces.text); faceSet.add(l.look.faces.mono);
  const res = run({ client: 'Corner Bakery', fontdant: l.look });
  if (!res.ok) luckyFails.push(JSON.stringify(l.look.faces) + ' ' + hard(res));
}
expect(!luckyFails.length, '3,000 lucky looks pass the pass', luckyFails.slice(0, 3));
expect(faceSet.size >= 25, 'lucky reaches most of the library', faceSet.size);
const maybes = ['hanken-grotesk', 'plus-jakarta-sans', 'playfair-display', 'cinzel', 'instrument-serif'];
expect(!maybes.some((m) => faceSet.has(m)), 'lucky never rolls a "maybe" font');

/* 2 ── lucky's licence filter */
{
  const fake = JSON.parse(JSON.stringify(L.fonts['inter-tight']));
  fake.id = 'fake-commercial'; fake.family = 'Fake Commercial'; fake.licence = { id: 'commercial', licensee: 'Other Client', domains: ['other.example'], self_host: 'allowed', term: { type: 'perpetual' }, modify: { metric_override_css: 'allowed' } };
  L.fonts[fake.id] = fake;
  let seen = 0; for (let i = 0; i < 2000; i++) { const f = G.lucky({ client: 'Corner Bakery', domain: 'cornerbakery.example' }).look.faces; if (Object.values(f).includes(fake.id)) seen++; }
  expect(seen === 0, 'lucky never proposes a font licensed to another client', seen);
  fake.licence.licensee = 'Corner Bakery'; fake.licence.domains = ['cornerbakery.example'];
  let seen2 = 0; for (let i = 0; i < 2000; i++) { const f = G.lucky({ client: 'Corner Bakery', domain: 'shop.cornerbakery.example' }).look.faces; if (Object.values(f).includes(fake.id)) seen2++; }
  expect(seen2 > 0, 'licensed to this client and domain (subdomains count), it can be rolled', seen2);
  fake.licence.term = { type: 'term', expires: '2026-01-01' };
  expect(!Lic.covers(fake, { client: 'Corner Bakery', domain: 'cornerbakery.example', today: Date.parse('2026-11-08') }), 'an expired licence is not covered');
  /* 3 ── L1–L6 on a library (not added) commercial font */
  fake.licence = { id: 'commercial', licensee: 'Other Client', domains: ['other.example'], self_host: 'forbidden', term: { type: 'term', expires: '2026-12-01' }, cap: 1000, reserved_font_name: 'Fake', modify: { metric_override_css: 'allowed' } };
  const res = run({ client: 'Corner Bakery', fontdant: { faces: { display: fake.id } } }, { domain: 'cornerbakery.example', injection: 'build', traffic: 5000, subset: true, today: Date.parse('2026-11-08') });
  expect(byId(res, 'L1').level === 'hard' && !byId(res, 'L1').ok, 'L1: licensee mismatch is hard for a library font', byId(res, 'L1'));
  expect(byId(res, 'L2').level === 'hard' && !byId(res, 'L2').ok, 'L2: domain not covered is hard', byId(res, 'L2').detail);
  expect(byId(res, 'L3').level === 'hard' && !byId(res, 'L3').ok, 'L3: self-host forbidden + build injection is hard', byId(res, 'L3').detail);
  expect(byId(res, 'L4').level === 'warn' && /23 days/.test(byId(res, 'L4').detail), 'L4: expiring within 60 days warns', byId(res, 'L4').detail);
  expect(!byId(res, 'L5').ok && byId(res, 'L5').level === 'warn', 'L5: over the traffic cap warns');
  expect(!byId(res, 'L6').ok && /rename/.test(byId(res, 'L6').detail), 'L6: reserved name + subset warns');
  delete L.fonts[fake.id];
  const open = run({ client: 'Corner Bakery' }, { domain: 'cornerbakery.example', injection: 'build' });
  expect(['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].every((id) => byId(open, id).ok), 'the open default look passes every licence check');
}

/* 4 ── a client's own font (Add a font) */
const own = JSON.parse(JSON.stringify(L.fonts['arimo']));
Object.assign(own, { id: 'brand-sans', family: 'Brand Sans', added: true, client: 'Corner Bakery', shelf: 'own', lucky: false,
  files: [{ file: 'brand-400.woff2', weight: '400', style: 'normal', src: '/fonts/own/brand-400.woff2' }, { file: 'brand-700.ttf', weight: '700', style: 'normal', src: '/fonts/own/brand-700.ttf' }],
  weights: { kind: 'static', available: [400, 700] }, licence: { id: 'commercial', licensee: 'Corner Bakery', domains: ['cornerbakery.example'], self_host: 'allowed', term: { type: null }, modify: { metric_override_css: 'allowed' } } });
{
  const look = { faces: { display: 'brand-sans' }, fonts: { 'brand-sans': own } };
  const head = E.head(look, { baseUrl: '/fonts/library' });
  expect(/url\("\/fonts\/own\/brand-400\.woff2"\) format\("woff2"\)/.test(head.css) && /format\("truetype"\)/.test(head.css), 'a client font is emitted from its own src, with the right format', head.css.slice(0, 300));
  expect(head.preloads.includes('/fonts/own/brand-400.woff2') && head.preloads.includes('type="font/ttf"'), 'its upright files are preloaded');
  const fitted = K.fit(look).look;   // the panel fits every pick: the 800 weight snaps to 700
  const r1 = run({ client: 'Corner Bakery', fontdant: fitted }, { domain: 'cornerbakery.example' });
  expect(r1.ok && ['L1', 'L2'].every((id) => byId(r1, id).ok), 'in its own client\'s recipe the client font passes', hard(r1), byId(r1, 'L1').detail);
  const r2 = run({ client: 'Other Client', fontdant: fitted }, { domain: 'other.example' });
  expect(byId(r2, 'L1').level === 'warn' && !byId(r2, 'L1').ok && !hard(r2).includes('L1'), 'in another client\'s recipe it warns, not blocks (H3)', byId(r2, 'L1'));
  expect(!byId(r2, 'L2').ok && byId(r2, 'L2').level === 'warn', 'and the domain mismatch is a warning too (H3)', byId(r2, 'L2'));
  const f = K.fit({ faces: { display: 'brand-sans', text: 'brand-sans' }, fonts: { 'brand-sans': own } });
  expect(f.look.faces.text === 'brand-sans' && f.look.faces.display === 'brand-sans' && f.notes.some((n) => /snapped to 700/.test(n)), 'fit keeps a client font (registered from look.fonts) and snaps its weights', f.notes);
  const forb = JSON.parse(JSON.stringify(own)); forb.licence.modify.metric_override_css = 'forbidden';
  F.use({ 'brand-sans': forb });
  expect(F.faceBlocks('brand-sans', 'display', {}).k === 1 && /size-adjust: 100%;/.test(F.faceBlocks('brand-sans', 'display', {}).css), 'licence forbids metric overrides → size-adjust 100% (no fit)');
  expect(K.fit({ faces: { display: 'brand-sans' }, fonts: { 'brand-sans': forb } }).notes.some((n) => /forbids metric-override/.test(n)), '…and fit badges it');
  const kit = { id: 'hypatia-kit', family: 'hypatia-sans-pro', files: [], kit: 'abc1234', provider: 'adobe-kit', slots: ['display', 'text'], weights: { kind: 'static', available: [400, 500, 600, 700, 800] }, metrics: own.metrics, licence: { id: 'adobe-fonts', licensee: 'Corner Bakery', self_host: 'forbidden', modify: { metric_override_css: 'allowed' } }, added: true, client: 'Corner Bakery', fallback: 'sans' };
  const kh = E.head({ faces: { display: 'hypatia-kit' }, fonts: { 'hypatia-kit': kit } });
  expect(kh.preloads.includes('https://use.typekit.net/abc1234.css') && /--fd-face-display: "hypatia-sans-pro", "hypatia-sans-pro fd-display fallback"/.test(kh.css), 'an Adobe kit font: kit stylesheet linked, family first in the stack', kh.css.match(/--fd-face-display[^;]*/));
  F.use({});
}

/* 5 ── before-first-paint emission */
{
  const look = { mode: 'dense', faces: { display: 'fraunces', text: 'source-sans-3' }, dials: { weights: { bold: 800 } }, roles: { caption: { weight: 500 } } };
  const h = E.head(look, { baseUrl: '/fonts/library' });
  expect(/<link rel="preload" as="font" type="font\/woff2" href="\/fonts\/library\/fraunces\/[^"]+" crossorigin>/.test(h.preloads), 'preloads use the base URL', h.preloads.slice(0, 200));
  expect(!/italic/.test(h.preloads), 'italics are not preloaded');
  expect(/@font-face \{\n  font-family: "Fraunces fd-display";/.test(h.css) && /"Fraunces fd-display fallback"/.test(h.css), 'aliases and fallbacks are in the style');
  expect(/--fd-face-display: "Fraunces fd-display"/.test(h.css) && /--fd-face-mono: "JetBrains Mono fd-mono"/.test(h.css), ':root has every slot, defaults included');
  expect(/--fd-weight-bold: 800;/.test(h.css) && /--fd-caption-weight: 500;/.test(h.css), 'dials and role overrides are emitted');
  expect(h.htmlAttrs['data-fd-mode'] === 'dense' && /^<link/.test(h.html) && /<style id="fontdant">/.test(h.html), 'mode attribute and html string');
  expect(!Object.keys(E.head({}).htmlAttrs).length, 'default mode needs no attribute');
}

/* 6 ── Sprinkles */
{
  const P1 = S.plain(FT.light);
  const m = P1.changes.muted;
  expect(P1.available && m.after >= 7 && m.before >= 4.5 && m.before < 7, 'Plain takes muted from AA to 7:1', m);
  expect(Math.abs(C.hsl(m.to).h - C.hsl(m.from).h) < 6, 'Plain keeps the hue', C.hsl(m.from).h, C.hsl(m.to).h);
  expect(C.hsl(m.to).l < C.hsl(m.from).l, 'on light, Plain darkens');
  const Pd = S.plain(FT.dark).changes.muted;
  expect(Pd.after >= 7 && C.hsl(Pd.to).l > C.hsl(Pd.from).l, 'on dark, Plain lightens to 7:1', Pd);
  // "just enough": one lightness step back would miss 7:1
  const back = C.hex(Object.assign(C.hsl(m.to), { l: C.hsl(m.to).l + 1 }));
  expect(Math.min(C.contrast(back, FT.light.bg), C.contrast(back, FT.light.surface)) < 7, 'Plain moves the grey only as far as it must');
  const on = run({});
  expect(byId(on, 'X4').level === 'info' && byId(on, 'X4').ok && /Plain version available/.test(byId(on, 'X4').detail), 'Sprinkles on: X4 is an info note, "Plain version available"', byId(on, 'X4'));
  expect(on.summary.warn === 0 && on.summary.info >= 1, 'the default look has no warnings left, one note', on.summary);
  const off = run({ sprinkles: false });
  expect(byId(off, 'X4').ok && byId(off, 'X4').level !== 'info' && off.colors.muted === m.to, 'Sprinkles off: the pass checks the Plain grey and X4 passes outright', byId(off, 'X4'));
  expect(R.clean({}, light).sprinkles === true && R.clean({ sprinkles: false }, light).sprinkles === false, 'the recipe keeps sprinkles, on by default');
  const css = S.css(FT.light, { prefix: 'gfe' });
  expect(css.includes('@media (prefers-contrast: more) { :root:not([data-mise-contrast="normal"]) { --gfe-muted: ' + m.to + ' !important; } }') && css.includes(':root[data-mise-contrast="more"] { --gfe-muted: ' + m.to), 'prefers-contrast and the on-page switch get the Plain greys', css);
  // a mid-tone background can't carry 7:1 greys: no Plain version, X4 stays a warning
  const mid = { ...FT.light, bg: '#808080', surface: '#808080', muted: '#202020', text: '#000000' };
  expect(!S.plain(mid).available, 'no Plain version on a mid-tone background');
  expect(P.failing({ ...run({ frosting: { colors: mid } }) }, 'warn').includes('X4') || hard(run({ frosting: { colors: mid } })).length, 'there, X4 is not softened');
  expect(S.effective({ frosting: { colors: FT.light }, sprinkles: false }).muted === m.to && S.effective({ frosting: { colors: FT.light } }).muted === FT.light.muted, 'effective() follows the switch');
}

/* 6b ── Sprinkles waits for Publish (J5) */
{
  const mem = sb.KitchenStore.memoryAdapter(), st = S.store(mem);
  await st.load();
  expect(st.draft() === true && st.published() === true && !st.pending(), 'Sprinkles store: on by default, nothing pending');
  await st.set(false);
  expect(st.draft() === false && st.published() === true && st.pending() && (await mem.get('sprinkles')) == null, 'switching off writes only the draft', await mem.get('sprinkles'));
  const again = S.store(mem); await again.load();
  expect(again.draft() === false && again.published() === true, 'the draft is kept across loads');
  await again.publish();
  expect(again.published() === false && !again.pending() && (await mem.get('sprinkles')) === 'false', 'publish() makes it what visitors see');
  await again.set(true); await again.reset();
  expect(again.draft() === false && !again.pending(), 'reset() puts the draft back to the published value');
}

if (fails) { console.log(`\n${fails} phase 5 check(s) failed`); process.exit(1); }
console.log(`PASS: phase 5 — ${presets.length} type presets + 3000 lucky pass the pass; lucky licence filter; L1–L6; client fonts (scoped, H3 warnings, fit gate, Adobe kit); first-paint emission; Sprinkles (Plain 7:1, X4 note, prefers-contrast css, waits for Publish)`);
