import { json } from '@sveltejs/kit';
import { handleOptions, withCorsHeaders } from '$lib/server/apiHandler';

// Handle OPTIONS requests for CORS
export const OPTIONS = handleOptions;

// Wrap your handler with the error handler
export const GET = async () => {
	const response = json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: import.meta.env.MODE || 'development',
		version: import.meta.env.VITE_APP_VERSION
	});

	return withCorsHeaders(response);
};
