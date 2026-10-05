import type { LayoutLoad } from './$types';
import { loadLocaleAsync } from '#lib/helpers/i18n.js';

export const load: LayoutLoad = async ({ data }) => {
	if (data?.locale) {
		await loadLocaleAsync(data.locale);
	}
	return { ...data };
};
