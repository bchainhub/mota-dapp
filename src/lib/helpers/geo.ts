import * as privateDynamicEnv from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Retrieves and processes geographical data (country and city) from the platform or headers.
 * Supports Cloudflare Workers, Vercel, and Netlify platforms.
 * @param event - The RequestEvent object provided by SvelteKit.
 * @returns Nothing, but sets the country and city values in event.locals.
 */
export function getGeoData(event: RequestEvent): void {
	if (!event.platform && !event.request) {
		return;
	}
	const env = privateDynamicEnv?.env;
	// Cloudflare Workers: Access geographical data via platform.cf
	if (event.platform?.cf) {
		if (env?.CAPTURE_COUNTRY && event.platform.cf.country) {
			event.locals.country = event.platform.cf.country;
		}
		if (env?.CAPTURE_CITY && event.platform.cf.city) {
			event.locals.city = event.platform.cf.city;
		}
		return;
	}

	// Vercel: Access geographical data via headers
	const vercelCountry = event.request.headers.get('x-vercel-ip-country');
	const vercelCity = event.request.headers.get('x-vercel-ip-city');
	if (vercelCountry || vercelCity) {
		if (env?.CAPTURE_COUNTRY && vercelCountry) {
			event.locals.country = vercelCountry;
		}
		if (env?.CAPTURE_CITY && vercelCity) {
			event.locals.city = vercelCity;
		}
		return;
	}

	// Netlify: Access geographical data via headers
	const netlifyCountry = event.request.headers.get('x-nf-country');
	const netlifyCity = event.request.headers.get('x-nf-city');
	if (netlifyCountry || netlifyCity) {
		if (env?.CAPTURE_COUNTRY && netlifyCountry) {
			event.locals.country = netlifyCountry;
		}
		if (env?.CAPTURE_CITY && netlifyCity) {
			event.locals.city = netlifyCity;
		}
		return;
	}

	return;
}
