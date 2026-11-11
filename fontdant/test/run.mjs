// Loads the plain-script parts into one sandbox (the way a browser would) and checks:
//  - both modes' defaults pass every contract that needs no rendering (T1–T12, T14–T17; T13 is rendered → phase 4)
//  - the generated CSS carries every style's longhands, the mode block, the scope block, the coarse floor, the alias faces
//  - fit raises a dial below its floor and badges it; fixes order; clamps scaling; snaps weights a face lacks
//  - a dense console app's 8 dials map one-to-one onto fontdant dials in dense mode, and its low-vision preset fits clean
//  - the font library: 39 entries, every face lands on its slot target, Inter's aliases are 100%, fallbacks have overrides
//  - bring your own font: a file not in the library becomes a valid entry (Lora), and a font whose hhea/typo disagree (Arial) is flagged (F5)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { metricsFromFile, makeEntry } from '../src/metrics.mjs';

const sandbox = { window: {}, console };
sandbox.window.window = sandbox.window;
for (const f of ['dist/type-tokens.js', 'dist/library.js', 'src/fontface.js', 'src/typecheck.js']) vm.runInNewContext(readFileSync(new URL('../' + f, import.meta.url), 'utf8'), sandbox);
const W = sandbox.window, T = W.FontdantTokens, K = W.FontdantCheck, L = W.FontdantLibrary, F = W.FontdantFonts;
const css = readFileSync(new URL('../dist/fontdant.css', import.meta.url), 'utf8');
const fontsCss = readFileSync(new URL('../dist/fontdant-fonts.css', import.meta.url), 'utf8');
let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (cond, ...m) => { if (!cond) fail(...m); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* 1. defaults in both modes */
const modes = Object.keys(T.modes);
for (const mode of modes) {
  const bad = K.failures({ mode });
  if (bad.length) fail(`${mode} defaults:`, bad.map((c) => `${c.id} ${c.detail}`).join(' | '));
  const pending = K.check({ mode }).filter((c) => c.pending).map((c) => c.id);
  expect(pending.join() === 'T13', mode, 'pending set should be T13 only, got', pending.join());
}
const R = K.resolve({ mode: 'dense' }), Rr = K.resolve({ mode: 'reading' });
const want = { dense: { eyebrow: 12, caption: 12, 'ui-sm': 12, ui: 13, 'mono-block': 13, 'body-sm': 14, body: 14, 'heading-sm': 16, 'heading-md': 18, 'heading-lg': 22, 'heading-xl': 28, display: 36, metric: 22 },
               reading: { eyebrow: 12, caption: 13, 'ui-sm': 13, ui: 15, 'mono-block': 15, 'body-sm': 15, body: 17, 'heading-sm': 19, 'heading-md': 22, 'heading-lg': 28, 'heading-xl': 32, display: 40, metric: 28 } };
for (const [mode, table] of Object.entries(want)) {
  const res = mode === 'dense' ? R : Rr;
  for (const [name, pxv] of Object.entries(table)) { const s = res.styles.find((x) => x.name === name); expect(s && near(s.sizePx, pxv, 0.01), mode, name, 'expected', pxv, 'got', s && s.sizePx); }
}
expect(R.styles.find((s) => s.name === 'heading-xl').face === 'display' && R.styles.find((s) => s.name === 'heading-md').face === 'text', 'heading faces (F4)');
expect(R.styles.find((s) => s.name === 'ui-button').weight === 600 && R.styles.find((s) => s.name === 'ui-nav').weight === 500 && R.styles.find((s) => s.name === 'ui-input').weight === 400, 'ui variant weights (F2)');
expect(R.styles.find((s) => s.name === 'eyebrow-lower').face === 'mono' && R.styles.find((s) => s.name === 'eyebrow-lower').case === 'lower', 'eyebrow lower variant');
expect(near(R.styles.find((s) => s.name === 'mono-inline').sizePx, 14 * 0.9, 0.01), 'mono-inline is 0.9em of body');
expect(Rr.styles.find((s) => s.name === 'heading-md').tracking === '-0.01em' && R.styles.find((s) => s.name === 'heading-md').tracking === '0', 'heading-md tracking follows the mode (T9)');
expect(R.faces.display === 'inter' && R.faces.text === 'inter' && R.faces.mono === 'jetbrains-mono', 'default look is Inter / Inter / JetBrains Mono', R.faces);

/* 2. generated CSS */
for (const st of T.styles) for (const k of ['family', 'size', 'weight', 'leading', 'tracking', 'numeric', 'transform', 'style']) expect(css.includes(`--fd-${st.name}-${k}:`), 'css missing', `--fd-${st.name}-${k}`);
expect(css.includes(':root[data-fd-mode="dense"]'), 'css missing dense mode block');
expect(/data-fd-mode="dense"\][^}]*--fd-body-size: var\(--fd-step-md\)/s.test(css), 'dense block should remap body to step md');
expect(css.includes('[data-fd-scope="embedded"]') && css.includes('--fd-heading-xl-size: var(--fd-step-h-md)'), 'embedded scope block');
expect(css.includes('@media (pointer: coarse)') && css.includes('--fd-ui-input-floor: 1rem'), 'coarse-pointer composer floor (T15)');
expect(css.includes('--fd-ui-input-size: max(var(--fd-ui-input-floor, 0px)'), 'ui-input size wraps the floor');
expect(css.includes('.fd-ui--button {') && css.includes('.fd-heading-xl {') && css.includes('.fd-mono-inline {'), 'classes for variant, step, inline');
expect(!/font:\s/.test(css), 'no font: shorthand in generated css');
expect(css.includes('--fd-body-paragraph: calc(1.5 * 1.5em)'), 'paragraph derived from leading (T16)');
expect((css.match(/font-synthesis: none/g) || []).length === T.styles.length, 'font-synthesis: none on every class');
expect(css.includes('--fd-step-md: calc(0.9375rem * var(--fd-scaling))'), 'steps scale with --fd-scaling');
expect(css.includes('--fd-face-text: "Inter fd-text", "Inter fd-text fallback", "Inter", system-ui'), 'default text face is the Inter alias stack');
expect(css.includes('--fd-face-mono: "JetBrains Mono fd-mono", "JetBrains Mono fd-mono fallback", "JetBrains Mono", ui-monospace'), 'default mono face is the JetBrains Mono alias stack');

