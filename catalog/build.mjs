// The Fournée catalog: one site for the whole design system. Assembles catalog/site/ from the pages here plus
// Fournée's built files (host it anywhere static; catalog/wrangler.example.jsonc is a Cloudflare template):
//   index.html     what Fournée is and where things live
//   frosting/      the Frosting catalog (frosting/scripts/catalog.mjs builds it; copied in as is)
//   fontdant.html  type presets with samples, the size ladder per mode, the font library
//   spec.html      the House spec and the 21 standards, rule by rule
//   steps.html     the four-step panel (Frosting, Fontdant, Spec, Expo) live, saved only in this browser
//   assets/        the plain scripts and styles, fonts/ the self-hosted font library
// Usage: node catalog/build.mjs [--placeholder]   (--placeholder: an empty page, for checking Access first)
import { cpSync, copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), site = join(here, 'site');
rmSync(site, { recursive: true, force: true });
mkdirSync(site, { recursive: true });
writeFileSync(join(site, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-cache\n');

if (process.argv.includes('--placeholder')) {
  writeFileSync(join(site, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Fournée</title><p>Fournée catalog: coming up.</p>\n');
  console.log('catalog/site: placeholder only');
  process.exit(0);
}

// the Frosting catalog, built by its own script, copied in whole
const node = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
node(['scripts/build.mjs'], join(root, 'frosting'));
node(['scripts/catalog.mjs'], join(root, 'frosting'));
cpSync(join(root, 'frosting', 'site'), join(site, 'frosting'), { recursive: true });
rmSync(join(site, 'frosting', '_headers'), { force: true });

// shared scripts and styles (flat names; fontdant's gallery/panel get an fd- prefix)
const assets = join(site, 'assets');
mkdirSync(assets, { recursive: true });
const files = {
  'frosting/dist/frosting.css': 'frosting.css', 'frosting/dist/tokens.js': 'tokens.js', 'frosting/dist/store.js': 'store.js',
  'frosting/src/readability.js': 'readability.js', 'frosting/src/fills.js': 'fills.js', 'frosting/src/gallery.js': 'gallery.js',
  'frosting/src/panel.js': 'panel.js', 'frosting/src/panel.css': 'panel.css',
  'fontdant/dist/type-tokens.js': 'type-tokens.js', 'fontdant/dist/library.js': 'library.js', 'fontdant/dist/metrics.js': 'metrics.js',
  'fontdant/dist/fontdant.css': 'fontdant.css', 'fontdant/dist/fontdant-fonts.css': 'fontdant-fonts.css',
  'fontdant/src/fontface.js': 'fontface.js', 'fontdant/src/typecheck.js': 'typecheck.js', 'fontdant/src/licence.js': 'licence.js',
  'fontdant/src/gallery.js': 'fd-gallery.js', 'fontdant/src/emit.js': 'emit.js', 'fontdant/src/panel.js': 'fd-panel.js', 'fontdant/src/panel.css': 'fd-panel.css',
  'kitchen/src/recipe.js': 'recipe.js', 'kitchen/src/sprinkles.js': 'sprinkles.js', 'kitchen/src/standards.js': 'standards.js',
  'kitchen/src/pass.js': 'pass.js', 'kitchen/src/passview.js': 'passview.js', 'kitchen/src/passview.css': 'passview.css',
  'kitchen/src/shell.js': 'shell.js', 'kitchen/src/shell.css': 'shell.css', 'kitchen/src/steps.js': 'steps.js',
};
for (const [from, to] of Object.entries(files)) copyFileSync(join(root, from), join(assets, to));
// fontdant-fonts.css points at ../fonts/, which is site/fonts from assets/
cpSync(join(root, 'fontdant', 'fonts'), join(site, 'fonts'), { recursive: true, filter: (p) => !/\.(json|md)$/i.test(p) || /library/.test(p) });

for (const f of readdirSync(join(here, 'pages'))) copyFileSync(join(here, 'pages', f), join(site, f));
console.log(`catalog/site assembled: ${Object.keys(files).length} assets, the Frosting catalog, fonts, ${readdirSync(join(here, 'pages')).length} pages`);
