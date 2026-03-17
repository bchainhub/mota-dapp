import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const esPartial: DeepPartial<Translation> = {
	common: {
		account: 'Cuenta',
		loading: 'Cargando…',
		error: 'Error',
		success: 'Éxito',
		cancel: 'Cancelar',
		confirm: 'Confirmar',
		close: 'Cerrar',
		back: 'Atrás',
		menu: 'Menú',
		next: 'Siguiente',
		submit: 'Enviar',
		save: 'Guardar',
		edit: 'Editar',
		delete: 'Eliminar',
		logout: 'Cerrar sesión',
		online: 'En línea',
		offline: 'Desconectado',
		theme: {
			light: 'Claro',
			dark: 'Oscuro',
			system: 'Sistema'
		}
	},

	helpers: {
		coreIdValidation: {
			error: 'Por favor introduce un Core ID válido',
			enterpriseError: 'Las direcciones de red empresarial no pueden usarse para pagos',
			requiredError: 'Core ID es obligatorio'
		},
		wallet: {
			walletNotConfigured: 'La billetera no está configurada.',
			walletNotInstalled: 'La billetera no está instalada o habilitada.',
			walletCannotConnect: 'No se puede conectar a la billetera.',
			walletConnected: 'Billetera conectada.',
			walletDisconnected: 'Billetera desconectada.'
		}
	},

	navbar: {
		home: 'Inicio',
		support: 'Soporte',
		register: 'Registrarse',
		login: 'Iniciar sesión',
		logout: 'Cerrar sesión',
		connect: 'Conectar',
		disconnect: 'Desconectar',
		profile: 'Perfil',
		settings: 'Configuración'
	},

	footer: {
		home: 'Inicio',
		ecosystem: 'Ecosistema',
		applications: 'Aplicaciones',
		developers: 'Desarrolladores',
		contact: 'Contacto',
		termsOfService: 'Términos de servicio',
		privacyPolicy: 'Política de privacidad',
		keyRegistry: 'Registro de claves',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},
	content: {}
};

const es: Translation = deepMergeDict(en as any, esPartial as DeepPartial<Translation>);
export default es;