/* 3. fit: floors, order, scaling */
const low = K.fit({ mode: 'dense', dials: { steps: { xs: '0.625rem' } } });
expect(low.notes.some((n) => /step xs raised to its floor \(12px\)/.test(n)), 'xs below floor should be raised; notes:', low.notes);
expect(!low.look.dials || !low.look.dials.steps || !low.look.dials.steps.xs, 'raised xs equals the default so the override is dropped', JSON.stringify(low.look));
expect(K.failures(low.look).length === 0, 'fitted look passes');
const lowBody = K.fit({ mode: 'dense', dials: { steps: { md: '0.75rem' } } });
expect(lowBody.notes.some((n) => /step md raised to its floor \(14px\)/.test(n)), 'dense body floor is 14 (F1); notes:', lowBody.notes);
expect(K.failures(lowBody.look).length === 0, 'fitted body look passes', K.failures(lowBody.look));
expect(K.failures({ mode: 'dense', dials: { steps: { md: '0.75rem' } } }).some((c) => c.id === 'T5'), 'unfitted 12px dense body must fail T5');
const order = K.fit({ mode: 'reading', dials: { steps: { lg: '2rem' } } });
expect(order.notes.filter((n) => /bumped to keep the order/.test(n)).length >= 3, 'order bumps h-sm, h-md, h-lg; notes:', order.notes);
expect(K.failures(order.look).length === 0, 'order-fitted look passes', K.failures(order.look));
const sc = K.fit({ scaling: 0.8 });
expect(sc.look.scaling === 1 && sc.notes.length === 1, 'scaling below range is raised to 1', sc);
const w = K.fit({ dials: { weights: { title: 450, bold: 300 } } });
expect(w.look.dials.weights.title === 500 && w.look.dials.weights.bold === 500 && w.notes.length === 2, 'weights keep their order', w.look.dials, w.notes);
expect(K.check({ roles: { metric: { weight: 300 } } }).find((c) => c.id === 'T7').ok, 'metric at 300 weight and 28px must pass T7 (desktop HUD gauge case)');
const thinSmall = K.check({ roles: { caption: { weight: 300 } } }).find((c) => c.id === 'T7');
expect(!thinSmall.ok && thinSmall.level === 'warn', 'caption at 300 weight warns T7', thinSmall);

