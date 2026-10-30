import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { toast } from '#components';
import { browser } from '$app/env';
import { deviceSherlock } from 'device-sherlock';
import { getRedirectTo } from '#lib/helpers/redirect.js';
import { getSiteConfig } from '#lib/helpers/siteConfig.js';
import { discoverWallets } from './discovery';
export type { WalletProvider, ProviderDetail, CoreProvider, CIP6963ProviderInfo, CIP6963ProviderDetail } from './discovery';

type Web3Config = NonNullable<NonNullable<NonNullable<ReturnType<typeof getSiteConfig>>['modules']>['auth']>['web3'];
type Web3AppConfig = NonNullable<Web3Config>['app'];

/** Config with required provider and methods (after getWeb3Config() validation). */
type ValidatedWeb3Config = { provider: string; methods: Record<string, string> } & Partial<Web3Config>;

// Shared metadata and request interface for 6963-style provider discovery.
// Existing EIP-named exports remain available for compatibility.
/** Provider metadata announced by wallets. */
export interface EIP6963ProviderInfo {
	uuid: string;
	name: string;
	icon: string;
	rdns: string;
}
/** Announced wallet: info + EIP-1193 provider. */
export interface EIP6963ProviderDetail {
	info: EIP6963ProviderInfo;
	provider: EIP1193Provider;
}
/** EIP-1193 provider: request + optional event subscription. */
export interface EIP1193Provider {
	request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
	on?(event: string, listener: (...args: unknown[]) => void): void;
	removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export const discoveredProviders = writable<EIP6963ProviderDetail[]>([]);
export const discoveredCoreProviders = writable<EIP6963ProviderDetail[]>([]);
/** Providers grouped by event namespace; UUIDs never cross protocol boundaries. */
export const providersByProtocol = writable<Record<string, EIP6963ProviderDetail[]>>({});
const initializedProtocols = new Set<string>();

export function getDiscoveryProtocol(): string {
	const cfg = getWeb3Config();
	if (cfg.discovery) return cfg.discovery;
	if (cfg.methods.requestAccounts.startsWith('xcb_')) return 'cip6963';
	if (cfg.methods.requestAccounts.startsWith('eth_')) return 'eip6963';
	throw new Error('Configure a 6963 discovery namespace for this blockchain.');
}

export function initProviderDiscovery(): void {
	if (!browser) return;
	const configured = getSiteConfig()?.modules?.auth?.web3;
	if (!configured?.provider || !configured.methods?.requestAccounts) return;
	const protocol = getDiscoveryProtocol();
	if (initializedProtocols.has(protocol)) return;
	initializedProtocols.add(protocol);
	discoverWallets(window, protocol, (detail) => {
		providersByProtocol.update((groups) => ({ ...groups, [protocol]: [...(groups[protocol] ?? []), detail] }));
		if (protocol === 'cip6963') discoveredCoreProviders.update((list) => [...list, detail]);
		if (protocol === 'eip6963') discoveredProviders.update((list) => [...list, detail]);
	});
}

export function getAvailableProviders(): EIP6963ProviderDetail[] {
	if (!browser) return [];
	initProviderDiscovery();
	const protocol = getDiscoveryProtocol();
	return get(providersByProtocol)[protocol] ?? [];
}

export function getBlockchainName(): string {
	const cfg = getWeb3Config();
	return cfg.blockchain ?? (getDiscoveryProtocol() === 'cip6963' ? 'Core' : getDiscoveryProtocol() === 'eip6963' ? 'Ethereum' : cfg.provider);
}

export function getWeb3Config(): ValidatedWeb3Config {
	const raw = getSiteConfig()?.modules?.auth?.web3 ?? {};
	const cfg = raw as NonNullable<Web3Config>;
	if (!cfg.provider || !cfg.methods?.requestAccounts || !cfg.methods.chainId) {
		throw new Error('Web3 configuration is not valid.');
	}
	return {
		...cfg,
		provider: cfg.provider,
		methods: cfg.methods as Record<string, string>
	};
}

/** Optional redirect URLs from config; does not throw. All keys optional. Query param (default `redirect`) is preferred over these when present. */
function getWeb3Redirect(): { connect?: string; disconnect?: string; onAutoConnect?: boolean } | undefined {
	return (getSiteConfig()?.modules?.auth?.web3 as Web3Config | undefined)?.redirect;
}

// --- Install wallet: when user taps Connect and no provider, open extension store by browser (device-sherlock) ---
const POST_INSTALL_ACTION_KEY = 'postInstallWalletAction';

function getWeb3AppConfig(): Web3AppConfig | undefined {
	return getSiteConfig()?.modules?.auth?.web3?.app;
}

/** Extension store URL for current browser (device-sherlock). Chrome, Firefox, Edge; fallback Edge → Chrome id. */
function getExtensionStoreUrl(app: NonNullable<Web3AppConfig>): string | null {
	const ext = app.extension;
	if (!ext) return null;
	if (deviceSherlock.isFirefox && ext.mozilla) {
		return `https://addons.mozilla.org/en-US/firefox/addon/${ext.mozilla}/`;
	}
	if (deviceSherlock.isChrome && ext.chrome) {
		return `https://chrome.google.com/webstore/detail/${ext.chrome}`;
	}
	if (deviceSherlock.isEdge && ext.edge) {
		return `https://microsoftedge.microsoft.com/addons/detail/${ext.edge}`;
	}
	if (deviceSherlock.isSamsung && ext.chrome) {
		return `https://chrome.google.com/webstore/detail/${ext.chrome}`;
	}
	return null;
}

/** True when default wallet extension is configured for current browser; then we can offer install flow. */
export function canOfferMobileWalletInstall(): boolean {
	if (typeof window === 'undefined') return false;
	const app = getWeb3AppConfig();
	if (!app?.extension) return false;
	return getExtensionStoreUrl(app) != null;
}

/** Redirect to wallet extension store for current browser (Chrome Web Store, Firefox Add-ons, or Edge Add-ons). */
export function tryOpenWalletAppThenStore(): void {
	if (typeof window === 'undefined') return;
	const app = getWeb3AppConfig();
	if (!app) return;
	const storeUrl = getExtensionStoreUrl(app);
	if (!storeUrl) return;

	localStorage.setItem(POST_INSTALL_ACTION_KEY, 'connect');
	window.location.href = storeUrl;
}

/** Clear post-install action (e.g. when user returned from store). */
export function clearPostInstallWalletAction(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(POST_INSTALL_ACTION_KEY);
}

/** Check for post-install action on load and clear it. Call from layout/header when web3 is enabled. */
export function initPostInstallWalletAction(): void {
	if (typeof window === 'undefined') return;
	const action = localStorage.getItem(POST_INSTALL_ACTION_KEY);
	if (action === 'connect') {
		localStorage.removeItem(POST_INSTALL_ACTION_KEY);
	}
}

/**
 * Detect a wallet from the configured 6963 namespace using announced metadata.
 * @param preferredRdns - When set, pick the EIP-6963 provider whose info.rdns or info.name matches (if any).
 */
function findProvider(preferredRdns?: string): EIP6963ProviderDetail | undefined {
	const list = getAvailableProviders();
	const preferred = (preferredRdns ?? getWeb3Config().provider).toLowerCase();
	return list.find((detail) => detail.info.rdns.toLowerCase() === preferred ||
		detail.info.name.toLowerCase() === preferred) ?? list[0];
}

export function detectProvider(preferredRdns?: string): { type: string | null; provider: EIP1193Provider | null } {
	if (!browser) return { type: null, provider: null };
	const detail = findProvider(preferredRdns);
	return { type: detail?.info.rdns ?? null, provider: detail?.provider ?? null };
}

export async function requestAccounts(providerType?: string, explicitProvider?: EIP1193Provider | null): Promise<string[]> {
	const cfg = getWeb3Config();
	const provider = explicitProvider ?? detectProvider(providerType ?? undefined).provider;
	if (!provider) return [];
	const accounts = (await provider.request({ method: cfg.methods.requestAccounts })) as string[] | undefined;
	return Array.isArray(accounts) ? accounts : [];
}

// Svelte stores for wallet state
export const walletConnected = writable(false);
/** Self-attested provider RDNS from the announcement. */
export const walletType = writable<string | null>(null);
/** Wallet display name from the announcement info.name. */
export const walletDisplayName = writable<string | null>(null);
export const walletAddress = writable<string | null>(null);
/** Current chain ID from wallet (e.g. "0x1"); updated on chainChanged, no reload. */
export const walletChainId = writable<string | null>(null);

/** Core ecosystem membership comes from CIP-6963, never a wallet brand name. */
export function isCoreEcosystem(type: string | null): boolean {
	return get(discoveredCoreProviders).some((detail) => detail.info.rdns === type);
}

const WALLET_AUTO_CONNECT_KEY = 'wallet_auto_connect';
const WALLET_SELECTED_KEY = 'wallet_selected_provider';

let providerRef: EIP1193Provider | null = null;
type ProviderListener = (...args: unknown[]) => void;
let accountsChangedHandler: ProviderListener | null = null;
let chainChangedHandler: ProviderListener | null = null;
let lastChainId: string | null = null;

function unsubscribeProvider() {
	if (!providerRef) return;
	if (accountsChangedHandler && typeof providerRef.removeListener === 'function') {
		providerRef.removeListener('accountsChanged', accountsChangedHandler);
	}
	if (chainChangedHandler && typeof providerRef.removeListener === 'function') {
		providerRef.removeListener('chainChanged', chainChangedHandler);
	}
	providerRef = null;
	accountsChangedHandler = null;
	chainChangedHandler = null;
	lastChainId = null;
}

function subscribeToProviderEvents(provider: EIP1193Provider) {
	if (!provider || typeof provider.on !== 'function') return;
	unsubscribeProvider();
	providerRef = provider;
	accountsChangedHandler = (...args: unknown[]) => {
		const accounts = args[0] as string[] | undefined;
		if (!accounts || accounts.length === 0) {
			if (get(walletAddress) == null) return;
			unsubscribeProvider();
			walletConnected.set(false);
			walletType.set(null);
			walletDisplayName.set(null);
			walletAddress.set(null);
			walletChainId.set(null);
			clearWalletAutoConnect();
			const redirect = getWeb3Redirect();
			const redirectUrl = getRedirectTo(redirect?.disconnect);
			if (browser && redirectUrl) goto(redirectUrl);
			else if (browser && redirect?.disconnect) goto(redirect.disconnect);
			return;
		}
		const next = accounts[0];
		if (get(walletAddress) === next) return;
		walletAddress.set(next);
	};
	chainChangedHandler = (...args: unknown[]) => {
		const chainId = args[0] as string | undefined;
		const id = chainId ?? null;
		if (lastChainId != null && lastChainId === id) return;
		lastChainId = id;
		walletChainId.set(id);
	};
	provider.on('accountsChanged', accountsChangedHandler);
	provider.on('chainChanged', chainChangedHandler);
	if (typeof provider.request === 'function') {
		const cfg = getWeb3Config();
		provider
			.request({ method: cfg.methods.chainId })
			.then((id: unknown) => {
				if (providerRef !== provider) return;
				const cid = (id as string) ?? null;
				lastChainId = cid;
				walletChainId.set(cid);
			})
			.catch(() => {});
	}
}

/** True when user previously connected on this origin; then we may auto-connect without prompting again. */
export function shouldAutoConnect(): boolean {
	if (!browser || typeof localStorage === 'undefined') return false;
	return localStorage.getItem(WALLET_AUTO_CONNECT_KEY) === (typeof window !== 'undefined' ? window.location.origin : '');
}

function setWalletAutoConnect() {
	if (browser && typeof localStorage !== 'undefined' && typeof window !== 'undefined') {
		localStorage.setItem(WALLET_AUTO_CONNECT_KEY, window.location.origin);
	}
}

function clearWalletAutoConnect() {
	if (browser && typeof localStorage !== 'undefined') {
		localStorage.removeItem(WALLET_AUTO_CONNECT_KEY);
		localStorage.removeItem(WALLET_SELECTED_KEY);
	}
}

// Automatically login and connect wallet (only call when shouldAutoConnect() is true to avoid prompting every load)
export async function autoLogin() {
	const rdns = localStorage.getItem(WALLET_SELECTED_KEY);
	const selected = getAvailableProviders().find((detail) => `${getDiscoveryProtocol()}:${detail.info.rdns}` === rdns);
	if (!selected) return;
	await connectWallet(false, undefined, selected, true);
}

/**
 * Connect directly to an announced wallet from the configured 6963 namespace.
 * @param automessage - Show toast on error/no wallet.
 * @param messages - Optional toast strings.
 * @param selectedDetail - Explicit announced provider; otherwise prefer configured RDNS/name, then first announcement.
 * @param isAutoConnect - When true, redirect only if redirect.onAutoConnect is true (default: no redirect on auto-connect).
 */
export async function connectWallet(
	automessage: boolean = true,
	messages?: Record<string, string>,
	selectedDetail?: EIP6963ProviderDetail,
	isAutoConnect?: boolean
) {
	let cfg: ValidatedWeb3Config;
	let detail = selectedDetail;
	let type: string | null = null;
	let provider: EIP1193Provider | null = null;
	const reportFailure = () => {
		if (!automessage || isAutoConnect) return;
		const raw = getSiteConfig()?.modules?.auth?.web3;
		let blockchain = raw?.blockchain ?? raw?.provider ?? 'unknown';
		try { blockchain = getBlockchainName(); } catch { /* Invalid config still produces one actionable error. */ }
		toast.error(`Cannot connect wallet for Blockchain: ${blockchain}.`);
	};
	try {
		cfg = getWeb3Config();
		const available = getAvailableProviders();
		detail ??= findProvider();
		if (detail && !available.includes(detail)) {
			reportFailure();
			return;
		}
		type = detail?.info.rdns ?? null;
		provider = detail?.provider ?? null;
		if (!provider) {
			reportFailure();
			return;
		}
		const accounts = isAutoConnect
			? (cfg.methods.accounts && provider ? await provider.request({ method: cfg.methods.accounts }) as string[] : [])
			: await requestAccounts(type ?? cfg.provider, provider);
		if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === 'string') {
			const resolvedType = type ?? cfg.provider ?? null;
			walletType.set(resolvedType);
			walletDisplayName.set(detail?.info.name ?? null);
			walletAddress.set(accounts[0]);
			walletConnected.set(true);
			setWalletAutoConnect();
			if (detail) localStorage.setItem(WALLET_SELECTED_KEY, `${getDiscoveryProtocol()}:${detail.info.rdns}`);
			if (provider) subscribeToProviderEvents(provider);
			toast.success(messages?.walletConnected ?? 'Wallet connected.');
			const redirect = getWeb3Redirect();
			const mayRedirect = !isAutoConnect || redirect?.onAutoConnect === true;
			if (mayRedirect) {
				const redirectUrl = getRedirectTo(redirect?.connect);
				if (browser && redirectUrl) goto(redirectUrl);
			}
			return;
		}
		reportFailure();
	} catch (error) {
		console.error('Wallet connection failed:', error);
		reportFailure();
	}
}

// Disconnect the current wallet
export function disconnectWallet(messages?: Record<string, string>) {
	unsubscribeProvider();
	walletConnected.set(false);
	walletType.set(null);
	walletDisplayName.set(null);
	walletAddress.set(null);
	walletChainId.set(null);
	clearWalletAutoConnect();
	toast.success(messages?.walletDisconnected || 'Wallet disconnected.');
	const redirect = getWeb3Redirect();
	const redirectUrl = getRedirectTo(redirect?.disconnect);
	if (browser && redirectUrl) goto(redirectUrl);
	else if (browser && redirect?.disconnect) goto(redirect.disconnect);
}
