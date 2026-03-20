// Polyfill for global object in browser environment
const g = globalThis as typeof globalThis & { global?: unknown };
if (typeof g.global === 'undefined') {
	g.global = globalThis;
}
