/**
 * Server-only module loader. Loads auth submodules via server.ts (exports authHandle)
 * so that $env/dynamic/private and other server-only code never get into the client bundle.
 * Use this in hooks.server.ts for the primary auth handle.
 */

import type { ModuleName } from './modules';
import { getModuleRoute, isModuleEnabled } from './modules';

const authServerLoaders = import.meta.glob<Record<string, unknown>>('$modules/auth/**/server.ts');

export async function loadAuthModuleServer(module: ModuleName): Promise<unknown | null> {
	if (!isModuleEnabled(module)) return null;
	const parsed = module.indexOf('.');
	if (parsed < 0) return null;
	const route = getModuleRoute(module);
	if (!route) return null;
	const key = `${route}/server.ts`;
	const suffix = route.replace(/^\$modules\/?/, '') + '/server.ts';
	let loader: (() => Promise<Record<string, unknown>>) | undefined = authServerLoaders[key];
	if (typeof loader !== 'function') {
		const found = Object.entries(authServerLoaders).find(
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
