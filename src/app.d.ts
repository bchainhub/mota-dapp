declare module 'vite-plugin-config' {
	/**
	 * Site configuration injected at build time as `__SITE_CONFIG__`.
	 * Edit in `vite.config.ts` (`siteConfig`). JSDoc here appears in editor tooltips.
	 */
	export interface Config {
		/**
		 * title
		 * @description Site title shown in nav, meta, and UI.
		 * @example "Mota"
		 */
		title: string;
		/**
		 * url
		 * @description Canonical site URL (origin for auth, links).
		 * @example "https://url.ext"
		 */
		url: string;
		/**
		 * organizationName
		 * @description Organization name (e.g. GitHub username for links).
		 */
		organizationName?: string;
		/**
		 * projectName
		 * @description Project or repo name (e.g. for issue links).
		 */
		projectName?: string;
		/**
		 * favicon
		 * @description Favicon path in static folder.
		 * @example "/img/icons/favicon.png"
		 */
		favicon?: string;

		/**
		 * themeConfig
		 * @description Theme: navbar, footer, color mode, metadata.
		 */
		themeConfig: {
			/**
			 * navbar
			 * @description Navbar layout, logo, items, and auth actions.
			 */
			navbar?: {
				/**
				 * logo
				 * @description Logo paths for light and dark theme, plus alt text.
				 */
				logo?: {
					src: string;
					srcDark?: string;
					alt?: string;
					/** When true, appends the site `title` brand segment only (text before the first `|`, trimmed) after the image inside the same home link. */
					attachTitle?: boolean;
					/** Tailwind/classes for the whole logo link (image + optional title), e.g. text color. */
					className?: string;
				};
				/**
				 * items
				 * @description Nav items: use `to` for internal, `href` for external; action keys: manualConnect, disconnectWallet, signin, signout.
				 */
				items?: NavbarItem[];
				/**
				 * authItems
				 * @description Auth-specific items merged with items when auth is enabled.
				 */
				authItems?: NavbarItem[];
				/**
				 * style
				 * @description Navbar visual style.
				 * @values `'auto'` (theme-adaptive) | `'blur'` (blurred background) | `'transparent'`
				 * @recommendation `blur` for contrast on varied backgrounds; `transparent` for overlay.
				 */
				style?: 'auto' | 'blur' | 'transparent';
				/**
				 * hideOnScroll
				 * @description Hide navbar when user scrolls down; show on scroll up.
				 */
				hideOnScroll?: boolean;
				/**
				 * orientation
				 * @description Navbar layout.
				 * @values `'horizontal'` | `'vertical'` (vertical = sidebar on large screens)
				 * @recommendation `horizontal` for top nav; `vertical` for side nav.
				 */
				orientation?: 'horizontal' | 'vertical';
				/**
				 * iconExternal
				 * @description Show external-link icon on items with `href` (external links).
				 */
				iconExternal?: boolean;
				/**
				 * itemsPosition
				 * @description Alignment of nav items (horizontal layout).
				 * @values `'side'` (left) | `'center'`
				 */
				itemsPosition?: 'side' | 'center';
			};
			/**
			 * footer
			 * @description Footer layout, link groups, copyright, liner links.
			 */
			footer?: {
				/**
				 * style
				 * @description Footer visual style.
				 * @values `'light'` | `'dark'` | `'transparent'`
				 * @recommendation Match navbar or use `dark` for contrast.
				 */
				style?: 'light' | 'dark' | 'transparent';
				/**
				 * logo
				 * @description Footer logo: src path and alt text.
				 */
				logo?: { src: string; alt?: string };
				/**
				 * links
				 * @description Link groups: each has title and items (FooterLinkItem[]).
				 */
				links?: { title: string; items: FooterLinkItem[] }[];
				/**
				 * copyright
				 * @description Copyright text; may use i18n key (e.g. footer.copyright with `{ year }`).
				 */
				copyright?: string;
				/**
				 * liner
				 * @description Single-row liner links (e.g. below main footer).
				 */
				liner?: FooterLinkItem[];
				/**
				 * iconExternal
				 * @description Show external-link icon on external footer links.
				 */
				iconExternal?: boolean;
			};
			/**
			 * metadata
			 * @description HTML `<meta>` tags (`name` / `property` + `content`) or `<link>` (`rel` + `href`).
			 */
			metadata?: ({ name?: string; content: string; property?: string } | { rel?: string; href?: string })[];
			/**
			 * colorMode
			 * @description Color / dark mode: default, toggle visibility, system preference.
			 */
			colorMode?: {
				/**
				 * defaultMode
				 * @description Default theme when no user preference.
				 * @values `'light'` | `'dark'`
				 * @recommendation `light` or `dark`; use with respectPrefersColorScheme for system default.
				 */
				defaultMode?: 'light' | 'dark';
				/**
				 * disableSwitch
				 * @description Hide the theme (light/dark) toggle.
				 */
				disableSwitch?: boolean;
				/**
				 * respectPrefersColorScheme
				 * @description Use system preference when user has not chosen a theme.
				 */
				respectPrefersColorScheme?: boolean;
				/**
				 * iconExternal
				 * @description Show external-link icon in color mode switcher.
				 */
				iconExternal?: boolean;
			};
		};

		/**
		 * api
		 * @description API (e.g. /api/*) enable/disable and CORS allow-origin. Used in hooks.server.
		 */
		api?: {
			/**
			 * enabled
			 * @description When false, /api/* returns 404 (API disabled). Default true when omitted.
			 */
			enabled?: boolean;
			/**
			 * allowOrigin
			 * @description Value for Access-Control-Allow-Origin. Single origin, '*' or list of allowed origins.
			 * If the request Origin is in the list, it is echoed; otherwise first element or '*'. Default '*' when omitted.
			 */
			allowOrigin?: '*' | string | string[];
			/**
			 * activeVersions
			 * @description Enabled API versions: one version (string) or list of versions (string[]). Case-insensitive.
			 * When not defined, all versions are allowed.
			 */
			activeVersions?: string | string[];
		};

		/**
		 * modules
		 * @description Feature modules: auth, support, banking, minting. Add custom keys for your own modules; unknown keys are allowed.
		 */
		modules?: {
			/**
			 * auth
			 * @description Auth and wallet. When enabled, navbar/footer show connect, disconnect, signin, signout.
			 */
			auth?: {
				/** Addons may extend authentication configuration without editing this central declaration. */
				[key: string]: unknown;
				/**
				 * enabled
				 * @description Enable auth UI (connect, disconnect, signin, signout in navbar/footer).
				 */
				enabled?: boolean;
				/**
				 * strategy
				 * @description Allowed auth strategies.
				 * @values `'passkey'` | `'web3'` (array of one or both)
				 * @recommendation Use both for full auth + wallet; passkey-only or web3-only if one flow only.
				 */
				strategy?: (string)[];
				/**
				 * primaryStrategy
				 * @description Which strategy is primary for sign-in/register/logout and for loading the auth module.
				 * Used to load ./passkey/index or ./web3/index (startRegistrationFlow, startLoginFlow, startLogoutFlow)
				 * and as fallback when strategy order matters. Set on Locals as authPrimaryStrategy when needed.
				 * @recommendation Must be one of the values in strategy (e.g. 'passkey' or 'web3').
				 */
				primaryStrategy?: string;

				/**
				 * web3
				 * @description Web3 / injected wallet. Required: `provider`, `methods.requestAccounts`, `methods.chainId`.
				 */
				web3?: {
					/** Web3 addons may introduce additional client-visible options. */
					[key: string]: unknown;
					/**
					 * provider
					 * @description Preferred wallet provider id. Must match detectProvider type.
					 * @values Any string; common: `'ethereum'` | `'core'` | `'metamask'`
					 * @recommendation `ethereum` for EVM; `core` for Core Blockchain (CorePass wallet).
					 */
					provider: string;
					/**
					 * autoConnect
					 * @description Reconnect wallet on load when user previously connected on this origin.
					 */
					autoConnect?: boolean;
					/**
					 * chainId
					 * @description Numeric chain id (optional, for display or validation).
					 */
					chainId?: number;
					/**
					 * accountId
					 * @description Optional account id (e.g. for display or API).
					 */
					accountId?: string;
					/**
					 * methods
					 * @description RPC method names. Required keys: requestAccounts, chainId.
					 * @values e.g. requestAccounts: `'eth_requestAccounts'`, chainId: `'eth_chainId'`
					 * @recommendation Use eth_* for EVM; provider-specific for others.
					 */
					methods?: Record<string, string>;
					/**
					 * redirect
					 * @description Optional redirect after connect or disconnect. Query param `redirect` takes precedence when present (e.g. ?redirect=/dashboard). Omitted key = no redirect for that action.
					 */
					redirect?: {
						/**
						 * connect
						 * @description Path to navigate to after successful wallet connect. Fallback when `redirect` query is not set.
						 * @example "/portal"
						 */
						connect?: string;
						/**
						 * disconnect
						 * @description Path to navigate to after wallet disconnect. Fallback when `redirect` query is not set.
						 * @example "/"
						 */
						disconnect?: string;
						/**
						 * onAutoConnect
						 * @description When true, redirect after successful auto-connect using the same path as connect. Default false.
						 */
						onAutoConnect?: boolean;
					};
					/**
					 * app
					 * @description Default wallet for "install if missing" flow. When user taps Connect and no provider is detected, browser is detected (device-sherlock) and user is sent to the matching extension store.
					 */
					app?: {
						/** App/wallet name (e.g. "CorePass"). */
						name?: string;
						/** Icon URL for Connect button in header when defined. */
						icon?: string;
						/** Browser extension store ids: detected via device-sherlock; opens Chrome Web Store, Firefox Add-ons, or Edge Add-ons. */
						extension?: {
							/** Firefox Add-ons slug or id (e.g. "ether-metamask"). */
							mozilla?: string;
							/** Chrome Web Store extension id (e.g. "nkbihfbeogaeaoehlefnkodbefgpgknn"). */
							chrome?: string;
							/** Microsoft Edge Add-ons extension id (optional; Edge id differs from Chrome). */
							edge?: string;
						};
					};
				};

				/**
				 * trustedOrigins
				 * @description List of trusted origins for Better Auth (CORS, callbacks). Single origin string or array of origins. Omit to use Better Auth default.
				 * @see https://better-auth.com/docs/reference/options#trustedorigins
				 */
				trustedOrigins?: string | string[];
				/**
				 * rateLimit
				 * @description Global rate limit settings for Better Auth. Omit to use Better Auth defaults.
				 * @see https://better-auth.com/docs/reference/options#ratelimit
				 */
				rateLimit?: {
					/**
					 * enabled
					 * @description Enable rate limiting. Default true in production, false in development.
					 */
					enabled?: boolean;
					/**
					 * window
					 * @description Time window in seconds for rate limiting. Default 10.
					 */
					window?: number;
					/**
					 * max
					 * @description Maximum requests allowed within the window. Default 100.
					 */
					max?: number;
					/**
					 * storage
					 * @description Storage for rate limit state. 'memory' | 'database' | 'secondary-storage'. Default 'memory'.
					 */
					storage?: 'memory' | 'database' | 'secondary-storage';
					/**
					 * modelName
					 * @description Table name for rate limit when storage is database. Default 'rateLimit'.
					 */
					modelName?: string;
				};

				/**
				 * topMenu
				 * @description Top menu overrides (e.g. for layout or custom nav).
				 */
				topMenu?: { items?: NavbarItem[] };
				/**
				 * sideMenu
				 * @description Side menu overrides (e.g. for layout or custom nav).
				 */
				sideMenu?: { items?: NavbarItem[] };
			};
			/** Custom module keys; add your own without type errors. */
			[key: string]: unknown;
		};

		/**
		 * language
		 * @description Language switcher: locales, icon, auto-detect, default locale.
		 */
		language?: {
			/**
			 * enabled
			 * @description Enable language switcher in navbar/footer.
			 */
			enabled?: boolean;
			/**
			 * icon
			 * @description Icon name for the language switcher (e.g. 'languages').
			 */
			icon?: string;
			/**
			 * showName
			 * @description Show locale name next to the icon (e.g. "English").
			 */
			showName?: boolean;
			/**
			 * availableLocales
			 * @description Locale codes (e.g. ['en', 'es', 'pt-br']). Names come from each locale's language.descriptiveName in src/i18n.
			 */
			availableLocales?: string[] | Array<{ code: string; name?: string }>;
			/**
			 * defaultLocale
			 * @description Default locale code when none is detected or selected (e.g. 'en').
			 */
			defaultLocale?: string;
			/**
			 * autoDetect
			 * @description Detect locale from browser when no stored preference.
			 */
			autoDetect?: boolean;
			/**
			 * addIcons
			 * @description When true, show flag/icon before language name in switcher (normal and compact). Default false.
			 */
			addIcons?: boolean;
			/**
			 * className
			 * @description Optional CSS class for the language switcher container (normal and compact).
			 */
			className?: string;
		};
	}
}

