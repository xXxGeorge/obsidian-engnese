import type { CandidateEntry, DictionaryCache } from "../types";

export const DICTIONARY_CACHE_VERSION = 1;

function compactCode(code: string): string {
	return code.replace(/\s+/g, "").toLowerCase();
}

export function buildDictionaryCache(
	sourcePath: string,
	sourceMtimeMs: number,
	entries: CandidateEntry[],
): DictionaryCache {
	const grouped = new Map<string, CandidateEntry[]>();

	for (const entry of entries) {
		const key = compactCode(entry.code);
		if (!key) {
			continue;
		}
		const list = grouped.get(key) ?? [];
		list.push({
			...entry,
			score: entry.weight,
		});
		grouped.set(key, list);
	}

	const normalizedEntries: Record<string, CandidateEntry[]> = {};
	for (const [key, list] of grouped.entries()) {
		normalizedEntries[key] = list
			.sort((left, right) => {
				if (right.weight !== left.weight) {
					return right.weight - left.weight;
				}
				if (right.text.length !== left.text.length) {
					return right.text.length - left.text.length;
				}
				return left.text.localeCompare(right.text, "zh-Hans-CN");
			})
			.slice(0, 64);
	}

	return {
		version: DICTIONARY_CACHE_VERSION,
		sourcePath,
		sourceMtimeMs,
		entries: normalizedEntries,
	};
}
