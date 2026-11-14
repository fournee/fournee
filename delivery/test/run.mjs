// All delivery checks (build phase 6), one after another; exits non-zero if any fails.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
for (const t of ['project.mjs', 'dtcg.mjs', 'accent.mjs', 'roles.mjs', 'backcompat.mjs', 'web.mjs', 'electron.mjs', 'python.mjs']) {
  const r = spawnSync(process.execPath, [join(here, t)], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, encoding: 'utf8' });
  // Keep PASS/FAIL/SKIP lines, plus the detail lines printed under a FAIL (a diff or value), so CI logs say why.
  const lines = [];
  let inFail = 0;
  for (const l of (r.stdout || '').trim().split('\n')) {
    if (/^(PASS|SKIP)/.test(l)) { inFail = 0; lines.push(l); }
    else if (/^FAIL/.test(l)) { inFail = 40; lines.push(l); }
    else if (inFail > 0) { inFail--; lines.push(`  ${l}`); }
  }
  console.log(lines.length ? lines.join('\n') : `FAIL ${t}: no result\n${(r.stderr || '').slice(-1500)}`);
  if (r.status !== 0 || !lines.some((l) => /^(PASS|SKIP)/.test(l))) failed++;
}
if (failed) { console.log(`\n${failed} delivery suite(s) failed`); process.exit(1); }
