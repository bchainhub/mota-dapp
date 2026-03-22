import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import {
	getAvailableLocales,
	getFirstSegmentLocale,
	initLLForSsr,
	pathWithoutFirstLocale
} from '$lib/helpers/i18n';

import { getSiteConfig } from '$lib/helpers/siteConfig';
const languageConfig = getSiteConfig()?.language;
const available = getAvailableLocales();
const defaultLocale = languageConfig?.defaultLocale || 'en';

export const load: LayoutServerLoad = async ({ url, params, request, locals }) => {
	if (!languageConfig?.enabled) {
		locals.locale = defaultLocale;
		await initLLForSsr(defaultLocale);
		const session = locals.session;
		return {
			locale: defaultLocale,
			...(session !== undefined && { session })
		};
	}

	// 1) derive candidate locale from URL params
	let locale = params.lang ?? defaultLocale;

	// 2) if the first path segment is the default locale, redirect to path without it (locale only in first position)
	const firstSegment = getFirstSegmentLocale(url.pathname);
	if (firstSegment && firstSegment.toLowerCase() === defaultLocale.toLowerCase()) {
		const without = pathWithoutFirstLocale(url.pathname);
		throw redirect(302, `${without}${url.search}`);
	}

	// 3) final checks
	if (!available.includes(locale)) {
		// You could also redirect to default here
		throw error(404, 'Locale not supported');
	}

	locals.locale = locale;

	await initLLForSsr(locale);

	// Session is set in hooks (sessionHandle) only when passkey is enabled. Include in layout data only when we have it.
	const session = locals.session;
	const loggedIn = session != null && session.user != null;

	return {
		locale,
		fromUrl: !!params.lang,
		...(session !== undefined && { session })
	};
};
