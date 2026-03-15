/**
 * Context for evaluating show rules (navbar/footer visibility).
 * loggedIn: user signed in (passkey or wallet). connected: wallet (web3) connected.
 * authIn: authenticator (passkey) signed in only. authOut: no passkey session (wallet state ignored).
 */
export type ShowRuleContext = {
	loggedIn: boolean;
	connected: boolean;
	authIn: boolean;
};

type Token = '(' | ')' | 'and' | 'or' | string;

/**
 * Evaluates a single term (identifier) against context.
 * Terms: always, hide, loggedIn, loggedOut, signedOut, connected, disconnected, authIn, authOut.
 * Unknown/invalid term is treated as always (shown).
 */
function evaluateTerm(term: string, ctx: ShowRuleContext): boolean {
	const t = term.trim().toLowerCase();
	if (t === 'always') return true;
	if (t === 'hide') return false;
	if (t === 'loggedin') return ctx.loggedIn;
	if (t === 'loggedout' || t === 'signedout') return !ctx.loggedIn;
	if (t === 'connected') return ctx.connected;
	if (t === 'disconnected') return !ctx.connected;
	if (t === 'authin') return ctx.authIn;
	if (t === 'authout') return !ctx.authIn;
	return true;
}

/** Tokenize: ( ) and or and identifiers (e.g. loggedin, connected). */
function tokenize(s: string): Token[] {
	const normalized = s.trim().toLowerCase().replace(/\s+/g, ' ');
	const tokens: Token[] = [];
	let i = 0;
	while (i < normalized.length) {
		if (normalized[i] === ' ') {
			i++;
			continue;
		}
		if (normalized[i] === '(') {
			tokens.push('(');
			i++;
			continue;
		}
		if (normalized[i] === ')') {
			tokens.push(')');
			i++;
			continue;
		}
		let word = '';
		while (i < normalized.length && /[a-z0-9_]/i.test(normalized[i])) {
			word += normalized[i];
			i++;
		}
		if (word.length > 0) {
			tokens.push(word);
		}
	}
	return tokens;
}

/**
 * Recursive-descent parser. Precedence: or (lowest) < and < term (parentheses, identifier).
 * Returns [result, nextIndex]. Throws on parse error.
 */
function parseOr(tokens: Token[], idx: number, ctx: ShowRuleContext): [boolean, number] {
	let left: boolean;
	[left, idx] = parseAnd(tokens, idx, ctx);
	while (idx < tokens.length && tokens[idx] === 'or') {
		idx++;
		let right: boolean;
		[right, idx] = parseAnd(tokens, idx, ctx);
		left = left || right;
	}
	return [left, idx];
}

function parseAnd(tokens: Token[], idx: number, ctx: ShowRuleContext): [boolean, number] {
	let left: boolean;
	[left, idx] = parseTerm(tokens, idx, ctx);
	while (idx < tokens.length && tokens[idx] === 'and') {
		idx++;
		let right: boolean;
		[right, idx] = parseTerm(tokens, idx, ctx);
		left = left && right;
	}
	return [left, idx];
}

function parseTerm(tokens: Token[], idx: number, ctx: ShowRuleContext): [boolean, number] {
	if (idx >= tokens.length) return [false, idx];
	if (tokens[idx] === '(') {
		idx++;
		const [result, next] = parseOr(tokens, idx, ctx);
		if (next >= tokens.length || tokens[next] !== ')') return [false, next];
		return [result, next + 1];
	}
	if (typeof tokens[idx] === 'string' && tokens[idx] !== 'and' && tokens[idx] !== 'or') {
		const value = evaluateTerm(tokens[idx] as string, ctx);
		return [value, idx + 1];
	}
	return [false, idx + 1];
}

/**
 * Evaluates a show rule string.
 * - undefined / null / empty / invalid → always shown.
 * - Terms: "always", "hide", "loggedIn", "loggedOut", "signedOut", "connected", "disconnected", "authIn" (passkey only), "authOut" (no passkey)
 * - Conjunction: "loggedIn and connected", "authIn and connected"
 * - Disjunction: "signedOut or disconnected"
 * - Grouping: "( loggedIn and connected ) or always", "hide or disconnected"
 * Precedence: "or" < "and"; use "()" to override. Normalizes: lowercase, collapse spaces.
 */
export function evaluateShowRule(show: string | undefined, context: ShowRuleContext): boolean {
	if (show === undefined || show === null) return true;
	const normalized = show.trim().toLowerCase().replace(/\s+/g, ' ');
	if (normalized === '') return true;

	const tokens = tokenize(normalized);
	if (tokens.length === 0) return true;
	const [result, next] = parseOr(tokens, 0, context);
	return next >= tokens.length ? result : true;
}
