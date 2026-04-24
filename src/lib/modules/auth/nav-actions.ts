import { browser } from '$app/environment';
import { isDev } from '$lib/helpers/dev';
import type { LLType } from '$lib/helpers/i18n';
import { getSiteConfig } from '$lib/helpers/siteConfig';
import { connectWallet, disconnectWallet } from './web3';

type AuthConfig = { enabled?: boolean; strategy?: string | string[]; primaryStrategy?: string };
type SessionLike = {
	user?: { id?: string; userId?: string; name?: string | null; email?: string | null };
	provider?: string;
} | null | undefined;

function getAuthConfig(): AuthConfig | undefined {
	const c = getSiteConfig();
	const mods = c?.modules as Record<string, unknown> | undefined;
	return mods?.auth as AuthConfig | undefined;
}

/** True when site config has auth.enabled and at least one strategy (passkey or web3). */
export function isAuthEnabled(): boolean {
	const auth = getAuthConfig();
	return Boolean(
		auth?.enabled && (Array.isArray(auth.strategy) ? auth.strategy.length > 0 : auth.strategy)
	);
}

/** True when user is logged in via passkey (session) or web3 (wallet). Use only when auth is enabled. */
export function isLoggedIn(session: SessionLike, walletAddress: string | null | undefined): boolean {
	return Boolean(walletAddress ?? (session != null && session.user != null));
}

/** All active auth providers when logged in (e.g. passkey from session, web3 from wallet). Can be multiple. */
export function getAuthProviders(
	session: SessionLike,
	walletAddress: string | null | undefined
): string[] {
	const out: string[] = [];
	if (session != null && session.user != null) out.push(session.provider ?? 'passkey');
	if (walletAddress) out.push('web3');
	return out;
}

/** First/primary auth provider when logged in (for display when showing one). */
export function getAuthProvider(
	session: SessionLike,
	walletAddress: string | null | undefined
): string | undefined {
	const providers = getAuthProviders(session, walletAddress);
	return providers[0];
}

/** Navbar items from site config (parsed). Use for show: 'loggedIn'/'loggedOut' to apply. */
export function getNavbarItemsFromConfig(): Array<{ show?: string; label?: string; to?: string; href?: string; target?: '_blank' | '_self' | '_parent' | '_top'; rel?: string; action?: string; position?: string; icon?: string; className?: string; submenu?: unknown[] }> {
	const c = getSiteConfig();
	const items = (c?.themeConfig as { navbar?: { items?: unknown[] } })?.navbar?.items;
	return Array.isArray(items) ? items as Array<{ show?: string; label?: string; to?: string; href?: string; target?: '_blank' | '_self' | '_parent' | '_top'; rel?: string; action?: string; position?: string; icon?: string; className?: string; submenu?: unknown[] }> : [];
}

/** Auth item for dropdown; optional show rule (e.g. "loggedIn", "connected", "loggedIn and connected"). */
export type AuthItemFromConfig = {
	label?: string;
	to?: string;
	href?: string;
	target?: '_blank' | '_self' | '_parent' | '_top';
	rel?: string;
	icon?: string;
	show?: string;
	className?: string;
};

/** Auth items for user dropdown from themeConfig.navbar.authItems. Each item may have show to control visibility per connection state. */
export function getAuthItemsFromConfig(): AuthItemFromConfig[] {
	const c = getSiteConfig();
	const items = (c?.themeConfig as { navbar?: { authItems?: unknown[] } })?.navbar?.authItems;
	return Array.isArray(items) ? (items as AuthItemFromConfig[]) : [];
}

function getPrimaryStrategy(): string | undefined {
	const auth = getAuthConfig();
	return auth?.primaryStrategy ?? (Array.isArray(auth?.strategy) ? auth.strategy[0] : (auth?.strategy as string));
}

