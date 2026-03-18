<script lang="ts">
	import { Header, Footer } from '$components';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';
	import { applyLocale, detectLocale, getAvailableLocales } from '$lib/helpers/i18n';
	import { getStoredLocale, setStoredLocale } from '$lib/helpers/storageKeys';
	import { getSiteConfig } from '$lib/helpers/siteConfig';
	import type { Config } from 'vite-plugin-config';

	export let data: LayoutData;

	const __cfg = getSiteConfig();
	const cfg: Partial<Config> = __cfg ?? {};
	const { themeConfig, language, title, favicon } = cfg;
	const _theme = themeConfig ?? {};
	const { metadata, navbar } = _theme;
	const metaList = metadata ?? [];

	const enabled = language?.enabled || false;

	// Apply locale: URL wins over stored (mota.locale), then stored, then auto-detect, then default
	$: if (enabled && browser) {
		const storedLocale = getStoredLocale();
		const localeCodes = getAvailableLocales();
		const urlLocaleValid =
			(data as { fromUrl?: boolean; locale?: string }).fromUrl && data.locale && localeCodes.includes(data.locale);
		const storedValid = storedLocale && localeCodes.includes(storedLocale);

		// Priority 1: URL locale (e.g. /ru) — use it and persist so next visit follows it unless URL says otherwise
		if (urlLocaleValid) {
			const finalLocale = data.locale;
			setStoredLocale(finalLocale);
			document.documentElement.setAttribute('lang', finalLocale);
			applyLocale(finalLocale);
		}
		// Priority 2: stored locale (mota.locale)
		else if (storedValid) {
			const finalLocale = storedLocale!;
			document.documentElement.setAttribute('lang', finalLocale);
			applyLocale(finalLocale);
		}
		// Priority 3: Auto-detect
		else if (language?.autoDetect) {
			detectLocale(navigator.language, localeCodes)
				.then(detectedLocale => {
					const finalLocale =
						detectedLocale && localeCodes.includes(detectedLocale)
							? detectedLocale
							: language?.defaultLocale || 'en';
					setStoredLocale(finalLocale);
					document.documentElement.setAttribute('lang', finalLocale);
					applyLocale(finalLocale);
				})
				.catch(() => {
					const finalLocale = language?.defaultLocale || 'en';
					document.documentElement.setAttribute('lang', finalLocale);
					applyLocale(finalLocale);
				});
		}
		// Priority 4: Default
		else {
			const finalLocale = language?.defaultLocale || 'en';
			document.documentElement.setAttribute('lang', finalLocale);
			applyLocale(finalLocale);
		}
	}

	let isNavHidden = false;

	const handleNavHiddenChange = (event: CustomEvent) => {
		isNavHidden = event.detail.isHidden;
	};

	onMount(() => {
		if (browser) {
			document.addEventListener('navHiddenChange', handleNavHiddenChange as EventListener);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('navHiddenChange', handleNavHiddenChange as EventListener);
		}
	});
</script>

<svelte:head>
	<title>{title ?? ''}</title>
	{#if favicon}
		<link rel="icon" href={favicon} type="image/png" />
	{/if}
	{#if metaList.length}
		{#each metaList as { name, content, property }}
			{#if name}
				<meta {name} {content} />
			{/if}
			{#if property}
				<meta {property} {content} />
			{/if}
		{/each}
	{/if}
	<meta name="generator" content="MOTA" />
</svelte:head>

<div
	class={`view ${navbar && navbar.orientation === 'vertical' ? 'vertical-max-w flex flex-col lg:flex-row lg:mx-auto lg:container' : 'flex flex-col'}`}
>
	<div
		class={`header-wrapper ${navbar && navbar.orientation === 'vertical' ? 'lg:flex-shrink-0 lg:h-auto lg:min-w-0 max-lg:contents' : 'contents'} ${navbar && navbar.orientation === 'vertical' ? 'lg:w-[320px]' : ''} ${navbar && navbar.orientation === 'vertical' && navbar.hideOnScroll ? 'transition-[width] duration-300 ease-in-out' : ''} ${navbar && navbar.orientation === 'vertical' && navbar.hideOnScroll && isNavHidden ? 'lg:!w-0 lg:overflow-hidden' : ''}`}
	>
		<Header layoutData={data} />
	</div>
	<main
		class={`container flex-1 mx-auto px-4 xl:px-0 min-w-0 ${navbar && navbar.orientation === 'vertical' && navbar.hideOnScroll ? 'transition-[width] duration-300 ease-in-out' : ''} ${navbar && navbar.orientation === 'vertical' ? '' : 'pt-8'}`}
	>
		<slot />
	</main>
</div>
<Footer session={(data as { session?: App.Locals['session'] }).session} />
