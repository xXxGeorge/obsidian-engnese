import * as fs from "node:fs/promises";
import { homedir } from "node:os";
import * as path from "node:path";
import { Notice, normalizePath } from "obsidian";
import type { Plugin } from "obsidian";
import { buildDictionaryCache, DICTIONARY_CACHE_VERSION } from "./index-builder";
import { collectRimeEntries } from "./rime-parser";
import type { DictionaryCache } from "../types";

export function resolveDictionaryPath(inputPath: string): string {
	if (inputPath.startsWith("~/")) {
		const home = homedir();
		return path.join(home, inputPath.slice(2));
	}
	return inputPath;
}

async function getMtimeMs(filePath: string): Promise<number> {
	const stats = await fs.stat(filePath);
	return stats.mtimeMs;
}

export class DictionaryIndexStore {
	private plugin: Plugin;
	private cache: DictionaryCache | null = null;

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	getCache(): DictionaryCache | null {
		return this.cache;
	}

	async load(dictionaryPath: string, forceRebuild = false): Promise<DictionaryCache> {
		const expandedPath = normalizePath(resolveDictionaryPath(dictionaryPath));
		const sourceMtimeMs = await getMtimeMs(expandedPath);

		if (
			!forceRebuild &&
			this.cache &&
			this.cache.version === DICTIONARY_CACHE_VERSION &&
			this.cache.sourcePath === expandedPath &&
			this.cache.sourceMtimeMs === sourceMtimeMs
		) {
			return this.cache;
		}

		const entries = await collectRimeEntries(expandedPath);
		const rebuilt = buildDictionaryCache(expandedPath, sourceMtimeMs, entries);
		this.cache = rebuilt;
		new Notice(`Engnese indexed ${entries.length} dictionary entries.`);
		return rebuilt;
	}
}
