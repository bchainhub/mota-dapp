<script lang="ts">
	import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-svelte';
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';

	type NavIcon = string | import('svelte').Component | (new (...args: any[]) => unknown);

	let {
		isOpen = false,
		title = '',
		icon = 'globe',
		items = [],
		onback,
		onselect,
		iconExternal = true
	}: {
		isOpen?: boolean;
		title?: string;
		icon?: NavIcon;
		items?: Array<{
			label: string;
			to?: string;
			href?: string;
			target?: string;
			rel?: string;
			icon?: NavIcon;
			className?: string;
			active?: boolean;
		}>;
		onback?: () => void;
		onselect?: (item: any) => void;
		iconExternal?: boolean;
	} = $props();

	let showSubmenu = $state(false);
	let isAnimating = $state(false);
	let slideDirection = $state<'enter' | 'exit'>('exit');

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

	const selectItem = (item: any) => {
		onselect?.(item);
		slideDirection = 'exit';
		isAnimating = true;
		setTimeout(() => {
			showSubmenu = false;
			isAnimating = false;
		}, 300);
	};

</script>

<!-- Submenu Button -->
<button
	onclick={toggleSubmenu}
	class="flex items-center justify-between w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8"
>
	<div class="w-5"></div> <!-- Left spacer to balance the chevron -->
	<div class="flex items-center justify-center flex-1">
		{#if icon}
			{#if typeof icon === 'string'}
				<Icon name={icon} className="h-5 w-5 mr-1.5" />
			{:else}
				{@const IconC = asDynamicIcon(icon)}
				<IconC class="h-5 w-5 mr-1.5" />
			{/if}
		{/if}
		<span>{title}</span>
	</div>
	<ChevronRight className="h-5 w-5" />
</button>

<!-- Submenu Overlay -->
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

					<!-- Submenu Items -->
					{#if items && items.length > 0}
						{#each items as item}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								{#if item.to}
									<!-- Internal Link -->
									<button
										onclick={(e) => { e.stopPropagation(); selectItem(item); }}
										class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : '' } {item.className}"
									>
										<div class="flex items-center">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 mr-1.5" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 mr-1.5" />
												{/if}
											{/if}
											<span>{item.label}</span>
										</div>
									</button>
								{:else if item.href}
									<!-- External Link -->
									<button
										onclick={(e) => { e.stopPropagation(); selectItem(item); }}
										class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : '' } {item.className}"
									>
										<div class="flex items-center">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 mr-1.5" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 mr-1.5" />
												{/if}
											{/if}
											<span>{item.label}</span>
											{#if typeof iconExternal === 'undefined' || iconExternal === true}
												<ArrowUpRight class="ml-1 h-4 w-4" />
											{/if}
										</div>
									</button>
								{:else}
									<!-- Plain Button -->
									<button
										onclick={(e) => { e.stopPropagation(); selectItem(item); }}
										class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : '' } {item.className}"
									>
										<div class="flex items-center">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 mr-1.5" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 mr-1.5" />
												{/if}
											{/if}
											<span>{item.label}</span>
										</div>
									</button>
								{/if}
							</li>
						{/each}
					{/if}
				</ul>
			</div>
		</div>
	</div>
{/if}
