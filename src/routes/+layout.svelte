<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/env';
	import '../css/app.css';
	import Toast from '$components/toast/Toast.svelte';

	onMount(() => {
		if (dev) return;
		void import('virtual:pwa-register')
			.then(({ registerSW }) => registerSW({ immediate: true }))
			.catch((error) => console.error('Service worker registration failed:', error));
	});
</script>

<slot />
<Toast />