type PrimaryStrategyModule = {
	startRegistrationFlow?: () => Promise<void>;
	startLoginFlow?: () => Promise<void>;
	startLogoutFlow?: () => Promise<void>;
};

/** Strategy folder modules: each key is ./<name>/index.ts, loaded by primary strategy name. */
const strategyModules = import.meta.glob<PrimaryStrategyModule>('./*/index.ts');

/** Load ./${primary}/index according to config primaryStrategy. */
async function loadPrimaryStrategyModule(): Promise<PrimaryStrategyModule | null> {
	const primary = getPrimaryStrategy();
	if (!primary) return null;
	const loader = strategyModules[`./${primary}/index.ts`];
	if (typeof loader !== 'function') return null;
	try {
		return await loader();
	} catch (e) {
		if (isDev) {
			console.warn(`[auth] Strategy "${primary}" not available`, e);
		}
		return null;
	}
}

async function runRegistrationFlow(): Promise<void> {
	const mod = await loadPrimaryStrategyModule();
	if (typeof mod?.startRegistrationFlow === 'function') await mod.startRegistrationFlow();
}

async function runLoginFlow(): Promise<void> {
	const mod = await loadPrimaryStrategyModule();
	if (typeof mod?.startLoginFlow === 'function') await mod.startLoginFlow();
}

async function runLogoutFlow(): Promise<void> {
	const mod = await loadPrimaryStrategyModule();
	if (typeof mod?.startLogoutFlow === 'function') await mod.startLogoutFlow();
}

/** Minimal LL shape for wallet messages (i18n). */
export type AuthNavMessages = {
	helpers: {
		wallet: {
			walletNotConfigured(): string;
			walletNotInstalled(): string;
			walletCannotConnect(): string;
			walletConnected(): string;
			walletDisconnected(): string;
		};
	};
};

export type AuthNavActions = {
	register: () => void;
	/** Main action: sign in (Auth.js passkey). Use action: 'signin' in config; 'login' is an alias. */
	signin: () => void;
	/** Main action: sign out. Use action: 'signout' in config; 'logout' is an alias. */
	signout: () => void;
	connect: () => void;
	disconnect: () => void;
};

/**
 * Returns reusable auth nav actions (login, register, connect, disconnect)
 * for use in header, footer, or any component. Pass LL (i18n) for messages.
 */
export function getAuthNavActions(ll: LLType): AuthNavActions {
	const { helpers } = ll as unknown as AuthNavMessages;
	const wallet = helpers.wallet;
	const auth = getAuthConfig();
	const authEnabled = auth?.enabled ?? false;
	const strategy = auth?.strategy;
	const web3Enabled = Array.isArray(strategy) ? strategy?.includes('web3') : strategy === 'web3';

	return {
		register: () => void runRegistrationFlow(),
		signin: () => void runLoginFlow(),
		signout: () => void runLogoutFlow(),
		connect: () => {
			if (authEnabled && browser && web3Enabled) {
				connectWallet(true, {
					walletNotConfigured: wallet.walletNotConfigured(),
					walletNotInstalled: wallet.walletNotInstalled(),
					walletCannotConnect: wallet.walletCannotConnect(),
					walletConnected: wallet.walletConnected()
				});
			}
		},
		disconnect: () => {
			disconnectWallet({
				walletDisconnected: wallet.walletDisconnected()
			});
		}
	};
}

/** Resolves string action keys to callbacks. Main keys: signin, signout. Aliases: login → signin, logout → signout. */
export function resolveAuthNavAction(
	actionKey: string,
	actions: AuthNavActions
): (() => void) | undefined {
	if (actionKey === 'manualConnect') return actions.connect;
	if (actionKey === 'disconnectWallet') return actions.disconnect;
	if (actionKey === 'register') return actions.register;
	if (actionKey === 'signin' || actionKey === 'login') return actions.signin;
	if (actionKey === 'signout' || actionKey === 'logout') return actions.signout;
	return undefined;
}
