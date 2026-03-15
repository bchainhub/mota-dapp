import type { Component } from 'svelte';

/** Cast injected icon for dynamic component tag (string icons use Icon name instead). */
export function asDynamicIcon(icon: unknown): Component {
	return icon as Component;
}
