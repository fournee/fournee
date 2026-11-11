// Generates dist/fontdant.css and dist/type-tokens.js from type-tokens.json.
// Usage: node scripts/build.mjs [--prefix=fd]
// Mirrors frosting/scripts/build.mjs: the token file is the only input; do not edit dist/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(root, 'type-tokens.json'), 'utf8'));
// the font library (fonts/library.json, from build-library.mjs) gives the default faces their aliases
const libPath = join(root, 'fonts', 'library.json');
const LIB = existsSync(libPath) ? JSON.parse(readFileSync(libPath, 'utf8')) : null;
globalThis.FontdantTokens = T; globalThis.FontdantLibrary = LIB;
await import('../src/fontface.js');
const FF = globalThis.FontdantFonts;
const faceDefault = (slot) => (LIB && LIB.defaultLook[slot] ? FF.faceStack(LIB.defaultLook[slot], slot) : T.faces[slot].generic);
const prefixArg = process.argv.find((a) => a.startsWith('--prefix='));
const p = prefixArg ? prefixArg.slice('--prefix='.length) : T.prefix;
const modes = Object.keys(T.modes);
const otherModes = modes.filter((m) => m !== T.defaultMode);

/* ── helpers ── */
const isModeMap = (v) => v && typeof v === 'object' && modes.some((m) => m in v);
const forMode = (v, mode) => (isModeMap(v) ? v[mode] : v);
const stepVar = (s) => `var(--${p}-step-${s})`;
const sizeExpr = (size) => (T.stepOrder.includes(size) ? stepVar(size) : size);  // a step id or a literal (e.g. 0.9em)
const weightVar = (w) => (w in T.weights ? `var(--${p}-weight-${w})` : String(w));
const faceVar = (f) => `var(--${p}-face-${f})`;
// Multiply every rem term by the scaling factor; vw terms stay as they are.
const scaled = (expr) => expr.replace(/(\d*\.?\d+)rem/g, (_, n) => `calc(${n}rem * var(--${p}-scaling))`);
const weightUp = (w) => { const ks = Object.keys(T.weights).filter((k) => k !== 'about'); const i = ks.indexOf(w); return ks[Math.min(i + 1, ks.length - 1)]; };

/* Resolve one emitted style (role, role-step or role-variant) into its longhand values for a mode. */
function style(role, over, mode) {
  const s = { ...role, ...over };
  if (over && over.strong) s.weight = weightUp(s.weight);
  return {
    family: faceVar(forMode(s.face, mode)),
    size: sizeExpr(forMode(s.size, mode)),
    weight: weightVar(s.weight),
    leading: String(forMode(s.leading, mode)),
    tracking: forMode(s.tracking, mode),
    numeric: s.tnum ? 'tabular-nums' : 'normal',
    transform: s.case === 'upper' ? 'uppercase' : s.case === 'lower' ? 'lowercase' : 'none',
    style: s.italic ? 'italic' : 'normal',
    coarseFloor: s.coarseFloor || null,
    measure: s.measure || null,
    align: s.align || null,
  };
}

/* Every style name the CSS emits: role, role-step, role-variant. */
function emitted(role) {
  // the bare role name is its default step (heading = heading-md, mono = mono-block)
  const out = [{ name: role.name, over: (role.steps && role.defaultStep && role.steps[role.defaultStep]) || {} }];
  for (const [k, v] of Object.entries(role.steps || {})) out.push({ name: `${role.name}-${k}`, over: v });
  for (const [k, v] of Object.entries(role.variants || {})) out.push({ name: `${role.name}-${k}`, over: v, variant: true });
  return out;
}

const vars = (name, st) => {
  const lines = [
    `  --${p}-${name}-family: ${st.family};`,
    `  --${p}-${name}-size: ${st.coarseFloor ? `max(var(--${p}-${name}-floor, 0px), ${st.size})` : st.size};`,
    `  --${p}-${name}-weight: ${st.weight};`,
    `  --${p}-${name}-leading: ${st.leading};`,
    `  --${p}-${name}-tracking: ${st.tracking};`,
    `  --${p}-${name}-numeric: ${st.numeric};`,
    `  --${p}-${name}-transform: ${st.transform};`,
    `  --${p}-${name}-style: ${st.style};`,
  ];
  if (st.measure) lines.push(`  --${p}-${name}-measure: ${st.measure};`, `  --${p}-${name}-paragraph: calc(${st.leading} * 1.5em);`);
  return lines.join('\n');
};

