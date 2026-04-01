<script lang="ts" context="module">
	import { getSiteConfig } from '$lib/helpers/siteConfig';
	const { style } = (getSiteConfig()?.themeConfig as { navbar?: { style?: string } } | undefined)?.navbar || {};

	export function toastType(type: string): string {
		if (style === 'blur') {
			return (
				{
					success: 'bg-emerald-800/70 dark:bg-emerald-300/70',
					error: 'bg-rose-800/70 dark:bg-rose-300/70',
					info: 'bg-sky-800/70 dark:bg-sky-300/70',
					warning: 'bg-amber-800/70 dark:bg-amber-300/70'
				}[type] || 'bg-slate-800/70 dark:bg-slate-300/70'
			);
		}
		return (
			{
				success: 'bg-emerald-800/90 dark:bg-emerald-300/90',
				error: 'bg-rose-800/90 dark:bg-rose-300/90',
				info: 'bg-sky-800/90 dark:bg-sky-300/90',
				warning: 'bg-amber-800/90 dark:bg-amber-300/90'
			}[type] || 'bg-slate-800/90 dark:bg-slate-300/90'
		);
	}

	export function getBlurBorderColor(type: string): string {
		return (
			{
				success: 'border border-emerald-400/50',
				error: 'border border-rose-400/50',
				info: 'border border-sky-400/50',
				warning: 'border border-amber-400/50'
			}[type] || 'border border-slate-400/50'
		);
	}
</script>

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { toasts, toast } from './toastStore';
	import { X } from 'lucide-svelte';

	function handleMouseEnter(id: string) {
		toast.pause(id);
	}

	function handleMouseLeave(id: string) {
		toast.resume(id);
	}

	function closeToast(id: string) {
		toast.remove(id);
	}
</script>

<div class="fixed bottom-4 end-4 z-20 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-2">
	{#each $toasts as { id, message, type = 'info', className } (id)}
		<div
			in:fade={{ duration: 150 }}
			out:fade={{ duration: 150 }}
			role="alert"
			class={`toast rounded-lg py-3 ps-4 pe-2 shadow-lg text-white dark:text-slate-800 font-medium text-sm ${style === 'blur' ? `backdrop-blur-md ${getBlurBorderColor(type)}` : ''} ${toastType(type)} ${className}`}
			on:mouseenter={() => handleMouseEnter(id)}
			on:mouseleave={() => handleMouseLeave(id)}
		>
			<div class="flex items-start gap-2">
				<span class="min-w-0 flex-1 text-start leading-snug">{message}</span>
				<button
					type="button"
					class="shrink-0 rounded-md p-1.5 hover:bg-white/20 dark:hover:bg-slate-800/30"
					on:click={() => closeToast(id)}
					aria-label="Close"
				>
					<X size={16} class="block" aria-hidden="true" />
				</button>
			</div>
		</div>
	{/each}
</div>
