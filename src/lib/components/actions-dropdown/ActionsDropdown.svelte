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
	import { ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, Wallet, Key } from 'lucide-svelte';
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
		class="group {orientation === 'vertical' ? 'px-4 py-2 w-full justify-start' : 'px-1 py-2'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}"
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
			<ChevronRight class="w-3 h-3 ml-1 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{:else}
			<ChevronDown class="w-3 h-3 ml-1 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{/if}
	</button>

	<!-- Desktop Dropdown Menu -->
	{#if isOpen}
		<div class="absolute {orientation === 'vertical' ? 'left-full top-0 ml-2' : 'left-0 mt-2'} w-56 max-h-80 overflow-y-auto bg-slate-800 {theme === 'blur' ? 'backdrop-blur-md' : ''} rounded-lg shadow-lg border border-slate-700 z-50">
			{#if items && items.length > 0}
				{#each items as item}
					{#if item.href}
						<!-- External Link -->
						<button
							onclick={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
							class="w-full flex items-center justify-start px-4 py-2 text-left hover:bg-slate-700 transition-colors text-slate-300 {item.active ? 'bg-slate-700' : ''} {item.className ?? ''}"
						>
							{#if item.icon}
								{#if typeof item.icon === 'string'}
									<Icon name={item.icon} className="h-5 w-5 {item.label ? 'mr-1.5' : ''}" />
								{:else}
									{@const IconC = asDynamicIcon(item.icon)}
									<IconC class="h-5 w-5 {item.label ? 'mr-1.5' : ''}" />
								{/if}
							{/if}
							{#if item.label}
								<span class="whitespace-nowrap">{item.label}</span>
							{/if}
							{#if iconExternal === true}
								<ArrowUpRight class="ml-1 h-4 w-4" />
							{/if}
						</button>
					{:else}
						<!-- Action Button -->
						<button
							onclick={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
							class="w-full flex items-center justify-start px-4 py-2 text-left hover:bg-slate-700 transition-colors text-slate-300 {item.active ? 'bg-slate-700' : ''} {item.className ?? ''}"
						>
							{#if item.icon}
								{#if typeof item.icon === 'string'}
									<Icon name={item.icon} className="h-5 w-5 {item.label ? 'mr-1.5' : ''}" />
								{:else}
									{@const IconC = asDynamicIcon(item.icon)}
									<IconC class="h-5 w-5 {item.label ? 'mr-1.5' : ''}" />
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
<div class="lg:hidden block {className}">
	<button
		onclick={handleToggle}
		class="flex items-center justify-between w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8"
	>
		<div class="flex items-center justify-center flex-1">
			{#if title}
				<span class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white/60 dark:bg-slate-700/60 mr-2 overflow-hidden">
					<img alt={title} src={blo(title)} class="w-8 h-8 rounded-full object-cover" />
				</span>
				<span>{shortFormat(title, formatKind)}</span>
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
		</div>
		<ChevronRight className="h-5 w-5" />
	</button>

	<!-- Mobile Dropdown Overlay -->
	{#if isOpen}
		<div class="fixed top-0 left-0 right-0 bottom-0 z-50 bg-gray-800 transition-transform duration-300 translate-x-0" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
			<div class="h-full overflow-y-auto" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()} role="button" tabindex="0">
				<ul class="flex flex-col text-xl">
					<!-- Back Button -->
					<li class="sticky top-0 z-20 bg-slate-900 flex justify-center border-b border-slate-600/30">
						<button
							onclick={(e) => { e.stopPropagation(); isOpen = false; }}
							class="flex items-center justify-between w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8"
						>
							<ChevronLeft className="h-5 w-5" />
							<span>{t('common.back', $LL)}</span>
							<div class="w-5"></div> <!-- Spacer to balance the layout -->
						</button>
					</li>

					<!-- Dropdown Items -->
					{#if items && items.length > 0}
						{#each items as item}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								{#if item.href}
									<!-- External Link -->
									<button
										onclick={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
										class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : ''} {isSmall ? '' : (item.className ?? '')}"
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
									<!-- Action Button -->
									<button
										onclick={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
										class="flex items-center justify-center w-full text-center text-white hover:text-indigo-400 transition-colors duration-200 px-4 py-8 {item.active ? 'text-indigo-400' : ''} {isSmall ? '' : (item.className ?? '')}"
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
	{/if}
</div>
