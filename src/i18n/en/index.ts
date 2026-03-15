import type { BaseTranslation } from '../i18n-types'

const en: BaseTranslation = {
	site: {
		description: 'MOTA',
		keywords: 'mota, sveltekit, dapp, blockchain, moneyx, paypass, ican, payto, oric, corepass, txms'
	},

	common: {
		account: 'Account',
		loading: 'Loading…',
		error: 'Error',
		success: 'Success',
		cancel: 'Cancel',
		confirm: 'Confirm',
		close: 'Close',
		back: 'Back',
		menu: 'Menu',
		next: 'Next',
		submit: 'Submit',
		save: 'Save',
		edit: 'Edit',
		delete: 'Delete',
		logout: 'Logout',
		online: 'Online',
		offline: 'Offline',
		theme: {
			light: 'Light',
			dark: 'Dark',
			system: 'System'
		},
		keys: {
			keyRegistry: 'Keys Registry',
			welcome: 'Welcome to the Keys Registry. Here you can find all types of keys for our services.',
			keyTypes: 'Key Types',
			keyTypeRegistry: '{key} Keys Registry',
			welcomeTypeRegistry: 'Registry for {key} keys. Here you can find all keys used in our services.',
			keyTypeInfo: 'Key Types',
			publicKeyFor: 'Public Key for {keyName}',
			keyId: 'Key ID: {keyId}',
			copyKey: 'Copy Key',
			downloadKey: 'Download {keyName}',
			viewOnKeyServer: 'View on Key Server'
		}
	},

	helpers: {
		keys: {
			copiedToClipboard: 'Key copied to clipboard',
			failedToCopy: 'Failed to copy key'
		},
		coreIdValidation: {
			error: 'Please enter a valid Core ID',
			enterpriseError: 'Enterprise network addresses cannot be used for payments',
			requiredError: 'Core ID is required'
		},
		wallet: {
			walletNotConfigured: 'Wallet is not configured.',
			walletNotInstalled: 'Wallet is not installed or enabled.',
			walletCannotConnect: 'Cannot connect to wallet.',
			walletConnected: 'Wallet connected.',
			walletDisconnected: 'Wallet disconnected.'
		}
	},

	navbar: {
		home: 'Home',
		support: 'Support',
		register: 'Register',
		login: 'Login',
		logout: 'Logout',
		connect: 'Connect',
		disconnect: 'Disconnect',
		profile: 'Profile',
		settings: 'Settings'
	},

	footer: {
		home: 'Home',
		ecosystem: 'Ecosystem',
		applications: 'Applications',
		developers: 'Developers',
		contact: 'Contact',
		allianceMember: 'PayTo Alliance Member',
		termsOfService: 'Terms of Service',
		privacyPolicy: 'Privacy Policy',
		keyRegistry: 'Key Registry',
		copyright: '© Copyright 2025-{year} MOTA'
	},

	modules: {},

	content: {}
};

export default en;
