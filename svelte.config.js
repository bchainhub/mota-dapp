import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		alias: {
			$lang: 'src/i18n',
			$data: 'src/data',
			$components: 'src/lib/components',
			$modules: 'src/lib/modules'
		},
		adapter: adapter()
	}
};

export default config;
