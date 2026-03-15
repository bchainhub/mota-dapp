/**
 * Single accessor for client-safe site config (Option A).
 * __SITE_CONFIG__ is injected by Vite define (server-only keys stripped for security).
 * Parsed result is cached. Client and server both use getSiteConfig(); __SITE_CONFIG__ is injected via Vite define.
 */

import type { Config } from 'vite-plugin-config';

let cached: Config | undefined;

export function getSiteConfig(): Config | undefined {
	if (cached !== undefined) return cached;
	const raw = typeof __SITE_CONFIG__ !== 'undefined' ? __SITE_CONFIG__ : undefined;
	if (raw === undefined) return undefined;
	if (typeof raw === 'object' && raw !== null) {
		cached = raw as Config;
		return cached;
	}
	if (typeof raw === 'string') {
		try {
			cached = JSON.parse(raw) as Config;
			return cached;
		} catch {
			return undefined;
		}
	}
	return undefined;
}

/**
 * Returns true if the given API version is enabled.
 * Uses api.activeVersions: string (one version) or string[] (multiple). Comparison is case-insensitive.
 * If activeVersions is not defined, all versions are allowed. If api is omitted, reads from getSiteConfig()?.api.
 */
export function isApiVersionEnabled(version: string, api?: Config['api']): boolean {
	const raw = api?.activeVersions ?? getSiteConfig()?.api?.activeVersions;
	if (raw === undefined || raw === null) return true;
	const v = version.toLowerCase();
	if (typeof raw === 'string') return raw.toLowerCase() === v;
	return Array.isArray(raw) && raw.some((x) => String(x).toLowerCase() === v);
}
