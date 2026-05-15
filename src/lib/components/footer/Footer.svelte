<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ArrowUpLeft, ArrowUpRight, ChevronRight } from '@lucide/svelte';
	import { Icon, Tooltip } from '$components';
	import { Key } from '@lucide/svelte';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { LL } from '$lib/helpers/i18n';
	import { t } from '$lib/helpers/i18n';
	import { walletAddress } from '$modules/auth/web3';
	import {
		getAuthNavActions,
		resolveAuthNavAction,
		isAuthEnabled,
		isLoggedIn as isLoggedInHelper,
		getAuthProviders
	} from '$modules/auth/nav-actions';
	import { shouldShowItem, type ItemWithShow } from '$lib/helpers/nav';
	import { loadModule } from '$lib/helpers/modules';
	import { getSiteConfig, getSiteTitleParts } from '$lib/helpers/siteConfig';

	const _cfg = getSiteConfig();
	const footerCfg = _cfg?.themeConfig?.footer;
	const { style, logo, copyright, liner, links, iconExternal } = footerCfg ?? {};
	const footerClass = style && `footer-${style}`;

	const { session: sessionProp = undefined }: { session?: App.Locals['session'] } = $props();

	/** Session from layout (passkey optional). */
	const session = $derived(sessionProp);
	const authEnabled = $derived(isAuthEnabled());
	const isLoggedIn = $derived(isLoggedInHelper(session, $walletAddress));
	const connected = $derived(session?.walletConnected ?? !!$walletAddress);
	const authIn = $derived(Boolean(session?.user));
	const showContext = $derived({ loggedIn: isLoggedIn, connected, authIn });
	const authProviders = $derived(getAuthProviders(session, $walletAddress));

	/** Filter by show only when auth enabled; otherwise show all. */
	const visibleLinks = $derived(
		(links ?? []).map((section) => ({
			...section,
			items: authEnabled
				? (section.items ?? []).filter((item) => shouldShowItem(item as unknown as ItemWithShow, showContext))
				: (section.items ?? [])
		})).filter((section) => section.items.length > 0)
	);
	const authNavActions = $derived(getAuthNavActions($LL));

	let bankingModule = $state<unknown>(null);
	onMount(() => {
		loadModule('banking').then((m) => (bankingModule = m));
	});

	type LinerItem = {
		label?: string;
		to?: string;
		href?: string;
		target?: string;
		rel?: string;
		className?: string;
		icon?: string | (new (...args: unknown[]) => unknown);
		action?: () => void;
	};
	const visibleLiner = $derived.by(() => {
		const linerItems = liner ?? [];
		const filtered = authEnabled
			? linerItems.filter((item) => shouldShowItem(item as unknown as ItemWithShow, showContext))
			: linerItems;
		const oricItem =
			bankingModule && typeof bankingModule === 'object' && 'getBankingOricFooterLinerItem' in bankingModule
				? (bankingModule as { getBankingOricFooterLinerItem: (b: unknown) => unknown }).getBankingOricFooterLinerItem(
						_cfg?.modules
					)
				: null;
		const withOric = oricItem ? [...filtered, oricItem] : filtered;
		return (withOric as Record<string, unknown>[]).map((item) => {
			const action =
				'action' in item && item.action !== undefined
					? typeof item.action === 'string'
						? resolveAuthNavAction(item.action, authNavActions)
						: (item.action as () => void)
					: undefined;
			return { ...item, action } as LinerItem;
		});
	});

	let connectionStatus = $state(false);

	// Function to convert kebab-case to capitalized words with spaces
	function kebabToCapitalized(str: string): string {
		return str
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Parse URL and create breadcrumb segments
	const pathSegments = $derived.by(() => {
		if (!page?.url) return [];
		const path = page.url.pathname;
		const segments = path.split('/').filter((segment) => segment);
		const result: { name: string; url: string; current: boolean }[] = [
			{ name: t('footer.home', $LL), url: '/', current: segments.length === 0 }
		];
		let currentPath = '';
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			result.push({
				name: kebabToCapitalized(segment),
				url: currentPath,
				current: index === segments.length - 1
			});
		});
		return result;
	});

	onMount(() => {
		const updateConnectionStatus = () => {
			connectionStatus = navigator.onLine ? true : false;
		};

		updateConnectionStatus();

		window.addEventListener('online', updateConnectionStatus);
		window.addEventListener('offline', updateConnectionStatus);

		return () => {
			window.removeEventListener('online', updateConnectionStatus);
			window.removeEventListener('offline', updateConnectionStatus);
		};
	});
