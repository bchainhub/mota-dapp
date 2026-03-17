import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const jaPartial: DeepPartial<Translation> = {
	common: {
		account: 'アカウント',
		loading: '読み込み中…',
		error: 'エラー',
		success: '成功',
		cancel: 'キャンセル',
		confirm: '確認',
		close: '閉じる',
		back: '戻る',
		menu: 'メニュー',
		next: '次へ',
		submit: '送信',
		save: '保存',
		edit: '編集',
		delete: '削除',
		logout: 'ログアウト',
		online: 'オンライン',
		offline: 'オフライン',
		theme: {
			light: 'ライト',
			dark: 'ダーク',
			system: 'システム'
		}
	},

	helpers: {
		coreIdValidation: {
			error: '有効な Core ID を入力してください',
			enterpriseError: '企業ネットワークアドレスは支払いに使用できません',
			requiredError: 'Core ID は必須です'
		},
		wallet: {
			walletNotConfigured: 'ウォレットが設定されていません。',
			walletNotInstalled: 'ウォレットがインストールまたは有効化されていません。',
			walletCannotConnect: 'ウォレットに接続できません。',
			walletConnected: 'ウォレット接続済み。',
			walletDisconnected: 'ウォレットが切断されました。'
		}
	},

	navbar: {
		home: 'ホーム',
		support: 'サポート',
		register: '登録',
		login: 'ログイン',
		logout: 'ログアウト',
		connect: '接続',
		disconnect: '切断',
		profile: 'プロフィール',
		settings: '設定'
	},

	footer: {
		home: 'ホーム',
		ecosystem: 'エコシステム',
		applications: 'アプリケーション',
		developers: '開発者',
		contact: 'お問い合わせ',
		termsOfService: '利用規約',
		privacyPolicy: 'プライバシーポリシー',
		keyRegistry: 'キー登録',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},
	content: {}
};

const ja: Translation = deepMergeDict(en as any, jaPartial as DeepPartial<Translation>);
export default ja;
