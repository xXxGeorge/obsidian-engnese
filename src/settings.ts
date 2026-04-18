import { App, PluginSettingTab, Setting } from "obsidian";
import type PinyinCompletionPlugin from "./main";

export interface PinyinCompletionSettings {
	enabled: boolean;
	rimeDictionaryPath: string;
	minTokenLength: number;
	autoPopupMode: "high-confidence" | "always";
	autoPopupScoreThreshold: number;
	doubleSpaceSelect: boolean;
	doubleSpaceTimeoutMs: number;
	keepSpaceAfterDoubleSpaceSelection: boolean;
	selectFirstKey: string;
	selectSecondKey: string;
	selectThirdKey: string;
	selectFourthKey: string;
	selectFifthKey: string;
	prevPageKey: string;
	nextPageKey: string;
	disableInCodeBlock: boolean;
	disableInInlineCode: boolean;
	disableInMath: boolean;
}

export const DEFAULT_SETTINGS: PinyinCompletionSettings = {
	enabled: true,
	rimeDictionaryPath: "~/Library/Rime/rime_ice.dict.yaml",
	minTokenLength: 1,
	autoPopupMode: "always",
	autoPopupScoreThreshold: 0,
	doubleSpaceSelect: true,
	doubleSpaceTimeoutMs: 350,
	keepSpaceAfterDoubleSpaceSelection: false,
	selectFirstKey: "Tab",
	selectSecondKey: "Ctrl-;",
	selectThirdKey: "Ctrl-'",
	selectFourthKey: "Ctrl-/",
	selectFifthKey: "Ctrl-[",
	prevPageKey: "Ctrl-,",
	nextPageKey: "Ctrl-.",
	disableInCodeBlock: true,
	disableInInlineCode: true,
	disableInMath: true,
};

export class PinyinCompletionSettingTab extends PluginSettingTab {
	plugin: PinyinCompletionPlugin;

	constructor(app: App, plugin: PinyinCompletionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Enable plugin")
			.setDesc("Enable english-first pinyin completion in supported editors.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabled)
				.onChange(async value => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Rime dictionary path")
			.setDesc("Main rime dictionary file. Supports import_tables from that file.")
			.addText(text => text
				.setPlaceholder("~/Library/Rime/rime_ice.dict.yaml")
				.setValue(this.plugin.settings.rimeDictionaryPath)
				.onChange(async value => {
					this.plugin.settings.rimeDictionaryPath = value.trim();
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Rebuild dictionary index")
			.setDesc("Re-parse the rime dictionary and refresh the cached index.")
			.addButton(button => button
				.setButtonText("Rebuild")
				.onClick(async () => {
					button.setDisabled(true);
					button.setButtonText("Rebuilding...");
					try {
						await this.plugin.rebuildDictionaryIndex();
					} finally {
						button.setDisabled(false);
						button.setButtonText("Rebuild");
					}
				}));

		new Setting(containerEl)
			.setName("Popup behavior")
			.setDesc("Show candidates whenever the current english token can be parsed as pinyin.")
			.addText(text => text
				.setValue("Always")
				.setDisabled(true));

		new Setting(containerEl)
			.setName("Double space selects first candidate")
			.setDesc("First space remains a normal space. Press space again within the timeout to replace the previous pinyin token with the first candidate.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.doubleSpaceSelect)
				.onChange(async value => {
					this.plugin.settings.doubleSpaceSelect = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Double space timeout")
			.setDesc("Maximum interval in milliseconds between the two space presses.")
			.addText(text => text
				.setPlaceholder("350")
				.setValue(String(this.plugin.settings.doubleSpaceTimeoutMs))
				.onChange(async value => {
					const parsed = Number.parseInt(value.trim(), 10);
					this.plugin.settings.doubleSpaceTimeoutMs = Number.isFinite(parsed)
						? Math.min(Math.max(parsed, 100), 1500)
						: DEFAULT_SETTINGS.doubleSpaceTimeoutMs;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Keep space after double space selection")
			.setDesc("When enabled, double space turns `woaini  ` into `我爱你 ` instead of `我爱你`.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.keepSpaceAfterDoubleSpaceSelection)
				.onChange(async value => {
					this.plugin.settings.keepSpaceAfterDoubleSpaceSelection = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Selection keys")
			.setDesc("Configure the shortcuts used to pick candidates and turn pages.")
			.addText(text => text
				.setPlaceholder("Tab")
				.setValue(this.plugin.settings.selectFirstKey)
				.onChange(async value => {
					this.plugin.settings.selectFirstKey = value.trim() || "Tab";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Select candidate 2")
			.setDesc("Shortcut for the second candidate in the current page.")
			.addText(text => text
				.setPlaceholder("Ctrl-;")
				.setValue(this.plugin.settings.selectSecondKey)
				.onChange(async value => {
					this.plugin.settings.selectSecondKey = value.trim() || "Ctrl-;";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Select candidate 3")
			.setDesc("Shortcut for the third candidate in the current page.")
			.addText(text => text
				.setPlaceholder("Ctrl-'")
				.setValue(this.plugin.settings.selectThirdKey)
				.onChange(async value => {
					this.plugin.settings.selectThirdKey = value.trim() || "Ctrl-'";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Select candidate 4")
			.setDesc("Shortcut for the fourth candidate in the current page.")
			.addText(text => text
				.setPlaceholder("Ctrl-/")
				.setValue(this.plugin.settings.selectFourthKey)
				.onChange(async value => {
					this.plugin.settings.selectFourthKey = value.trim() || "Ctrl-/";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Select candidate 5")
			.setDesc("Shortcut for the fifth candidate in the current page. Ctrl-[ may be interpreted as escape by the system, so changing it is recommended if it conflicts.")
			.addText(text => text
				.setPlaceholder("Ctrl-[")
				.setValue(this.plugin.settings.selectFifthKey)
				.onChange(async value => {
					this.plugin.settings.selectFifthKey = value.trim() || "Ctrl-[";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Previous page")
			.setDesc("Shortcut for moving to the previous candidate page.")
			.addText(text => text
				.setPlaceholder("Ctrl-,")
				.setValue(this.plugin.settings.prevPageKey)
				.onChange(async value => {
					this.plugin.settings.prevPageKey = value.trim() || "Ctrl-,";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Next page")
			.setDesc("Shortcut for moving to the next candidate page.")
			.addText(text => text
				.setPlaceholder("Ctrl-.")
				.setValue(this.plugin.settings.nextPageKey)
				.onChange(async value => {
					this.plugin.settings.nextPageKey = value.trim() || "Ctrl-.";
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Disable in code blocks")
			.setDesc("Do not show pinyin candidates inside fenced code blocks.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableInCodeBlock)
				.onChange(async value => {
					this.plugin.settings.disableInCodeBlock = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Disable in inline code")
			.setDesc("Do not show pinyin candidates inside backtick code spans.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableInInlineCode)
				.onChange(async value => {
					this.plugin.settings.disableInInlineCode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Disable in math")
			.setDesc("Do not show pinyin candidates inside inline or block math.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.disableInMath)
				.onChange(async value => {
					this.plugin.settings.disableInMath = value;
					await this.plugin.saveSettings();
				}));
	}
}
