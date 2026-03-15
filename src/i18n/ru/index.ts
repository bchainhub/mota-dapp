import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const ruPartial: DeepPartial<Translation> = {
	site: {
		description: 'MOTA',
		keywords: 'mota, sveltekit, dapp, blockchain, moneyx, paypass, ican, payto, oric, corepass, txms'
	},

	common: {
		account: 'Аккаунт',
		loading: 'Загрузка…',
		error: 'Ошибка',
		success: 'Успешно',
		cancel: 'Отмена',
		confirm: 'Подтвердить',
		close: 'Закрыть',
		back: 'Назад',
		menu: 'Меню',
		next: 'Далее',
		submit: 'Отправить',
		save: 'Сохранить',
		edit: 'Редактировать',
		delete: 'Удалить',
		logout: 'Выйти',
		online: 'В сети',
		offline: 'Не в сети',
		theme: {
			light: 'Светлая',
			dark: 'Тёмная',
			system: 'Системная'
		},
		keys: {
			keyRegistry: 'Реестр ключей',
			welcome: 'Добро пожаловать в Реестр ключей. Здесь вы можете найти все виды ключей для наших сервисов.',
			keyTypes: 'Типы ключей',
			keyTypeRegistry: 'Реестр ключей {key}',
			welcomeTypeRegistry: 'Реестр для ключей {key}. Здесь вы можете найти все ключи, используемые в наших сервисах.',
			keyTypeInfo: 'Типы ключей',
			publicKeyFor: 'Публичный ключ для {keyName}',
			keyId: 'ID ключа: {keyId}',
			copyKey: 'Копировать ключ',
			downloadKey: 'Скачать {keyName}',
			viewOnKeyServer: 'Посмотреть на сервере ключей'
		}
	},

	helpers: {
		keys: {
			copiedToClipboard: 'Ключ скопирован в буфер обмена',
			failedToCopy: 'Не удалось скопировать ключ'
		},
		coreIdValidation: {
			error: 'Пожалуйста, введите корректный Core ID',
			enterpriseError: 'Адреса корпоративной сети не могут использоваться для платежей',
			requiredError: 'Core ID обязателен для заполнения'
		},
		wallet: {
			walletNotConfigured: 'Кошелёк не настроен.',
			walletNotInstalled: 'Кошелёк не установлен или не включён.',
			walletCannotConnect: 'Не удаётся подключить кошелёк.',
			walletConnected: 'Кошелёк подключён.',
			walletDisconnected: 'Кошелёк отключён.'
		}
	},

	navbar: {
		home: 'Главная',
		support: 'Поддержка',
		register: 'Регистрация',
		login: 'Войти',
		logout: 'Выйти',
		connect: 'Подключить',
		disconnect: 'Отключить',
		profile: 'Профиль',
		settings: 'Настройки'
	},

	footer: {
		home: 'Главная',
		ecosystem: 'Экосистема',
		applications: 'Приложения',
		developers: 'Разработчикам',
		contact: 'Контакты',
		allianceMember: 'Член PayTo альянса',
		termsOfService: 'Условия обслуживания',
		privacyPolicy: 'Политика конфиденциальности',
		keyRegistry: 'Реестр ключей',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},

	content: {}
};

const ru: Translation = deepMergeDict(en as any, ruPartial as DeepPartial<Translation>);
export default ru;
