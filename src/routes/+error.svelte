<script lang="ts">
	import { ArrowRight, House, CircleAlert, MessageCircleQuestionMark, LifeBuoy } from 'lucide-svelte';
	import { page } from '$app/state';
	import { getSiteConfig } from '$lib/helpers/siteConfig';

	export const data = {};
	export let error: Error | null = null;
	const _cfg = getSiteConfig();
	const supportLink = _cfg?.url ? `mailto:support@${new URL(_cfg.url as string).hostname}` : undefined;
	const organizationName = (_cfg?.organizationName as string) ?? '';
	const projectName = (_cfg?.projectName as string) ?? '';
	const communityUrl = `https://github.com/${organizationName}/${projectName}`;
	$: status = page.status;

	// Navigation items for different error scenarios
	const getNavigations = () => {
		const commonItems = [
			{
				icon: House,
				title: 'Go back home',
				desc: 'Return to the main page of the website',
				href: '/'
			}
		];

		if (status === 404) {
			return [
				...commonItems,
				{
					icon: MessageCircleQuestionMark,
					title: 'Community',
					desc: 'Seek the right answers in our community',
					href: communityUrl
				},
				...(supportLink ? [{
					icon: LifeBuoy,
					title: 'Support',
					desc: 'Contact our support team for assistance by email',
					href: supportLink
				}] : [])
			];
		} else {
			return [
				...commonItems,
				{
					icon: CircleAlert,
					title: 'Report problem',
					desc: 'Let us know about this issue so we can fix it',
					href: `https://github.com/${organizationName}/${projectName}/issues`,
					target: '_blank'
				},
				...(supportLink ? [{
					icon: LifeBuoy,
					title: 'Support',
					desc: 'Contact our support team for assistance by email',
					href: supportLink
				}] : [])
			];
		}
	};

	const navigations = getNavigations();
</script>

<main>
	<div class="max-w-screen-xl mx-auto px-4 flex items-center justify-start min-h-screen md:px-8">
		<div class="max-w-lg mx-auto text-gray-600 dark:text-gray-300">
			<div class="space-y-3 text-center">
				<h3 class="text-primary-600 dark:text-primary-400 font-semibold">
					{status} Error
				</h3>
				<p class="text-gray-800 dark:text-gray-100 text-4xl font-semibold sm:text-5xl">
					{#if status === 404}
						Page not found
					{:else if status === 500}
						Server error
					{:else}
						Error occurred
					{/if}
				</p>
				<p class="text-gray-700 dark:text-gray-300">
					{#if status === 404}
						Sorry, the page you are looking for could not be found or has been removed.
					{:else if status === 500}
						We're having trouble processing your request.
					{:else}
						{error?.message || 'An unexpected error has occurred. Please try again later.'}
					{/if}
				</p>
			</div>
			<div class="mt-6">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each navigations as item, idx (idx)}
						<li class="flex gap-x-4 py-6">
							<div
								class="flex-none w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 flex items-center justify-center"
							>
								<svelte:component this={item.icon} class="w-6 h-6" />
							</div>
							<div class="space-y-1">
								<h4 class="text-gray-800 dark:text-gray-100 font-medium">{item.title}</h4>
								<p class="text-gray-600 dark:text-gray-300">
									{item.desc}
								</p>
								<a
									href={item.href}
									class="text-sm text-primary-600 dark:text-primary-400 duration-150 hover:text-primary-400 dark:hover:text-primary-300 font-medium inline-flex items-center gap-x-1"
								>
									{item.title === 'Report problem' ? 'Report issue' : 'Continue'}
									<ArrowRight class="w-4 h-4" />
								</a>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</main>
