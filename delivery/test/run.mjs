// All delivery checks (build phase 6), one after another; exits non-zero if any fails.
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
for (const t of ['project.mjs', 'dtcg.mjs', 'accent.mjs', 'roles.mjs', 'backcompat.mjs', 'web.mjs', 'electron.mjs', 'python.mjs']) {
  const r = spawnSync(process.execPath, [join(here, t)], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, encoding: 'utf8' });
  const lines = (r.stdout || '').trim().split('\n').filter((l) => /^(PASS|FAIL|SKIP)/.test(l) || /^FAIL /.test(l));
  console.log(lines.length ? lines.join('\n') : `FAIL ${t}: no result\n${(r.stderr || '').slice(-1500)}`);
  if (r.status !== 0 || !lines.some((l) => /^(PASS|SKIP)/.test(l))) failed++;
}
if (failed) { console.log(`\n${failed} delivery suite(s) failed`); process.exit(1); }
