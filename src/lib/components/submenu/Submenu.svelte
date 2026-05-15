<script lang="ts">
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { ArrowUpLeft, ArrowUpRight, ChevronDown, ChevronRight } from '@lucide/svelte';
	import { onMount } from 'svelte';

	type NavIcon = string | import('svelte').Component | (new (...args: any[]) => unknown);

	let {
		title = '',
		icon = '',
		items = [],
		onback,
		onselect,
		iconExternal = false,
		orientation = 'horizontal',
		theme = 'blur'
	}: {
		title?: string;
		icon?: NavIcon;
		items?: Array<{
			label?: string;
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
		orientation?: 'horizontal' | 'vertical';
		theme?: 'auto' | 'blur' | 'transparent';
	} = $props();

	let isOpen = $state(false);
	let dropdownRef: HTMLDivElement;

	const handleItemClick = (item: any) => {
		isOpen = false;
		onselect?.(item);
		onback?.();
	};

	// Toggle dropdown when clicking the main button
	const toggleDropdown = () => {
		isOpen = !isOpen;
	};

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
			onback?.();
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<!-- Desktop Submenu Button -->
<div class="relative" bind:this={dropdownRef}>
	<button
		onclick={toggleDropdown}
		class="group {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : 'px-1 py-2'} flex cursor-pointer items-center gap-1.5 text-base font-medium transition-colors duration-200 {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		{#if icon}
			{#if typeof icon === 'string'}
				<Icon name={icon} className="h-5 w-5 shrink-0" />
			{:else}
				{@const IconC = asDynamicIcon(icon)}
				<IconC class="h-5 w-5 shrink-0" />
			{/if}
		{/if}
		{#if title}
			<span class="whitespace-nowrap">{title}</span>
		{/if}
		{#if orientation === 'vertical'}
			<ChevronRight class="h-3 w-3 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{:else}
			<ChevronDown class="h-3 w-3 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{/if}
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute z-[9999] w-56 rounded-lg border border-slate-700 bg-slate-800 shadow-lg {theme === 'blur'
				? 'backdrop-blur-md'
				: ''} {orientation === 'vertical' ? 'start-full top-0 ms-2' : 'start-0 mt-2'}"
		>
			{#if items && items.length > 0}
				{#each items as item}
					{#if item.to}
						<!-- Internal Link -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleItemClick(item);
							}}
							class="flex w-full items-center justify-start gap-1.5 px-4 py-2 text-left text-slate-300 transition-colors hover:bg-slate-700 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
					{:else if item.href}
						<!-- External Link -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleItemClick(item);
							}}
							class="flex w-full items-center justify-start gap-1.5 px-4 py-2 text-left text-slate-300 transition-colors hover:bg-slate-700 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
						<!-- Plain Button -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleItemClick(item);
							}}
							class="flex w-full items-center justify-start gap-1.5 px-4 py-2 text-left text-slate-300 transition-colors hover:bg-slate-700 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
