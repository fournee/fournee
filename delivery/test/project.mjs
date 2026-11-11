// project.mjs (phase 7): a project's committed type files. Checks the options projects rely on:
//  - a client font with no files (a system font such as Segoe UI) gets a stack by its own name, no @font-face, nothing copied
//  - --display overrides every face's font-display (desktop apps: block); a bad value is refused
//  - --no-copy writes no fonts/ and keeps a client font's own src
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { projectType } from '../scripts/project.mjs';

let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const out = () => mkdtempSync(join(tmpdir(), 'mise-project-'));
const sysFont = { id: 'segoe-ui', family: 'Segoe UI', shelf: 'custom', slots: ['text', 'display'], category: 'sans', fallback: 'sans', files: [],
  weights: { kind: 'static', available: [400, 600, 700] }, italics: { kind: 'none', available: [] }, axes: {},
  metrics: { unitsPerEm: 2048, ratios: { cap: 0.7, x: 0.5, xWidthAvg: 0.5, ascent: 1.08, descent: 0.25, lineGap: 0 } }, licence: { id: 'system' } };
const recipe = { name: 'T', fontdant: { faces: { display: 'segoe-ui', text: 'segoe-ui', mono: 'jetbrains-mono' }, fit: { display: false, text: false }, fonts: { 'segoe-ui': sysFont } } };

{ const d = out(), r = projectType(recipe, d);
  expect(/--fd-face-text: "Segoe UI", "Segoe UI fd-text fallback"/.test(r.css), 'a system font is used by its own name', r.css.match(/--fd-face-text:[^;]*/));
  expect(!/font-family: "Segoe UI fd-text";/.test(r.css), 'no @font-face alias for a font with no files');
  expect(r.copied.every((f) => !/segoe/.test(f)) && !existsSync(join(d, 'fonts', 'segoe-ui')), 'nothing copied for a system font', r.copied);
  expect(/font-display: optional/.test(r.css), 'default: the slot loading (optional) stays'); }
{ const r = projectType(recipe, out(), { display: 'block' });
  expect(/font-display: block/.test(r.css) && !/font-display: (optional|swap)/.test(r.css), '--display block reaches every face'); }
{ let threw = false; try { projectType(recipe, out(), { display: 'fast' }); } catch (e) { threw = /--display fast/.test(e.message); }
  expect(threw, 'a bad --display value is refused'); }
{ const d = out(), r = projectType(recipe, d, { noCopy: true, baseUrl: '/fonts/library' });
  expect(!existsSync(join(d, 'fonts')) && /\/fonts\/library\/jetbrains-mono\//.test(readFileSync(join(d, 'mise-type.css'), 'utf8')), '--no-copy: no fonts/ written, urls at the base'); }

console.log(fails ? `FAIL: ${fails} project.mjs checks` : 'PASS: project.mjs — system fonts by name, --display, --no-copy');
process.exit(fails ? 1 : 0);
