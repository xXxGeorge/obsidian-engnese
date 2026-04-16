import type { PinyinCompletionSettings } from "../settings";
import { COMPLETION_PAGE_SIZE, type CandidateEntry, type DictionaryCache, type LookupCandidate } from "../types";

function normalizeToken(token: string): string {
	return token.replace(/'/g, "").toLowerCase();
}

function consumedTextLength(token: string, consumeNormalizedLength: number): number {
	let normalizedCount = 0;
	for (let index = 0; index < token.length; index++) {
		if (token[index] !== "'") {
			normalizedCount++;
		}
		if (normalizedCount >= consumeNormalizedLength) {
			return index + 1;
		}
	}
	return token.length;
}

function scoreCandidate(entry: CandidateEntry, exactMatch: boolean): LookupCandidate {
	const exactLengthBonus = exactMatch ? 600 : 0;
	const multiSyllableBonus = entry.code.includes(" ") ? 300 : 0;
	const textLengthBonus = entry.text.length * 20;
	return {
		...entry,
		score: entry.weight + exactLengthBonus + multiSyllableBonus + textLengthBonus,
		consumeNormalizedLength: 0,
		consumeTextLength: 0,
		exactMatch,
	};
}

export class PinyinEngine {
	private settings: PinyinCompletionSettings;

	constructor(settings: PinyinCompletionSettings) {
		this.settings = settings;
	}

	updateSettings(settings: PinyinCompletionSettings): void {
		this.settings = settings;
	}

	lookup(token: string, cache: DictionaryCache | null): LookupCandidate[] {
		if (!cache) {
			return [];
		}
		const normalized = normalizeToken(token);
		if (!normalized) {
			return [];
		}

		let matchedKey: string | null = normalized;
		let exactMatch = true;
		let matched = cache.entries[normalized] ?? [];

		if (matched.length === 0) {
			exactMatch = false;
			matchedKey = null;
			for (let length = normalized.length - 1; length >= 1; length--) {
				const prefix = normalized.slice(0, length);
				const prefixCandidates = cache.entries[prefix];
				if (prefixCandidates?.length) {
					matchedKey = prefix;
					matched = prefixCandidates;
					break;
				}
			}
		}

		if (!matchedKey || matched.length === 0) {
			return [];
		}

		const textLength = consumedTextLength(token, matchedKey.length);
		return matched
			.map(candidate => {
				const scored = scoreCandidate(candidate, exactMatch);
				scored.consumeNormalizedLength = matchedKey.length;
				scored.consumeTextLength = textLength;
				return scored;
			})
			.sort((left, right) => right.score - left.score)
			.slice(0, COMPLETION_PAGE_SIZE * 10);
	}

	shouldAutoPopup(candidates: LookupCandidate[]): boolean {
		return candidates.length > 0;
	}
}
