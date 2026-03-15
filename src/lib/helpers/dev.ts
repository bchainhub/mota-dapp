/**
 * Single source of truth for "dev-like" mode: local dev or Cloudflare Preview (DEV_MODE=1).
 * Treats import.meta.env.DEV as true when it is boolean true, number 1, or string '1'/'true'.
 */

import { dev } from '$app/environment';

function envDevTruthy(): boolean {
	if (typeof import.meta === 'undefined') return false;
	const d = import.meta.env?.DEV as unknown;
	if (d === true || d === 1) return true;
	if (typeof d === 'string') return d === '1' || d.toLowerCase() === 'true';
	return false;
}

/** True when running in development or dev-like environment (e.g. Cloudflare Preview with DEV_MODE=1). */
export const isDev = dev || envDevTruthy();
