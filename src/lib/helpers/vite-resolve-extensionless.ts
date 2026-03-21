/**
 * Vite plugin helper: resolve extensionless ESM imports in node_modules for Deno/Node SSR.
 * e.g. lucide-svelte imports ./icons/index without .js; this resolves to ./icons/index.js.
 */
// @ts-expect-error
import path from 'node:path';
// @ts-expect-error
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

function stripVirtualAndQuery(importer: string): string {
	let p = importer.startsWith('file:') ? fileURLToPath(importer) : importer;
	if (p.startsWith('virtual-module:')) p = p.slice('virtual-module:'.length);
	const q = p.indexOf('?');
	if (q !== -1) p = p.slice(0, q);
	return p;
}

export function resolveExtensionlessPlugin(): Plugin {
	return {
		name: 'resolve-extensionless',
		enforce: 'pre',
		resolveId(id: string, importer: string | undefined) {
			if (!importer) return null;
			// Vite 8 / Rolldown pre-bundling scans lucide icon .svelte files as virtual IDs; `../Icon.svelte`
			// then fails to resolve. Point it at the real dist file.
			if (id === '../Icon.svelte') {
				const p = stripVirtualAndQuery(importer);
				const iconsSeg = `${path.sep}lucide-svelte${path.sep}dist${path.sep}icons${path.sep}`;
				const inLucideIcons =
					p.includes(iconsSeg) ||
					p.includes('/lucide-svelte/dist/icons/') ||
					p.includes('\\lucide-svelte\\dist\\icons\\');
				if (inLucideIcons && p.endsWith('.svelte')) {
					return path.normalize(path.join(path.dirname(p), '..', 'Icon.svelte'));
				}
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
