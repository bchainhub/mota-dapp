import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { toast } from '$components';
import { browser } from '$app/environment';
import { deviceSherlock } from 'device-sherlock';
import { getRedirectTo } from '$lib/helpers/redirect';
import { getSiteConfig } from '$lib/helpers/siteConfig';

type Web3Config = NonNullable<NonNullable<NonNullable<ReturnType<typeof getSiteConfig>>['modules']>['auth']>['web3'];
type Web3AppConfig = NonNullable<Web3Config>['app'];

/** Config with required provider and methods (after getWeb3Config() validation). */
type ValidatedWeb3Config = { provider: string; methods: Record<string, string> } & Partial<Web3Config>;

// --- EIP-6963: Multi Injected Provider Discovery (https://eips.ethereum.org/EIPS/eip-6963) ---
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
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on?(event: string, listener: (...args: unknown[]) => void): void;
	removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

const EIP6963_ANNOUNCE = 'eip6963:announceProvider' as const;
const EIP6963_REQUEST = 'eip6963:requestProvider' as const;

/** Discovered EIP-6963 providers (multiple wallets). Use for wallet picker UI. */
export const discoveredProviders = writable<EIP6963ProviderDetail[]>([]);

let eip6963Initialized = false;
function initEip6963(): void {
	if (!browser || typeof window === 'undefined' || eip6963Initialized) return;
	eip6963Initialized = true;
	const list: EIP6963ProviderDetail[] = [];
	const seen = new Set<string>();
	function add(detail: EIP6963ProviderDetail) {
		if (seen.has(detail.info.uuid)) return;
		seen.add(detail.info.uuid);
		list.push(detail);
		discoveredProviders.set([...list]);
	}
	window.addEventListener(EIP6963_ANNOUNCE, ((e: CustomEvent<EIP6963ProviderDetail>) => {
		const d = e.detail;
		if (d?.info?.uuid && d?.provider) add(d);
	}) as EventListener);
	window.dispatchEvent(new Event(EIP6963_REQUEST));
}

// Extend Window for known wallet globals (fallback when EIP-6963 discovery has no providers)
declare global {
	interface Window {
		ethereum?: unknown;
		corepass?: unknown;
	}
}

/** Legacy wallet detector: type id and getProvider. Used only when no EIP-6963 providers. */
type WalletDetector = { type: string; getProvider: () => unknown };

