import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { json } from '@sveltejs/kit';
import { ApiError } from '$lib/server/apiError';
import { getGeoData } from '$lib/helpers/geo';
import { getPrimaryAuthModuleName, isModuleEnabled } from '$lib/helpers/modules';
import { loadAuthModuleServer } from '$lib/helpers/modules.server';
import { getSiteConfig, isApiVersionEnabled } from '$lib/helpers/siteConfig';
import type { Config } from 'vite-plugin-config';

type ApiConfig = NonNullable<Config['api']>;

function getApiConfig(): ApiConfig | undefined {
	return getSiteConfig()?.api as ApiConfig | undefined;
}

/** Resolves Access-Control-Allow-Origin from config; default '*' if missing or not set. */
function getApiAllowOrigin(event: { request: Request }, api: ApiConfig | undefined): string {
	const raw = api?.allowOrigin;
	if (raw === undefined || raw === null) return '*';
	if (raw === '*') return '*';
	if (typeof raw === 'string') return raw;
	if (Array.isArray(raw) && raw.length > 0) {
		const origin = event.request.headers.get('Origin');
		if (origin && raw.includes(origin)) return origin;
		return raw[0];
	}
	return '*';
}

let authModuleCache: Promise<{ authHandle: Handle } | null> | null = null;

const authHandle: Handle = async ({ event, resolve }) => {
	const moduleName = getPrimaryAuthModuleName();
	if (!moduleName || !isModuleEnabled(moduleName)) return resolve(event);
	if (!authModuleCache) authModuleCache = loadAuthModuleServer(moduleName) as Promise<{ authHandle: Handle } | null>;
	const mod = await authModuleCache;
	return mod?.authHandle?.({ event, resolve }) ?? resolve(event);
};

const statusMessages: Record<number, string> = {
	400: 'Bad Request',
	401: 'Unauthorized',
	402: 'Payment Required',
	403: 'Forbidden',
	404: 'Not Found',
	405: 'Method Not Allowed',
	406: 'Not Acceptable',
	407: 'Proxy Authentication Required',
	408: 'Request Timeout',
	409: 'Conflict',
	410: 'Gone',
	411: 'Length Required',
	412: 'Precondition Failed',
	413: 'Payload Too Large',
	414: 'URI Too Long',
	415: 'Unsupported Media Type',
	416: 'Range Not Satisfiable',
	417: 'Expectation Failed',
	422: 'Unprocessable Entity',
	423: 'Locked',
	424: 'Failed Dependency',
	425: 'Too Early',
	426: 'Upgrade Required',
	428: 'Precondition Required',
	429: 'Too Many Requests',
	431: 'Request Header Fields Too Large',
	451: 'Unavailable For Legal Reasons',
	500: 'Internal Server Error',
	501: 'Not Implemented',
	502: 'Bad Gateway',
	503: 'Service Unavailable',
	504: 'Gateway Timeout',
	505: 'HTTP Version Not Supported',
	506: 'Variant Also Negotiates',
	507: 'Insufficient Storage',
	508: 'Loop Detected',
	510: 'Not Extended',
	511: 'Network Authentication Required'
};

const handleApi: Handle = async ({ event, resolve }) => {
	try {
		getGeoData(event);
	} catch (e) {
		// ignore error
	}
	try {

		// API routes bypass i18n/layout redirects
		if (event.url.pathname.startsWith('/api/')) {
			const api = getApiConfig();
			if (api?.enabled === false) {
				const allowOrigin = getApiAllowOrigin(event, api);
				return json(
					{ status: 'error', code: 404, message: 'API is disabled', timestamp: new Date().toISOString() },
					{ status: 404, headers: { 'Access-Control-Allow-Origin': allowOrigin } }
				);
			}
			const allowOrigin = getApiAllowOrigin(event, api);
			const apiVersion = (String((event.params as Record<string, string | undefined>)?.['version'] ?? '')).toLowerCase();
			if (!isApiVersionEnabled(apiVersion)) {
				return json(
					{
						status: 'error',
						code: 404,
						message: 'API version not enabled',
						timestamp: new Date().toISOString()
					},
					{ status: 404, headers: { 'Access-Control-Allow-Origin': allowOrigin } }
				);
			}
			const response = await resolve(event);
			// normalize API error responses
			if (response.status >= 400) {
				try {
					const data = await response.clone().json();
					if (data.status === 'error') {
						return json(data, {
							status: data.code,
							headers: {
								'Access-Control-Allow-Origin': allowOrigin,
								'X-API-Version': apiVersion
							}
						});
					}
				} catch {
					/* ignore non-JSON */
				}
			}

			// Add CORS to successful API response (resolve() may not include it)
			const headers = new Headers(response.headers);
			headers.set('Access-Control-Allow-Origin', allowOrigin);
			headers.set('X-API-Version', apiVersion);
			return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
		}

		// Non-API routes: let the [[lang]] layout handle i18n + redirects
		return resolve(event);
	} catch (error) {
		// Only wrap API errors here; non-API errors bubble to SvelteKit
		if (event.url.pathname.startsWith('/api/')) {
			const api = getApiConfig();
			const allowOrigin = getApiAllowOrigin(event, api);
			const apiVersion = (String((event.params as Record<string, string | undefined>)?.['version'] ?? '')).toLowerCase();
			if (error instanceof ApiError) {
				return json(
					{
						status: error.status,
						code: error.code,
						errorCode: error.errorCode,
						message: error.message,
						timestamp: new Date().toISOString()
					},
					{
						status: error.code,
						headers: {
							'Access-Control-Allow-Origin': allowOrigin,
							'X-API-Version': apiVersion
						}
					}
				);
			}

			const status = error instanceof ApiError ? error.code : 500;
			const message =
				error instanceof ApiError
					? error.message
					: (statusMessages[500] ?? 'Internal Server Error');

			return json(
				{
					status: 'error',
					code: status,
					message,
					timestamp: new Date().toISOString(),
					...(import.meta.env.MODE === 'development' && {
						error: error instanceof Error ? error.stack : String(error)
					})
				},
				{
					status,
					headers: {
						'Access-Control-Allow-Origin': allowOrigin,
						'X-API-Version': apiVersion
					}
				}
			);
		}

		throw error;
	}
};

export const handle = sequence(authHandle, handleApi);
