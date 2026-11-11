// The Svelte demo entry.
import { mount } from 'svelte';
import SvelteApp from './SvelteApp.svelte';

mount(SvelteApp, { target: document.getElementById('root'), props: { recipe: window.RECIPE, baseUrl: window.FONTS_URL || '/fonts' } });
