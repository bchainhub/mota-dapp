<script lang="ts">
	import { browser } from '$app/environment';
	import { LL } from '$lib/helpers/i18n';
	import { t } from '$lib/helpers/i18n';

	const {
		title = null,
		formatKind = 'user',
		providerIcon = null,
		items = [],
		open: initialOpen = false,
		isSmall = false,
		iconExternal = true,
		className = '',
		orientation = 'horizontal',
		theme = 'blur',
		onChange
	} = $props<{
		title: string | null;
		/** Kind of identity for shortFormat: Core Blockchain (CorePass) = core, other wallet, or user. */
		formatKind?: ShortFormatKind;
		/** Icon to show after title: 'web3' (Wallet) or 'passkey' (Key). */
		providerIcon?: 'web3' | 'passkey' | null;
		items: MenuItem[];
		open?: boolean;
		position?: 'left' | 'right';
		isSmall?: boolean;
		iconExternal?: boolean;
		className?: string;
		orientation?: 'horizontal' | 'vertical';
		theme?: 'auto' | 'blur' | 'transparent';
		onChange?: (event: CustomEvent<{ label: string; action?: () => void }>) => void;
	}>();

	let isOpen = $state(false);

	$effect(() => {
		isOpen = initialOpen;
	});

	$effect(() => {
		if (typeof window !== 'undefined' && window.document) {
			const event = new CustomEvent('update:open', { detail: isOpen });
			document.dispatchEvent(event);
		}
	});

	import { onMount, onDestroy } from 'svelte';
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { ArrowUpLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Key, Wallet } from 'lucide-svelte';
	import { blo } from '@blockchainhub/blo';
	import { shortFormat, type ShortFormatKind } from '$lib/helpers/shortFormat';

	let dropdownRef: HTMLDivElement | null = null;

	const handleItemClick = (item: MenuItem, event: Event) => {
		if (item.action) {
			isOpen = false;
			onChange?.(new CustomEvent('change', { detail: item }));
		} else if (item.href) {
			return;
		}
		event.preventDefault();
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	};

	const handleToggle = () => {
		isOpen = !isOpen;
	};

	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside, true);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside, true);
		}
	});
</script>

