import { defineEnvVars } from '@sveltejs/kit/env';

// Declare addon environment settings here; only explicitly public settings reach the browser.
export const variables = defineEnvVars({
	CAPTURE_COUNTRY: { schema: (value) => value },
	CAPTURE_CITY: { schema: (value) => value }
});