const WALLET_DETECTORS: WalletDetector[] = [
	{ type: 'core', getProvider: () => (typeof window !== 'undefined' && typeof (window as Window).corepass !== 'undefined' ? (window as Window).corepass : null) },
	{ type: 'metamask', getProvider: () => (typeof window !== 'undefined' && (window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask === true ? (window as Window & { ethereum: unknown }).ethereum : null) },
	{ type: 'ethereum', getProvider: () => (typeof window !== 'undefined' && typeof (window as Window & { ethereum?: unknown }).ethereum !== 'undefined' ? (window as Window & { ethereum: unknown }).ethereum : null) }
];

export function getWeb3Config(): ValidatedWeb3Config {
	const raw = getSiteConfig()?.modules?.auth?.web3 ?? {};
	const cfg = raw as NonNullable<Web3Config>;
	if (!cfg.provider || !cfg.methods) {
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
 * Detect wallet provider. Prefers EIP-6963 discovered providers; falls back to legacy window.ethereum / window.corepass.
 * @param preferredRdns - When set, pick the EIP-6963 provider whose info.rdns or info.name matches (if any).
 */
export function detectProvider(preferredRdns?: string): { type: string | null; provider: EIP1193Provider | null } {
	if (!browser) return { type: null, provider: null };
	initEip6963();
	const list = get(discoveredProviders);
	if (list.length > 0) {
		const web3 = getSiteConfig()?.modules?.auth?.web3 as Web3Config | undefined;
		const preferred = preferredRdns ?? web3?.provider ?? undefined;
		// core = Core Blockchain (config); CorePass = wallet (EIP-6963 rdns/name)
		const match = preferred
			? list.find(
					(d) =>
						d.info.rdns === preferred ||
						d.info.name === preferred ||
						d.info.rdns.toLowerCase().includes(preferred.toLowerCase()) ||
						d.info.name.toLowerCase().includes(preferred.toLowerCase()) ||
						((preferred === 'core' || preferred === 'corepass') &&
							(d.info.rdns.toLowerCase().includes('corepass') || d.info.name.toLowerCase().includes('corepass')))
				) ?? list[0]
			: list[0];
		return { type: match.info.rdns, provider: match.provider };
	}
	for (const { type, getProvider } of WALLET_DETECTORS) {
		const provider = getProvider();
		if (provider != null) return { type, provider: provider as EIP1193Provider };
	}
	return { type: null, provider: null };
}

export async function requestAccounts(providerType?: string, explicitProvider?: EIP1193Provider | null): Promise<string[]> {
	const cfg = getWeb3Config();
	const provider = explicitProvider ?? detectProvider(providerType ?? undefined).provider;
	const type = providerType ?? (explicitProvider ? null : detectProvider().type);
	if (!provider) return [];
	const accounts = (await provider.request({ method: cfg.methods.requestAccounts })) as string[] | undefined;
	return Array.isArray(accounts) ? accounts : [];
}

// Svelte stores for wallet state
export const walletConnected = writable(false);
/** Provider id: EIP-6963 rdns (e.g. net.corepass.app) or legacy type (e.g. "core"). Used for matching; ecosystem "core" = Core Blockchain. */
export const walletType = writable<string | null>(null);
/** Wallet display name from EIP-6963 info.name (e.g. "CorePass") or derived for legacy; use for UI. */
export const walletDisplayName = writable<string | null>(null);
export const walletAddress = writable<string | null>(null);
/** Current chain ID from wallet (e.g. "0x1"); updated on chainChanged, no reload. */
export const walletChainId = writable<string | null>(null);

/** True when walletType is Core Blockchain ecosystem (legacy "core" or CorePass wallet rdns/name). */
export function isCoreEcosystem(type: string | null): boolean {
	return type === 'core' || (type?.toLowerCase().includes('corepass') ?? false);
}

/** Display name for the wallet: EIP-6963 info.name (CorePass etc.), or "CorePass" for core ecosystem, or type. */
function getWalletDisplayNameFromType(type: string | null, selectedDetail: EIP6963ProviderDetail | null): string | null {
	if (selectedDetail) return selectedDetail.info.name;
	if (type) {
		const list = get(discoveredProviders);
		const d = list.find((x) => x.info.rdns === type || x.info.name === type);
		if (d) return d.info.name;
	}
	if (isCoreEcosystem(type)) return 'CorePass';
	return type ?? null;
}

const WALLET_AUTO_CONNECT_KEY = 'wallet_auto_connect';

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
	}
}

// Automatically login and connect wallet (only call when shouldAutoConnect() is true to avoid prompting every load)
export async function autoLogin() {
	await connectWallet(false, undefined, undefined, true);
}

/**
 * Connect to wallet. Prefers EIP-6963 discovered providers; falls back to legacy injection.
 * @param automessage - Show toast on error/no wallet.
 * @param messages - Optional toast strings.
 * @param selectedDetail - When multiple wallets exist, use this provider (e.g. from discoveredProviders + user pick).
 * @param isAutoConnect - When true, redirect only if redirect.onAutoConnect is true (default: no redirect on auto-connect).
 */
export async function connectWallet(
	automessage: boolean = true,
	messages?: Record<string, string>,
	selectedDetail?: EIP6963ProviderDetail,
	isAutoConnect?: boolean
) {
	const cfg = getWeb3Config();
	const { type, provider } = selectedDetail
		? { type: selectedDetail.info.rdns, provider: selectedDetail.provider }
		: detectProvider();
	try {
		const accounts = await requestAccounts(type ?? cfg.provider, provider);
		if (accounts && accounts.length > 0) {
			const resolvedType = type ?? cfg.provider ?? null;
			walletType.set(resolvedType);
			walletDisplayName.set(getWalletDisplayNameFromType(resolvedType, selectedDetail ?? null));
			walletAddress.set(accounts[0]);
			walletConnected.set(true);
			setWalletAutoConnect();
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
		toast.warning(messages?.walletNotConfigured ?? 'Wallet is not configured or returned no accounts.');
	} catch (error) {
		console.error('Wallet connection failed:', error);
		if (automessage) {
			toast.warning(messages?.walletCannotConnect ?? 'Cannot connect wallet.');
		}
		return;
	}

	if (!type && automessage) {
		if (browser && canOfferMobileWalletInstall()) {
			tryOpenWalletAppThenStore();
		} else {
			toast.warning(messages?.walletNotInstalled ?? 'No compatible wallet found.');
		}
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