/* 4. a dense console app: 8 dials → fontdant dials, dense mode */
const consoleDials = { fsXs: 12, fsS: 13, fsM: 14, fsL: 15, fsPanel: 16, weightEmph: 500, weightTitle: 600, weightBold: 700 };
const map = { fsXs: 'xs', fsS: 'sm', fsM: 'md', fsL: 'lg', fsPanel: 'h-sm', weightEmph: 'emph', weightTitle: 'title', weightBold: 'bold' };
for (const [k, v] of Object.entries(consoleDials)) { const got = k.startsWith('fs') ? R.stepPx[map[k]] : R.weights[map[k]]; expect(got === v, `console ${k}=${v} should equal fontdant dense ${map[k]}=${got}`); }
const lowVision = { mode: 'dense', dials: { steps: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem', lg: '1rem', 'h-sm': '1.125rem' }, weights: { emph: 600, title: 700, bold: 800 } } };
const lv = K.fit(lowVision);
expect(lv.notes.length === 1 && /step h-md bumped to keep the order \(19px\)/.test(lv.notes[0]), 'console low-vision preset fits with one order bump', lv.notes);
expect(K.failures(lv.look).length === 0, 'low-vision preset passes', K.failures(lv.look));
expect(K.cssVars(lowVision).includes('--fd-step-xs: calc(0.8125rem * var(--fd-scaling));') && K.cssVars(lowVision).includes('--fd-weight-bold: 800;'), 'cssVars emits the overrides');
{ const v = K.cssVars({ roles: { display: { size: '6rem', weight: 300 }, caption: { size: 'xs', weight: 'medium', case: 'upper', tracking: '0.08em' } } });
  expect(v.includes('--fd-display-size: calc(6rem * var(--fd-scaling));') && v.includes('--fd-display-weight: 300;') && v.includes('--fd-caption-size: var(--fd-step-xs);') && v.includes('--fd-caption-weight: var(--fd-weight-medium);') && v.includes('--fd-caption-transform: uppercase;') && v.includes('--fd-caption-tracking: 0.08em;'), 'cssVars emits per-role overrides (hand edits and snapped weights)', v); }
{ const ext = K.resolve({ extensions: { roles: [{ name: 'price', base: 'metric', size: '1.5rem', weight: 'title' }] } }).styles.find((s) => s.name === 'price');
  expect(ext && ext.extension && ext.base === 'metric' && ext.sizePx === 24 && ext.weight === T.weights.title, 'extension roles resolve with the standard schema', ext); }

/* 5. token file sanity */
expect(T.roles.filter((r) => r.group === 'core').map((r) => r.name).join() === 'display,heading,body,ui,caption,eyebrow,mono', 'core roles (D1)');
expect(T.roles.find((r) => r.group === 'data').name === 'metric', 'metric is the optional data role');
expect(T.stepOrder.length === 9 && Object.keys(T.weights).length === 5, '9 size steps and 5 weight dials');

/* 6. the font library and the fit aliases */
const ids = Object.keys(L.fonts);
expect(ids.length === 39, '39 library fonts (37 + DM Mono and Roboto for the NASA and CERN looks), got', ids.length);
expect(ids.filter((id) => L.fonts[id].lucky).length === 32, '32 lucky fonts');
for (const id of ids) {
  const e = L.fonts[id];
  expect(e.metrics.unitsPerEm > 0 && e.metrics.capHeight > 0 && e.metrics.xHeight > 0 && e.metrics.xWidthAvg > 0, id, 'metrics present');
  expect(e.metrics.names.fullName && e.metrics.names.postscriptName, id, 'both local() names');
  expect(e.licence.id === 'OFL-1.1' && e.licence.licensee === 'n/a (open)', id, 'open licence block', e.licence.id);
  for (const slot of e.slots) {
    const a = F.adjusted(id, slot);
    expect(a && near(a.metric === 'cap-height' ? a.cap : a.x, a.target, 1e-6), id, slot, 'lands on the slot target', a);
  }
  if (e.slots.includes('text')) expect([400, 500, 600, 700].every((wt) => e.weights.kind === 'variable' ? wt >= e.weights.min && wt <= e.weights.max : e.weights.available.includes(wt)), id, 'text slot needs 400–700');
}
expect(near(F.fitFactor(L.fonts.inter, 'display'), 1, 1e-6) && near(F.fitFactor(L.fonts.inter, 'text'), 1, 1e-6), 'Inter is the anchor: factor 1 in both slots');
expect(F.fitFactor(L.fonts.fraunces, 'display') > 1.03 && F.fitFactor(L.fonts.anton, 'display') < 0.86, 'Fraunces grows, Anton shrinks to the cap target', F.fitFactor(L.fonts.fraunces, 'display'), F.fitFactor(L.fonts.anton, 'display'));
expect(near(F.fitFactor(L.fonts['jetbrains-mono'], 'mono'), 0.5459 / 0.55, 1e-4), 'mono target borrows the text slot (matchFace)');
{ // a look may turn a slot's fit off (natural size): headings drawn for that face
  const off = F.faceCss({ faces: { display: 'fraunces', text: 'public-sans' }, fit: { display: false } });
  expect(off.factors.display === 1 && off.factors.text > 1.03, 'fit {display:false}: display at 100%, text still fitted', off.factors);
  expect(/"Fraunces fd-display";[^}]*size-adjust: 100%;/s.test(off.css), 'the display alias carries size-adjust 100%');
  const textOff = F.faceCss({ faces: { text: 'public-sans', mono: 'jetbrains-mono' }, fit: { text: false } });
  expect(textOff.factors.text === 1 && textOff.factors.mono === 1, 'text off: mono (which borrows the text target) is off too', textOff.factors);
  const back = F.faceCss({ faces: { display: 'fraunces' } });
  expect(back.factors.display > 1.03, 'a look without fit turns it back on', back.factors);
  const t11 = K.check({ faces: { display: 'anton' }, fit: { display: false } }).find((c) => c.id === 'T11');
  expect(t11 && /fit off by choice/.test(t11.detail), 'T11 names a chosen natural size', t11 && t11.detail);
  K.check({});   // reset the fit switches for what follows
}
expect(fontsCss.includes('font-family: "Inter fd-text";') && fontsCss.includes('size-adjust: 100%;') && fontsCss.includes('font-family: "Inter fd-text fallback";') && /ascent-override: 9\d\.\d+%;/.test(fontsCss) && fontsCss.includes('local("Arial")'), 'default fonts css: aliases, 100% for Inter, Arial fallback with overrides');
expect(fontsCss.includes('"JetBrains Mono fd-mono fallback"') && fontsCss.includes('local("Courier New")'), 'mono fallback stands on Courier New');
expect(!fontsCss.includes('"Inter fd-text";\n  src: url("../fonts/inter/inter-latin-wght.woff2") format("woff2");\n  font-weight: 100 900;\n  font-style: normal;\n  font-display: optional'), 'text slot loads with swap, not optional');
expect(fontsCss.includes('font-display: optional') && fontsCss.includes('font-display: swap'), 'loading policy per slot (mono optional, text/display swap)');
expect(F.faceCss({ faces: L.defaultLook }, { baseUrl: '/fonts' }).preloads.length === 2, 'default look preloads two files (Inter and JetBrains Mono, Inter once per file)');
expect(L.systemFallbacks.sans && L.systemFallbacks.serif && L.systemFallbacks.mono, 'three system fallbacks measured');

/* 6b. italics: every family Google ships with italics has them, emitted as font-style: italic in the same alias */
const withIt = ids.filter((id) => L.fonts[id].italics.kind !== 'none');
expect(withIt.length === 29, '29 families with italics, got', withIt.length);
for (const id of ['anton', 'bebas-neue', 'young-serif', 'syne', 'unbounded', 'space-grotesk', 'manrope', 'bricolage-grotesque', 'big-shoulders', 'cinzel']) expect(L.fonts[id].italics.kind === 'none', id, 'has no italics');
expect(L.fonts['ibm-plex-mono'].italics.kind === 'static' && L.fonts['ibm-plex-mono'].italics.available.join() === '400,500,600,700', 'IBM Plex Mono static italics 400–700');
const interBlocks = F.faceBlocks('inter', 'text', { baseUrl: '/fonts' });
expect(/font-family: "Inter fd-text";\n  src: url\("\/fonts\/inter\/inter-latin-wght-italic\.woff2"\)[^}]*font-style: italic;[^}]*size-adjust: 100%;/.test(interBlocks.css), 'Inter italic is in the same alias with the same size-adjust');
expect(/"Inter fd-text fallback";\n  src: local\("Arial Italic"\)/.test(interBlocks.css), 'italic fallback stands on Arial Italic');
expect(interBlocks.preloads.length === 1 && !interBlocks.preloads[0].includes('italic'), 'italics are not preloaded');
expect(!F.faceBlocks('anton', 'display', { baseUrl: '/fonts' }).css.includes('font-style: italic'), 'no italic blocks for a family without italics');

