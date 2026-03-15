/**
 * Local storage key prefixes for app preferences.
 * Use prefixed keys to avoid collisions with other scripts on the same origin.
 */

export const MOTA_STORAGE_PREFIX = 'mota.';

/** Local storage key for locale (e.g. en, sk). */
export const STORAGE_KEY_LOCALE = `${MOTA_STORAGE_PREFIX}locale`;
/** Local storage key for color mode: 'light' | 'dark' | 'system'. */
export const STORAGE_KEY_THEME = `${MOTA_STORAGE_PREFIX}theme`;

const LEGACY_LOCALE = 'locale';
const LEGACY_THEME = 'theme';

/**
 * Reads a value from localStorage, migrating from legacy key if present and prefixed key is missing.
 * Removes the legacy key after migrating so next read uses the new key only.
 */
function getWithMigration(
	key: string,
	legacyKey: string
): string | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
	let value = localStorage.getItem(key);
	if (value != null) return value;
	value = localStorage.getItem(legacyKey);
	if (value != null) {
		localStorage.setItem(key, value);
		localStorage.removeItem(legacyKey);
		return value;
	}
	return null;
}

export function getStoredLocale(): string | null {
	return getWithMigration(STORAGE_KEY_LOCALE, LEGACY_LOCALE);
}

export function setStoredLocale(value: string): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_LOCALE, value);
	}
}

export function getStoredTheme(): string | null {
	return getWithMigration(STORAGE_KEY_THEME, LEGACY_THEME);
}

export function setStoredTheme(value: string): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_THEME, value);
	}
}

export function removeStoredTheme(): void {
	if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY_THEME);
		localStorage.removeItem(LEGACY_THEME);
	}
}
