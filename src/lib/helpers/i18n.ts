import { browser } from '$app/environment';
import { get, writable, type Writable } from 'svelte/store';
import { getStoredLocale, setStoredLocale } from '$lib/helpers/storageKeys';
import { getSiteConfig } from '$lib/helpers/siteConfig';
import { isLocale, loadedLocales } from '../../i18n/i18n-util';
import type { Locales } from '../../i18n/i18n-types';

const config = getSiteConfig()?.language;

/** Recursive type for LL: nested objects and/or functions returning string. Used when i18n-types (TranslationFunctions) is not available. */
export type LLType = { [key: string]: LLType | ((...args: any[]) => string) };

// -----------------------------
// locale / LL / setLocale (all in helper; when language disabled = print key + defaults)
// -----------------------------

function createKeyProxy(prefix = ''): unknown {
	return new Proxy(
		() => prefix || '(key)',
		{
			get(_, key: string) {
				if (key === 'then' || key === 'toJSON') return undefined;
				const path = prefix ? `${prefix}.${key}` : key;
				return createKeyProxy(path);
			}
		}
	);
}

export const locale = writable<string>('en');
/** Cast: recursive `LLType` does not narrow `$LL.modules.*` for TypeScript; runtime shape is still `LLType`. */
export const LL = writable(createKeyProxy() as LLType) as Writable<Record<string, any>>;

/** When language enabled: updates locale store. When disabled: no-op. When enabled, LL store is set in applyLocale after loading typesafe-i18n. */
function setLocaleDefault(l: string): void {
	if (config?.enabled) locale.set(l);
}
export const setLocale = setLocaleDefault;

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

/**
 * Matches the first path segment if it looks like a BCP 47 locale (e.g. en, pt-br, zh-Hans).
 * Language 2–3 letters; optional subtags 2–8 alphanumeric. Locale is always first in URL.
 */
const FIRST_SEGMENT_LOCALE_REGEX = /^\/[a-z]{2,3}(-[a-z0-9]{2,8})*(?=\/|$)/;

/**
 * Returns the first path segment if it looks like a locale, else null.
 */
export function getFirstSegmentLocale(pathname: string): string | null {
	const m = pathname.match(/^\/([a-z]{2,3}(-[a-z0-9]{2,8})*)(?=\/|$)/);
	return m ? m[1] : null;
}

/**
 * Returns pathname with the first segment stripped iff it matches a locale.
 * Use to remove any leading locale segment before prepending a new one.
 */
export function pathWithoutFirstLocale(pathname: string): string {
	return pathname.replace(FIRST_SEGMENT_LOCALE_REGEX, '') || '/';
}

/**
 * Builds the path for a locale switch: strip any locale in the first segment, then prepend newLocale if not default.
 * Ensures the locale is only in the first position (no …/th/pt-br/…).
 */
export function pathWithLocale(pathname: string, newLocale: string, defaultLocale: string): string {
	const without = pathWithoutFirstLocale(pathname);
	if (newLocale === defaultLocale) return without;
	return without === '/' ? `/${newLocale}` : `/${newLocale}${without}`;
}

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

// get available locales with names; when config.availableLocales is string[], names come from locale files via getLocaleDisplay
export const getAvailableLocalesWithNames = (): Array<{ code: string; name: string; icon?: string }> => {
	if (!config?.enabled) return [{ code: 'en', name: 'English' }];
	const locales = config?.availableLocales as string[] | Array<{ code: string; name?: string; icon?: string }> | undefined;
	if (!locales?.length) return [{ code: 'en', name: 'English' }];
	const codes = typeof locales[0] === 'string' ? (locales as string[]) : (locales as Array<{ code: string }>).map((l) => l.code);
	const withNames = typeof locales[0] === 'string'
		? (codes as string[]).map((code) => ({ code, name: code }))
		: (locales as Array<{ code: string; name?: string; icon?: string }>).map((loc) => ({
				code: loc.code,
				name: loc.name ?? loc.code,
				icon: loc.icon
		  }));
	return withNames;
};

// Locale display (name/icon from each locale's language.descriptiveName in src/i18n). Uses dynamic import to avoid circular deps.
type LocaleDisplay = { name: string; icon?: string };
const localeDisplayCache: Record<string, LocaleDisplay> = {};
const localeModules = import.meta.glob<{ default: { language?: { code?: string; descriptiveName?: string; name?: string; icon?: string } } }>(
	'../../i18n/*/index.ts'
);

export async function getLocaleDisplayAsync(code: string): Promise<LocaleDisplay> {
	if (localeDisplayCache[code]) return localeDisplayCache[code];
	const key = `../../i18n/${code}/index.ts`;
	const loader = localeModules[key];
	if (!loader) {
		localeDisplayCache[code] = { name: code };
		return localeDisplayCache[code];
	}
	try {
		const mod = await loader();
		const d = mod?.default;
		// Only use language block if it belongs to this locale (e.g. sk must have language.code === 'sk'). Otherwise merged base (e.g. en) would show for sk.
		if (d?.language?.code !== code) {
			localeDisplayCache[code] = { name: code };
			return localeDisplayCache[code];
		}
		localeDisplayCache[code] = {
			name: d.language.descriptiveName ?? d.language.name ?? code,
			icon: d.language.icon
		};
		return localeDisplayCache[code];
	} catch {
		localeDisplayCache[code] = { name: code };
		return localeDisplayCache[code];
	}
}

