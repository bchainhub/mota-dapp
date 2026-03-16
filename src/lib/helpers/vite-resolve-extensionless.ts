/**
 * Vite plugin helper: resolve extensionless ESM imports in node_modules for Deno/Node SSR.
 * e.g. lucide-svelte imports ./icons/index without .js; this resolves to ./icons/index.js.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

export function resolveExtensionlessPlugin(): Plugin {
	return {
		name: 'resolve-extensionless',
		enforce: 'pre',
		resolveId(id: string, importer: string | undefined) {
			if (!importer) return null;
			const norm = importer.startsWith('file:') ? fileURLToPath(importer) : importer;
			if (!norm.includes('lucide-svelte')) return null;
			if (id !== './icons/index' && id !== 'icons/index') return null;
			const dir = path.dirname(norm);
			const resolved = path.join(dir, id.startsWith('.') ? id : './' + id);
			return resolved.endsWith('.js') ? resolved : resolved + '.js';
		}
	};
}
