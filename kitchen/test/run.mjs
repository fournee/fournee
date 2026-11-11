// kitchen unit checks, in a sandbox loaded the way a browser would load the plain scripts:
//  1. a recipe { name, scheme, client, frosting, fontdant } with an empty fontdant round-trips through every
//     adapter (memory, localStorage, http, pywebview), as published, draft and favorite
//  2. a recipe with a full fontdant half round-trips too; unknown keys are dropped, missing ones defaulted
//  3. FrostingStore keeps working as an alias over KitchenStore (same API, same keys, same validation)
//  4. a recipe store adopts a project's existing published frosting look
//  5. a workbench app's replay: its exact calls (custom doc adapter, createStore, clean, publish → local copy)
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const files = ['../frosting/dist/tokens.js', '../fontdant/dist/type-tokens.js', 'src/store.js', 'src/recipe.js', '../frosting/src/store.js', '../fontdant/src/panel.js'];
function sandbox(extra) {
  const sb = Object.assign({ window: {}, console, JSON, Promise, Object, Array, String, Number, Math, isFinite }, extra);
  sb.window.window = sb.window; Object.assign(sb.window, extra);
  for (const f of files) vm.runInNewContext(readFileSync(new URL('../' + f.replace(/^\.\.\//, '../'), import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'utf8'), sb);
  return sb.window;
}
let fails = 0;
const fail = (...m) => { fails++; console.log('FAIL', ...m); };
const expect = (c, ...m) => { if (!c) fail(...m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* fakes for the three non-memory adapters */
function fakeLocalStorage() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; }
function fakeFetch() {
  const m = {};
  const f = async (url, init = {}) => {
    const key = new URL(url, 'http://x').pathname;
    if ((init.method || 'GET') === 'PUT') { m[key] = init.body; return { ok: true, status: 200, text: async () => '' }; }
    if (!(key in m)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => m[key] };
  };
  f._m = m; return f;
}
function fakePywebview() { const m = {}; return { api: { get_frosting: async (k) => (k in m ? m[k] : null), set_frosting: async (k, v) => { m[k] = v; } }, _m: m }; }

const ls = fakeLocalStorage(), ft = fakeFetch(), pw = fakePywebview();
const W = sandbox({ localStorage: ls, fetch: ft, pywebview: pw });
const K = W.KitchenStore, R = W.KitchenRecipe, FS = W.FrostingStore, FT = W.FrostingTokens;
const defaults = { colors: FT.light, scheme: 'Light' };

const adapters = {
  memory: K.memoryAdapter(),
  localStorage: K.localStorageAdapter('mise-test'),
  http: K.httpAdapter('https://example.test/api/look'),
  pywebview: K.pywebviewAdapter(),
};

/* 1 + 2: round-trips */
{ // a look's fit switches survive cleaning; only `false` per known slot is kept
  const c = R.cleanFontdant({ faces: { display: 'fraunces' }, fit: { display: false, text: true, bogus: false } });
  expect(same(c.fit, { display: false }), 'cleanFontdant keeps fit {display:false} and drops the rest', c.fit);
  expect(!('fit' in R.cleanFontdant({ fit: { display: true } })), 'an all-on fit is dropped');
}
{ // FontdantPanel.createStore(adapter, base): an empty store starts from the project's look (a site's recipe)
  const base = { faces: { display: 'fraunces', text: 'inter' }, fit: { display: false } };
  const ad = K.memoryAdapter(), st = W.FontdantPanel.createStore(ad, base);
  const first = await st.load();
  expect(first.draft.faces.display === 'fraunces' && first.draft.fit.display === false, 'empty type store starts from the base look', first.draft);
  await ad.set('type', JSON.stringify({ faces: { display: 'anton' } }));
  expect((await st.load()).draft.faces.display === 'anton', 'a published look wins over the base');
  expect(same((await W.FontdantPanel.createStore(K.memoryAdapter()).load()).draft, {}), 'no base: empty as before');
}
const emptyFd = { name: 'Corner Bakery', scheme: 'Light', client: 'Corner Bakery Ltd', frosting: { colors: { bg: '#fffdf8', text: '#1c1b19', accent: '#B4532A' } }, fontdant: {} };
const fullFd = { name: 'Midnight Diner', scheme: 'Dark', client: 'Diner Co', frosting: { colors: Object.assign({}, FT.dark, { accent: '#ff7a59' }) },
  fontdant: { mode: 'dense', scaling: 1.1, faces: { display: 'fraunces', text: 'inter', mono: 'jetbrains-mono' }, dials: { weights: { title: 650 } }, roles: { eyebrow: { variant: 'lower' } }, bogus: 1 }, extra: 'dropped' };
for (const [name, adapter] of Object.entries(adapters)) {
  const store = R.createRecipeStore(adapter, defaults);
  const first = await store.load();
  expect(same(first.theme, R.empty(defaults)) && first.favorites.length === 0, name, 'empty store yields the empty recipe');
  expect(same(first.theme.fontdant, {}), name, 'empty recipe has an empty fontdant half');
  for (const [label, rec] of [['empty fontdant', emptyFd], ['full fontdant', fullFd]]) {
    await store.saveDraft(rec);
    const d = (await store.load()).draft;
    const want = R.clean(rec, defaults);
    expect(same(d, want), name, label, 'draft round-trips', JSON.stringify(d).slice(0, 200));
    await store.publish();
    expect(same((await store.load()).theme, want), name, label, 'published round-trips');
    const favs = await store.saveFavorites([{ name: '  <i>' + rec.name + '</i> ', recipe: rec }]);
    const back = (await store.load()).favorites;
    expect(same(back, favs) && back[0].name === 'i ' + rec.name + ' /i' && same(back[0].recipe, want), name, label, 'favorite round-trips', JSON.stringify(back[0]).slice(0, 160));
  }
  const d = (await store.load()).theme;
  expect(d.frosting.colors.accent === '#FF7A59' && !('extra' in d) && !('bogus' in d.fontdant) && d.fontdant.mode === 'dense' && d.fontdant.faces.display === 'fraunces' && d.client === 'Diner Co', name, 'validation: uppercase hex, unknown keys dropped');
  expect(Object.keys(d.frosting.colors).length === FT.roles.length, name, 'missing colour roles filled from defaults');
}
expect(Object.keys(ls._m).some((k) => k === 'mise-test.recipe') && Object.keys(ft._m).includes('/api/look/recipe.draft') && 'recipe.favorites' in pw._m, 'each adapter wrote under the recipe keys', Object.keys(ls._m), Object.keys(ft._m), Object.keys(pw._m));
expect(same(R.clean({ fontdant: { mode: 'huge' } }, defaults).fontdant, {}), 'unknown fontdant mode dropped (FontdantTokens loaded)');
expect(R.clean({}, defaults).name === 'Untitled recipe' && R.clean({}, defaults).client === null && R.clean({}, defaults).scheme === 'Light', 'empty recipe defaults');
const look = { name: 'Paper', scheme: 'Light', colors: { bg: '#f1f2ef' } };
expect(same(R.toLook(R.fromLook(look, defaults)).colors.bg, '#F1F2EF'), 'fromLook / toLook bridge');

/* 3: FrostingStore alias */
expect(['createStore', 'clean', 'cleanFavorites', 'memoryAdapter', 'localStorageAdapter', 'httpAdapter', 'pywebviewAdapter', 'HEX'].every((k) => k in FS), 'FrostingStore keeps its whole API');
expect(FS.memoryAdapter === K.memoryAdapter && FS.httpAdapter === K.httpAdapter, 'FrostingStore adapters are kitchen\'s');
const fsStore = FS.createStore(K.memoryAdapter(), FT.dark);
await fsStore.saveDraft({ bg: '#123456', bogus: '#000000', text: 'red' });
const fsAfter = await fsStore.load();
expect(fsAfter.draft.bg === '#123456' && !('bogus' in fsAfter.draft) && fsAfter.draft.text === FT.dark.text && fsAfter.theme.bg === FT.dark.bg, 'FrostingStore draft validation unchanged');
const fsFavs = await fsStore.saveFavorites([{ name: '  <b>Hi</b>  ', colors: { bg: '#000000' } }, { colors: {} }]);
expect(fsFavs[0].name === 'b Hi /b' && fsFavs[1].name === 'Saved palette' && fsFavs[0].colors.bg === '#000000', 'FrostingStore favorites unchanged', fsFavs);
expect(same(fsStore.keys, { theme: 'theme', draft: 'draft', favorites: 'favorites' }), 'FrostingStore keeps frosting\'s keys');

/* 4: adopt the published frosting look */
const legacy = K.memoryAdapter();
await legacy.set('theme', JSON.stringify(Object.assign({}, FT.light, { accent: '#2255AA' })));
const adopt = await R.createRecipeStore(legacy, defaults).load();
expect(adopt.adoptedFrostingLook === true && adopt.theme.frosting.colors.accent === '#2255AA' && adopt.theme.name === 'Current look', 'recipe store adopts the existing frosting look', adopt.theme.name);

/* 5: a workbench app's replay: its exact store calls */
const docs = {}, mlocal = fakeLocalStorage();
const db = { doc: (path) => ({ get: async () => ({ exists: path in docs, data: () => docs[path] }), set: async (v) => { docs[path] = v; } }) };
const MW = sandbox({ localStorage: mlocal });
function dbAdapter(store) {
  return { get: (k) => store.doc('frosting/' + k).get().then((s) => (s.exists ? s.data().value : null)),
    set: (k, v) => store.doc('frosting/' + k).set({ value: v, at: Date.now() }).then(() => { if (k === 'theme') { try { mlocal.setItem('workbench.look', v); } catch (e) {} } }) };
}
const lookStore = MW.FrostingStore.createStore(dbAdapter(db), MW.FrostingTokens.light);
const loaded = await lookStore.load();
expect(same(loaded.theme, MW.FrostingTokens.light), 'workbench: empty db yields the light defaults');
await lookStore.saveDraft(Object.assign({}, loaded.draft, { accent: '#aa3300' }));
await lookStore.publish();
expect(JSON.parse(docs['frosting/theme'].value).accent === '#AA3300', 'workbench: publish writes frosting/theme');
expect(JSON.parse(mlocal.getItem('workbench.look')).accent === '#AA3300', 'workbench: publish keeps its local copy for first paint');
const relook = MW.FrostingStore.clean(JSON.parse(docs['frosting/theme'].value), MW.FrostingTokens.light);
expect(relook.accent === '#AA3300' && Object.keys(relook).length === MW.FrostingTokens.roles.length, 'workbench: FrostingStore.clean on the stored theme');
const memStore = MW.FrostingStore.createStore(MW.FrostingStore.memoryAdapter(), MW.FrostingTokens.dark);
expect(same((await memStore.load()).theme, MW.FrostingTokens.dark), 'workbench: memory adapter path (no db)');

console.log(fails ? `FAIL: ${fails} failures` : `PASS: recipe round-trips (empty and full fontdant) through ${Object.keys(adapters).length} adapters × published/draft/favorite, FrostingStore alias, look adoption, workbench replay`);
if (fails) process.exitCode = 1;
