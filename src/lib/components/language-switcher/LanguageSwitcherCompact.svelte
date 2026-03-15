<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Icon } from '$components';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { getLocale, applyLocale } from '$lib/helpers/i18n';
	import { locale as localeStore } from '$lang/i18n-svelte';

	let {
		title = '',
		icon = '',
		items = [],
		onback,
		onselect,
		iconExternal = true
	}: {
		title?: string;
		icon?: string;
		items?: Array<{
			id: string;
			label: string;
			active?: boolean;
		}>;
		onback?: () => void;
		onselect?: (item: any) => void;
		iconExternal?: boolean;
	} = $props();

	let showSubmenu = $state(false);
	let currentLocale = $state<string | null>(null);
	let isAnimating = $state(false);
	let slideDirection = $state<'enter' | 'exit'>('exit');

	// Update current locale from i18n helpers
	function updateCurrentLocale() {
		if (browser) {
			currentLocale = getLocale();
		}
	}

	// Use i18n store so active state persists across navigations
	const effectiveLocale = $derived($localeStore ?? currentLocale);
	const updatedItems = $derived(items.map(item => ({
		...item,
		active: effectiveLocale ? item.id === effectiveLocale : item.active
	})));

	// Listen for storage changes
	if (browser) {
		window.addEventListener('storage', updateCurrentLocale);
		updateCurrentLocale(); // Initial load
	}

	const toggleSubmenu = () => {
		if (!showSubmenu) {
			showSubmenu = true;
			// Start off-screen, then animate in
			setTimeout(() => {
				slideDirection = 'enter';
			}, 10);
		}
	};

	const goBackToMainMenu = () => {
		slideDirection = 'exit';
		isAnimating = true;
		setTimeout(() => {
			showSubmenu = false;
			isAnimating = false;
			onback?.();
		}, 300);
	};

	const selectItem = async (item: any) => {
		// Apply locale using i18n helper (locale store updates; UI follows)
		await applyLocale(item.id);

		onselect?.(item);
		slideDirection = 'exit';
		isAnimating = true;
		setTimeout(() => {
			showSubmenu = false;
			isAnimating = false;
		}, 300);
	};

	// Cleanup on component destroy
	onMount(() => {
		return () => {
			if (browser) {
				window.removeEventListener('storage', updateCurrentLocale);
			}
		};
	});
</script>

<!-- Language Button -->
<button
	onclick={toggleSubmenu}
	class="flex items-center justify-between w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8"
>
	<div class="w-5"></div> <!-- Left spacer to balance the chevron -->
	<div class="flex items-center justify-center flex-1">
		{#if icon}
			<Icon name={icon} className="h-5 w-5 mr-1.5" />
		{/if}
		<span>{title}</span>
	</div>
	<ChevronRight className="h-5 w-5" />
</button>

<!-- Language Submenu Overlay -->
{#if showSubmenu}
	<div class="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-hidden" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
		<div class="w-full h-full bg-gray-800 transition-transform duration-300 ease-out {slideDirection === 'enter' ? 'translate-x-0' : 'translate-x-full'}" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
			<div class="h-full overflow-y-auto" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
				<ul class="flex flex-col text-xl">
					<!-- Back Button -->
					<li class="sticky top-0 z-20 bg-slate-900 flex justify-center border-b border-slate-600/30">
						<button
							onclick={(e) => { e.stopPropagation(); goBackToMainMenu(); }}
							class="flex items-center justify-between w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8"
						>
							<ChevronLeft className="h-5 w-5" />
							<span>Back</span>
							<div class="w-5"></div> <!-- Spacer to balance the layout -->
						</button>
					</li>

					<!-- Language Options -->
					{#if updatedItems && updatedItems.length > 0}
						{#each updatedItems as item}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								<button
									onclick={(e) => { e.stopPropagation(); selectItem(item); }}
									class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : ''}"
								>
									<div class="flex items-center">
										<span>{item.label}</span>
									</div>
								</button>
							</li>
						{/each}
					{/if}
				</ul>
			</div>
		</div>
	</div>
{/if}