/* Variables that differ between the default mode and another mode (steps always; role sizes/tracking when mode-mapped). */
function modeDiff(mode) {
  const out = Object.entries(T.modes[mode].steps).map(([s, v]) => `  --${p}-step-${s}: ${scaled(v)};`);
  for (const role of T.roles) for (const e of emitted(role)) {
    const a = style(role, e.over, T.defaultMode), b = style(role, e.over, mode);
    for (const k of ['size', 'tracking', 'family', 'leading']) if (a[k] !== b[k]) out.push(`  --${p}-${e.name}-${k}: ${k === 'size' && b.coarseFloor ? `max(var(--${p}-${e.name}-floor, 0px), ${b.size})` : b[k]};`);
  }
  return out.join('\n');
}

/* ── CSS ── */
const rootBlock = [
  `  --${p}-scaling: 1;`,
  '',
  `  /* ── faces ── the families a look swaps; defaults are the library's default look (${LIB ? Object.values(LIB.defaultLook).join(' / ') : 'generic stacks'}) through their fit aliases */`,
  ...Object.keys(T.faces).filter((k) => k !== 'about').map((k) => `  --${p}-face-${k}: ${faceDefault(k)};`),
  '',
  `  /* ── weights ── ${T.weights.about} */`,
  ...Object.entries(T.weights).filter(([k]) => k !== 'about').map(([k, v]) => `  --${p}-weight-${k}: ${v};`),
  '',
  `  /* ── steps ── default mode "${T.defaultMode}"; every rem term is multiplied by --${p}-scaling */`,
  ...Object.entries(T.modes[T.defaultMode].steps).map(([s, v]) => `  --${p}-step-${s}: ${scaled(v)};`),
];
for (const g of Object.keys(T.groups)) {
  rootBlock.push('', `  /* ── ${g} ── ${T.groups[g]} */`);
  for (const role of T.roles.filter((r) => r.group === g)) for (const e of emitted(role)) rootBlock.push(vars(e.name, style(role, e.over, T.defaultMode)), '');
}

const modeBlocks = otherModes.map((m) => `:root[data-${p}-mode="${m}"] {\n${modeDiff(m)}\n}`).join('\n');

const scopeBlocks = [];
for (const role of T.roles) for (const [scope, map] of Object.entries(role.scopes || {})) {
  const lines = Object.entries(map).map(([step, over]) => `  --${p}-${role.name}-${step}-size: ${sizeExpr(over.size)};`);
  scopeBlocks.push(`[data-${p}-scope="${scope}"] {\n${lines.join('\n')}\n}`);
}

const coarse = [];
for (const role of T.roles) for (const e of emitted(role)) { const st = style(role, e.over, T.defaultMode); if (st.coarseFloor) coarse.push(`  --${p}-${e.name}-floor: ${st.coarseFloor};`); }
const coarseBlock = coarse.length ? `@media (pointer: coarse) {\n  :root {\n${coarse.map((l) => '  ' + l).join('\n')}\n  }\n}` : '';

const classes = [];
for (const role of T.roles) for (const e of emitted(role)) {
  const cls = e.variant ? `.${p}-${role.name}--${e.name.slice(role.name.length + 1)}` : `.${p}-${e.name}`;
  const n = e.name;
  // T13: anything set in the mono face wraps long tokens (URLs, hashes) instead of pushing the page sideways
  const mono = Object.keys(T.modes).some((m) => style(role, e.over, m).family === faceVar('mono'));
  classes.push(`${cls} {\n  font-family: var(--${p}-${n}-family); font-size: var(--${p}-${n}-size); font-weight: var(--${p}-${n}-weight);\n  line-height: var(--${p}-${n}-leading); letter-spacing: var(--${p}-${n}-tracking); font-variant-numeric: var(--${p}-${n}-numeric);\n  text-transform: var(--${p}-${n}-transform); font-style: var(--${p}-${n}-style); font-synthesis: none;${mono ? ' overflow-wrap: anywhere;' : ''}\n}`);
}
const body = T.roles.find((r) => r.name === 'body');
if (body && body.measure) classes.push(`.${p}-prose { max-width: var(--${p}-body-measure); text-align: ${body.align || 'start'}; }\n.${p}-prose p + p { margin-top: var(--${p}-body-paragraph); }`);

