/**
 * Single source of truth for "dev-like" mode: local dev or Cloudflare Preview (DEV_MODE=1).
 */

import { dev } from '$app/env';

/** True when running in development or dev-like environment (e.g. Cloudflare Preview with DEV_MODE=1). */
export const isDev = dev || __DEV_MODE__;
