// Phase 6, Python: pywebview renders the same recipe as the browser (page built by mise_web, served by pywebview's
// http server, never file://); Qt and tkinter get every role's real face (no substitute), Qt at the web's cap height.
//   MISE_PYTHON=<python> to choose the interpreter (needs pywebview, PyQt5, fontTools)
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { measure, settle, diff, bodyHtml } from './specimen.mjs';
import { startServer, MiseApply, RECIPE } from './server.mjs';
import { exportDesktop } from '../scripts/desktop.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const work = join(here, 'out', 'python');
rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true });
const python = process.env.MISE_PYTHON || 'python';
// Optional suite: skip (not fail) when Python or its packages are missing, as on a fresh clone or in CI.
const probe = spawnSync(python, ['-c', 'import webview, fontTools, tkinter, PyQt5'], { windowsHide: true, encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.log(`SKIP: Python delivery (needs ${python} with pywebview, PyQt5, fontTools and tkinter; set MISE_PYTHON to choose the interpreter)`);
  process.exit(0);
}
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };

writeFileSync(join(work, 'body.html'), bodyHtml(MiseApply.classes(RECIPE)));
writeFileSync(join(work, 'measure.js'), measure.toString());
const desktop = await exportDesktop(RECIPE, join(work, 'desktop'), { python });

const result = await new Promise((resolve, reject) => {
  const p = spawn(python, [join(here, 'python_check.py'), work, join(here, 'fixtures', 'recipe.json'), join(work, 'desktop')], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let so = '', se = ''; p.stdout.on('data', (d) => so += d); p.stderr.on('data', (d) => se += d);
  const t = setTimeout(() => { p.kill(); reject(new Error('python timed out\n' + se.slice(-1500))); }, 120000);
  p.on('exit', () => { clearTimeout(t); const m = so.match(/MISE-RESULT (.*)/); m ? resolve(JSON.parse(m[1])) : reject(new Error('no result\n' + so.slice(-800) + se.slice(-2000))); });
});

// pywebview vs Playwright's Chromium (WebView2 is Chromium too)
const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const { chromium } = require('playwright');
const srv = await startServer(); const browser = await chromium.launch(); let ref;
try { const pg = await browser.newPage({ viewport: { width: 1000, height: 900 } }); await pg.goto(`${srv.base}/plain`); await settle(pg); ref = await pg.evaluate(measure); }
finally { await browser.close(); srv.close(); }

const w = result.pywebview || {};
expect(!w.error && w.measure, 'pywebview ran', w.error);
if (w.measure) {
  const m = w.measure;
  expect(/^http:\/\/(127\.0\.0\.1|localhost)/.test(m.url), 'pywebview: the page is served over http by pywebview, not file://', m.url);
  expect(m.fontSrcs.length >= 3 && m.fontSrcs.every((u) => !/^file:/i.test(u)), 'pywebview: no font is a file:// url', m.fontSrcs);
  expect(/Fraunces fd-display/.test(m.firstSeen || ''), 'pywebview: the look is in place the moment the specimen is inserted', m.firstSeen);
  const d = diff(ref, m);
  expect(!d.length, 'pywebview: renders the same recipe as Chromium', d.slice(0, 6));
  expect(w.copied.join(',') === 'fraunces,ibm-plex-mono,source-sans-3', 'mise_web.copy_assets copies only the fonts the recipe uses', w.copied);
}

const q = result.qt || {};
expect(!q.error, 'Qt ran', q.error);
if (q.roles) {
  const bad = Object.entries(q.roles).filter(([, r]) => r.family !== r.expected).map(([n, r]) => `${n}: ${r.family} ≠ ${r.expected}`);
  expect(!bad.length, 'Qt: every role gets its real face (no substitute)', bad);
  const cap = Object.entries(q.roles).filter(([, r]) => Math.abs(r.capHeight - r.capExpected) > 1).map(([n, r]) => `${n}: cap ${r.capHeight} vs web ${r.capExpected}`);
  expect(!cap.length, 'Qt: every role\'s cap height is within 1px of the web\'s (the fit carried over)', cap);
  expect(Object.keys(q.roles).length === Object.keys(desktop.roles).length, 'Qt: all roles', Object.keys(q.roles).length);
}
const t = result.tk || {};
expect(!t.error, 'tkinter ran', t.error);
if (t.roles) {
  const bad = Object.entries(t.roles).filter(([, r]) => r.family !== r.expected).map(([n, r]) => `${n}: ${r.family} ≠ ${r.expected}`);
  expect(!bad.length, 'tkinter: every role gets its real face (registered privately)', bad);
  expect(t.roles['eyebrow-upper'].text === 'EYEBROW' && t.roles['eyebrow-lower'].text === 'eyebrow', 'tkinter: case transforms via mise.text()', t.roles['eyebrow-upper'].text);
  expect(t.color.toUpperCase() === globalThis.KitchenSprinkles.effective(MiseApply.clean(RECIPE)).muted.toUpperCase(), 'desktop colours: the Plain grey (Sprinkles off)', t.color);
}

const caps = q.roles ? Object.values(q.roles).map((r) => Math.abs(r.capHeight - r.capExpected)) : [0];
console.log(`pywebview (${w.measure ? w.measure.url.split('/').slice(0, 3).join('/') : '?'}): same as Chromium across ${w.measure ? Object.keys(w.measure.styles).length : 0} styles; Qt: ${q.roles ? Object.keys(q.roles).length : 0} roles on their real faces, cap height within ${Math.max(...caps).toFixed(2)}px of the web; tkinter: ${t.roles ? Object.keys(t.roles).length : 0} roles on their real faces; ${desktop.fonts.length} static TTFs`);
console.log(fails ? `FAIL: ${fails} python failures` : 'PASS: Python — pywebview (served, no file://) = Chromium; Qt and tkinter on the real faces, Qt at the web\'s cap height');
if (fails) process.exitCode = 1;
