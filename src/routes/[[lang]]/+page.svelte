<script lang="ts">
	import { Brain, Bot, BookSearch, Box, Code, Plug, Scroll } from 'lucide-svelte';
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
	<h1 class="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
		MOTA
	</h1>
	<p class="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mb-2">
		ĐApp framework for the multi-chain web
	</p>
	<p class="text-base text-gray-500 dark:text-gray-400 max-w-xl mb-12">
		Type-safe, extensible SvelteKit apps. Powered by ₡ore, multiple chains supported.
	</p>
	<a
		href="https://github.com/bchainhub/dapp-starter"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white! no-underline! hover:bg-emerald-700 transition-colors font-zephirum"
	>
		Get started 🚀
	</a>
</div>

<section class="max-w-5xl mx-auto px-4 py-12 md:py-20">
	<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
		Why MOTA
	</h2>
	<div class="grid gap-6 md:grid-cols-3">
		<div
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
			>
				<Code class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">SvelteKit at the core</h3>
			<p class="text-gray-600 dark:text-gray-400 text-sm">
				MOTA is a ĐApp framework built on <a href="https://kit.svelte.dev" target="_blank" rel="noopener noreferrer" class="underline">SvelteKit</a>. Fast, SSR-ready, and great DX out of the box.
			</p>
		</div>

		<div
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
			>
				<Scroll class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Core + multi-chain</h3>
			<p class="text-gray-600 dark:text-gray-400 text-sm">
				Runs on <strong>₡ore</strong> by default and supports multiple chains. One codebase, many networks.
			</p>
		</div>

		<div
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
			>
				<Plug class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Plugin system</h3>
			<p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
				Install addons with <code class="rounded bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 px-1.5 py-0.5 text-sm font-code">npx addon &lt;repo&gt; &lt;generator&gt; &lt;action&gt;</code>. Hygen-based generators add auth, features, or config without forking.
			</p>
			<a
				href="https://github.com/topics/mota-addon"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 no-underline hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			>
				<Box class="h-4 w-4 shrink-0" />
				Search for Addons
			</a>
		</div>
	</div>
</section>

<section class="max-w-5xl mx-auto px-4 py-12 md:py-16">
	<h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
		Skills & AI
	</h2>
	<div class="grid gap-6 md:grid-cols-2">
		<div
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
			>
				<Brain class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Agent skills</h3>
			<p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
				MOTA projects can use <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" class="underline">skills.sh</a>: reusable skill packs that AI agents (Cursor, Copilot, Continue) use to work with your stack. Add MOTA Skills, or any repo.
			</p>
			<pre class="overflow-x-auto rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-3 text-xs"><code>npx skills find   # discover skills · npx skills add owner/repo</code></pre>
		</div>
		<div
			class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm transition-shadow hover:shadow-md"
		>
			<div
				class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
			>
				<Bot class="h-5 w-5" />
			</div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI toolkit</h3>
			<p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
				AI support is via <strong>skills</strong>. Pick your agent (Copilot, Cursor, Continue) and add skill packs so assistants know your stack and conventions.
			</p>
			<a
				href="https://github.com/topics/mota-skills"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 no-underline hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
			>
				<BookSearch class="h-4 w-4 shrink-0" />
				Search for skills
			</a>
		</div>
	</div>
</section>

<section class="max-w-3xl mx-auto px-4 py-12 pb-20">
	<div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Quick start</h3>
		<p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
			Use the <a href="https://github.com/bchainhub/sveltekit-starter" target="_blank" rel="noopener noreferrer" class="underline">SvelteKit Starter</a> to create a MOTA project. It sets up SvelteKit, optional i18n, and the addon CLI.
		</p>
		<pre class="overflow-x-auto rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 text-sm"><code>npx github:bchainhub/sveltekit-starter</code></pre>
		<p class="text-gray-600 dark:text-gray-400 text-sm mt-4">
			Then install addons (e.g. Passkey, Support, Banking, Minting) with:
		</p>
		<pre class="overflow-x-auto rounded-lg bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 text-sm mt-2"><code>npx addon bchainhub@mota-addon-support support install</code></pre>
	</div>
</section>
