import {
	acceptCompletion,
	completionStatus,
	currentCompletions,
	moveCompletionSelection,
	selectedCompletionIndex,
	setSelectedCompletion,
} from "@codemirror/autocomplete";
import { Prec } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { COMPLETION_PAGE_SIZE, type LookupCandidate } from "../types";
import type { PinyinCompletionSettings } from "../settings";
import type { AutocompleteEnvironment } from "../ui/autocomplete-source";
import { getTokenBeforeCursor } from "./token-tracker";
import { isContextBlocked } from "./context-guard";
import { applyCandidateReplacement } from "./candidate-apply";

interface PendingDoubleSpaceSelection {
	candidate: LookupCandidate;
	tokenFrom: number;
	tokenText: string;
	firstSpaceFrom: number;
	firstSpaceTo: number;
	timestamp: number;
}

let pendingDoubleSpaceSelection: PendingDoubleSpaceSelection | null = null;

function isCompletionActive(view: EditorView): boolean {
	return completionStatus(view.state) === "active";
}

function acceptCompletionAtPageOffset(view: EditorView, offset: number): boolean {
	if (!isCompletionActive(view)) {
		return false;
	}

	const completions = currentCompletions(view.state);
	if (completions.length === 0) {
		return false;
	}

	const selectedIndex = selectedCompletionIndex(view.state) ?? 0;
	const currentPageStart = Math.floor(selectedIndex / COMPLETION_PAGE_SIZE) * COMPLETION_PAGE_SIZE;
	const targetIndex = currentPageStart + offset;
	if (targetIndex < 0 || targetIndex >= completions.length) {
		return false;
	}

	view.dispatch({
		effects: setSelectedCompletion(targetIndex),
	});
	return acceptCompletion(view);
}

function moveCompletionPage(view: EditorView, direction: -1 | 1): boolean {
	if (!isCompletionActive(view)) {
		return false;
	}

	const completions = currentCompletions(view.state);
	if (completions.length === 0) {
		return false;
	}

	const selectedIndex = selectedCompletionIndex(view.state) ?? 0;
	const currentPageStart = Math.floor(selectedIndex / COMPLETION_PAGE_SIZE) * COMPLETION_PAGE_SIZE;
	const nextPageStart = currentPageStart + (direction * COMPLETION_PAGE_SIZE);
	if (nextPageStart < 0 || nextPageStart >= completions.length) {
		return false;
	}

	view.dispatch({
		effects: setSelectedCompletion(nextPageStart),
	});
	return true;
}

function normalizeShortcut(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		return "";
	}

	const parts = trimmed.split("-").map(part => part.trim()).filter(Boolean);
	if (parts.length === 0) {
		return "";
	}

	const modifiers: string[] = [];
	let key = "";
	for (const part of parts) {
		const lower = part.toLowerCase();
		if (lower === "ctrl" || lower === "control") {
			if (!modifiers.includes("Ctrl")) {
				modifiers.push("Ctrl");
			}
			continue;
		}
		if (lower === "alt" || lower === "option") {
			if (!modifiers.includes("Alt")) {
				modifiers.push("Alt");
			}
			continue;
		}
		if (lower === "shift") {
			if (!modifiers.includes("Shift")) {
				modifiers.push("Shift");
			}
			continue;
		}
		if (lower === "meta" || lower === "cmd" || lower === "command") {
			if (!modifiers.includes("Meta")) {
				modifiers.push("Meta");
			}
			continue;
		}
		key = part.length === 1 ? part : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
	}

	return [...modifiers, key].filter(Boolean).join("-");
}

function eventShortcutVariants(event: KeyboardEvent): string[] {
	const modifiers: string[] = [];
	if (event.ctrlKey) {
		modifiers.push("Ctrl");
	}
	if (event.altKey) {
		modifiers.push("Alt");
	}
	if (event.shiftKey) {
		modifiers.push("Shift");
	}
	if (event.metaKey) {
		modifiers.push("Meta");
	}

	const variants = new Set<string>();
	const specialKeys: Record<string, string> = {
		Escape: "Escape",
		Esc: "Escape",
		Tab: "Tab",
	};
	const codeKeys: Record<string, string> = {
		Semicolon: ";",
		Quote: "'",
		Slash: "/",
		BracketLeft: "[",
		BracketRight: "]",
		Comma: ",",
		Period: ".",
	};

	const addVariant = (key: string): void => {
		if (!key) {
			return;
		}
		const normalizedKey = key.length === 1 ? key : (specialKeys[key] ?? key);
		variants.add([...modifiers, normalizedKey].join("-"));
	};

	addVariant(event.key);
	const codeKey = codeKeys[event.code];
	if (codeKey) {
		addVariant(codeKey);
	}

	return [...variants];
}

type ShortcutAction = "select1" | "select2" | "select3" | "select4" | "select5" | "prevPage" | "nextPage";

