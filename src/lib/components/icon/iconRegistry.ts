import type { Component } from 'svelte';
import { House, Languages } from 'lucide-svelte';

/**
 * Keys: lowercase kebab-case Lucide stems. Config `icon` must use the same.
 */
export const iconComponents: Record<string, Component> = {
    'languages': Languages as unknown as Component,
	'house': House as unknown as Component
};

export function resolveIconComponent(name: string): Component | undefined {
	return iconComponents[name.trim().toLowerCase()];
}
