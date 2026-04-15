<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Icon } from '$components';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getLocale, applyLocale, pathWithLocale } from '$lib/helpers/i18n';
	import { getSiteConfig } from '$lib/helpers/siteConfig';
	import { locale as localeStore } from '$lib/helpers/i18n';

	let {
		title = '',
		icon = '',
		items = [],
		onback,
		onselect,
		iconExternal = true,
		className = ''
	}: {
		title?: string;
		icon?: string;
		items?: Array<{
			id: string;
			label: string;
			icon?: string;
			active?: boolean;
		}>;
		onback?: () => void;
		onselect?: (item: any) => void;
		iconExternal?: boolean;
		className?: string;
	} = $props();

	let showSubmenu = $state(false);
	let currentLocale = $state<string | null>(null);
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
		const newLocale = item.id;
		const defaultLocale = (getSiteConfig()?.language as { defaultLocale?: string } | undefined)?.defaultLocale ?? 'en';

		// Apply locale (updates store; UI follows)
		await applyLocale(newLocale);

		// Update URL: always strip any locale in the first segment, then prepend new one (locale only in first position).
		const newPath = pathWithLocale(page.url.pathname, newLocale, defaultLocale);
		await goto(newPath as any, { replaceState: true });

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

<!-- Language drill: same row order; RTL flex places last child (chevron) on physical left -->
<button
	type="button"
	onclick={toggleSubmenu}
	class="flex w-full flex-row items-center px-4 py-8 text-white transition-colors duration-200 hover:text-indigo-400 {className}"
>
	<div class="w-11 shrink-0" aria-hidden="true"></div>
	<div class="flex min-w-0 flex-1 items-center justify-center gap-2" dir="auto">
		{#if icon}
			<Icon name={icon} className="h-5 w-5 shrink-0" />
		{/if}
		<span class="text-center">{title}</span>
	</div>
	<div class="flex w-11 shrink-0 items-center justify-center">
		<ChevronRight class="h-5 w-5 shrink-0 ltr:block rtl:hidden" aria-hidden="true" />
		<ChevronLeft class="hidden h-5 w-5 shrink-0 rtl:inline" aria-hidden="true" />
	</div>
</button>

<!-- Language Submenu Overlay -->
{#if showSubmenu}
	<div class="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-hidden" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
		<div
			class="h-full w-full bg-gray-800 transition-transform duration-300 ease-out {slideDirection === 'enter'
				? 'translate-x-0'
				: 'translate-x-full rtl:-translate-x-full'}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()}
			role="button"
			tabindex="0"
		>
			<div class="h-full overflow-y-auto" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
				<ul class="flex flex-col text-xl">
					<!-- Back Button -->
					<li class="sticky top-0 z-20 flex justify-center border-b border-slate-600/30 bg-slate-900">
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								goBackToMainMenu();
							}}
							class="grid w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-4 py-8 [direction:ltr] text-white transition-colors duration-200 hover:text-indigo-400"
						>
							<div class="flex w-full shrink-0 items-center justify-center">
								<ChevronLeft class="h-5 w-5" aria-hidden="true" />
							</div>
							<span class="text-center" dir="auto">Back</span>
							<div class="w-full shrink-0" aria-hidden="true"></div>
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
									<div class="flex items-center gap-2">
										{#if item.icon}
											<span class="text-lg leading-none" aria-hidden="true">{item.icon}</span>
										{/if}
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
