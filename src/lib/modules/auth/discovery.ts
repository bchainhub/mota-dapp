/** Core discovery is independent from Ethereum discovery. Metadata is self-attested. */
export interface WalletProvider {
	request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
	on?(event: string, listener: (...args: unknown[]) => void): void;
	removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}
export interface CoreProvider extends WalletProvider {
	on(event: string, listener: (...args: unknown[]) => void): void;
	removeListener(event: string, listener: (...args: unknown[]) => void): void;
}
export interface CIP6963ProviderInfo {
	uuid: string;
	name: string;
	icon: string;
	rdns: string;
}
export interface ProviderDetail {
	info: CIP6963ProviderInfo;
	provider: WalletProvider;
}
export interface CIP6963ProviderDetail extends ProviderDetail {
	provider: CoreProvider;
}

/** Validate the CID encoding and multihash length before constructing gateway URLs. */
function validCid(cid: string): boolean {
	if (cid.length > 256) return false;
	const base32 = cid.startsWith('b');
	const payload = cid.startsWith('Qm') ? cid : cid.slice(1);
	const alphabet = base32 ? 'abcdefghijklmnopqrstuvwxyz234567' : '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	if (!base32 && !cid.startsWith('Qm') && !cid.startsWith('z')) return false;
	let number = 0n;
	for (const character of payload) {
		const digit = alphabet.indexOf(character);
		if (digit < 0) return false;
		number = number * BigInt(alphabet.length) + BigInt(digit);
	}
	const bytes: number[] = [];
	if (base32) {
		const padding = (payload.length * 5) % 8;
		if (padding > 4 || (number & ((1n << BigInt(padding)) - 1n)) !== 0n) return false;
		number >>= BigInt(padding);
	}
	while (number > 0n) {
		bytes.unshift(Number(number & 255n));
		number >>= 8n;
	}
	let offset = 0;
	function varint(): number {
		let value = 0;
		for (let shift = 0; shift <= 28 && offset < bytes.length; shift += 7) {
			const byte = bytes[offset++];
			value += (byte & 127) * 2 ** shift;
			if (byte < 128) return value;
		}
		return -1;
	}
	if (cid.startsWith('Qm')) return bytes.length === 34 && bytes[0] === 18 && bytes[1] === 32;
	if (varint() !== 1 || varint() <= 0 || varint() < 0) return false;
	const length = varint();
	return length > 0 && length <= 128 && bytes.length - offset === length;
}

/** Return a safe image URL; invalid resources use the picker fallback. */
export function walletIconUrl(icon: unknown, gateway = 'https://ipf.sk/ipfs/'): string | null {
	if (typeof icon !== 'string' || icon.length > 262144) return null;
	if (/^data:image\/(?:webp|png|jxl|svg\+xml)(?:;[^,]*)?,/i.test(icon)) return icon;
	try {
		const url = new URL(icon);
		if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
		if (url.protocol !== 'ipfs:') return null;
		const resource = icon.slice(7);
		const [cid, ...segments] = resource.split('/');
		// CIDv0 SHA-256 multihash or CIDv1 base32/base58btc. Reject ambiguous paths.
		if (!validCid(cid)) return null;
		if (segments.some((part) => !/^[a-zA-Z0-9._~-]+$/.test(part) || part === '.' || part === '..')) return null;
		const base = new URL(gateway);
		if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) return null;
		return `${base.href.replace(/\/$/, '')}/${resource}`;
	} catch {
		return null;
	}
}

/** Validate and snapshot metadata without modifying or freezing the wallet's provider. */
export function validateAnnouncement(value: unknown, core: boolean): ProviderDetail | null {
	try {
		const detail = value as ProviderDetail;
		const info = detail?.info;
		const provider = detail?.provider;
		if (!info || !provider || typeof provider.request !== 'function') return null;
		if (core && (typeof provider.on !== 'function' || typeof provider.removeListener !== 'function')) return null;
		if (typeof info.uuid !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(info.uuid)) return null;
		if (typeof info.name !== 'string' || !info.name.trim() || info.name.length > 128) return null;
		if (typeof info.rdns !== 'string' || info.rdns.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(info.rdns)) return null;
		if (typeof info.icon !== 'string') return null;
		return { info: Object.freeze({ uuid: info.uuid.toLowerCase(), name: info.name, rdns: info.rdns, icon: walletIconUrl(info.icon) ? info.icon : '' }), provider };
	} catch {
		return null;
	}
}

/** Register before requesting; retain the listener for delayed injection. */
export function discoverWallets(target: Window, protocol: string | boolean, update: (detail: ProviderDetail) => void): () => void {
	const prefix = typeof protocol === 'boolean' ? (protocol ? 'cip6963' : 'eip6963') : protocol;
	if (!/^[a-z][a-z0-9-]*6963$/.test(prefix)) throw new Error('Invalid 6963 discovery namespace.');
	const seen = new Set<string>();
	const listener = (event: Event) => {
		const detail = validateAnnouncement((event as CustomEvent).detail, prefix === 'cip6963');
		if (!detail || seen.has(detail.info.uuid)) return;
		seen.add(detail.info.uuid);
		update(detail);
	};
	target.addEventListener(`${prefix}:announceProvider`, listener);
	target.dispatchEvent(new Event(`${prefix}:requestProvider`));
	return () => target.removeEventListener(`${prefix}:announceProvider`, listener);
}
