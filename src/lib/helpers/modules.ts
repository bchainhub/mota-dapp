/**
 * Module enablement and loading from site config (vite.config.ts).
 * Request a module by name with loadModule('banking'); it checks enabled and imports; use the returned module directly.
 *
 * Universal rule for any module name:
 * - Submodule (e.g. "auth.passkey"): config.modules.parent is object, parent.enabled === true, parent[sub] is object.
 * - Top-level (e.g. "banking", "minting"): config.modules[module] is object, config.modules[module].enabled === true.
 * Module must reside in config.modules and be enabled.
 */

import { getSiteConfig } from '$lib/helpers/siteConfig';

/** Any module name. Use "parent.sub" for submodules (e.g. "auth.passkey"), or a single key for top-level (e.g. "banking"). */
export type ModuleName = string;

function parseModule(module: string): { parent: string; sub: string } | { parent: null; sub: null } {
	if (typeof module !== 'string' || !module.trim()) return { parent: null, sub: null };
	const dot = module.indexOf('.');
	if (dot < 0) return { parent: null, sub: null };
	const parent = module.slice(0, dot).trim();
	const sub = module.slice(dot + 1).trim();
	if (!parent || !sub) return { parent: null, sub: null };
	return { parent, sub };
}

/**
 * Primary auth module name from site config (vite.config.ts auth.primaryStrategy).
 * Defines which auth submodule is used: auth.<primaryStrategy.toLowerCase()> (e.g. auth.passkey).
 */
export function getPrimaryAuthModuleName(): string | undefined {
	const c = getSiteConfig();
	const mods = c?.modules as Record<string, unknown> | undefined;
	const auth = mods?.auth as { primaryStrategy?: string } | undefined;
	const primary = auth?.primaryStrategy;
	if (typeof primary !== 'string' || !primary.trim()) return undefined;
	return `auth.${primary.trim().toLowerCase()}`;
}

/**
 * Returns true when the given module resides in site config and is enabled.
 * Submodule ("auth.passkey"): config.parent is object, parent.enabled === true, parent[sub] is object.
 * Top-level ("banking"): config[module] is object, config[module].enabled === true.
 */
export function isModuleEnabled(module: ModuleName): boolean {
	const c = getSiteConfig();
	const mods = c?.modules as Record<string, unknown> | undefined;
	if (!mods || typeof mods !== 'object') return false;
	const parsed = parseModule(module);
	if (parsed.parent !== null) {
		const parent = mods[parsed.parent] as Record<string, unknown> | undefined;
		if (typeof parent !== 'object' || parent === null) return false;
		if (parent.enabled !== true) return false;
		const sub = parent[parsed.sub];
		return typeof sub === 'object' && sub !== null;
	}
	const key = module.trim();
	if (!key) return false;
	const m = mods[key] as { enabled?: boolean } | undefined;
	return typeof m === 'object' && m !== null && m.enabled === true;
}

/**
 * Returns the $modules path to the loadable module (auth, banking, minting live under $modules).
 * "auth.passkey" -> $modules/auth/passkey; "banking" -> $modules/banking.
 */
export function getModuleRoute(module: ModuleName): string {
	if (typeof module !== 'string' || !module.trim()) return '';
	const parsed = parseModule(module);
	if (parsed.parent !== null) {
		return `$modules/${parsed.parent}/${parsed.sub}`;
	}
	return `$modules/${module.trim()}`;
}

/**
 * Loads a module only when it is enabled. Path from getModuleRoute(module).
 * Client-safe: only index.ts entries (auth server entries are loaded via loadModuleServer in hooks).
 */
const moduleLoaders = import.meta.glob<Record<string, unknown>>('$modules/**/index.ts');

/** Path suffix for glob key match (e.g. 'auth/passkey/index.ts'). */
function getLoaderPathSuffix(module: ModuleName): string {
	const route = getModuleRoute(module);
	if (!route) return '';
	return route.replace(/^\$modules\/?/, '') + '/index.ts';
}

export async function loadModule(module: ModuleName): Promise<unknown | null> {
	if (!isModuleEnabled(module)) return null;
	const route = getModuleRoute(module);
	if (!route) return null;
	const key = `${route}/index.ts`;
	const suffix = getLoaderPathSuffix(module);
	let loader: (() => Promise<Record<string, unknown>>) | undefined = moduleLoaders[key];
	if (typeof loader !== 'function' && suffix) {
		const found = Object.entries(moduleLoaders).find(
			([k]) => k === key || k.endsWith(suffix) || k.replace(/\\/g, '/').endsWith(suffix)
		);
		loader = typeof found?.[1] === 'function' ? (found[1] as () => Promise<Record<string, unknown>>) : undefined;
	}
	if (typeof loader !== 'function') return null;
	try {
		const m = await loader();
		return m && typeof m === 'object' ? m : null;
	} catch {
		return null;
	}
}
