// Test server for the delivery targets. Serves the Fournée repo, the font library at /fonts/, and four pages that render
// the same recipe and specimen:
//   /plain   the look written into the first bytes by MiseApply.head() (what a server or build step does)
//   /boot    dist/mise.js + MiseApply.apply() in a <head> script (what a Python-built page or pywebview does)
//   /react   the React wrapper (MiseProvider + useMise().classes)
//   /svelte  the Svelte wrapper (the Mise.svelte component + its classes)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { bodyHtml } from './specimen.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const mise = join(here, '..', '..');
const require = createRequire(import.meta.url);
export const MiseApply = require('../dist/mise.js');
export const RECIPE = JSON.parse(readFileSync(join(here, 'fixtures', 'recipe.json'), 'utf8'));
const out = join(here, 'out');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json', '.ttf': 'font/ttf' };

/** bundles the React and Svelte demos into test/out (esbuild + esbuild-svelte) */
export async function bundles() {
  await mkdir(out, { recursive: true });
  const esbuild = require('esbuild'), sveltePlugin = require('esbuild-svelte');
  const common = { bundle: true, format: 'esm', platform: 'browser', logLevel: 'error', define: { 'process.env.NODE_ENV': '"production"' }, minify: false };
  await esbuild.build({ ...common, entryPoints: [join(here, 'apps', 'react-app.mjs')], outfile: join(out, 'react.js') });
  await esbuild.build({ ...common, entryPoints: [join(here, 'apps', 'svelte-app.mjs')], outfile: join(out, 'svelte.js'), conditions: ['svelte', 'browser'], mainFields: ['svelte', 'browser', 'module', 'main'],
    plugins: [sveltePlugin({ compilerOptions: { css: 'injected' } })] });
}

/** a probe in <head>: CLS (Chromium), and whether the look is in place in the first frame that paints the specimen
 *  (read in requestAnimationFrame, which runs just before that paint) */
const PROBE = `<script>window.__cls=0;try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)window.__cls+=e.value;});}).observe({type:'layout-shift',buffered:true});}catch(e){}
window.__firstSeen=null;new MutationObserver(function(m,o){var s=document.getElementById('spec');if(s&&window.__firstSeen===null){window.__firstSeen='';o.disconnect();requestAnimationFrame(function(){window.__firstSeen=getComputedStyle(document.documentElement).getPropertyValue('--fd-face-display');});}}).observe(document.documentElement,{childList:true,subtree:true});
</script>`;
const BASE = '<style>body { margin: 16px; width: 900px; background: var(--fr-bg); color: var(--fr-text); }</style>';

export function page(kind, opts = {}) {
  const fontsUrl = opts.fontsUrl || '/fonts', recipe = opts.recipe || RECIPE, css = opts.cssUrl || '/delivery/dist/mise.css';
  const json = JSON.stringify(recipe).replace(/</g, '\\u003c');
  if (kind === 'plain') {
    const h = MiseApply.head(recipe, { baseUrl: fontsUrl });
    const attrs = Object.entries(h.htmlAttrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    return `<!doctype html><html lang="en"${attrs}><head><meta charset="utf-8">${PROBE}<link rel="stylesheet" href="${css}">${BASE}${h.html}</head><body>${bodyHtml(MiseApply.classes(recipe))}</body></html>`;
  }
  if (kind === 'boot') {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">${PROBE}<link rel="stylesheet" href="${css}">${BASE}<script src="${opts.bundleUrl || '/delivery/dist/mise.js'}"></script><script>MiseApply.apply(${json}, { baseUrl: ${JSON.stringify(fontsUrl)} });</script></head><body>${bodyHtml(MiseApply.classes(recipe))}</body></html>`;
  }
  if (kind === 'react' || kind === 'svelte') {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">${PROBE}<link rel="stylesheet" href="${css}">${BASE}<script>window.RECIPE=${json};window.FONTS_URL=${JSON.stringify(fontsUrl)};</script></head><body><div id="root"></div><script type="module" src="${opts.appUrl || '/delivery/test/out/' + kind + '.js'}"></script></body></html>`;
  }
  throw new Error('unknown page ' + kind);
}

export async function startServer(opts = {}) {
  const state = { delayFonts: opts.delayFonts || 0 };
  const server = createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
    const m = /^\/(plain|boot|react|svelte)$/.exec(p);
    if (m) { res.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' }); res.end(page(m[1])); return; }
    try {
      const file = p.startsWith('/fonts/') ? normalize(join(mise, 'fontdant', p)) : normalize(join(mise, p));
      if (!file.startsWith(mise + sep)) throw new Error('outside');
      const d = await readFile(file);
      if (state.delayFonts && /\.woff2$/.test(file)) await new Promise((r) => setTimeout(r, state.delayFonts));
      res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(d);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, state, close: () => server.close() };
}
