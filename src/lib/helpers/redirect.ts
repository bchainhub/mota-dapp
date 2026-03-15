/**
 * Redirect URL after auth actions (login, register, connect, disconnect).
 * Query param is preferred over config fallback (same-origin path only).
 */

/** Default query param name for redirect URL (login, register, connect, disconnect). */
export const REDIRECT_QUERY_DEFAULT = 'redirect';

/**
 * Options for building the redirect URL.
 * @property keepOtherQueryParams - If true (default), copy other query params from the current URL into the redirect URL. The redirect param itself is always stripped to avoid loops.
 */
export interface GetRedirectToOptions {
	keepOtherQueryParams?: boolean;
}

/**
 * Returns the URL to redirect to after an auth action.
 * Priority: 1) query param (valid same-origin path), 2) configFallback.
 * Normalizes: if the query value does not start with `/`, a leading `/` is added.
 * Security: rejects values that start with `//` (protocol-relative / open redirect).
 * The redirect query param (e.g. `redirect`) is always stripped from the result URL to prevent redirect loops.
 * @param configFallback - Optional fallback from site config (e.g. auth.passkey.redirect or auth.web3.redirect.connect).
 * @param queryName - Query param to read. Default `red`.
 * @param options - Optional. `keepOtherQueryParams` (default true) keeps other current-URL query params in the redirect; false strips them.
 * @returns Full URL to redirect to, or undefined if no valid redirect.
 */
export function getRedirectTo(
	configFallback?: string,
	queryName: string = REDIRECT_QUERY_DEFAULT,
	options: GetRedirectToOptions = {}
): string | undefined {
	const { keepOtherQueryParams = true } = options;
	if (typeof window === 'undefined') return configFallback;
	const u = new URL(window.location.href);
	const fromQuery = u.searchParams.get(queryName);
	if (fromQuery == null) return configFallback;
	const trimmed = fromQuery.trim();
	if (!trimmed) return configFallback;
	const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
	if (path.startsWith('//')) return configFallback;
	const out = new URL(path, u.origin);
	if (keepOtherQueryParams) {
		for (const [key, value] of u.searchParams) {
			if (key !== queryName) out.searchParams.set(key, value);
		}
	}
	return out.toString();
}
