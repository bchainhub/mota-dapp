/**
 * Display names and icons for each locale, read from each locale's language.descriptiveName / language.icon.
 * Add imports and map entries when you add new locales (e.g. from mota-translations).
 */
import en from './en/index';

type Display = { name: string; icon?: string };

const map: Record<string, Display> = {
	en: {
		name: (en as { language?: { descriptiveName?: string } }).language?.descriptiveName ?? 'English',
		icon: (en as { language?: { icon?: string } }).language?.icon
	}
	// Add other locales when present, e.g.:
	// es: { name: (es as any).language?.descriptiveName ?? 'es', icon: (es as any).language?.icon },
};

export function getLocaleDisplay(code: string): Display {
	return map[code] ?? { name: code };
}
