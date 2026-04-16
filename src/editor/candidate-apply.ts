import { startCompletion } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import type { LookupCandidate } from "../types";

export interface ApplyCandidateOptions {
	replaceTo?: number;
	trailingInsert?: string;
}

export function applyCandidateReplacement(
	view: EditorView,
	tokenFrom: number,
	tokenText: string,
	candidate: LookupCandidate,
	options: ApplyCandidateOptions = {},
): void {
	const consumeTo = tokenFrom + candidate.consumeTextLength;
	const suffix = tokenText.slice(candidate.consumeTextLength);
	const replaceTo = options.replaceTo ?? (tokenFrom + tokenText.length);
	const insert = `${candidate.text}${suffix}${options.trailingInsert ?? ""}`;
	const newCursor = tokenFrom + insert.length;

	view.dispatch({
		changes: {
			from: tokenFrom,
			to: Math.max(consumeTo, replaceTo),
			insert,
		},
		selection: {
			anchor: newCursor,
			head: newCursor,
		},
	});

	if (suffix.length > 0) {
		queueMicrotask(() => {
			startCompletion(view);
		});
	}
}
