import type { EditorState } from "@codemirror/state";
import type { TokenMatch } from "../types";

const TOKEN_PATTERN = /[A-Za-z']+$/;

export function getTokenBeforeCursor(state: EditorState, pos: number): TokenMatch | null {
	const line = state.doc.lineAt(pos);
	const before = line.text.slice(0, pos - line.from);
	const match = before.match(TOKEN_PATTERN);
	if (!match?.[0]) {
		return null;
	}

	const text = match[0];
	return {
		from: pos - text.length,
		to: pos,
		text,
	};
}