/**
 * __SITE_CONFIG__
 * @description Site config injected at build time by Vite define. Client and server use getSiteConfig() from $lib/helpers/siteConfig.
 */
declare const __SITE_CONFIG__: import('vite-plugin-config').Config;

/**
 * NavbarItem
 * @description Navbar or menu item. Use `to` for internal routes, `href` for external. Actions use string keys resolved at runtime.
 */
interface NavbarItem {
	/**
	 * label
	 * @description Display label (i18n key or plain text).
	 */
	label?: string;
	/**
	 * to
	 * @description Internal SvelteKit path (e.g. /cards).
	 */
	to?: string;
	/**
	 * href
	 * @description External URL (opens in same or new tab per target).
	 */
	href?: string;
	/**
	 * action
	 * @description Action key (string in config) or function at runtime.
	 * @values `'manualConnect'` | `'disconnectWallet'` | `'signin'` | `'signout'` | `'register'`
	 * @recommendation Use string in vite.config; Header resolves to handlers.
	 */
	action?: (() => void) | string;
	/**
	 * position
	 * @description Side of the nav where this item appears.
	 * @values `'left'` | `'right'`
	 */
	position?: 'left' | 'right';
	/**
	 * target
	 * @description Link target (window/frame).
	 * @values `'_blank'` | `'_self'` | `'_parent'` | `'_top'`
	 * @recommendation `_blank` for external; omit for same window.
	 */
	target?: '_blank' | '_self' | '_parent' | '_top';
	/**
	 * rel
	 * @description Link rel attribute (e.g. noopener, noreferrer for external).
	 */
	rel?: string;
	/**
	 * icon
	 * @description Icon: string = name from Icon.svelte; or Svelte/Lucide component.
	 */
	icon?: string | import('svelte').Component | (new (...args: any[]) => unknown);
	/**
	 * className
	 * @description Optional CSS class for the item.
	 */
	className?: string;
	/**
	 * submenu
	 * @description Nested items (submenu / dropdown).
	 */
	submenu?: NavbarItem[];
	/**
	 * show
	 * @description Visibility rule: when to show this item.
	 * @values `'loggedIn'` | `'loggedOut'` | `'authIn'` | `'authOut'` | `'connected'` | `'disconnected'`, or combined: `'loggedIn and connected'`, `'authIn or connected'`
	 * @recommendation Use for auth-specific items (e.g. disconnect only when connected).
	 */
	show?: string;
}

