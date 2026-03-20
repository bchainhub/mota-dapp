<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { ArrowUpRight, Eclipse, Menu, Moon, Sun, X } from 'lucide-svelte';
	import { ActionsDropdown, Icon, LanguageSwitcher, LanguageSwitcherCompact, Submenu, SubmenuCompact } from '$components';
	import { asDynamicIcon } from '$lib/helpers/icon';
	import { LL, locale as localeStore } from '$lib/helpers/i18n';
	import { t, getAvailableLocalesWithNamesAsync, applyLocale } from '$lib/helpers/i18n';
	import { walletAddress, walletType, autoLogin, shouldAutoConnect, initPostInstallWalletAction, isCoreEcosystem } from '$modules/auth/web3';
	import type { ShortFormatKind } from '$lib/helpers/shortFormat';
	import { goto } from '$app/navigation';
	import {
		getAuthNavActions,
		resolveAuthNavAction,
		isAuthEnabled,
		isLoggedIn as isLoggedInHelper,
		getAuthProvider,
		getAuthItemsFromConfig,
		getNavbarItemsFromConfig
	} from '$modules/auth/nav-actions';
	import { filterNavItemsByAuth } from '$lib/helpers/nav';
	import { evaluateShowRule } from '$lib/helpers/showRule';
	import { getStoredTheme, setStoredTheme, removeStoredTheme } from '$lib/helpers/storageKeys';
	import { getSiteConfig, getSiteTitleParts } from '$lib/helpers/siteConfig';

	const { layoutData, session: sessionProp = undefined }: { layoutData?: Record<string, unknown>; session?: App.Locals['session'] } = $props();

	/** Session from layout or page data (passkey optional). */
	const session = $derived(
		(layoutData?.session as App.Locals['session']) ??
			(page.data as { session?: App.Locals['session'] }).session ??
			sessionProp
	);

	/** Auth is optional; only filter by show when auth is enabled (passkey or web3). */
	const authEnabled = $derived(isAuthEnabled());
	const _cfg = getSiteConfig();
	const items = $derived.by(() => {
		const fromConfig = getNavbarItemsFromConfig();
		return fromConfig.length ? fromConfig : (_cfg?.themeConfig as { navbar?: { items?: unknown[] } } | undefined)?.navbar?.items ?? [];
	});
	const isLoggedIn = $derived(isLoggedInHelper(session, $walletAddress));
	const connected = $derived(session?.walletConnected ?? !!$walletAddress);
	const authIn = $derived(Boolean(session?.user));
	const showContext = $derived({ loggedIn: isLoggedIn, connected, authIn });
	const authProvider = $derived(getAuthProvider(session, $walletAddress));

	const navbarCfg = _cfg?.themeConfig;
	const {
		logo,
		orientation = 'horizontal',
		style = 'blur',
		iconExternal,
		itemsPosition = 'side',
		hideOnScroll = false
	} = navbarCfg?.navbar ?? {};
	const { disableSwitch, defaultMode, respectPrefersColorScheme } =
		navbarCfg?.colorMode ?? {};
	const auth = _cfg?.modules?.auth;
	const authStrategy = auth?.strategy;
	const web3Enabled = Array.isArray(authStrategy) ? authStrategy.includes('web3') : authStrategy === 'web3';

	let isOpen = $state(false);
	let dropdownOpen = $state(false);
	let theme = $state(respectPrefersColorScheme
		? 'system'
		: (defaultMode ?? 'light'));
	/** Resolved dark state for logo: true when user or system theme is dark (used for transparent/auto logo choice). */
	let isResolvedDark = $state(false);

	// Scroll hide functionality
	let isScrollingDown = $state(false);
	let lastScrollY = $state(0);
	let headerVisible = $state(true);
	let initialLoad = $state(true);

	// Language submenu state (use i18n store so selection persists across navigations)
	let availableLocales: Array<{ code: string; name: string; icon?: string }> = $state([]);
	const currentLocale = $derived(
		$localeStore ?? (page.data as { locale?: string }).locale ?? (_cfg?.language as { defaultLocale?: string } | undefined)?.defaultLocale ?? 'en'
	);

	// Define the system theme change handler
	const handleSystemThemeChange = (e: MediaQueryListEvent) => {
		if (theme === 'system') {
			document.documentElement.classList.toggle('dark', e.matches);
			isResolvedDark = e.matches;
		}
	};

	/** Logo src: blur = always dark logo; transparent = dark when theme dark; auto = dark when navbar dark (user light). No srcDark → fallback to src. */
	const logoSrc = $derived.by(() => {
		if (!logo) return '';
		const dark = logo.srcDark ?? logo.src;
		if (style === 'blur') return dark;
		if (style === 'transparent') return isResolvedDark ? dark : logo.src;
		if (style === 'auto') return !isResolvedDark ? dark : logo.src; // light theme → dark navbar → dark logo
		return logo.src;
	});

	const visibleItems = $derived(
		filterNavItemsByAuth(items as import('$lib/helpers/nav').ItemWithShow[], showContext, authEnabled) as NavbarItem[]
	);

	/** Display label for the user dropdown: wallet address or passkey session user; fallback to translated Account when no name. */
	const userDropdownTitle = $derived(
		$walletAddress ??
			session?.user?.name ??
			session?.user?.email ??
			(session?.user?.id != null || session?.user?.userId != null
				? String(session.user.id ?? session.user.userId).slice(0, 12) + '…'
				: null) ??
			t('common.account', $LL)
	);
	/** Format kind for shortFormat: Core Blockchain (wallet CorePass) = "core", other wallet = "wallet". */
	const userDropdownFormatKind = $derived.by((): ShortFormatKind => {
		if ($walletAddress) return isCoreEcosystem($walletType) ? 'core' : 'wallet';
		return 'user';
	});
	/** Icon for dropdown: Wallet when connected, Key when logged in only. Wallet wins when both. */
	const userDropdownProviderIcon = $derived(
		$walletAddress ? 'web3' as const : session?.user ? 'passkey' as const : null
	);

	const autoConnectEnabled = auth?.web3?.autoConnect !== false;

	const authNavActions = $derived(getAuthNavActions($LL));

	const visibleItemsWithActions = $derived(
		visibleItems.map((item) => {
			const connectIcon = typeof item.action === 'string' && item.action === 'manualConnect' && auth?.web3?.app?.icon ? auth.web3.app.icon : undefined;
			return {
				...item,
				icon: connectIcon ?? item.icon,
				action:
					item.action === undefined
						? undefined
						: typeof item.action === 'string'
							? resolveAuthNavAction(item.action, authNavActions) ?? (() => {})
							: item.action
			};
		})
	);

	const menuItems = $derived.by(() => {
		const ctx = showContext;
		const authItems = getAuthItemsFromConfig().filter(
			(item) => evaluateShowRule(item.show, ctx)
		);
		const authMenuItems = authItems.map((item) => ({
			label: item.label ? t(item.label, $LL) : '',
			to: item.to,
			className: item.className,
			icon: item.icon,
			action: item.to ? () => goto(item.to!) : undefined
		}));
		const logoutItem = { label: t('common.logout', $LL), to: undefined as string | undefined, className: undefined as string | undefined, icon: undefined as string | undefined, action: () => Promise.resolve(authNavActions.signout()) };
		const disconnectItem = { label: t('navbar.disconnect', $LL), to: undefined as string | undefined, className: undefined as string | undefined, icon: undefined as string | undefined, action: () => Promise.resolve(authNavActions.disconnect()) };
		const items = [...authMenuItems];
		if (authEnabled && web3Enabled && $walletAddress) items.push(disconnectItem);
		if (session?.user) items.push(logoutItem);
		return items;
	});

	const handleSelect = (event: CustomEvent<{ label: string; action?: () => void }>) => {
		if (event.detail.action) {
			event.detail.action();
		}
	};


	const selectLanguage = async (localeCode: string) => {
		await applyLocale(localeCode);
		isOpen = false;
		if (browser) {
			document.body.style.overflow = 'auto';
		}
	};

	const getCurrentLanguageName = () => {
		const locale = availableLocales.find(l => l.code === currentLocale);
		return locale?.name || currentLocale.toUpperCase();
	};

	const toggleMenu = (event?: Event) => {
		if (event) {
			event.stopPropagation();
		}
		isOpen = !isOpen;
		if (browser) {
			document.body.style.overflow = isOpen ? 'hidden' : 'auto';
		}
	};

	const closeMenu = () => {
		isOpen = false;
		if (browser) {
			document.body.style.overflow = 'auto';
		}
	};

	const handleClickOutside = (event: MouseEvent) => {
		const menuElement = document.getElementById('dropdown-menu');
		const hamburgerButton = document.getElementById('hamburger-button');
		if (
			menuElement &&
			!menuElement.contains(event.target as Node) &&
			hamburgerButton &&
			!hamburgerButton.contains(event.target as Node)
		) {
			closeMenu();
		}
	};

	const handleScroll = () => {
		if (!hideOnScroll || !browser) return;

		const currentScrollY = window.scrollY;
		const wasVisible = headerVisible;

		// Determine scroll direction
		isScrollingDown = currentScrollY > lastScrollY;

		// Only hide if scrolled down more than 100px
		if (currentScrollY > 100) {
			if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) {
				// Scrolling down - hide menu
				headerVisible = false;
			} else if (currentScrollY < lastScrollY && lastScrollY - currentScrollY > 5) {
				// Scrolling up - show menu
				headerVisible = true;
			}
		} else {
			// Always show when near top
			headerVisible = true;
		}

		// Dispatch event if visibility changed
		if (wasVisible !== headerVisible) {
			const event = new CustomEvent('navHiddenChange', {
				detail: { isHidden: !headerVisible }
			});
			document.dispatchEvent(event);
		}

		lastScrollY = currentScrollY;
	};

	const rotateTheme = () => {
		if (!respectPrefersColorScheme) {
			// System theme detection is disabled, just toggle between light/dark
			theme = theme === 'light' ? 'dark' : 'light';
		} else {
			// System theme detection is enabled, rotate through: system -> light -> dark -> system
			if (theme === 'system') {
				theme = 'light';
			} else if (theme === 'light') {
				theme = 'dark';
			} else {
				theme = 'system';
			}
		}

		applyTheme();
	};

	const applyTheme = () => {
		if (browser) {
			if (theme === 'system') {
				// Apply system theme
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				document.documentElement.classList.toggle('dark', prefersDark);
				isResolvedDark = prefersDark;
				removeStoredTheme();
			} else {
				// Apply manual theme
				const isDark = theme === 'dark';
				document.documentElement.classList.toggle('dark', isDark);
				isResolvedDark = isDark;
				setStoredTheme(theme);
			}
		}
	};

	onMount(() => {
		// Initialize language settings (names/icons from locale files when config.availableLocales is string[])
		getAvailableLocalesWithNamesAsync().then((list) => { availableLocales = list; });

		let autoConnectTimeout: ReturnType<typeof setTimeout> | undefined;
		if (authEnabled && browser && web3Enabled && autoConnectEnabled && shouldAutoConnect()) {
			// Short delay so layout/auth can settle; wallet events drive state, no reload
			const runAutoConnect = () => autoLogin().catch(() => {});
			autoConnectTimeout = setTimeout(() => runAutoConnect(), 300);
		}

		if (browser && web3Enabled) {
			initPostInstallWalletAction();
		}

		if (!browser) return;

		// Initialize scroll state
		lastScrollY = window.scrollY;
		initialLoad = false;

		// Listen for the custom event from ActionsDropdown
		document.addEventListener('update:open', ((e: CustomEvent) => {
			dropdownOpen = e.detail;
		}) as EventListener);

		// Initialize theme based on configuration and user preferences
		if (respectPrefersColorScheme) {
			const storedTheme = getStoredTheme();
			if (storedTheme === 'light' || storedTheme === 'dark') {
				// User has manually selected a theme
				theme = storedTheme;
			} else {
				// No manual selection, use system theme
				theme = 'system';
			}
		} else {
			// Respect system preference is disabled, use stored theme or default
			const storedTheme = getStoredTheme();
			if (storedTheme === 'light' || storedTheme === 'dark') {
				theme = storedTheme;
			} else {
				theme = defaultMode || 'light';
			}
		}

		applyTheme();

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);

		document.addEventListener('click', handleClickOutside);

		// Add scroll event listener for hideOnScroll functionality
		if (hideOnScroll) {
			window.addEventListener('scroll', handleScroll, { passive: true });
		}

		return () => {
			if (autoConnectTimeout != null) clearTimeout(autoConnectTimeout);
		};
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			mediaQuery.removeEventListener('change', handleSystemThemeChange);

			// Remove scroll event listener
			if (hideOnScroll) {
				window.removeEventListener('scroll', handleScroll);
			}

			// Remove custom event listener
			document.removeEventListener('update:open', ((e: CustomEvent) => {
				dropdownOpen = e.detail;
			}) as EventListener);

			document.body.style.overflow = 'auto';
		}
	});
