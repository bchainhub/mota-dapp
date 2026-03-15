import { evaluateShowRule, type ShowRuleContext } from '$lib/helpers/showRule';

export type { ShowRuleContext };

/** Item with optional show visibility (navbar or footer). show: rule string, e.g. "loggedIn", "loggedIn and connected", "signedOut or disconnected". */
export type ItemWithShow = {
	show?: string;
	submenu?: ItemWithShow[] | unknown[];
	[key: string]: unknown;
};

/**
 * Returns whether an item should be shown for the current auth/connection state.
 * Uses evaluateShowRule for compound rules (and / or).
 */
export function shouldShowItem(item: ItemWithShow, context: ShowRuleContext): boolean {
	return evaluateShowRule(item.show, context);
}

/**
 * Filters navbar items (and their submenus) by show rule.
 * Items with submenus that become empty after filtering are excluded.
 */
export function filterNavItemsByShow<T extends ItemWithShow>(
	items: T[],
	context: ShowRuleContext
): T[] {
	return items
		.filter((item) => shouldShowItem(item, context))
		.map((item) => {
			if (!item.submenu || item.submenu.length === 0) return item;
			const filteredSub = filterNavItemsByShow(item.submenu as T[], context);
			if (filteredSub.length === 0) return null;
			return { ...item, submenu: filteredSub } as T;
		})
		.filter((item): item is T => item !== null);
}

/**
 * When auth is disabled, returns all items. When auth is enabled, filters by show rule (e.g. "loggedIn", "loggedIn and connected").
 */
export function filterNavItemsByAuth<T extends ItemWithShow>(
	items: T[],
	context: ShowRuleContext,
	authEnabled: boolean
): T[] {
	if (!authEnabled) return items;
	return filterNavItemsByShow(items, context);
}
