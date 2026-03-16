// Stub: no typesafe-i18n dependency. Replaced by typesafe-i18n when "Install translations" is used.
/* eslint-disable */
import type { Formatters, Locales, Translations, TranslationFunctions } from './i18n-types';

export const baseLocale: Locales = 'en';

export const locales: Locales[] = ['en', 'ru', 'sk'];

export const isLocale = (locale: string): locale is Locales => locales.includes(locale as Locales);

export const loadedLocales: Record<Locales, Translations> = {} as Record<Locales, Translations>;

export const loadedFormatters: Record<Locales, Formatters> = {} as Record<Locales, Formatters>;

/** Stub: shallow merge; real implementation from typesafe-i18n when installed. */
export const extendDictionary = <T>(base: T, overlay: Partial<T> | undefined): T =>
	overlay ? ({ ...base, ...overlay } as T) : base;

/** Stub: returns key as string; real from typesafe-i18n when installed. */
export const i18nString = (_locale: Locales): ((key: string) => string) => (key: string) => key;

/** Stub: returns object that resolves to key; real from typesafe-i18n when installed. */
export const i18nObject = (_locale: Locales): TranslationFunctions =>
	new Proxy(
		{} as TranslationFunctions,
		{
			get(_, key: string) {
				return () => key;
			}
		}
	);

/** Stub: returns proxy that resolves any path to key; real from typesafe-i18n when installed. */
export const i18n = (): Record<string, unknown> =>
	new Proxy(
		{} as Record<string, unknown>,
		{
			get(_, key: string) {
				if (key === 'then' || key === 'toJSON') return undefined;
				return new Proxy(
					() => key,
					{
						get(_, k: string) {
							return () => (typeof k === 'string' ? k : key);
						}
					}
				);
			}
		}
	);

/** Stub: returns baseLocale; real from typesafe-i18n/detectors when installed. */
export const detectLocale = (..._detectors: unknown[]): Locales => baseLocale;