/** Sync fallback when locale was already loaded; otherwise returns code as name. Use getLocaleDisplayAsync for names from translation files. */
export function getLocaleDisplay(code: string): LocaleDisplay {
	return localeDisplayCache[code] ?? { name: code };
}

/** When config.availableLocales is string[], use this in onMount to get names/icons from locale files. */
export async function getAvailableLocalesWithNamesAsync(): Promise<Array<{ code: string; name: string; icon?: string }>> {
	const locales = config?.availableLocales as string[] | Array<{ code: string; name?: string; icon?: string }> | undefined;
	if (!config?.enabled || !locales?.length) return [{ code: 'en', name: 'English' }];
	const codes = typeof locales[0] === 'string' ? (locales as string[]) : (locales as Array<{ code: string }>).map((l) => l.code);
	if (typeof locales[0] !== 'string') {
		return (locales as Array<{ code: string; name?: string; icon?: string }>).map((loc) => ({
			code: loc.code,
			name: loc.name ?? loc.code,
			icon: loc.icon
		}));
	}
	return Promise.all(
		(codes as string[]).map(async (code) => ({ code, ...(await getLocaleDisplayAsync(code)) }))
	);
}

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
// - Uses i18n-svelte.setLocale() to reactively update $LL everywhere
export const applyLocale = async (localeToApply: string) => {
	if (!config?.enabled) return;

	if (browser) {
		try {
			const { loadLocaleAsync: loadAsync } = await import('../../i18n/i18n-util.async');
			await loadAsync(localeToApply as any);
		} catch {
			// i18n-util.async not available
		}
		setStoredLocale(localeToApply);
	}

	// Update local locale store (used by LanguageSwitcher via $localeStore)
	setLocale(localeToApply);

	if (!browser) return;
	await initLLForSsr(localeToApply);
};

/**
 * Load the locale dictionary and set `$LL` for the current SSR render (social crawlers, no JS).
 * Call once per request from `[[lang]]/+layout.server.ts` after the locale is known.
 */
export async function initLLForSsr(localeToApply: string): Promise<void> {
	if (!config?.enabled) return;
	try {
		const util = await import('../../i18n/i18n-util');
		const utilAsync = await import('../../i18n/i18n-util.async');
		if (util.isLocale(localeToApply)) {
			await utilAsync.loadLocaleAsync(localeToApply);
			LL.set(util.i18nObject(localeToApply) as unknown as LLType);
		}
	} catch {
		// typesafe-i18n or i18n folder not present; LL stays as proxy, t() returns keys
	}
}

// preload a locale dictionary into memory (used by layout load)
export const loadLocaleAsync = async (localeToLoad: string) => {
	if (!config?.enabled) return;
	try {
		const util = await import('../../i18n/i18n-util');
		const utilAsync = await import('../../i18n/i18n-util.async');
		if (util.isLocale(localeToLoad)) await utilAsync.loadLocaleAsync(localeToLoad);
	} catch {
		// typesafe-i18n or i18n folder not present
	}
};

/**
 * Load a locale dictionary and return a plain tree for {@link t} (previews, snippets, etc.).
 * Uses `loadedLocales` (raw strings), not `i18nObject` proxies: nested proxies do not work with
 * `key in object` traversal in {@link t}, so keys would render literally otherwise.
 */
export async function getLLForLocale(localeToApply: string): Promise<LLType> {
	if (!config?.enabled) {
		return get(LL);
	}
	try {
		const util = await import('../../i18n/i18n-util');
		const utilAsync = await import('../../i18n/i18n-util.async');
		const loc = util.isLocale(localeToApply) ? localeToApply : util.baseLocale;
		await utilAsync.loadLocaleAsync(loc);
		const dict = util.loadedLocales[loc];
		if (dict && typeof dict === 'object' && Object.keys(dict as object).length > 0) {
			return dict as unknown as LLType;
		}
		return get(LL);
	} catch {
		return get(LL);
	}
}

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
 * - When language is disabled: returns the key (print content).
 * - If the resolved value is a function -> calls it with vars.
 * - If it's a string -> returns it (with optional {vars} interpolation).
 * - If not found -> returns the key as a fallback.
 */
export function t(key: string, LL: Record<string, any>, vars?: Vars): string {
	if (!config?.enabled) return key;
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

/** Like t() but returns null instead of the key when the translation is missing. Useful for optional translations (e.g. currency names). */
export function torNot(key: string, LL: Record<string, any>, vars?: Vars): string | null {
	let cur: any = LL;
	for (const part of key.split('.')) {
		if (cur && part in cur) cur = cur[part];
		else return null;
	}

	if (typeof cur === 'function') {
		return cur(vars);
	}

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

	return null;
}

/**
 * RTL from each locale `language.rtl` in locale index files (`'true'` / `'false'`).
 * Call `loadLocale` from `i18n-util.sync` before this if the dictionary may not be loaded yet.
 * Unknown or missing value is treated as LTR (`false`).
 */
export function isRtlLocale(locale: string): boolean {
	if (!isLocale(locale)) return false;
	return loadedLocales[locale as Locales]?.language?.rtl === 'true';
}
