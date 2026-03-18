<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import { Icon } from '$components';
	import { onMount } from 'svelte';
	import { applyLocale, pathWithLocale } from '$lib/helpers/i18n';
	import { getStoredLocale } from '$lib/helpers/storageKeys';
	import { getSiteConfig } from '$lib/helpers/siteConfig';
	import { locale as localeStore } from '$lib/helpers/i18n';

	let {
		currentLocale = 'en',
		availableLocales = [{ code: 'en', name: 'English' }],
		defaultLocale = 'en',
		addIcons = false,
		className = '',
		orientation = 'horizontal',
		theme = 'blur'
	}: {
		currentLocale?: string;
		availableLocales?: Array<{ code: string; name: string; icon?: string }>;
		defaultLocale?: string;
		addIcons?: boolean;
		className?: string;
		orientation?: 'horizontal' | 'vertical';
		theme?: 'auto' | 'blur' | 'transparent';
	} = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	// Use i18n locale store so selection persists across navigations (not just page.data.locale)
	const actualCurrentLocale = $derived($localeStore ?? currentLocale);

	// When storage changes (e.g. another tab), apply so this tab’s locale store updates
	function updateCurrentLocale() {
		if (browser) {
			const stored = getStoredLocale();
			if (stored) applyLocale(stored);
		}
	}

	// Get current language name
	const currentLanguageName = $derived(availableLocales.find(locale => locale.code === actualCurrentLocale)?.name || actualCurrentLocale.toUpperCase());

	// Sort languages with current locale first
	const sortedLocales = $derived([
		...availableLocales.filter(locale => locale.code === actualCurrentLocale),
		...availableLocales.filter(locale => locale.code !== actualCurrentLocale)
	]);

	// Handle language change
	async function changeLanguage(locale: string) {
		if (locale === actualCurrentLocale) return;

		// Use i18n helper to apply locale (updates locale store; UI follows)
		await applyLocale(locale);

		// Update URL: always strip any locale in the first segment, then prepend new one (locale only in first position).
		const newPath = pathWithLocale(page.url.pathname, locale, defaultLocale);

		// Navigate to new path
		await goto(newPath as any, { replaceState: true });

		// Close dropdown
		isOpen = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		// Listen for storage changes and initial load
		if (browser) {
			window.addEventListener('storage', updateCurrentLocale);
			updateCurrentLocale(); // Initial load
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
			if (browser) {
				window.removeEventListener('storage', updateCurrentLocale);
			}
		};
	});
</script>

<div class="relative" bind:this={dropdownRef}>
	<!-- Language Button -->
	<button
		onclick={() => isOpen = !isOpen}
		class="flex items-center gap-1 px-1 py-2 transition-colors duration-200 {orientation === 'vertical' ? 'w-full justify-center' : ''} {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'} {className}"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<Icon name="languages" />
        {#if (getSiteConfig()?.language as { showName?: boolean } | undefined)?.showName}
		    <span class="whitespace-nowrap">{currentLanguageName}</span>
		{/if}
		{#if orientation === 'vertical'}
			<ChevronRight class="w-3 h-3 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{:else}
			<ChevronDown class="w-3 h-3 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{/if}
	</button>

		<!-- Dropdown Menu -->
		{#if isOpen}
			<div class="absolute {orientation === 'vertical' ? 'left-full top-0 ml-2' : 'right-0 mt-2'} w-56 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50 max-h-80 overflow-hidden">
				<div class="max-h-80 overflow-y-auto">
					{#each sortedLocales as locale}
						<button
							onclick={() => changeLanguage(locale.code)}
							class="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors duration-200 flex items-center justify-between gap-2 {locale.code === actualCurrentLocale ? 'bg-slate-700 font-medium' : ''}"
						>
							<span class="flex items-center gap-2">
								{#if addIcons && locale.icon}
									<span class="text-lg leading-none" aria-hidden="true">{locale.icon}</span>
								{/if}
								{locale.name}
							</span>
							{#if locale.code === actualCurrentLocale}
								<div class="w-2 h-2 bg-indigo-500 rounded-full shrink-0"></div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
</div>
