<script lang="ts">
	import { Icon } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-svelte';
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
		class="group {orientation === 'vertical' ? 'px-4 py-2 w-full justify-start' : 'px-1 py-2'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {theme === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : theme === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		{#if icon}
			{#if typeof icon === 'string'}
				<Icon name={icon} className="h-5 w-5 {title ? 'mr-1.5' : ''}" />
			{:else}
				{@const IconC = asDynamicIcon(icon)}
				<IconC class="h-5 w-5 {title ? 'mr-1.5' : ''}" />
			{/if}
		{/if}
		{#if title}
			<span class="whitespace-nowrap">{title}</span>
		{/if}
		{#if orientation === 'vertical'}
			<ChevronRight class="w-3 h-3 ml-1 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{:else}
			<ChevronDown class="w-3 h-3 ml-1 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
		{/if}
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div class="absolute {orientation === 'vertical' ? 'left-full top-0 ml-2' : 'left-0 mt-2'} w-56 bg-slate-800 {theme === 'blur' ? 'backdrop-blur-md' : ''} rounded-lg shadow-lg border border-slate-700 z-[9999]">
			{#if items && items.length > 0}
				{#each items as item}
					{#if item.to}
						<!-- Internal Link -->
						<button
							onclick={(e) => { e.stopPropagation(); handleItemClick(item); }}
							class="w-full flex items-center justify-start px-4 py-2 text-left hover:bg-slate-700 transition-colors text-slate-300 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
					{:else if item.href}
						<!-- External Link -->
						<button
							onclick={(e) => { e.stopPropagation(); handleItemClick(item); }}
							class="w-full flex items-center justify-start px-4 py-2 text-left hover:bg-slate-700 transition-colors text-slate-300 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
						<!-- Plain Button -->
						<button
							onclick={(e) => { e.stopPropagation(); handleItemClick(item); }}
							class="w-full flex items-center justify-start px-4 py-2 text-left hover:bg-slate-700 transition-colors text-slate-300 {item.active ? 'bg-slate-700' : ''} {item.className}"
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
