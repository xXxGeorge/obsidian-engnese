import type { EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import type { SyntaxNodeRef } from "@lezer/common";
import type { PinyinCompletionSettings } from "../settings";

function hasOddUnescapedDelimiters(text: string, delimiter: string): boolean {
	let count = 0;
	for (let i = 0; i < text.length; i++) {
		if (text[i] === delimiter && text[i - 1] !== "\\") {
			count++;
		}
	}
	return count % 2 === 1;
}

function inInlineCode(linePrefix: string): boolean {
	const tripleTicks = (linePrefix.match(/```/g) ?? []).length;
	if (tripleTicks > 0) {
		return false;
	}
	return hasOddUnescapedDelimiters(linePrefix, "`");
}

function inInlineMath(linePrefix: string): boolean {
	return hasOddUnescapedDelimiters(linePrefix, "$");
}

export function isContextBlocked(
	state: EditorState,
	pos: number,
	settings: PinyinCompletionSettings,
): boolean {
	const line = state.doc.lineAt(pos);
	const linePrefix = line.text.slice(0, pos - line.from);

	if (settings.disableInInlineCode && inInlineCode(linePrefix)) {
		return true;
	}

	if (settings.disableInMath && inInlineMath(linePrefix)) {
		return true;
	}

	const tree = syntaxTree(state);
	let blocked = false;
	tree.iterate({
		from: pos,
		to: pos,
		enter(node: SyntaxNodeRef) {
			const name = node.name.toLowerCase();
			if (settings.disableInCodeBlock && (name.includes("codeblock") || name.includes("fencedcode"))) {
				blocked = true;
				return false;
			}
			if (settings.disableInMath && name.includes("math")) {
				blocked = true;
				return false;
			}
			return undefined;
		},
	});

	return blocked;
}
