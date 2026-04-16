import {
	CompletionContext,
	CompletionResult,
} from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import { getTokenBeforeCursor } from "../editor/token-tracker";
import { isContextBlocked } from "../editor/context-guard";
import { applyCandidateReplacement } from "../editor/candidate-apply";
import type { PinyinEngine } from "../engine/pinyin-engine";
import type { PinyinCompletionSettings } from "../settings";
import type { DictionaryIndexStore } from "../dictionary/index-store";
import type { LookupCandidate } from "../types";

export interface AutocompleteEnvironment {
	getSettings(): PinyinCompletionSettings;
	getDictionaryStore(): DictionaryIndexStore;
	getPinyinEngine(): PinyinEngine;
}

function completionLabel(candidate: LookupCandidate): string {
	return `${candidate.text}`;
}

export function buildCompletionSource(env: AutocompleteEnvironment) {
	return (context: CompletionContext): CompletionResult | null => {
		const settings = env.getSettings();
		if (!settings.enabled) {
			return null;
		}

		const token = getTokenBeforeCursor(context.state, context.pos);
		if (!token) {
			return null;
		}
		if (isContextBlocked(context.state, context.pos, settings)) {
			return null;
		}

		const candidates = env.getPinyinEngine().lookup(token.text, env.getDictionaryStore().getCache());
		if (candidates.length === 0) {
			return null;
		}
		if (!context.explicit && !env.getPinyinEngine().shouldAutoPopup(candidates)) {
			return null;
		}

		return {
			from: token.from,
			to: token.to,
			filter: false,
			options: candidates.map(candidate => ({
				label: completionLabel(candidate),
				type: "text",
				detail: candidate.exactMatch ? candidate.code : `${candidate.code} (prefix)`,
				info: candidate.source,
				boost: candidate.score,
				apply(view: EditorView) {
					applyCandidateReplacement(view, token.from, token.text, candidate);
				},
			})),
		};
	};
}
