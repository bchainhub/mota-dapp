import { json } from '@sveltejs/kit';
import { handleOptions, withCorsHeaders } from '$lib/server/apiHandler';

export const OPTIONS = handleOptions;

export const GET = async () => {
	const response = json({
		status: 'ok',
		message: 'pong',
		timestamp: new Date().toISOString()
	});

	return withCorsHeaders(response);
};
