/**
 * Vite plugin helper: resolve extensionless ESM imports in node_modules for Deno/Node SSR.
 * e.g. lucide-svelte imports ./icons/index without .js; this resolves to ./icons/index.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

function stripVirtualAndQuery(importer: string): string {
	let p = importer.startsWith('file:') ? fileURLToPath(importer) : importer;
	if (p.startsWith('virtual-module:')) p = p.slice('virtual-module:'.length);
	const q = p.indexOf('?');
	if (q !== -1) p = p.slice(0, q);
	return p;
}

function importerIsLucideIconSvelte(importer: string): boolean {
	const p = stripVirtualAndQuery(importer);
	if (!p.includes('lucide-svelte')) return false;
	const posix = p.replace(/\\/g, '/');
	return posix.includes('/lucide-svelte/dist/icons/') && posix.endsWith('.svelte');
}

export function resolveExtensionlessPlugin(projectRoot: string): Plugin {
	const lucideIconSvelte = path.join(projectRoot, 'node_modules/lucide-svelte/dist/Icon.svelte');

	return {
		name: 'resolve-extensionless',
		enforce: 'pre',
		resolveId(id: string, importer: string | undefined) {
			if (!importer) return null;
			// Vite 8 / Rolldown: lucide icon modules are virtual; `../Icon.svelte` must map to the real file.
			if (id === '../Icon.svelte' && importerIsLucideIconSvelte(importer)) {
				if (fs.existsSync(lucideIconSvelte)) return lucideIconSvelte;
				const p = stripVirtualAndQuery(importer);
				return path.normalize(path.join(path.dirname(p), '..', 'Icon.svelte'));
			}
			const norm = importer.startsWith('file:') ? fileURLToPath(importer) : importer;
			if (!norm.includes('lucide-svelte')) return null;
			if (id !== './icons/index' && id !== 'icons/index') return null;
			const dir = path.dirname(norm);
			const resolved = path.join(dir, id.startsWith('.') ? id : './' + id);
			return resolved.endsWith('.js') ? resolved : resolved + '.js';
		}
	};
}
