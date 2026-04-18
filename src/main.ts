import { Notice, Plugin } from "obsidian";
import { DictionaryIndexStore, resolveDictionaryPath } from "./dictionary/index-store";
import { EditorExtensionManager } from "./editor/cm-extension";
import { PinyinEngine } from "./engine/pinyin-engine";
import {
	DEFAULT_SETTINGS,
	PinyinCompletionSettingTab,
	type PinyinCompletionSettings,
} from "./settings";

export default class PinyinCompletionPlugin extends Plugin {
	settings: PinyinCompletionSettings;
	private dictionaryStore: DictionaryIndexStore;
	private pinyinEngine: PinyinEngine;
	private editorExtensions: EditorExtensionManager;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.dictionaryStore = new DictionaryIndexStore(this);
		this.pinyinEngine = new PinyinEngine(this.settings);
		this.editorExtensions = new EditorExtensionManager(this, {
			getSettings: () => this.settings,
			getDictionaryStore: () => this.dictionaryStore,
			getPinyinEngine: () => this.pinyinEngine,
		});

		this.editorExtensions.register();
		this.addSettingTab(new PinyinCompletionSettingTab(this.app, this));

		this.addCommand({
			id: "rebuild-rime-index",
			name: "Rebuild rime dictionary index",
			callback: async () => {
				await this.rebuildDictionaryIndex();
			},
		});

		this.app.workspace.onLayoutReady(() => {
			void this.ensureDictionaryReady();
		});
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData() as Partial<PinyinCompletionSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.pinyinEngine?.updateSettings(this.settings);
	}

	async rebuildDictionaryIndex(): Promise<void> {
		try {
			await this.dictionaryStore.load(this.settings.rimeDictionaryPath, true);
			new Notice("Engnese dictionary index rebuilt.");
		} catch (error) {
			console.error("Failed to rebuild dictionary index", error);
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to rebuild Engnese dictionary index: ${message}`);
		}
	}

	private async ensureDictionaryReady(): Promise<void> {
		try {
			await this.dictionaryStore.load(this.settings.rimeDictionaryPath);
		} catch (error) {
			console.error("Failed to load dictionary index", error);
			const resolvedPath = resolveDictionaryPath(this.settings.rimeDictionaryPath);
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Engnese could not load ${resolvedPath}: ${message}`);
		}
	}
}
