// Loads MiseApply and the parts it needs straight from the source files (the same list as scripts/build.mjs PARTS,
// minus dtcg.js), in one sandbox, so a test sees the current sources without rebuilding dist/mise.js.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const mise = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PARTS = [
  'frosting/dist/tokens.js', 'frosting/src/readability.js', 'frosting/src/fills.js',
  'fontdant/dist/type-tokens.js', 'fontdant/dist/library.js', 'fontdant/src/fontface.js', 'fontdant/src/typecheck.js', 'fontdant/src/emit.js',
  'kitchen/src/recipe.js', 'kitchen/src/sprinkles.js', 'delivery/src/apply.js',
];
export function loadSources() {
  const sb = { console }; sb.window = sb; sb.globalThis = sb; vm.createContext(sb);
  for (const f of PARTS) vm.runInContext(readFileSync(join(mise, f), 'utf8'), sb);
  return sb;
}
export const RECIPE = JSON.parse(readFileSync(join(mise, 'delivery', 'test', 'fixtures', 'recipe.json'), 'utf8'));