/**
 * FooterLinkItem
 * @description Footer link. Use `to` for internal, `href` for external. Icon: string = Icon.svelte name, or component.
 */
interface FooterLinkItem {
	/**
	 * label
	 * @description Display label (i18n key or plain text).
	 */
	label: string;
	/**
	 * to
	 * @description Internal path.
	 */
	to?: string;
	/**
	 * href
	 * @description External URL.
	 */
	href?: string;
	/**
	 * action
	 * @description Action key or function. Same @values as NavbarItem.action.
	 */
	action?: (() => void) | string;
	/**
	 * target
	 * @description Link target.
	 * @values `'_blank'` | `'_self'` | `'_parent'` | `'_top'`
	 */
	target?: '_blank' | '_self' | '_parent' | '_top';
	/**
	 * rel
	 * @description Link rel attribute.
	 */
	rel?: string;
	/**
	 * icon
	 * @description Icon: string = Icon.svelte name, or Svelte/Lucide component.
	 */
	icon?: string | import('svelte').Component | (new (...args: any[]) => unknown);
	/**
	 * className
	 * @description Optional CSS class.
	 */
	className?: string;
	/**
	 * show
	 * @description Visibility rule. Same @values as NavbarItem.show.
	 */
	show?: string;
}

/**
 * MenuItem
 * @description Menu item with optional action callback. Used by ActionsDropdown (navbar/footer dropdowns).
 * Extends NavbarItem; action may be a function at runtime (resolved from config action keys).
 */
