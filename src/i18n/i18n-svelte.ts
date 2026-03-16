// Stub: no typesafe-i18n dependency. Replaced by typesafe-i18n when "Install translations" is used.
/* eslint-disable */
import { readable, writable } from 'svelte/store';
import type { Locales, TranslationFunctions, Translations } from './i18n-types';

export const locale = writable<Locales>('en');

/** Stub LL: any path resolves to a function that returns the key string (e.g. LL.footer.links.about() → "footer.links.about"). */
function makeLL(path: string[] = []): TranslationFunctions {
	return new Proxy(
		((..._args: unknown[]) => path.join('.')) as unknown as TranslationFunctions,
		{
			get(_, key: string) {
				if (typeof key !== 'string') return undefined;
				return makeLL(path.concat(key));
			}
		}
	);
}

/** Exported as a store so Svelte's $LL subscription and unsubscribe work during SSR. */
const llValue = makeLL() as unknown as Translations;
export const LL = readable(llValue);

export function setLocale(l: Locales): void {
	locale.set(l);
}

export default LL;
