// Assembles the catalog site into site/ (what Cloudflare Pages deploys): the page plus the built
// tokens and the plain-script parts, all flat so the page can reference them by filename.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
const files = {
  'catalog/index.html': 'index.html',
  'dist/frosting.css': 'frosting.css', 'dist/tokens.js': 'tokens.js',
  'src/readability.js': 'readability.js', 'src/fills.js': 'fills.js', 'src/gallery.js': 'gallery.js', 'dist/store.js': 'store.js',
  '../kitchen/src/standards.js': 'standards.js',
  'src/panel.js': 'panel.js', 'src/panel.css': 'panel.css',
};
for (const [from, to] of Object.entries(files)) copyFileSync(join(root, from), join(site, to));
writeFileSync(join(site, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n');
console.log(`site/ assembled (${Object.keys(files).length} files)`);