</script>

<header
	class={`site-header fixed top-8 left-0 right-0 z-50 w-full flex justify-center lg:px-8 navigation ${style === 'transparent' ? 'transparent' : ''} ${orientation === 'vertical' ? 'vertical lg:mr-4' : 'horizontal'} ${orientation === 'vertical' && hideOnScroll ? 'transition-[transform,opacity] duration-300 ease-in-out' : 'transition-opacity duration-300 ease-in-out'} ${orientation === 'vertical' && hideOnScroll ? (!headerVisible ? '-translate-x-full opacity-0 pointer-events-none' : 'opacity-100') : (!headerVisible && hideOnScroll ? 'opacity-0' : 'opacity-100')}`}
>
	<div class={`nav-container container w-full flex items-center lg:mx-3 p-3 lg:rounded-xl relative z-50 ${style === 'transparent' ? 'transparent' : style === 'blur' ? 'bg-slate-900/80 backdrop-blur-md border border-slate-700/50' : style === 'auto' ? 'bg-slate-900/90 border border-slate-700/50 dark:bg-slate-200/90 dark:border dark:border-slate-400/50' : 'bg-slate-900/90 border border-slate-700/50'} lg:mt-6 ${orientation === 'vertical' ? 'lg:flex-col lg:max-w-[300px] lg:pt-6' : ''}`} style={style === 'blur' ? 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);' : ''}>
		<div class={`w-full flex items-center desktop-menu min-w-0 min-h-12 ${orientation === 'vertical' ? 'lg:flex-col lg:gap-4 lg:pb-6' : ''}`}>
			{#if logo}
				<a href="/" class={`flex items-center flex-shrink-0 ${orientation === 'vertical' ? 'lg:mb-6' : ''}`}>
					<img
						src={logoSrc}
						alt={logo.alt}
						class="h-6"
					/>
				</a>
			{:else if _cfg?.title}
				{@const titleParts = getSiteTitleParts(_cfg)}
				<a href="/" class={`flex items-center flex-shrink-0 ${orientation === 'vertical' ? 'lg:mb-6' : ''}`}>
					<h1 class="text-2xl font-bold {style === 'auto' ? 'text-white hover:text-slate-300 dark:text-slate-900 dark:hover:text-slate-600' : style === 'transparent' ? 'text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300' : 'text-white hover:text-slate-300'}">{titleParts.brand}{titleParts.poweredBy ? ` | ${titleParts.poweredBy}` : ''}</h1>
				</a>
			{/if}
			<!-- Desktop Navigation - Hidden on sm and md, visible on lg+ -->
			<div class={`hidden lg:flex flex-1 mx-4 min-w-0 ${orientation === 'vertical' ? 'lg:flex-col' : 'scroll-smooth'} relative`}>
			<div class="flex-1 min-w-0">
					<ul class={`flex items-center ${orientation === 'vertical' ? 'gap-2 lg:flex-col lg:items-stretch w-full' : itemsPosition === 'center' ? 'gap-4 flex-wrap justify-center w-full' : 'gap-4 flex-wrap justify-start w-full'}`}>
						{#each visibleItemsWithActions as { label, to, href, target, rel, position, icon, className, submenu, action }}
							{#if orientation === 'vertical' || position !== 'right'}
								<li class={`flex items-center flex-shrink-0 ${orientation === 'vertical' ? 'w-full justify-start' : ''}`}>
									{#if submenu}
										<!-- Submenu Item -->
										<Submenu
											title={label ? t(label, $LL) : ''}
											icon={icon}
											items={submenu.map(item => ({
												label: item.label ? t(item.label, $LL) : '',
												to: item.to,
												href: item.href,
												target: item.target,
												rel: item.rel,
												icon: item.icon,
												className: item.className,
												active: false
											}))}
											iconExternal={iconExternal}
											orientation={orientation}
											onback={() => {}}
											onselect={(item: any) => {
												if (item.href) {
													const rel = item.rel || 'noopener';
													window.open(item.href, item.target || '_self', rel);
												} else if (item.to) {
													window.location.href = item.to;
												}
											}}
											theme={style}
										/>
									{:else if to}
										<a href={to} class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : ''} {className ?? ''}">
											{#if icon}
												{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
													<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else if typeof icon === 'string'}
													<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else}
													{@const IconC = asDynamicIcon(icon)}
													<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{/if}
											{/if}
											{#if label}
												<span class="whitespace-nowrap">{t(label, $LL)}</span>
											{/if}
										</a>
									{:else if href}
										<a
											{href}
											target={target ? target : undefined}
											rel={rel ? rel : 'noopener'}
											class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : ''} {className ?? ''}"
										>
											{#if icon}
												{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
													<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else if typeof icon === 'string'}
													<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else}
													{@const IconC = asDynamicIcon(icon)}
													<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{/if}
											{/if}
											{#if label}
												<span class="whitespace-nowrap">{t(label, $LL)}</span>
											{/if}
											{#if typeof iconExternal === 'undefined' || iconExternal === true}
												<ArrowUpRight class="ml-1 h-4 w-4" />
											{/if}
										</a>
									{:else if action}
										<button
											type="button"
											onclick={action}
											class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {orientation === 'vertical' ? 'w-full justify-start px-4 py-2' : ''} {className ?? ''}"
										>
											{#if icon}
												{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
													<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else if typeof icon === 'string'}
													<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else}
													{@const IconC = asDynamicIcon(icon)}
													<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{/if}
											{/if}
											{#if label}
												<span class="whitespace-nowrap">{t(label, $LL)}</span>
											{/if}
										</button>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				</div>
			</div>
			<div class={`hidden lg:flex ${orientation === 'vertical' ? 'flex-col mx-4' : 'items-center'} flex-shrink-0 relative`}>
				<!-- Right-positioned menu items -->
				<div class="flex items-center {orientation === 'horizontal' ? 'mx-4' : ''}">
					<ul class={`flex items-center ${orientation === 'vertical' ? 'gap-2 lg:flex-col lg:items-stretch w-full' : 'gap-4 flex-wrap'}`}>
						{#each visibleItemsWithActions as { label, to, href, target, rel, position, icon, className, submenu, action }}
							{#if orientation !== 'vertical' && position === 'right'}
								<li class="flex items-center flex-shrink-0">
									{#if submenu}
										<!-- Submenu Item -->
										<Submenu
											title={label ? t(label, $LL) : ''}
											icon={icon}
											items={submenu.map(item => ({
												label: item.label ? t(item.label, $LL) : '',
												to: item.to,
												href: item.href,
												target: item.target,
												rel: item.rel,
												icon: item.icon,
												className: item.className,
												active: false
											}))}
											iconExternal={iconExternal}
											orientation={orientation}
											onback={() => {}}
											onselect={(item: any) => {
												if (item.href) {
													const rel = item.rel || 'noopener';
													window.open(item.href, item.target || '_self', rel);
												} else if (item.to) {
													window.location.href = item.to;
												}
											}}
											theme={style}
										/>
									{:else if to}
										<a href={to} class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {className ?? ''}">
													{#if icon}
														{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
															<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
														{:else if typeof icon === 'string'}
															<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
														{:else}
															{@const IconC = asDynamicIcon(icon)}
															<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
														{/if}
													{/if}
													{#if label}
														<span class="whitespace-nowrap">{t(label, $LL)}</span>
													{/if}
												</a>
											{:else if href}
												<a
													{href}
													target={target ? target : undefined}
													rel={rel ? rel : 'noopener'}
													class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {className ?? ''}"
												>
											{#if icon}
												{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
													<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else if typeof icon === 'string'}
													<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else}
													{@const IconC = asDynamicIcon(icon)}
													<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{/if}
											{/if}
											{#if label}
												<span class="whitespace-nowrap">{t(label, $LL)}</span>
											{/if}
											{#if typeof iconExternal === 'undefined' || iconExternal === true}
												<ArrowUpRight class="ml-1 h-4 w-4" />
											{/if}
										</a>
									{:else if action}
										<button
											type="button"
											onclick={action}
											class="group {style === 'auto' ? 'text-white! hover:text-slate-300! dark:text-slate-900! dark:hover:text-slate-600!' : style === 'transparent' ? 'text-slate-900! hover:text-slate-600! dark:text-white! dark:hover:text-slate-300!' : 'text-white! hover:text-slate-300!'} font-medium text-base flex items-center cursor-pointer transition-colors duration-200 {className ?? ''}"
										>
											{#if icon}
												{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
													<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else if typeof icon === 'string'}
													<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{:else}
													{@const IconC = asDynamicIcon(icon)}
													<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
												{/if}
											{/if}
											{#if label}
												<span class="whitespace-nowrap">{t(label, $LL)}</span>
											{/if}
										</button>
									{/if}
								</li>
							{/if}
						{/each}
					</ul>
				</div>
				<div class={`flex items-center ${orientation === 'vertical' ? 'gap-2 flex-col mt-4 w-full' : 'gap-2 whitespace-nowrap'}`}>
					{#if authEnabled && isLoggedIn}
						<ActionsDropdown
							title={userDropdownTitle}
							formatKind={userDropdownFormatKind}
							providerIcon={userDropdownProviderIcon}
							open={dropdownOpen}
							items={menuItems}
							position="right"
							{iconExternal}
							{orientation}
							onChange={handleSelect}
						/>
					{/if}
					<!-- Language Switcher -->
					{#if (_cfg?.language as { enabled?: boolean } | undefined)?.enabled}
						<div class="{orientation === 'vertical' ? 'w-full flex justify-center' : ''}">
							<LanguageSwitcher
								currentLocale={$localeStore ?? page.data.locale ?? (_cfg?.language as { defaultLocale?: string })?.defaultLocale ?? 'en'}
								availableLocales={availableLocales}
								addIcons={(_cfg?.language as { addIcons?: boolean })?.addIcons ?? false}
								defaultLocale={(_cfg?.language as { defaultLocale?: string })?.defaultLocale || 'en'}
								className={(_cfg?.language as { className?: string })?.className || ''}
								{orientation}
								theme={style}
							/>
						</div>
					{/if}
					<!-- Theme Switcher -->
					{#if !disableSwitch}
						<button onclick={rotateTheme} class="{style === 'auto' ? 'bg-white/40 dark:bg-slate-700/40' : style === 'transparent' ? 'bg-slate-700/40 dark:bg-white/40' : 'bg-white/40'} rounded-full {orientation === 'vertical' ? 'w-full min-w-0 h-10 justify-center px-4' : 'w-8 h-8 justify-center'} flex items-center hover:bg-gray/80 transition-colors duration-200">
							{#if theme === 'system'}
								<Eclipse class="w-4 h-4 {style === 'auto' ? 'text-slate-900 dark:text-white' : style === 'transparent' ? 'text-white dark:text-slate-900' : 'text-slate-900'}" />
							{:else if theme === 'dark'}
								<Moon class="w-4 h-4 {style === 'auto' ? 'text-slate-900 dark:text-white' : style === 'transparent' ? 'text-white dark:text-slate-900' : 'text-slate-900'}" />
							{:else}
								<Sun class="w-4 h-4 {style === 'auto' ? 'text-slate-900 dark:text-white' : style === 'transparent' ? 'text-white dark:text-slate-900' : 'text-slate-900'}" />
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
		<!-- Mobile/Tablet Hamburger Menu - Visible on sm and md, hidden on lg+ -->
		<div class="lg:hidden flex items-center relative z-60">
			<button
				id="hamburger-button"
				class="cursor-pointer focus:outline-hidden flex items-center relative z-60 transition-all duration-300"
				onclick={(e) => toggleMenu(e)}
			>
				<div class="relative w-8 h-8">
					<Menu
						class="w-8 h-8 text-white absolute transition-all duration-300 {isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}"
					/>
					<X
						class="w-8 h-8 text-white absolute transition-all duration-300 {isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}"
					/>
				</div>
			</button>
		</div>
	</div>

	{#if isOpen}
		<nav
			id="dropdown-menu"
			class="fixed top-18 left-0 right-0 bottom-0 overflow-hidden lg:hidden bg-gray-800 z-50"
		>
			<div class="relative overflow-hidden h-full">
				<!-- Main Menu -->
				<div class={`transition-transform duration-300 h-full overflow-y-auto translate-x-0`}>
					<ul class={`flex flex-col text-xl`}>
						{#each visibleItemsWithActions as { label, to, href, target, rel, icon, className, submenu, action }}
							<li class="flex justify-center border-b border-slate-600/30">
								{#if submenu}
									<!-- Submenu Item -->
									<SubmenuCompact
										title={label ? t(label, $LL) : ''}
										icon={icon}
										items={submenu.map(item => ({
											label: item.label ? t(item.label, $LL) : '',
											to: item.to,
											href: item.href,
											target: item.target,
											rel: item.rel,
											icon: item.icon,
											active: false
										}))}
										iconExternal={iconExternal}
										onback={() => {}}
										onselect={(item: any) => {
											if (item.href) {
												const rel = item.rel || 'noopener';
												window.open(item.href, item.target || '_self', rel);
											} else if (item.to) {
												window.location.href = item.to;
											}
											closeMenu();
										}}
									/>
								{:else if to}
									<a href={to} onclick={closeMenu} class="flex items-center justify-center w-full text-center text-white! hover:text-indigo-400! transition-colors duration-200 py-8 px-4">
										{#if icon}
											{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
												<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else if typeof icon === 'string'}
												<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else}
												{@const IconC = asDynamicIcon(icon)}
												<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{/if}
										{/if}
										{#if label}
											<span class="whitespace-nowrap">{t(label, $LL)}</span>
										{/if}
									</a>
								{:else if href}
									<a
										{href}
										target={target ? target : undefined}
										rel={rel ? rel : 'noopener'}
										onclick={closeMenu}
										class="flex items-center justify-center w-full text-center text-white! hover:text-indigo-400! transition-colors duration-200 py-8 px-4"
									>
										{#if icon}
											{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
												<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else if typeof icon === 'string'}
												<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else}
												{@const IconC = asDynamicIcon(icon)}
												<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{/if}
										{/if}
										{#if label}
											<span class="whitespace-nowrap">{t(label, $LL)}</span>
										{/if}
										{#if typeof iconExternal === 'undefined' || iconExternal === true}
											<ArrowUpRight class="ml-1 h-4 w-4" />
										{/if}
									</a>
								{:else if action}
									<button
										type="button"
										onclick={() => {
											action();
											closeMenu();
										}}
										class="flex items-center justify-center w-full text-center text-white! hover:text-indigo-400! transition-colors duration-200 py-8 px-4"
									>
										{#if icon}
											{#if typeof icon === 'string' && (icon.startsWith('http') || icon.startsWith('/'))}
												<img src={icon} alt="" class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else if typeof icon === 'string'}
												<Icon name={icon} className="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{:else}
												{@const IconC = asDynamicIcon(icon)}
												<IconC class="h-5 w-5 {label ? 'mr-1.5' : ''}" />
											{/if}
										{/if}
										{#if label}
											<span class="whitespace-nowrap">{t(label, $LL)}</span>
										{/if}
									</button>
								{/if}
							</li>
						{/each}

						{#if authEnabled && isLoggedIn}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								<ActionsDropdown
									title={userDropdownTitle}
									formatKind={userDropdownFormatKind}
									providerIcon={userDropdownProviderIcon}
									open={dropdownOpen}
									items={menuItems}
									position="left"
									isSmall={true}
									{iconExternal}
									theme={style}
									onChange={handleSelect}
									className="w-full py-8"
								/>
							</li>
						{/if}

						<!-- Language Switcher Item -->
						{#if (_cfg?.language as { enabled?: boolean } | undefined)?.enabled}
							<li class="flex justify-center w-full border-b border-slate-600/30">
								<LanguageSwitcherCompact
									title={getCurrentLanguageName()}
									icon={(_cfg?.language as { icon?: string })?.icon || 'languages'}
									items={availableLocales.map((locale) => ({
										id: locale.code,
										label: locale.name,
										icon: (_cfg?.language as { addIcons?: boolean })?.addIcons ? locale.icon : undefined,
										active: locale.code === currentLocale
									}))}
									onback={() => {}}
									onselect={(item: { id: string }) => selectLanguage(item.id)}
									className={(_cfg?.language as { className?: string })?.className ?? ''}
								/>
							</li>
						{/if}
					</ul>
				</div>

			</div>
		</nav>
	{/if}
</header>