/* 7. T11, T12, T14 and weight snapping with real faces */
expect(K.failures({ faces: { display: 'fraunces', text: 'geist', mono: 'ibm-plex-mono' } }).length === 0, 'Fraunces / Geist / IBM Plex Mono passes everything', K.failures({ faces: { display: 'fraunces', text: 'geist', mono: 'ibm-plex-mono' } }));
const anton = K.check({ faces: { display: 'anton' } }).find((c) => c.id === 'T14');
expect(!anton.ok && /display 800 not in anton/.test(anton.detail) && /heading-xl 600 not in anton/.test(anton.detail), 'Anton in the display slot fails T14 before fit', anton.detail);
const antonFit = K.fit({ faces: { display: 'anton' } });
expect(antonFit.notes.some((n) => /^display weight 800 snapped to 400 \(anton has 400\)/.test(n)) && antonFit.notes.some((n) => /^heading-xl weight 600 snapped to 400/.test(n)), 'fit snaps Anton styles to 400 and badges them', antonFit.notes);
expect(K.failures(antonFit.look).length === 0, 'snapped Anton look passes', K.failures(antonFit.look));
const arimoDisplay = K.fit({ faces: { display: 'arimo' } });
expect(arimoDisplay.notes.some((n) => /^display weight 800 snapped to 700/.test(n)), 'Arimo (400–700) snaps display to 700', arimoDisplay.notes);
const unknown = K.fit({ faces: { display: 'helvetica-neue' } });
expect(unknown.notes.some((n) => /not in the library; using inter/.test(n)) && !unknown.look.faces, 'unknown face id falls back to the default and is badged', unknown.notes);
const wrongSlot = K.fit({ faces: { text: 'anton' } });
expect(wrongSlot.notes.some((n) => /anton is not offered for the text slot/.test(n)), 'a display-only face in the text slot is badged', wrongSlot.notes);
expect(K.cssVars({ faces: { display: 'fraunces' } }).includes('--fd-face-display: "Fraunces fd-display", "Fraunces fd-display fallback", "Fraunces", system-ui, sans-serif;'), 'cssVars emits the alias stack for a face');

