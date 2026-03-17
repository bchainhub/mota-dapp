// Stub when typesafe-i18n is not installed. Replaced by typesafe-i18n when "Install translations" is used.
/* eslint-disable */
import { readable, writable } from 'svelte/store';
import type { Formatters, Locales, TranslationFunctions, Translations } from './i18n-types';
import { baseLocale, i18n } from './i18n-util';

const locale = writable<Locales>(baseLocale);
const LL = readable(i18n() as unknown as TranslationFunctions);
const setLocale = (l: Locales): void => locale.set(l);

export { locale, LL, setLocale };
export default LL;