function resolveShortcutAction(
	event: KeyboardEvent,
	settings: PinyinCompletionSettings,
): ShortcutAction | null {
	const shortcuts = new Map<string, ShortcutAction>([
		[normalizeShortcut(settings.selectFirstKey), "select1"],
		[normalizeShortcut(settings.selectSecondKey), "select2"],
		[normalizeShortcut(settings.selectThirdKey), "select3"],
		[normalizeShortcut(settings.selectFourthKey), "select4"],
		[normalizeShortcut(settings.selectFifthKey), "select5"],
		[normalizeShortcut(settings.prevPageKey), "prevPage"],
		[normalizeShortcut(settings.nextPageKey), "nextPage"],
	]);

	for (const variant of eventShortcutVariants(event)) {
		const action = shortcuts.get(variant);
		if (action) {
			return action;
		}
	}

	return null;
}

function clearPendingDoubleSpaceSelection(): void {
	pendingDoubleSpaceSelection = null;
}

function captureDoubleSpaceSelection(view: EditorView, env: AutocompleteEnvironment): void {
	const settings = env.getSettings();
	if (!settings.enabled || !settings.doubleSpaceSelect) {
		clearPendingDoubleSpaceSelection();
		return;
	}

	const cursor = view.state.selection.main;
	if (!cursor.empty || isContextBlocked(view.state, cursor.head, settings)) {
		clearPendingDoubleSpaceSelection();
		return;
	}

	const token = getTokenBeforeCursor(view.state, cursor.head);
	if (!token) {
		clearPendingDoubleSpaceSelection();
		return;
	}

	const [candidate] = env.getPinyinEngine().lookup(token.text, env.getDictionaryStore().getCache());
	if (!candidate) {
		clearPendingDoubleSpaceSelection();
		return;
	}

	pendingDoubleSpaceSelection = {
		candidate,
		tokenFrom: token.from,
		tokenText: token.text,
		firstSpaceFrom: cursor.head,
		firstSpaceTo: cursor.head + 1,
		timestamp: Date.now(),
	};
}

function maybeApplyDoubleSpaceSelection(view: EditorView, settings: PinyinCompletionSettings): boolean {
	const pending = pendingDoubleSpaceSelection;
	if (!settings.doubleSpaceSelect || !pending) {
		return false;
	}

	if (Date.now() - pending.timestamp > settings.doubleSpaceTimeoutMs) {
		clearPendingDoubleSpaceSelection();
		return false;
	}

	const cursor = view.state.selection.main;
	if (!cursor.empty || cursor.head !== pending.firstSpaceTo) {
		clearPendingDoubleSpaceSelection();
		return false;
	}

	const firstSpace = view.state.doc.sliceString(pending.firstSpaceFrom, pending.firstSpaceTo);
	if (firstSpace !== " ") {
		clearPendingDoubleSpaceSelection();
		return false;
	}

	applyCandidateReplacement(view, pending.tokenFrom, pending.tokenText, pending.candidate, {
		replaceTo: pending.firstSpaceTo,
		trailingInsert: settings.keepSpaceAfterDoubleSpaceSelection ? " " : "",
	});
	clearPendingDoubleSpaceSelection();
	return true;
}

export function buildCompletionKeymap(env: AutocompleteEnvironment): Extension {
	return Prec.highest(keymap.of([
		{
			any(view, event) {
				const settings = env.getSettings();
				if (event.key === " ") {
					if (maybeApplyDoubleSpaceSelection(view, settings)) {
						event.preventDefault();
						event.stopPropagation();
						return true;
					}
					captureDoubleSpaceSelection(view, env);
					return false;
				}

				const action = resolveShortcutAction(event, settings);
				if (!action) {
					clearPendingDoubleSpaceSelection();
					return false;
				}
				if (!isCompletionActive(view)) {
					return false;
				}

				event.preventDefault();
				event.stopPropagation();

				switch (action) {
					case "select1":
						return acceptCompletionAtPageOffset(view, 0);
					case "select2":
						return acceptCompletionAtPageOffset(view, 1);
					case "select3":
						return acceptCompletionAtPageOffset(view, 2);
					case "select4":
						return acceptCompletionAtPageOffset(view, 3);
					case "select5":
						return acceptCompletionAtPageOffset(view, 4);
					case "prevPage":
						return moveCompletionPage(view, -1);
					case "nextPage":
						return moveCompletionPage(view, 1);
				}
			},
		},
		{
			key: "Tab",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-;",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-'",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-/",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-[",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-,",
			run(view) {
				return false;
			},
		},
		{
			key: "Ctrl-.",
			run(view) {
				return false;
			},
		},
		{
			key: "ArrowDown",
			run(view) {
				if (!isCompletionActive(view)) {
					return false;
				}
				return moveCompletionSelection(true)(view);
			},
		},
		{
			key: "ArrowUp",
			run(view) {
				if (!isCompletionActive(view)) {
					return false;
				}
				return moveCompletionSelection(false)(view);
			},
		},
	]));
}
