export interface CandidateEntry {
	text: string;
	code: string;
	weight: number;
	source: string;
	score: number;
}

export interface LookupCandidate extends CandidateEntry {
	consumeNormalizedLength: number;
	consumeTextLength: number;
	exactMatch: boolean;
}

export interface TokenMatch {
	from: number;
	to: number;
	text: string;
}

export interface DictionaryCache {
	version: number;
	sourcePath: string;
	sourceMtimeMs: number;
	entries: Record<string, CandidateEntry[]>;
}

export const COMPLETION_PAGE_SIZE = 5;

export interface LookupResult {
	token: TokenMatch;
	candidates: LookupCandidate[];
}
