// Numeric accent in delivery (v1.3.0, deliverable B): MiseApply writes --fr-accent-h / -s / -l beside --fr-accent.
//  B8  dist/mise.css carries the same three declarations as frosting/dist/frosting.css (needs `npm run build` first)
//  B9  MiseApply.css, head and apply emit them from the recipe's accent
//  B10 a grey accent emits hue 0 and saturation 0%
//  B13 the wrappers (Python, Electron, React, Svelte) all call MiseApply, so they follow; they are exercised by
//      python.mjs, electron.mjs and web.mjs once dist/mise.js is rebuilt
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSources, mise, RECIPE } from './sources.mjs';

const sb = loadSources(), M = sb.MiseApply;
let fails = 0;
const expect = (c, ...m) => { if (!c) { fails++; console.log('FAIL', ...m); } };
const lines = (css) => css.split('\n').map((l) => l.trim()).filter((l) => /^--fr-accent-[hsl]:/.test(l));

// B8
const frosting = readFileSync(join(mise, 'frosting/dist/frosting.css'), 'utf8'), miseCss = readFileSync(join(mise, 'delivery/dist/mise.css'), 'utf8');
expect(lines(frosting).length === 9 && lines(frosting).join() === lines(miseCss).join(), 'B8: dist/mise.css has the same accent channel declarations as frosting.css (run `npm run build`)', lines(miseCss));

// B9
const red = { ...RECIPE, frosting: { colors: { ...RECIPE.frosting.colors, accent: '#FF0000' } } };
const want = ['--fr-accent-h: 0;', '--fr-accent-s: 100%;', '--fr-accent-l: 50%;'];
const css = M.css(red), block = css.slice(css.indexOf(':root:root:root'), css.indexOf('}', css.indexOf(':root:root:root')));
expect(want.every((w) => block.includes(w)), 'B9: css() has the three in the :root:root:root block', lines(block));
expect(want.every((w) => M.head(red).css.includes(w)), 'B9: head().css has them');
const doc = { tags: {}, documentElement: { setAttribute() {}, removeAttribute() {} }, head: { appendChild(t) { doc.tags[t.id] = t; } },
  getElementById: (id) => doc.tags[id] || null, createElement: () => ({ id: '', textContent: '' }) };
M.apply(red, { doc });
expect(want.every((w) => doc.tags.mise.textContent.includes(w)), 'B9: apply() writes them into the <style>');
// the accent that follows the recipe, light and dark defaults too
const dflt = M.css({ name: 'D', scheme: 'Dark' });
expect(dflt.includes('--fr-accent-h: 255.5;') && dflt.includes('--fr-accent-s: 100%;') && dflt.includes('--fr-accent-l: 74.1%;'), 'B9: a dark default recipe gets the dark accent channels', lines(dflt));
// a custom prefix
expect(M.css(red, { frostingPrefix: 'app' }).includes('--app-accent-h: 0;'), 'B9: the prefix option names them');

// B10
const grey = { ...RECIPE, frosting: { colors: { ...RECIPE.frosting.colors, accent: '#808080' } } };
const g = M.css(grey);
expect(g.includes('--fr-accent-h: 0;') && g.includes('--fr-accent-s: 0%;') && g.includes('--fr-accent-l: 50.2%;'), 'B10: a grey accent emits hue 0, saturation 0%', lines(g));

console.log(fails ? `FAIL: ${fails} accent checks` : 'PASS: accent.mjs - MiseApply emits the numeric accent (B8-B10)');
process.exit(fails ? 1 : 0);