const css = `/* fontdant type tokens v${T.version} — generated from type-tokens.json by scripts/build.mjs; do not edit.
   Faces, weights and steps are dials a look sets; roles are longhand variables that reference them.
   Default mode "${T.defaultMode}" on :root; other modes under data-${p}-mode; scopes under data-${p}-scope.
   A look overrides any variable with setProperty or by injecting a :root block before first paint. */
:root {
${rootBlock.join('\n')}
}
${modeBlocks}
${scopeBlocks.join('\n')}
${coarseBlock}

/* ── classes ── one per role, step and variant; longhands only (a font shorthand would reset features) */
${classes.join('\n')}
`;

/* ── JS ── */
const api = {
  version: T.version, prefix: p, groups: T.groups, faces: T.faces, weights: Object.fromEntries(Object.entries(T.weights).filter(([k]) => k !== 'about')),
  stepOrder: T.stepOrder, defaultMode: T.defaultMode, scalingRange: T.scalingRange, modes: T.modes, features: T.features,
  roles: T.roles, contracts: T.contracts,
  styles: T.roles.flatMap((r) => emitted(r).map((e) => ({ name: e.name, role: r.name, variant: !!e.variant }))),
};
const js = `/* fontdant type tokens v${T.version} — generated from type-tokens.json; do not edit. Plain script: window.FontdantTokens, or require()-able. */
(function (root) {
  var api = ${JSON.stringify(api, null, 2)};
  root.FontdantTokens = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'fontdant.css'), css);
writeFileSync(join(root, 'dist', 'type-tokens.js'), js);
let extra = '';
if (LIB) {
  const libJs = `/* fontdant font library v${LIB.version} — generated from fonts/library.json; do not edit. Plain script: window.FontdantLibrary, or require()-able. */
(function (root) {
  var lib = ${JSON.stringify(LIB)};
  root.FontdantLibrary = lib;
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;
})(typeof window !== 'undefined' ? window : globalThis);
`;
  writeFileSync(join(root, 'dist', 'library.js'), libJs);
  const def = FF.faceCss({ faces: LIB.defaultLook }, { baseUrl: '../fonts' });
  const fontsCss = `/* fontdant default look: ${Object.values(LIB.defaultLook).join(' / ')} — generated by scripts/build.mjs from fonts/library.json; do not edit.
   Fit aliases ("<Family> fd-<slot>", size-adjust to the slot target) and metric-matched local() fallbacks.
   URLs are relative to this file (dist/ → ../fonts/); regenerate with FontdantFonts.faceCss(look, { baseUrl }) for another look or path.
   Preload these: ${def.preloads.join(', ')} */
${def.css}
`;
  writeFileSync(join(root, 'dist', 'fontdant-fonts.css'), fontsCss);
  extra = `, dist/library.js (${Object.keys(LIB.fonts).length} fonts), dist/fontdant-fonts.css (${Object.values(LIB.defaultLook).join('/')})`;
}
console.log(`built dist/fontdant.css and dist/type-tokens.js (prefix --${p}-, ${T.roles.length} roles → ${api.styles.length} styles, ${modes.length} modes, ${T.contracts.length} contracts)${extra}`);

// dist/metrics.js: fontkit + metrics-core for the browser (Add a font reads files the way the library build does)
{
  const { build } = await import('esbuild');
  await build({ entryPoints: [join(root, 'src', 'metrics-browser.mjs')], bundle: true, format: 'iife', platform: 'browser', minify: true, legalComments: 'eof', outfile: join(root, 'dist', 'metrics.js'), logLevel: 'silent' });
  console.log('built dist/metrics.js (fontkit for Add a font)');
}