/* 8. bring your own font: Lora (not in the library) and Arial (hhea ≠ typo → F5) */
const lora = makeEntry({ id: 'lora', family: 'Lora', files: [{ file: 'lora-latin-400.woff2', weight: '400' }], metrics: metricsFromFile(new URL('./fixtures/lora-latin-400.woff2', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), category: 'serif' });
expect(lora.metrics.names.family === 'Lora' && lora.weights.kind === 'static' && lora.weights.available.join() === '400' && lora.slots.join() === 'display' && lora.fallback === 'serif', 'Lora becomes a display-only static entry', lora.slots, lora.weights);
L.fonts.lora = lora;
const loraCss = F.faceBlocks('lora', 'display', { baseUrl: '/fonts' });
expect(loraCss.css.includes('"Lora fd-display"') && /size-adjust: 10\d\.\d+%/.test(loraCss.css) && loraCss.css.includes('local("Times New Roman")'), 'Lora gets a display alias and a Times fallback with no code change', loraCss.css.slice(0, 200));
const loraFit = K.fit({ faces: { display: 'lora' } });
expect(loraFit.notes.some((n) => /^display weight 800 snapped to 400 \(lora has 400\)/.test(n)) && K.failures(loraFit.look).length === 0, 'Lora look snaps and passes', loraFit.notes, K.failures(loraFit.look));
const arialPath = 'C:/Windows/Fonts/arial.ttf';
let arial = null; try { arial = makeEntry({ id: 'arial', family: 'Arial', files: [{ file: 'arial.ttf', weight: '400' }], metrics: metricsFromFile(arialPath) }); } catch (e) { console.log('skip Arial (no file):', e.message); }
if (arial) {
  expect(arial.metrics.metricTablesDisagree === true, 'Arial hhea and typo disagree');
  L.fonts.arial = arial;
  const af = K.fit({ faces: { display: 'arial' } });
  expect(af.notes.some((n) => /^arial: hhea and typo metrics differ \(1854\/1491\); fit uses hhea/.test(n)), 'F5: fit warns on disagreeing metric tables', af.notes);
}
delete L.fonts.lora; delete L.fonts.arial;

console.log(fails ? `FAIL: ${fails} failures` : `PASS: ${modes.length} modes × ${T.styles.length} styles, ${T.contracts.filter((c) => !c.needs || c.needs === 'font-metrics').length} contracts checked (T13 pending), fit floors/order/scaling/weights, console 8-dial map, ${ids.length}-font library on target, BYO Lora + Arial F5`);
if (fails) process.exitCode = 1;
