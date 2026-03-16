import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const skPartial: DeepPartial<Translation> = {
	site: {
		description: 'MOTA',
		keywords: 'mota, sveltekit, dapp, blockchain, moneyx, paypass, ican, payto, oric, corepass, txms'
	},

	common: {
		account: 'Účet',
		loading: 'Načítavam…',
		error: 'Chyba',
		success: 'Hotovo',
		cancel: 'Zrušiť',
		confirm: 'Potvrdiť',
		close: 'Zatvoriť',
		back: 'Späť',
		menu: 'Menu',
		next: 'Ďalej',
		submit: 'Odoslať',
		save: 'Uložiť',
		edit: 'Upraviť',
		delete: 'Zmazať',
		logout: 'Odhlásiť sa',
		online: 'Online',
		offline: 'Offline',
		theme: {
			light: 'Svetlá',
			dark: 'Tmavá',
			system: 'Systémová'
		}
	},

	helpers: {
		coreIdValidation: {
			error: 'Zadajte platné Core ID',
			enterpriseError: 'Adresy podnikovej siete nie je možné použiť na platby',
			requiredError: 'Core ID je povinné'
		},
		wallet: {
			walletNotConfigured: 'Peňaženka nie je nakonfigurovaná.',
			walletNotInstalled: 'Peňaženka nie je nainštalovaná alebo povolená.',
			walletCannotConnect: 'Nedá sa pripojiť k peňaženke.',
			walletConnected: 'Peňaženka pripojená.',
			walletDisconnected: 'Peňaženka odpojená.'
		}
	},

	navbar: {
		home: 'Domov',
		support: 'Podpora',
		register: 'Registrácia',
		login: 'Prihlásiť sa',
		logout: 'Odhlásiť sa',
		connect: 'Pripojiť sa',
		disconnect: 'Odpojiť sa',
		profile: 'Profil',
		settings: 'Nastavenia'
	},

	footer: {
		home: 'Domov',
		ecosystem: 'Ekosystém',
		applications: 'Aplikácie',
		developers: 'Vývojári',
		contact: 'Kontakt',
		termsOfService: 'Podmienky používania',
		privacyPolicy: 'Zásady ochrany súkromia',
		keyRegistry: 'Register kľúčov',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},

	content: {}
};

const sk: Translation = deepMergeDict(en as any, skPartial as DeepPartial<Translation>);
export default sk;
