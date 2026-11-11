<!-- The Svelte demo: the specimen rendered by Svelte through the Mise.svelte component's classes. -->
<script>
  import Mise from '../../svelte/Mise.svelte';
  import { TEXT } from '../specimen.mjs';
  let { recipe, baseUrl } = $props();
</script>

<Mise {recipe} {baseUrl}>
  {#snippet children(classes)}
    <main id="spec">
      {#each Object.keys(classes) as n (n)}
        <p data-style={n} class={classes[n]}>{TEXT}</p>
      {/each}
      <div data-colors style="background: var(--fr-surface); color: var(--fr-muted); border: 1px solid var(--fr-border)">muted on surface</div>
    </main>
  {/snippet}
</Mise>
