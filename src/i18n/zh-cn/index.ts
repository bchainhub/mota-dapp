import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const zhCNPartial: DeepPartial<Translation> = {
	common: {
		account: '账户',
		loading: '加载中…',
		error: '错误',
		success: '成功',
		cancel: '取消',
		confirm: '确认',
		close: '关闭',
		back: '返回',
		menu: '菜单',
		next: '下一步',
		submit: '提交',
		save: '保存',
		edit: '编辑',
		delete: '删除',
		logout: '退出',
		online: '在线',
		offline: '离线',
		theme: {
			light: '浅色',
			dark: '深色',
			system: '系统'
		}
	},

	helpers: {
		coreIdValidation: {
			error: '请输入有效的 Core ID',
			enterpriseError: '企业网络地址不能用于支付',
			requiredError: 'Core ID 为必填项'
		},
		wallet: {
			walletNotConfigured: '钱包未配置。',
			walletNotInstalled: '钱包未安装或未启用。',
			walletCannotConnect: '无法连接钱包。',
			walletConnected: '钱包已连接。',
			walletDisconnected: '钱包已断开连接。'
		}
	},

	navbar: {
		home: '首页',
		support: '支持',
		register: '注册',
		login: '登录',
		logout: '退出',
		connect: '连接',
		disconnect: '断开连接',
		profile: '个人资料',
		settings: '设置'
	},

	footer: {
		home: '首页',
		ecosystem: '生态系统',
		applications: '应用',
		developers: '开发者',
		contact: '联系',
		termsOfService: '服务条款',
		privacyPolicy: '隐私政策',
		keyRegistry: '密钥注册表',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},
	content: {}
};

const zhCN: Translation = deepMergeDict(en as any, zhCNPartial as DeepPartial<Translation>);
export default zhCN;