type MenuItem = NavbarItem & {
	action?: () => void;
};

/**
 * SvelteKit App namespace: types for hooks, load functions, and platform.
 */
declare namespace App {
	/**
	 * Locals
	 * @description Data available in server hooks and load functions via event.locals.
	 */
	interface Locals {
		/**
		 * country
		 * @description Country (e.g. from geo or header).
		 */
		country?: string;
		/**
		 * city
		 * @description City (e.g. from geo or header).
		 */
		city?: string;
		/**
		 * locale
		 * @description Resolved locale code.
		 */
		locale?: string;
		/**
		 * session
		 * @description Auth session (user, expires, provider). Set by auth hooks.
		 */
		session?: {
			/**
			 * user
			 * @description User id and profile (id, userId, name, email).
			 */
			user?: {
				id?: string;
				userId?: string;
				name?: string | null;
				email?: string | null;
				profile?: object;
			};
			/**
			 * expires
			 * @description Session expiry (ISO string).
			 */
			expires?: string;
			/**
			 * provider
			 * @description Auth provider that established this session (e.g. passkey). Web3 is derived client-side from wallet.
			 */
			provider?: string;
			/**
			 * walletConnected
			 * @description Wallet (web3) connected separately from user login. Set on client when wallet connects.
			 */
			walletConnected?: boolean;
		} | null;
	}

