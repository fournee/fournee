// Builds delivery/dist from the plain scripts in frosting/, fontdant/ and kitchen/ (run after their builds):
//   dist/mise.js     one plain script: window.MiseApply plus everything it needs (also require()-able)
//   dist/mise.mjs    the same as an ES module (React, Svelte, bundlers): export { MiseApply, … }
//   dist/mise.css    the base stylesheet: frosting's role variables + fontdant's role classes
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const mise = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = join(mise, 'delivery', 'dist');
mkdirSync(dist, { recursive: true });
export const PARTS = [
  'frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js',
  'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'fontdant/src/emit.js',
  'kitchen/src/recipe.js', 'kitchen/src/sprinkles.js', 'delivery/src/apply.js', 'delivery/src/dtcg.js',
];
const GLOBALS = ['MiseApply', 'MiseDTCG', 'FrostingTokens', 'FrostingColor', 'FrostingFills', 'FontdantTokens', 'FontdantLibrary', 'FontdantFonts', 'FontdantCheck', 'FontdantEmit', 'KitchenRecipe', 'KitchenSprinkles'];
const banner = `/* Fournée delivery bundle: frosting colours + fontdant type + kitchen recipe/Sprinkles + MiseApply.
   Built by delivery/scripts/build.mjs from: ${PARTS.join(', ')}. Do not edit; edit the sources. */\n`;
const body = PARTS.map((p) => `/* ── ${p} ── */\n` + readFileSync(join(mise, p), 'utf8').trim()).join('\n\n');
// as a plain script, require() returns MiseApply (every part sets module.exports; the last word is this one)
writeFileSync(join(dist, 'mise.js'), banner + body + '\n\n/* require() → MiseApply; everything else is on globalThis */\nif (typeof module !== \'undefined\' && module.exports) module.exports = (typeof window !== \'undefined\' ? window : globalThis).MiseApply;\n');
writeFileSync(join(dist, 'mise.mjs'), banner + '/* eslint-disable */\nconst module = undefined;\n' + body + '\n\n' +
  GLOBALS.map((g) => `export const ${g} = globalThis.${g};`).join('\n') + '\nexport default MiseApply;\n');
writeFileSync(join(dist, 'mise.css'), '/* Fournée base stylesheet: frosting role variables + fontdant role classes. Built by delivery/scripts/build.mjs. */\n' +
  readFileSync(join(mise, 'frosting/dist/frosting.css'), 'utf8') + '\n' + readFileSync(join(mise, 'fontdant/dist/fontdant.css'), 'utf8'));
// for the Python helpers (mise_web.copy_assets): which files each library font has, and the default look
{
  const sb = {}; sb.window = sb; sb.globalThis = sb;
  new Function('window', 'globalThis', readFileSync(join(mise, 'fontdant/dist/library.js'), 'utf8'))(sb, sb);
  const L = sb.FontdantLibrary, fonts = {};
  for (const [id, e] of Object.entries(L.fonts)) fonts[id] = { family: e.family, files: e.files.map((f) => f.file), licence: e.licence && (e.licence.id || e.licence.spdx) || null };
  writeFileSync(join(dist, 'library-index.json'), JSON.stringify({ defaultLook: L.defaultLook, fonts }, null, 1));
}
console.log(`delivery/dist: mise.js, mise.mjs (${(body.length / 1024).toFixed(0)} KB), mise.css`);
