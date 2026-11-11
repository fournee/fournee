// The Fournée playground: serves this repo on localhost and opens the sample page with the whole panel.
// Run: node scripts/playground.mjs [--no-open] [--port 4646]   (or double-click scripts/try-the-panel.cmd)
// Stops when its window is closed or with Ctrl+C. Nothing leaves this computer; looks are saved in the browser.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const wantPort = Number(args[args.indexOf('--port') + 1]) || 4646;
const PAGE = '/kitchen/demo/';
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') { res.writeHead(302, { location: PAGE }); res.end(); return; }
    let file = normalize(join(root, p));
    if (!file.startsWith(root + sep) || /[\\/](node_modules|\.git)([\\/]|$)/.test(file)) throw new Error('outside');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found'); }
});

function listen(port) {
  return new Promise((resolve, reject) => {
    server.once('error', (e) => (e.code === 'EADDRINUSE' && port < wantPort + 20 ? resolve(listen(port + 1)) : reject(e)));
    server.listen(port, '127.0.0.1', () => resolve(port));
  });
}

const port = await listen(wantPort);
const url = `http://127.0.0.1:${port}${PAGE}`;
console.log(`\n  Fournée playground is running at ${url}\n`);
console.log('  Left: a sample bakery page. Right: the Frosting tab, the Fontdant tab, the pass and Sprinkles.');
console.log('  Your changes are saved in this browser only. "Start over" in the top bar clears them.\n');
console.log('  Close this window (or press Ctrl+C) to stop.\n');
if (!args.includes('--no-open')) {
  // Windows: Chrome when it is installed, otherwise the default browser. macOS: `open`. Linux: `xdg-open`.
  // If nothing can be opened, the address printed above still works: paste it into a browser.
  const launch = (cmd, a) => { const p = spawn(cmd, a, { detached: true, stdio: 'ignore', windowsHide: true }); p.on('error', () => console.log(`  Open ${url} in your browser.\n`)); p.unref(); };
  let opened = false;
  if (process.platform === 'win32') {
    const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`];
    for (const c of chrome) { try { await stat(c); launch(c, [url]); opened = true; break; } catch { /* next */ } }
    if (!opened) launch('cmd', ['/c', 'start', '', url]);
  } else {
    launch(process.platform === 'darwin' ? 'open' : 'xdg-open', [url]);
  }
}
