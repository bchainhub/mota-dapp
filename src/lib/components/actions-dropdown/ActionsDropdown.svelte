<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { LL, t } from '$lib/helpers/i18n';
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { ArrowUpLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Key, Wallet } from '@lucide/svelte';
	import { blo } from '@blockchainhub/blo';
	import { shortFormat, type ShortFormatKind } from '$lib/helpers/shortFormat';

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
		onChange,
		onItemSelect
	} = $props<{
		title: string | null;
		formatKind?: ShortFormatKind;
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
		onItemSelect?: () => void;
	}>();

	let isOpen = $state(false);
	let slideDirection = $state<'enter' | 'exit'>('exit');
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;
	let dropdownRef: HTMLDivElement | null = null;

	const clearCloseTimeout = () => {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
	};

	const openDropdown = () => {
		clearCloseTimeout();
		isOpen = true;
		slideDirection = 'exit';
		if (browser) {
			requestAnimationFrame(() => {
				slideDirection = 'enter';
			});
		} else {
			slideDirection = 'enter';
		}
	};

	const closeDropdown = ({ animated = false, notifyParent = false }: { animated?: boolean; notifyParent?: boolean } = {}) => {
		clearCloseTimeout();
		if (!isOpen) {
			if (notifyParent) onItemSelect?.();
			return;
		}
		if (!animated) {
			isOpen = false;
			slideDirection = 'exit';
			if (notifyParent) onItemSelect?.();
			return;
		}
		slideDirection = 'exit';
		closeTimeout = setTimeout(() => {
			isOpen = false;
			closeTimeout = null;
			if (notifyParent) onItemSelect?.();
		}, 300);
	};

	$effect(() => {
		if (initialOpen && !isOpen) openDropdown();
		if (!initialOpen && isOpen) closeDropdown();
	});

	$effect(() => {
		if (typeof window !== 'undefined' && window.document) {
			document.dispatchEvent(new CustomEvent('update:open', { detail: isOpen }));
		}
	});

	const handleActionClick = (item: MenuItem, event: Event) => {
		event.preventDefault();
		event.stopPropagation();
		closeDropdown({ animated: true, notifyParent: true });
		onChange?.(new CustomEvent('change', { detail: item }));
	};

	const handleLinkClick = (event: Event) => {
		event.stopPropagation();
		closeDropdown({ animated: true, notifyParent: true });
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			closeDropdown();
		}
	};

	const handleToggle = () => {
		if (isOpen) {
			closeDropdown(browser && window.innerWidth < 1024 ? { animated: true } : {});
			return;
		}
		openDropdown();
	};

	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside, true);
		}
	});

	onDestroy(() => {
		clearCloseTimeout();
		if (browser) {
			document.removeEventListener('click', handleClickOutside, true);
		}
	});
</script>

<div class="relative hidden lg:block {className}" bind:this={dropdownRef}>
	<button
		onclick={handleToggle}
		class="group {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : 'px-1 py-2'} flex cursor-pointer items-center gap-1.5 text-base font-medium transition-colors duration-200 {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		{#if title}
			<span class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/60 dark:bg-slate-700/60">
				<img alt={title} src={blo(title)} class="h-8 w-8 rounded-full object-cover" />
			</span>
			<span class="whitespace-nowrap">{shortFormat(title, formatKind)}</span>
			{#if providerIcon === 'web3'}
				<span class="ml-1.5 flex shrink-0 items-center" aria-hidden="true">
					<Wallet class="h-4 w-4 opacity-80" />
				</span>
			{:else if providerIcon === 'passkey'}
				<span class="ml-1.5 flex shrink-0 items-center" aria-hidden="true">
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

	{#if isOpen}
		<div
			class="absolute z-50 w-56 max-h-80 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg {theme === 'blur'
				? 'backdrop-blur-md'
				: ''} {orientation === 'vertical' ? 'start-full top-0 ms-2' : 'start-0 mt-2'}"
		>
			{#if items && items.length > 0}
				{#each items as item}
					{#if item.to}
						<a
							href={item.to}
							target={item.target ? item.target : undefined}
							rel={item.rel ? item.rel : undefined}
							onclick={(event) => item.action ? handleActionClick(item, event) : handleLinkClick(event)}
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
						</a>
					{:else if item.href}
						<a
							href={item.href}
							target={item.target ? item.target : undefined}
							rel={item.rel ? item.rel : undefined}
							onclick={(event) => item.action ? handleActionClick(item, event) : handleLinkClick(event)}
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
						</a>
					{:else}
						<button
							type="button"
							onclick={(event) => handleActionClick(item, event)}
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

<div class="block lg:hidden {className}">
	<button
		type="button"
		onclick={handleToggle}
		class="grid w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-4 py-8 text-white transition-colors duration-200 hover:text-indigo-400"
	>
		<div class="w-full shrink-0" aria-hidden="true"></div>
		<div class="flex min-w-0 items-center justify-center gap-2" dir="auto">
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
		<div class="flex w-full shrink-0 items-center justify-center">
			<ChevronRight class="h-5 w-5 shrink-0 rtl:hidden" aria-hidden="true" />
			<ChevronLeft class="hidden h-5 w-5 shrink-0 rtl:inline" aria-hidden="true" />
		</div>
	</button>

	{#if isOpen}
		<div class="fixed inset-0 z-50 overflow-hidden" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.key === 'Enter' && event.stopPropagation()} role="button" tabindex="0">
			<div
				class="h-full w-full bg-gray-800 transition-transform duration-300 ease-out {slideDirection === 'enter'
					? 'translate-x-0'
					: 'translate-x-full rtl:-translate-x-full'}"
				onclick={(event) => event.stopPropagation()}
				onkeydown={(event) => event.key === 'Enter' && event.stopPropagation()}
				role="button"
				tabindex="0"
			>
				<div class="h-full overflow-y-auto" onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.key === 'Enter' && event.stopPropagation()} role="button" tabindex="0">
					<ul class="flex flex-col text-xl">
						<li class="sticky top-0 z-20 flex justify-center border-b border-slate-600/30 bg-slate-900">
							<button
								type="button"
								onclick={(event) => {
									event.stopPropagation();
									closeDropdown({ animated: true });
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

						{#if items && items.length > 0}
							{#each items as item}
								<li class="flex w-full justify-center border-b border-slate-600/30">
									{#if item.to}
										<a
											href={item.to}
											target={item.target ? item.target : undefined}
											rel={item.rel ? item.rel : undefined}
											onclick={(event) => item.action ? handleActionClick(item, event) : handleLinkClick(event)}
											class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active ? 'text-indigo-400' : ''} {isSmall ? '' : item.className ?? ''}"
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
										</a>
									{:else if item.href}
										<a
											href={item.href}
											target={item.target ? item.target : undefined}
											rel={item.rel ? item.rel : undefined}
											onclick={(event) => item.action ? handleActionClick(item, event) : handleLinkClick(event)}
											class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active ? 'text-indigo-400' : ''} {isSmall ? '' : item.className ?? ''}"
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
										</a>
									{:else}
										<button
											type="button"
											onclick={(event) => handleActionClick(item, event)}
											class="flex w-full items-center justify-center px-4 py-8 text-center text-white transition-colors duration-200 hover:text-indigo-400 {item.active ? 'text-indigo-400' : ''} {isSmall ? '' : item.className ?? ''}"
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
</div>
