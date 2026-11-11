// A recipe → W3C Design Tokens 2025.10 (decision F3: export only).
//   node delivery/scripts/dtcg.mjs <recipe.json> [out.tokens.json] [--mode reading|dense]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export function exportDtcg(recipe, opts) { require('../dist/mise.js'); return globalThis.MiseDTCG.export(recipe, opts); }

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), mi = args.indexOf('--mode'), mode = mi >= 0 ? args.splice(mi, 2)[1] : undefined;
  const [inPath, outPath] = args;
  if (!inPath) { console.error('usage: node delivery/scripts/dtcg.mjs <recipe.json> [out.tokens.json] [--mode reading|dense]'); process.exit(2); }
  const tokens = exportDtcg(JSON.parse(readFileSync(inPath, 'utf8')), { mode });
  const text = JSON.stringify(tokens, null, 2) + '\n';
  if (outPath) { writeFileSync(outPath, text); console.log(`${outPath}: ${Object.keys(tokens.color).length - 1} colours, ${Object.keys(tokens.typography).length - 1} typography tokens`); }
  else process.stdout.write(text);
}
