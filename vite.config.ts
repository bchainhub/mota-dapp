// @ts-expect-error
import path from 'node:path';
// @ts-expect-error
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { Config } from 'vite-plugin-config';
import tailwindcss from '@tailwindcss/vite';
import { resolveExtensionlessPlugin } from './src/lib/helpers/vite-resolve-extensionless';

declare const process: { env: Record<string, string | undefined> };

/** Project root (vite.config.ts directory). Duplicates kit.alias so Vite/SSR resolves `$components/*` etc. reliably. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Language configuration: availableLocales as locale codes; names are read from each locale's language.descriptiveName in src/i18n
const languageConfig = {
	enabled: false,
	icon: 'languages',
	showName: false,
	availableLocales: ['en'],
	defaultLocale: 'en',
	autoDetect: true
};

const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:5173'; // Site domain

// ─── Client config (no server-only keys; used in define and client bundles) ───
const siteConfigClient: Config = {
	title: 'MOTA ĐApp | ₡ore', // Site title: split by "|" → [brand, poweredBy]; e.g. brand "MOTA ĐApp", powered by "₡ore"
	url: siteUrl,
	organizationName: 'bchainhub', // Organization name - In most cases it's your GitHub username
	projectName: 'mota-dapp', // Project name - In most cases it's your repo name
	favicon: '/img/icons/favicon.png', // Favicon path in static folder
	language: languageConfig,
	themeConfig: {
		navbar: {
			logo: {
				src: '/img/logo.svg', // Logo path in static folder
				srcDark: '/img/logo-dark.svg', // Shown in dark theme / auto when navbar is dark (blur=always; transparent=when dark; auto=when user light)
				alt: 'MOTA' // Logo alt attribute
			},
			style: 'blur', // Navbar style (auto, blur, transparent)
			orientation: 'horizontal', // Navbar orientation (horizontal, vertical)
			hideOnScroll: false, // Hide navbar on scroll down
			iconExternal: true, // Icon for external links
			itemsPosition: 'center', // Items position: side (left) or center
			// Use `to` for internal links; use string action keys for connect/disconnect (manualConnect, disconnectWallet).
			items: [
				// Navbar items
				{
					label: 'navbar.home',
					to: '/',
					position: 'left',
					icon: 'home'
				},
				{
					label: 'navbar.github',
					href: 'https://github.com/bchainhub/dapp-starter',
					target: '_blank',
					position: 'right',
					icon: 'github'
				}
			]
		},
		footer: {
			style: 'transparent', // Footer style (transparent, light, dark)
			logo: {
				src: '/img/logo-footer.svg', // Logo path in static folder
				alt: 'MOTA' // Logo alt attribute
			},
			iconExternal: true, // Icon for external links
			links: [
				// Footer links
				{
					title: 'footer.ecosystem',
					items: [
						{ label: 'footer.repo', href: 'https://github.com/bchainhub/mota-dapp', target: '_blank' },
					]
				},
				{
					title: 'footer.contact',
					items: [
						{ label: 'footer.emailContact', to: 'mailto:support@mota.mota' }
					]
				}
			],
			liner: [
				// Footer liner
				{
					label: 'footer.termsOfService',
					to: '/terms/service'
				},
				{
					label: 'footer.privacyPolicy',
					to: '/terms/privacy'
				},
				{
					label: 'footer.keyRegistry',
					to: '/keys',
					icon: 'key'
				},
				{
					label: 'footer.poweredBy',
					href: 'https://mota.dog',
					target: '_blank'
				}
			],
			copyright: 'footer.copyright' // Copyright text
		},
		metadata: [
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }, // Viewport meta tag
			{ name: 'theme-color', content: '#25c19f' }, // Theme color meta tag
			{ name: 'description', content: 'This is MOTA ĐApp website' }, // Description meta tag
			{ name: 'keywords', content: 'mota, website, sveltekit, vite' }, // Keywords meta tag
			{ property: 'og:type', content: 'website' }, // Open Graph type meta tag
		],
		colorMode: {
			defaultMode: 'dark', // Default color mode
			disableSwitch: false, // Disable color mode switch
			respectPrefersColorScheme: true // Respect browser color scheme preference
		}
	},
	api: {
		enabled: false
	},
	modules: {}
};

export default defineConfig({
	resolve: {
		alias: {
			$components: path.resolve(projectRoot, 'src/lib/components'),
			$data: path.resolve(projectRoot, 'src/data'),
			$modules: path.resolve(projectRoot, 'src/lib/modules')
		}
	},
	plugins: [
		resolveExtensionlessPlugin(),
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['/icons/favicon.svg', 'robots.txt', '/icons/apple-touch-icon.png'],
			workbox: {
				// SvelteKit does not output index.html in precache; disable default fallback to avoid "non-precached-url" error.
				navigateFallback: null
			},
			manifest: {
				name: 'MOTA',
				short_name: 'MOTA',
				description: 'MOTA ĐApp',
				theme_color: '#25c19f',
				icons: [
					{
						src: '/icons/192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icons/512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icons/512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			}
		})
	],
	define: {
		__SITE_CONFIG__: JSON.stringify(siteConfigClient),
		'import.meta.env.DEV': process.env.DEV_MODE === '1'
	},
	ssr: {
		noExternal: ['lucide-svelte']
	}
});