</script>

<footer class={`footer px-4 xl:px-0 ${footerClass}`}>
	<div class="container mx-auto py-4">
		<nav aria-label="breadcrumb" class="hidden sm:block">
			<ol class="inline-flex items-center rounded text-sm font-medium">
				{#each pathSegments as segment, index}
					<li class="inline-flex items-center" aria-current={segment.current ? 'page' : undefined}>
						{#if index > 0}
							<ChevronRight
								class="h-5 w-5 shrink-0 text-gray-400 mx-2 rtl:rotate-180"
								aria-hidden="true"
							/>
						{/if}
						<a
							href={segment.url}
							class={segment.current
								? 'text-secondary-700'
								: 'text-secondary-500 hover:text-secondary-600'}
						>
							{segment.name}
						</a>
					</li>
				{/each}
			</ol>
		</nav>

		<hr class="my-2 !border-gray-500/50" />

		<!-- Footer Links Section -->
		{#if visibleLinks && visibleLinks.length > 0}
			<div
				class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 mb-8 text-center sm:text-start"
			>
				{#each visibleLinks as section}
					<div class="text-center sm:text-start">
						<h4 class="text-lg font-semibold mb-2">
							{t(section.title, $LL)}
						</h4>
						<ul class="space-y-2">
							{#each section.items as item}
								<li class="text-sm min-w-0">
									{#if item.to}
										<a
											href={item.to}
											target={item.target ? item.target : undefined}
											rel={item.rel ? item.rel : undefined}
											class="hover:text-primary-600 transition duration-150 inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 text-start whitespace-nowrap"
										>
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-4 w-4 shrink-0" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-4 w-4 shrink-0" />
												{/if}
											{/if}
											{#if item.label}
												<span class="min-w-0">{t(item.label, $LL)}</span>
											{/if}
										</a>
									{:else if item.href}
										<a
											href={item.href}
											target={item.target ? item.target : undefined}
											rel={item.rel ? item.rel : undefined}
											class="hover:text-primary-600 transition duration-150 inline-flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-1.5 sm:justify-start"
										>
											{#if item.icon}
												{#if typeof item.icon === 'string'}
													<Icon name={item.icon} className="h-4 w-4 shrink-0" />
												{:else}
													{@const IconC = asDynamicIcon(item.icon)}
													<IconC class="h-4 w-4 shrink-0" />
												{/if}
											{/if}
											{#if item.label}
												<span class="min-w-0 text-start">{t(item.label, $LL)}</span>
											{/if}
											{#if typeof iconExternal === 'undefined' || iconExternal === true}
												<ArrowUpRight class="h-4 w-4 shrink-0 rtl:hidden" aria-hidden="true" />
												<ArrowUpLeft class="hidden h-4 w-4 shrink-0 rtl:inline" aria-hidden="true" />
											{/if}
										</a>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/if}

		<div
			class="mb-2 mt-4 flex w-full flex-col items-center gap-4 md:flex-row md:items-center md:justify-between"
		>
			<div
				class="flex min-w-0 flex-1 flex-col flex-wrap items-center gap-4 sm:flex-row sm:items-center"
			>
			{#if logo}
				<a href="/" class="flex items-center mb-4 md:mb-0">
					<img src={logo.src} alt={logo.alt} class="h-10" />
				</a>
			{:else if _cfg?.title}
				{@const titleParts = getSiteTitleParts(_cfg)}
				<a href="/" class="flex items-center mb-4 md:mb-0">
					<h1 class="text-xl font-bold">{titleParts.brand}{titleParts.poweredBy ? ` | ${titleParts.poweredBy}` : ''}</h1>
				</a>
			{/if}
			<div class="text-center text-sm text-footer-link sm:text-start max-w-full">
				<span dir="ltr" class="inline-block [unicode-bidi:isolate]">
					{t(copyright || 'footer.copyright', $LL, { year: new Date().getFullYear() })}
				</span>
			</div>
			{#if visibleLiner && visibleLiner.length > 0}
				<div
					class="flex flex-wrap justify-center text-sm md:justify-start md:ms-4 gap-4"
				>
					{#each visibleLiner as { label, to, href, target, rel, className, icon, action }}
						<div class="flex items-center">
							{#if to}
								<a
									href={to}
									target={target ? target : undefined}
									rel={rel ? rel : undefined}
									class="hover:text-footer-link-hover inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1 {className ?? ''}"
								>
									{#if icon}
										{#if typeof icon === 'string'}
											<Icon name={icon} className="h-4 w-4 shrink-0" />
										{:else}
											{@const IconC = asDynamicIcon(icon)}
											<IconC class="h-4 w-4 shrink-0" />
										{/if}
									{/if}
									{#if label}
										<span class="min-w-0 whitespace-nowrap">{t(label, $LL)}</span>
									{/if}
								</a>
							{:else if href}
								<a
									{href}
									target={target ? target : undefined}
									rel={rel ? rel : undefined}
									class="hover:text-footer-link-hover inline-flex max-w-full min-w-0 flex-nowrap items-center gap-1.5 {className}"
								>
									{#if icon}
										{#if typeof icon === 'string'}
											<Icon name={icon} className="h-4 w-4 shrink-0" />
										{:else}
											{@const IconC = asDynamicIcon(icon)}
											<IconC class="h-4 w-4 shrink-0" />
										{/if}
									{/if}
									{#if label}
										<span class="min-w-0 whitespace-nowrap">{t(label, $LL)}</span>
									{/if}
									{#if typeof iconExternal === 'undefined' || iconExternal === true}
										<ArrowUpRight class="h-4 w-4 shrink-0 rtl:hidden" aria-hidden="true" />
										<ArrowUpLeft class="hidden h-4 w-4 shrink-0 rtl:inline" aria-hidden="true" />
									{/if}
								</a>
							{:else if action}
								<button
									type="button"
									onclick={action}
									class="hover:text-footer-link-hover flex items-center cursor-pointer border-0 bg-transparent p-0 text-inherit {className}"
								>
									{#if icon}
										{#if typeof icon === 'string'}
											<Icon name={icon} className="h-4 w-4 {label ? 'me-1' : ''}" />
										{:else}
											{@const IconC = asDynamicIcon(icon)}
											<IconC class="h-4 w-4 {label ? 'me-1' : ''}" />
										{/if}
									{/if}
									{#if label}
										{t(label, $LL)}
									{/if}
								</button>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			</div>
			<div
				class="flex flex-wrap items-center justify-center gap-4 md:justify-end rtl:md:justify-start shrink-0"
			>
				{#if authEnabled && isLoggedIn && authProviders.length > 0}
					<div class="text-sm text-footer-link text-nowrap inline-flex items-center gap-1">
						<Key class="h-4 w-4 me-0.5 shrink-0" />
						{#each authProviders as provider}
							<Tooltip>
								<button
									type="button"
									class="cursor-pointer hover:underline focus:outline-none focus:underline"
									onclick={() => {
										if (provider === 'web3') authNavActions.disconnect();
										else authNavActions.signout();
									}}
								>
									{provider.charAt(0).toUpperCase() + provider.slice(1)}
								</button>
								<svelte:fragment slot="content">
									Disconnect {provider.charAt(0).toUpperCase() + provider.slice(1)}
								</svelte:fragment>
							</Tooltip>
							{#if authProviders.indexOf(provider) < authProviders.length - 1}
								<span class="opacity-70">•</span>
							{/if}
						{/each}
					</div>
				{/if}
				<div class="inline-flex items-center gap-2 leading-none">
					<span
						class="status-dot inline-block shrink-0 w-1.5 h-1.5 rounded-full {connectionStatus
							? 'connected'
							: ''}"
					></span>
					<span class="text-sm text-footer-link text-nowrap">{_cfg?.language?.enabled ? (connectionStatus ? t('common.online', $LL) : t('common.offline', $LL)) : (connectionStatus ? 'Online' : 'Offline')}</span>
				</div>
			</div>
		</div>
	</div>
</footer>