<!-- Desktop ActionsDropdown -->
<div class="relative lg:block hidden {className}" bind:this={dropdownRef}>
	<button
		onclick={handleToggle}
		class="group {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : 'px-1 py-2'} flex cursor-pointer items-center gap-1.5 text-base font-medium transition-colors duration-200 {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		{#if title}
			<span class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white/60 dark:bg-slate-700/60 mr-2 overflow-hidden">
				<img alt={title} src={blo(title)} class="w-8 h-8 rounded-full object-cover" />
			</span>
			<span class="whitespace-nowrap">{shortFormat(title, formatKind)}</span>
			{#if providerIcon === 'web3'}
				<span class="ml-1.5 flex-shrink-0 flex items-center" aria-hidden="true">
					<Wallet class="h-4 w-4 opacity-80" />
				</span>
			{:else if providerIcon === 'passkey'}
				<span class="ml-1.5 flex-shrink-0 flex items-center" aria-hidden="true">
					<Key class="h-4 w-4 opacity-80" />
				</span>
			{/if}
		{:else}
			<span>{t('common.menu', $LL)}</span>
		{/if}
		{#if orientation === 'vertical'}
			<ChevronRight class="h-3 w-3 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{:else}
			<ChevronDown class="h-3 w-3 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{/if}
	</button>

	<!-- Desktop Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute z-50 w-56 max-h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg {theme === 'blur'
				? 'backdrop-blur-md'
				: ''} {orientation === 'vertical' ? 'start-full top-0 ms-2' : 'start-0 mt-2'}"
		>
			{#if items && items.length > 0}
				{#each items as item}
					{#if item.href}
						<!-- External Link -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleItemClick(item, e);
							}}
							class="flex w-full items-center justify-start gap-1.5 px-4 py-2 text-left text-slate-300 transition-colors hover:bg-slate-700 {item.active ? 'bg-slate-700' : ''} {item.className ?? ''}"
						>
							{#if item.icon}
								{#if typeof item.icon === 'string'}
									<Icon name={item.icon} className="h-5 w-5 shrink-0" />
								{:else}
									{@const IconC = asDynamicIcon(item.icon)}
									<IconC class="h-5 w-5 shrink-0" />
								{/if}
							{/if}
							{#if item.label}
								<span class="whitespace-nowrap">{item.label}</span>
							{/if}
							{#if iconExternal === true}
								<ArrowUpRight class="h-4 w-4 shrink-0 rtl:hidden" aria-hidden="true" />
								<ArrowUpLeft class="hidden h-4 w-4 shrink-0 rtl:inline" aria-hidden="true" />
							{/if}
						</button>
					{:else}
						<!-- Action Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleItemClick(item, e);
							}}
							class="flex w-full items-center justify-start gap-1.5 px-4 py-2 text-left text-slate-300 transition-colors hover:bg-slate-700 {item.active ? 'bg-slate-700' : ''} {item.className ?? ''}"
						>
							{#if item.icon}
								{#if typeof item.icon === 'string'}
									<Icon name={item.icon} className="h-5 w-5 shrink-0" />
								{:else}
									{@const IconC = asDynamicIcon(item.icon)}
									<IconC class="h-5 w-5 shrink-0" />
								{/if}
							{/if}
							{#if item.label}
								<span class="whitespace-nowrap">{item.label}</span>
							{/if}
						</button>
					{/if}
				{/each}
			{/if}
		</div>
	{/if}
</div>

<!-- Mobile ActionsDropdown (SubmenuCompact style) -->
<div class="block lg:hidden {className}">
	<button
		type="button"
		onclick={handleToggle}
		class="flex w-full flex-row items-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400"
	>
		<div class="w-11 shrink-0" aria-hidden="true"></div>
		<div class="flex min-w-0 flex-1 items-center justify-center gap-2" dir="auto">
			{#if title}
				<span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/60 dark:bg-slate-700/60">
					<img alt={title} src={blo(title)} class="h-8 w-8 rounded-full object-cover" />
				</span>
				<span>{shortFormat(title, formatKind)}</span>
				{#if providerIcon === 'web3'}
					<span class="flex shrink-0 items-center" aria-hidden="true">
						<Wallet class="h-4 w-4 opacity-80" />
					</span>
				{:else if providerIcon === 'passkey'}
					<span class="flex shrink-0 items-center" aria-hidden="true">
						<Key class="h-4 w-4 opacity-80" />
					</span>
				{/if}
			{:else}
				<span>{t('common.menu', $LL)}</span>
			{/if}
		</div>
		<div class="flex w-11 shrink-0 items-center justify-center">
			<ChevronRight class="h-5 w-5 shrink-0 ltr:block rtl:hidden" aria-hidden="true" />
			<ChevronLeft class="hidden h-5 w-5 shrink-0 rtl:inline" aria-hidden="true" />
		</div>
	</button>

	<!-- Mobile Dropdown Overlay -->
	{#if isOpen}
		<div
			class="fixed inset-0 z-50 translate-x-0 bg-gray-800 transition-transform duration-300"
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
								isOpen = false;
							}}
							class="grid w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-4 py-8 [direction:ltr] text-white transition-colors duration-200 hover:text-indigo-400"
						>
							<div class="flex w-full shrink-0 items-center justify-center">
								<ChevronLeft class="h-5 w-5" aria-hidden="true" />
							</div>
							<span class="text-center" dir="auto">{t('common.back', $LL)}</span>
							<div class="w-full shrink-0" aria-hidden="true"></div>
						</button>
					</li>

					<!-- Dropdown Items -->
					{#if items && items.length > 0}
						{#each items as item}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								{#if item.href}
									<!-- External Link -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleItemClick(item, e);
										}}
										class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active
											? 'text-indigo-400'
											: ''} {isSmall ? '' : item.className ?? ''}"
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
									<!-- Action Button -->
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											handleItemClick(item, e);
										}}
										class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active
											? 'text-indigo-400'
											: ''} {isSmall ? '' : item.className ?? ''}"
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
	{/if}
</div>
