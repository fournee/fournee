// Electron harness for the delivery test: a hidden window (never shown) loads pages over mise-app:// with fonts over
// mise-fonts://, measures each, probes the fonts handler, prints one JSON line, quits.
//   electron main.cjs <repo root> <page path>...
'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow } = require('electron');
const [miseRoot, ...pages] = process.argv.slice(process.argv.indexOf(__filename) + 1);
const mise = require(path.join(miseRoot, 'delivery', 'electron', 'index.cjs'));
const measureSrc = fs.readFileSync(path.join(__dirname, '..', 'out', 'electron', 'measure.js'), 'utf8');

mise.registerSchemes();
app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const fontsUrl = mise.serveFonts({ dir: path.join(miseRoot, 'fontdant', 'fonts') });
  const appUrl = mise.serveApp({ dir: miseRoot });
  const out = { electron: process.versions.electron, chrome: process.versions.chrome, fontsUrl, appUrl, pages: {} };
  const win = new BrowserWindow({ show: false, width: 1000, height: 900, useContentSize: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: false } });
  try {
    for (const p of pages) {
      const errors = [];
      win.webContents.removeAllListeners('console-message');
      win.webContents.on('console-message', (e) => { const lvl = e.level ?? e; if (lvl === 'error' || lvl === 3) errors.push(e.message || String(arguments[2])); });
      await win.loadURL(`${appUrl}/${p}`);
      const m = await win.webContents.executeJavaScript(`(async () => {
        const t0 = Date.now(); while (!document.querySelector('#spec [data-style]') && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 20));
        while (!window.__firstSeen && Date.now() - t0 < 10000) await new Promise((r) => setTimeout(r, 20));
        await document.fonts.ready; for (const el of document.querySelectorAll('#spec [data-style]')) el.offsetHeight; await document.fonts.ready;
        const measure = ${measureSrc};
        const r = measure(); r.firstSeen = window.__firstSeen; return r;
      })()`);
      m.errors = errors;
      out.pages[p] = m;
    }
    // the fonts handler: a real font, a path that climbs out, a non-font file in the fonts folder, a missing font
    win.webContents.removeAllListeners('console-message');   // the file:// probe below logs an expected error
    out.probe = await win.webContents.executeJavaScript(`(async () => {
      const st = async (u) => { try { const r = await fetch(u); return r.status; } catch (e) { return 'error'; } };
      const lib = ${JSON.stringify(fontsUrl)};
      return { font: await st(lib + '/fraunces/fraunces-latin-wght.woff2'), climb: await st(lib + '/../../package.json'), climbEncoded: await st(lib + '/%2e%2e/%2e%2e/package.json'),
        licence: await st(lib + '/fraunces/LICENSE.txt'), missing: await st(lib + '/fraunces/nope.woff2'), fileUrl: await st('file:///C:/Windows/win.ini') };
    })()`);
  } catch (e) { out.error = String(e && e.stack || e); }
  process.stdout.write('MISE-RESULT ' + JSON.stringify(out) + '\n');
  app.quit();
});
