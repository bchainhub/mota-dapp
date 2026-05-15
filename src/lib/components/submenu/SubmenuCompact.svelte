<script lang="ts">
	import { ChevronLeft, ChevronRight, ArrowUpLeft, ArrowUpRight } from '@lucide/svelte';
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';

	type NavIcon = string | import('svelte').Component | (new (...args: any[]) => unknown);

	let {
		isOpen = false,
		title = '',
		icon,
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

<!-- Submenu drill: DOM [spacer|label|chevron]; RTL flex main-start is right → chevron (last) lands physical left -->
<button
	onclick={toggleSubmenu}
	type="button"
	class="flex w-full flex-row items-center px-4 py-8 text-white transition-colors duration-200 hover:text-indigo-400"
>
	<div class="w-11 shrink-0" aria-hidden="true"></div>
	<div class="flex min-w-0 flex-1 items-center justify-center gap-2" dir="auto">
		{#if icon}
			{#if typeof icon === 'string'}
				<Icon name={icon} className="h-5 w-5 shrink-0" />
			{:else}
				{@const IconC = asDynamicIcon(icon)}
				<IconC class="h-5 w-5 shrink-0" />
			{/if}
		{/if}
		<span class="text-center">{title}</span>
	</div>
	<div class="flex w-11 shrink-0 items-center justify-center">
		<ChevronRight class="h-5 w-5 shrink-0 text-white ltr:block rtl:hidden" aria-hidden="true" />
		<ChevronLeft class="hidden h-5 w-5 shrink-0 text-white rtl:inline" aria-hidden="true" />
	</div>
</button>

<!-- Submenu Overlay -->
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

					<!-- Submenu Items -->
					{#if items && items.length > 0}
						{#each items as item}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								{#if item.to}
									<!-- Internal Link -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											selectItem(item);
										}}
										class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active
											? 'text-indigo-400'
											: ''} {item.className}"
									>
										<div class="flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-2">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 shrink-0" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 shrink-0" />
												{/if}
											{/if}
											<span class="whitespace-nowrap">{item.label}</span>
										</div>
									</button>
								{:else if item.href}
									<!-- External Link -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											selectItem(item);
										}}
										class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active
											? 'text-indigo-400'
											: ''} {item.className}"
									>
										<div class="flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-2">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 shrink-0" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 shrink-0" />
												{/if}
											{/if}
											<span class="whitespace-nowrap">{item.label}</span>
											{#if typeof iconExternal === 'undefined' || iconExternal === true}
												<ArrowUpRight class="h-4 w-4 shrink-0 rtl:hidden" aria-hidden="true" />
												<ArrowUpLeft class="hidden h-4 w-4 shrink-0 rtl:inline" aria-hidden="true" />
											{/if}
										</div>
									</button>
								{:else}
									<!-- Plain Button -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											selectItem(item);
										}}
										class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active
											? 'text-indigo-400'
											: ''} {item.className}"
									>
										<div class="flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-2">
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-5 w-5 shrink-0" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-5 w-5 shrink-0" />
												{/if}
											{/if}
											<span class="whitespace-nowrap">{item.label}</span>
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
