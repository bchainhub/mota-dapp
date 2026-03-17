/**
 * i18n formatters stub: no typesafe-i18n dependency.
 * Replaced by typesafe-i18n when "Install translations" is used.
 * Used by i18n-util.async and i18n-util.sync; extend with locale-specific formatters as needed.
 */
export type FormattersInitializer<L extends string, F> = (locale: L) => F;

/**
 * Returns a stub initFormatters that returns an empty formatters object.
 * Use when typesafe-i18n is not installed; real formatters come from typesafe-i18n when installed.
 */
export function createStubFormatters<L extends string, F extends Record<string, unknown>>(): FormattersInitializer<
	L,
	F
> {
	return (_locale: L): F => ({} as F);
}

/** Stub used by i18n-util.async and i18n-util.sync when formatters are in helpers. Replace with locale-specific formatters if needed. */
export function initFormatters(_locale: string): Record<string, unknown> {
	return {};
}
