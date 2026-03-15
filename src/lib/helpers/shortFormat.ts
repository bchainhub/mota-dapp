/**
 * Ellipsis character used for shortening (midline horizontal ellipsis U+22EF).
 */
const ELLIPSIS = '\u22EF';

export type ShortFormatKind = 'core' | 'wallet' | 'user';

/**
 * Shortens an identity string for display in the user dropdown.
 * - core: Core Blockchain (wallet = CorePass) — first 4 chars + ⋯ + last 4 chars (uppercase).
 * - wallet (other): first 4 chars after "0x" + ⋯ + last 4 chars (no uppercase).
 * - user: if length > 14 then first 4 + ⋯ + last 4 (no uppercase); if length === 44 then first 4 + ⋯ + last 4 (uppercase); otherwise return as-is.
 */
export function shortFormat(value: string, kind: ShortFormatKind): string {
	const s = value.trim();
	if (!s) return s;

	switch (kind) {
		case 'core': {
			if (s.length <= 8) return s.toUpperCase();
			const first = s.slice(0, 4).toUpperCase();
			const last = s.slice(-4).toUpperCase();
			return `${first}${ELLIPSIS}${last}`;
		}
		case 'wallet': {
			const rest = s.toLowerCase().startsWith('0x') ? s.slice(2) : s;
			if (rest.length <= 8) return s;
			const first = rest.slice(0, 4);
			const last = s.slice(-4);
			return `${first}${ELLIPSIS}${last}`;
		}
		case 'user': {
			if (s.length <= 14) return s;
			if (s.length === 44) {
				const first = s.slice(0, 4).toUpperCase();
				const last = s.slice(-4).toUpperCase();
				return `${first}${ELLIPSIS}${last}`;
			}
			const first = s.slice(0, 4);
			const last = s.slice(-4);
			return `${first}${ELLIPSIS}${last}`;
		}
		default:
			return s;
	}
}
