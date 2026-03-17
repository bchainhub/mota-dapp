import { browser } from '$app/environment';
import { getStoredLocale, setStoredLocale } from '$lib/helpers/storageKeys';
import { getSiteConfig } from '$lib/helpers/siteConfig';

const config = getSiteConfig()?.language;

// -----------------------------
// Locale types
// -----------------------------

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends (...args: any) => any
		? T[K] // keep function signatures intact
		: T[K] extends object
			? DeepPartial<T[K]>
			: T[K];
};

// -----------------------------
// Deep merge helpers (exported)
// -----------------------------

/**
 * Deep-merge dictionaries: overlay overrides base; objects are merged; functions/strings overwrite.
 * Use for building a full locale dictionary from a DeepPartial overlay.
 */
export function deepMergeDict<T>(base: T, overlay: DeepPartial<T> | undefined): T {
	if (!overlay) return base;
	const out: any = Array.isArray(base) ? [] : { ...base };
	for (const key of Object.keys(overlay as any)) {
		const bv = (base as any)[key];
		const ov = (overlay as any)[key];
		if (
			bv &&
			ov &&
			typeof bv === 'object' &&
			typeof ov === 'object' &&
			!Array.isArray(bv) &&
			!Array.isArray(ov)
		) {
			out[key] = deepMergeDict(bv, ov);
		} else {
			out[key] = ov;
		}
	}
	return out as T;
}

// -----------------------------
// Locale utilities
// -----------------------------

// Fallback detectLocale function when typesafe-i18n is not available
const fallbackDetectLocale = (navigatorLanguage: string, availableLocales: string[]) => {
	// Simple fallback: try to match language code (e.g., 'en-US' -> 'en')
	const baseLanguage = navigatorLanguage.split('-')[0];
	return availableLocales.find(locale => locale.startsWith(baseLanguage)) || availableLocales[0];
};

// Smart detectLocale function that automatically detects and uses typesafe-i18n if available
export const detectLocale = async (navigatorLanguage: string, availableLocales: string[]) => {
	// Check if we're in a browser environment
	if (typeof window === 'undefined') {
		return fallbackDetectLocale(navigatorLanguage, availableLocales);
	}

	// Try to dynamically load typesafe-i18n using a runtime approach
	try {
		// Use a dynamic import with a string that Vite won't analyze statically
		const moduleName = 'typesafe-i18n/detectors';
		const module = await import(/* @vite-ignore */ moduleName);

		if (module && typeof module.detectLocale === 'function') {
			return module.detectLocale(navigatorLanguage, availableLocales);
		}
	} catch (error) {
		// typesafe-i18n not available, fall back to backup implementation
	}

	// Fallback to our simple implementation
	return fallbackDetectLocale(navigatorLanguage, availableLocales);
};

// get available locales from config (supports string[] or Array<{ code: string }>)
export const getAvailableLocales = (): string[] => {
	if (!config?.enabled) return ['en'];
	const locales = config?.availableLocales as string[] | Array<{ code: string }> | undefined;
	if (!locales?.length) return ['en'];
	return typeof locales[0] === 'string'
		? (locales as string[])
		: (locales as Array<{ code: string }>).map((loc) => loc.code);
};

// get available locales with names; when config.availableLocales is string[], names come from caller via getLocaleDisplay ($lang/locale-display)
export const getAvailableLocalesWithNames = (): Array<{ code: string; name: string; icon?: string }> => {
	if (!config?.enabled) return [{ code: 'en', name: 'English' }];
	const locales = config?.availableLocales as string[] | Array<{ code: string; name?: string }> | undefined;
	if (!locales?.length) return [{ code: 'en', name: 'English' }];
	const codes = typeof locales[0] === 'string' ? (locales as string[]) : (locales as Array<{ code: string }>).map((l) => l.code);
	// When config is string[], caller should use getLocaleDisplay for names; we return code as name
	const withNames = typeof locales[0] === 'string'
		? (codes as string[]).map((code) => ({ code, name: code }))
		: (locales as Array<{ code: string; name?: string }>).map((loc) => ({
				code: loc.code,
				name: loc.name ?? loc.code
		  }));
	return withNames;
};

// get the current locale
export const getLocale = (): string => {
	if (!config?.enabled) return 'en';
	if (browser) {
		return getStoredLocale() || config?.defaultLocale || 'en';
	}
	return config?.defaultLocale || 'en';
};

// set the active locale for $LL (and persist in localStorage on browser)
// - Ensures base + active dictionaries are loaded on the client before switching
export const applyLocale = async (locale: string) => {
	if (!config?.enabled) return;

	if (browser) {
		try {
			// Try to load the async i18n utilities if they exist
			// @ts-ignore - i18n-util.async may not exist if translations are not set up
			const { loadLocaleAsync } = await import('$lang/i18n-util.async');
			await loadLocaleAsync(locale as any);
		} catch (error) {
			// If i18n-util.async doesn't exist, we're not using translations
		}
		setStoredLocale(locale);
	}

	const { setLocale: i18nSetLocale } = await import('$lang/i18n-svelte');
	i18nSetLocale(locale as any);
};

// preload a locale dictionary into memory (used by layout load)
export const loadLocaleAsync = async (locale: string) => {
	if (!config?.enabled) return;
	try {
		// @ts-ignore - i18n-util.async may not exist if translations are not set up
		const { loadLocaleAsync } = await import('$lang/i18n-util.async');
		await loadLocaleAsync(locale as any);
	} catch (error) {
		// If i18n-util.async doesn't exist, we're not using translations
	}
};

// Layout load function for i18n
// - Preloads the active locale dictionary and the default (base) locale
// - Returns { locale } so +layout.svelte can apply it
export const createI18nLayoutLoad = () => {
	return async ({ params }: any) => {
		const locale = (params?.lang as any) || config?.defaultLocale || 'en';

		await loadLocaleAsync(locale);

		return { locale };
	};
};

// -----------------------------
// Simple translation helper: t(key, LL, vars?)
// -----------------------------

export type Vars = Record<string, string | number | boolean | null | undefined>;

/**
 * Resolve a dotted i18n key against $LL and (optionally) pass vars.
 * - If the resolved value is a function -> calls it with vars.
 * - If it's a string -> returns it (with optional {vars} interpolation).
 * - If not found -> returns the key as a fallback.
 */
export function t(key: string, LL: Record<string, any>, vars?: Vars): string {
	// navigate dotted path: 'footer.links.about' -> LL.footer.links.about
	let cur: any = LL;
	for (const part of key.split('.')) {
		if (cur && part in cur) cur = cur[part];
		else return key; // fallback: show the key when missing
	}

	// function-valued messages (normal in typesafe-i18n)
	if (typeof cur === 'function') {
		return cur(vars);
	}

	// plain string messages (less common, but supported)
	if (typeof cur === 'string') {
		if (vars) {
			let out = cur;
			for (const [k, v] of Object.entries(vars)) {
				out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v == null ? '' : String(v));
			}
			return out;
		}
		return cur;
	}

	// anything unexpected -> key fallback
	return key;
}
