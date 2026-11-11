<!-- Fournée for Svelte 5: applies a recipe and hands the role class names to its children.
     <Mise {recipe} baseUrl="/fonts">{#snippet children(classes)}<h1 class={classes['heading-xl']}>…</h1>{/snippet}</Mise> -->
<script>
  import { mise, miseClasses } from './index.mjs';
  let { recipe, baseUrl = 'fonts', id = 'mise', children } = $props();
  const classes = $derived(miseClasses(recipe));
</script>

<div style="display: contents" use:mise={{ recipe, baseUrl, id }}>
  {@render children?.(classes)}
</div>
