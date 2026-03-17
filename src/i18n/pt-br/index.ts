import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const ptBRPartial: DeepPartial<Translation> = {
	site: {
		description: 'MOTA',
		keywords: 'mota, sveltekit, dapp, blockchain, moneyx, paypass, ican, payto, oric, corepass, txms'
	},

	common: {
		account: 'Conta',
		loading: 'Carregando…',
		error: 'Erro',
		success: 'Sucesso',
		cancel: 'Cancelar',
		confirm: 'Confirmar',
		close: 'Fechar',
		back: 'Voltar',
		menu: 'Menu',
		next: 'Próximo',
		submit: 'Enviar',
		save: 'Salvar',
		edit: 'Editar',
		delete: 'Excluir',
		logout: 'Sair',
		online: 'Online',
		offline: 'Offline',
		theme: {
			light: 'Claro',
			dark: 'Escuro',
			system: 'Sistema'
		}
	},

	helpers: {
		coreIdValidation: {
			error: 'Por favor, insira um Core ID válido',
			enterpriseError: 'Endereços de rede corporativa não podem ser usados para pagamentos',
			requiredError: 'Core ID é obrigatório'
		},
		wallet: {
			walletNotConfigured: 'Carteira não configurada.',
			walletNotInstalled: 'Carteira não instalada ou não habilitada.',
			walletCannotConnect: 'Não foi possível conectar à carteira.',
			walletConnected: 'Carteira conectada.',
			walletDisconnected: 'Carteira desconectada.'
		}
	},

	navbar: {
		home: 'Início',
		support: 'Suporte',
		register: 'Registrar',
		login: 'Entrar',
		logout: 'Sair',
		connect: 'Conectar',
		disconnect: 'Desconectar',
		profile: 'Perfil',
		settings: 'Configurações'
	},

	footer: {
		home: 'Início',
		ecosystem: 'Ecossistema',
		applications: 'Aplicações',
		developers: 'Desenvolvedores',
		contact: 'Contato',
		termsOfService: 'Termos de Serviço',
		privacyPolicy: 'Política de Privacidade',
		keyRegistry: 'Registro de Chaves',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},
	content: {}
};

const ptBR: Translation = deepMergeDict(en as any, ptBRPartial as DeepPartial<Translation>);
export default ptBR;