	/**
	 * PageData
	 * @description Data returned from load functions and available in +page.svelte / +layout.svelte.
	 */
	interface PageData {
		/**
		 * config
		 * @description Full site config (same as __SITE_CONFIG__).
		 */
		config?: import('vite-plugin-config').Config;
		/**
		 * authPrimaryStrategy
		 * @description Primary auth strategy from site config: passkey | web3.
		 */
		authPrimaryStrategy?: string;
		/**
		 * authStrategyConfig
		 * @description Config for the primary strategy (auth.passkey or auth.web3).
		 */
		authStrategyConfig?: Record<string, unknown>;
	}

	/**
	 * Platform
	 * @description Platform-specific APIs (Cloudflare Workers, Vercel, etc.) available in hooks and load.
	 */
	interface Platform {
		/**
		 * caches
		 * @description Cache API (e.g. caches.default).
		 */
		caches?: CacheStorage & { default: Cache };
		/**
		 * context
		 * @description Execution context (e.g. waitUntil for background work).
		 */
		context?: {
			waitUntil(promise: Promise<any>): void;
		};
		/**
		 * env
		 * @description Platform env (secrets, bindings).
		 */
		env?: any;
		/**
		 * cf
		 * @description Cloudflare-specific (e.g. cf object).
		 */
		cf?: {
			[key: string]: string | undefined;
		};
	}
}

/**
 * $env/dynamic/private
 * @description Private env vars (server-only). Import from '$env/dynamic/private'.
 */
declare module '$env/dynamic/private' {
	/**
	 * CAPTURE_COUNTRY
	 * @description Country to use when geo is unavailable (e.g. for dev).
	 */
	export const CAPTURE_COUNTRY: string | undefined;
	/**
	 * CAPTURE_CITY
	 * @description City to use when geo is unavailable (e.g. for dev).
	 */
	export const CAPTURE_CITY: string | undefined;
	/**
	 * BANKING_API_KEY
	 * @description Banking API key (secret). Use when calling banking API from server.
	 */
	export const BANKING_API_KEY: string | undefined;
}
