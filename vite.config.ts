import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import type { Config } from 'vite-plugin-config';
import tailwindcss from '@tailwindcss/vite';
import { resolveExtensionlessPlugin } from './src/lib/helpers/vite-resolve-extensionless';
declare const process: { env: Record<string, string | undefined> };

// Language configuration
const languageConfig = {
	enabled: false,
	icon: 'languages',
	showName: false,
	availableLocales: [
		{ code: 'en', name: 'English' },
		{ code: 'ru', name: 'Русский' },
		{ code: 'sk', name: 'Slovenčina' }
	],
	defaultLocale: 'en',
	autoDetect: true
};

const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:5173'; // Site domain

// ─── Client config (no server-only keys; used in define and client bundles) ───
const siteConfigClient: Config = {
	title: 'MOTA ĐApp ₡ore', // Site title - keep `₡ore` if you want to let people know it's powered by Core Infra
	url: siteUrl,
	organizationName: 'bchainhub', // Organization name - In most cases it's your GitHub username
	projectName: 'sveltekit-mota', // Project name - In most cases it's your repo name
	favicon: '/img/icons/favicon.png', // Favicon path in static folder
	language: languageConfig,
	themeConfig: {
		navbar: {
			logo: {
				src: '/img/logo.svg', // Logo path in static folder
				srcDark: '/img/logo-dark.svg', // Logo path in static folder
				alt: 'MOTA' // Logo alt attribute
			},
			style: 'blur', // Navbar style (auto, blur, transparent)
			orientation: 'horizontal', // Navbar orientation (horizontal, vertical)
			hideOnScroll: false, // Hide navbar on scroll down
			iconExternal: true, // Icon for external links
			leftItemsPosition: 'center', // Left items position (left, center)
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
					label: 'navbar.repo',
					href: 'https://github.com/bchainhub/sveltekit-mota',
					position: 'left',
					icon: 'github'
				}
			]
		},
		footer: {
			style: 'transparent', // Footer style (auto, dark, light, transparent)
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
						{ label: 'footer.repo', href: 'https://github.com/bchainhub/sveltekit-mota', target: '_blank' },
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
					to: '/terms'
				},
				{
					label: 'footer.privacyPolicy',
					to: '/privacy'
				},
				{ label: 'footer.keyRegistry', to: '/keys' }
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
