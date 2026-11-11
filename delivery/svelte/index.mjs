/* Fournée for Svelte (build phase 6): a thin wrapper. An action that sets the recipe's variables on the page, and the
   role class names; no component library. Works in Svelte 4 and 5 (an action is plain JS).

     <script>
       import { mise, miseClasses } from '@fournee/delivery/svelte';
       import '@fournee/delivery/mise.css';
       let { recipe } = $props();
       const classes = $derived(miseClasses(recipe));
     </script>
     <div use:mise={{ recipe, baseUrl: '/fonts' }}>
       <h1 class={classes['heading-xl']}>…</h1>
     </div>

   Or the component: <Mise {recipe} baseUrl="/fonts">{#snippet children(classes)}…{/snippet}</Mise>
   (import Mise from '@fournee/delivery/svelte/Mise.svelte').

   First paint: an action runs when the element mounts, before the browser paints it. With SvelteKit server
   rendering, put miseHead(recipe, { baseUrl }).html in <svelte:head> ({@html …}) so the look is in the first
   bytes, and set its htmlAttrs on <html> in app.html or a handle hook. */
import { MiseApply } from '../dist/mise.mjs';

/** use:mise={{ recipe, baseUrl, id }} */
export function mise(node, params) {
  let key = null;
  function run(p) {
    p = p || {};
    const k = JSON.stringify([p.recipe || {}, p.baseUrl, p.id]);
    if (k === key) return;
    key = k;
    MiseApply.apply(p.recipe, { baseUrl: p.baseUrl || 'fonts', id: p.id || 'mise', doc: node.ownerDocument });
  }
  run(params);
  return { update: run };
}

/** { styleName: className } for a recipe. */
export function miseClasses(recipe) { return MiseApply.classes(recipe); }

/** For server rendering: { html, htmlAttrs, css } for <svelte:head>. */
export function miseHead(recipe, opts) { return MiseApply.head(recipe, opts); }

export { MiseApply };
