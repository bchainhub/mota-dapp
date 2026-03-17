import type { Translation } from '../i18n-types';
import type { DeepPartial } from '$lib/helpers/i18n';
import { deepMergeDict } from '$lib/helpers/i18n';
import en from '../en/index';

const thPartial: DeepPartial<Translation> = {
	common: {
		account: 'บัญชี',
		loading: 'กำลังโหลด…',
		error: 'ข้อผิดพลาด',
		success: 'สำเร็จ',
		cancel: 'ยกเลิก',
		confirm: 'ยืนยัน',
		close: 'ปิด',
		back: 'ย้อนกลับ',
		menu: 'เมนู',
		next: 'ถัดไป',
		submit: 'ส่ง',
		save: 'บันทึก',
		edit: 'แก้ไข',
		delete: 'ลบ',
		logout: 'ออกจากระบบ',
		online: 'ออนไลน์',
		offline: 'ออฟไลน์',
		theme: {
			light: 'สว่าง',
			dark: 'มืด',
			system: 'ระบบ'
		}
	},

	helpers: {
		coreIdValidation: {
			error: 'กรุณากรอก Core ID ที่ถูกต้อง',
			enterpriseError: 'ที่อยู่เครือข่ายองค์กรไม่สามารถใช้สำหรับการชำระเงินได้',
			requiredError: 'จำเป็นต้องระบุ Core ID'
		},
		wallet: {
			walletNotConfigured: 'ยังไม่ได้ตั้งค่ากระเป๋าเงิน',
			walletNotInstalled: 'ไม่ได้ติดตั้งหรือเปิดใช้งานกระเป๋าเงิน',
			walletCannotConnect: 'ไม่สามารถเชื่อมต่อกระเป๋าเงินได้',
			walletConnected: 'เชื่อมต่อกระเป๋าเงินแล้ว',
			walletDisconnected: 'ยกเลิกการเชื่อมต่อกระเป๋าเงินแล้ว'
		}
	},

	navbar: {
		home: 'หน้าแรก',
		support: 'ช่วยเหลือ',
		register: 'สมัครสมาชิก',
		login: 'เข้าสู่ระบบ',
		logout: 'ออกจากระบบ',
		connect: 'เชื่อมต่อ',
		disconnect: 'ตัดการเชื่อมต่อ',
		profile: 'โปรไฟล์',
		settings: 'การตั้งค่า'
	},

	footer: {
		home: 'หน้าแรก',
		ecosystem: 'ระบบนิเวศ',
		applications: 'แอปพลิเคชัน',
		developers: 'นักพัฒนา',
		contact: 'ติดต่อ',
		termsOfService: 'เงื่อนไขการให้บริการ',
		privacyPolicy: 'นโยบายความเป็นส่วนตัว',
		keyRegistry: 'ทะเบียนคีย์',
		copyright: '© 2025–{year} MOTA'
	},

	modules: {},
	content: {}
};

const th: Translation = deepMergeDict(en as any, thPartial as DeepPartial<Translation>);
export default th;
