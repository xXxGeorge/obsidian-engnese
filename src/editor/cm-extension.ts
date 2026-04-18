import { autocompletion, closeCompletion, completionStatus, startCompletion } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import type { ViewUpdate } from "@codemirror/view";
import type { Plugin } from "obsidian";
import { buildCompletionKeymap } from "./keymap";
import { buildCompletionSource, type AutocompleteEnvironment } from "../ui/autocomplete-source";
import { isContextBlocked } from "./context-guard";
import { getTokenBeforeCursor } from "./token-tracker";
import { COMPLETION_PAGE_SIZE } from "../types";

function scheduleStartCompletion(update: ViewUpdate): void {
	queueMicrotask(() => {
		startCompletion(update.view);
	});
}

function refreshCompletion(update: ViewUpdate, environment: AutocompleteEnvironment): void {
	if (!update.view.hasFocus) {
		return;
	}

	const settings = environment.getSettings();
	if (!settings.enabled) {
		if (completionStatus(update.state) === "active") {
			closeCompletion(update.view);
		}
		return;
	}

	const cursor = update.state.selection.main;
	if (!cursor.empty) {
		if (completionStatus(update.state) === "active") {
			closeCompletion(update.view);
		}
		return;
	}

	if (isContextBlocked(update.state, cursor.head, settings)) {
		if (completionStatus(update.state) === "active") {
			closeCompletion(update.view);
		}
		return;
	}

	const token = getTokenBeforeCursor(update.state, cursor.head);
	if (!token) {
		if (completionStatus(update.state) === "active") {
			closeCompletion(update.view);
		}
		return;
	}

	const candidates = environment.getPinyinEngine().lookup(
		token.text,
		environment.getDictionaryStore().getCache(),
	);
	if (candidates.length === 0) {
		if (completionStatus(update.state) === "active") {
			closeCompletion(update.view);
		}
		return;
	}

	// Force a refresh so completion keeps tracking both added characters and backspaces.
	if (completionStatus(update.state) === "active") {
		closeCompletion(update.view);
	}
	scheduleStartCompletion(update);
}

export class EditorExtensionManager {
	private plugin: Plugin;
	private environment: AutocompleteEnvironment;

	constructor(plugin: Plugin, environment: AutocompleteEnvironment) {
		this.plugin = plugin;
		this.environment = environment;
	}

	register(): void {
		this.plugin.registerEditorExtension(this.build());
	}

	private build(): Extension {
		const environment = this.environment;
		return [
			autocompletion({
				activateOnTyping: true,
				defaultKeymap: false,
				override: [buildCompletionSource(environment)],
				maxRenderedOptions: COMPLETION_PAGE_SIZE,
				activateOnTypingDelay: 0,
			}),
			buildCompletionKeymap(environment),
			ViewPlugin.fromClass(class {
				update(update: ViewUpdate): void {
					if (!update.docChanged && !update.selectionSet) {
						return;
					}
					refreshCompletion(update, environment);
				}
			}),
		];
	}
}
