// Phase 6, Electron: the same recipe in a real Electron (ELECTRON_PATH, so nothing is downloaded; skipped if unset):
// pages over mise-app://, fonts over mise-fonts:// (never file://); plain, boot and React pages render identically,
// and identically to Playwright's Chromium; the fonts handler serves fonts only from its folder.
//   ELECTRON_PATH=<electron.exe>, in the environment or the repo's .env (see .env.example)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { measure, settle, diff } from './specimen.mjs';
import { page, bundles, startServer, mise } from './server.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'out', 'electron');
mkdirSync(out, { recursive: true });
try { process.loadEnvFile(join(here, '..', '..', '.env')); } catch {}
const electronExe = process.env.ELECTRON_PATH || '';
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
if (!existsSync(electronExe)) { console.log(`SKIP: no Electron at ${electronExe} (set ELECTRON_PATH in .env)`); process.exit(0); }

await bundles();
const urls = { fontsUrl: 'mise-fonts://fonts', cssUrl: 'mise-app://app/delivery/dist/mise.css', bundleUrl: 'mise-app://app/delivery/dist/mise.js', appUrl: 'mise-app://app/delivery/test/out/react.js' };
const PAGES = ['plain', 'boot', 'react'];
for (const k of PAGES) writeFileSync(join(out, k + '.html'), page(k, urls));
writeFileSync(join(out, 'measure.js'), measure.toString());

const result = await new Promise((resolve, reject) => {
  const p = spawn(electronExe, [join(here, 'electron', 'main.cjs'), mise, ...PAGES.map((k) => `delivery/test/out/electron/${k}.html`)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ELECTRON_ENABLE_LOGGING: '0' } });
  let so = '', se = ''; p.stdout.on('data', (d) => so += d); p.stderr.on('data', (d) => se += d);
  const t = setTimeout(() => { p.kill(); reject(new Error('electron timed out\n' + se.slice(-1500))); }, 90000);
  p.on('exit', () => { clearTimeout(t); const m = so.match(/MISE-RESULT (.*)/); m ? resolve(JSON.parse(m[1])) : reject(new Error('no result\n' + so.slice(-800) + se.slice(-1500))); });
});
expect(!result.error, 'electron ran', result.error);

// the reference: Playwright's Chromium on the plain page over http
const require = createRequire(new URL('../../fontdant/package.json', import.meta.url));
const { chromium } = require('playwright');
const srv = await startServer(); const browser = await chromium.launch();
let ref;
try { const pg = await browser.newPage({ viewport: { width: 1000, height: 900 } }); await pg.goto(`${srv.base}/plain`); await settle(pg); ref = await pg.evaluate(measure); }
finally { await browser.close(); srv.close(); }

const plain = result.pages['delivery/test/out/electron/plain.html'];
for (const k of PAGES) {
  const m = result.pages[`delivery/test/out/electron/${k}.html`];
  expect(m && m.protocol === 'mise-app:', `electron ${k}: the page is mise-app://, not file://`, m && m.protocol);
  expect(m && m.fontSrcs.length >= 3 && m.fontSrcs.every((u) => u.startsWith('mise-fonts://fonts/')) && m.fontUrls.every((u) => u.startsWith('mise-fonts://fonts/')), `electron ${k}: every font is a mise-fonts:// url`, m && m.fontSrcs);
  expect(m && /Fraunces fd-display/.test(m.firstSeen || ''), `electron ${k}: the look is in place in the first painted frame`, m && m.firstSeen);
  expect(m && !m.errors.length, `electron ${k}: no console errors`, m && m.errors);
  const d = m ? diff(ref, m) : ['missing'];
  expect(!d.length, `electron ${k}: renders the same recipe as Chromium's plain page`, d.slice(0, 6));
}
expect(plain && plain.fonts.includes('Fraunces fd-display') && plain.fonts.includes('Source Sans 3 fd-text') && plain.fonts.includes('IBM Plex Mono fd-mono'), 'electron: the three faces loaded', plain && plain.fonts);
const pr = result.probe || {};
expect(pr.font === 200 && pr.climb === 404 && pr.climbEncoded === 404 && pr.licence === 404 && pr.missing === 404, 'mise-fonts:// serves fonts from its folder only (climbing out, non-font files, missing → 404)', pr);
expect(pr.fileUrl === 'error', 'the sandboxed page cannot fetch file:// at all', pr.fileUrl);

console.log(`electron ${result.electron} (Chromium ${result.chrome}): plain = boot = React = Playwright Chromium across ${plain ? Object.keys(plain.styles).length : 0} styles; fonts over ${result.fontsUrl}; pages over ${result.appUrl}; probe ${JSON.stringify(pr)}`);
console.log(fails ? `FAIL: ${fails} electron failures` : 'PASS: Electron — fonts over a privileged scheme (no file://), same recipe as the browser');
if (fails) process.exitCode = 1;
