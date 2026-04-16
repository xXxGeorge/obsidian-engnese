import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { CandidateEntry } from "../types";

interface ParsedDictionary {
	importTables: string[];
	entries: CandidateEntry[];
}

function normalizeImportTablePath(currentFile: string, tableName: string): string {
	const filename = tableName.endsWith(".dict.yaml") ? tableName : `${tableName}.dict.yaml`;
	return path.resolve(path.dirname(currentFile), filename);
}

function parseWeight(raw: string | undefined): number {
	if (!raw) {
		return 0;
	}
	const value = Number.parseInt(raw, 10);
	return Number.isFinite(value) ? value : 0;
}

export async function parseRimeDictionary(filePath: string): Promise<ParsedDictionary> {
	const raw = await fs.readFile(filePath, "utf8");
	const lines = raw.split(/\r?\n/);
	const importTables: string[] = [];
	const entries: CandidateEntry[] = [];
	let inHeader = true;
	let inImportTables = false;

	for (const originalLine of lines) {
		const line = originalLine.trimEnd();

		if (inHeader) {
			if (line.trim() === "...") {
				inHeader = false;
				inImportTables = false;
				continue;
			}

			const importMatch = line.match(/^\s*-\s+([^\s#]+)\s*(?:#.*)?$/);
			if (line.startsWith("import_tables:")) {
				inImportTables = true;
				continue;
			}
			if (inImportTables && importMatch) {
				const tableName = importMatch[1];
				if (tableName) {
					importTables.push(normalizeImportTablePath(filePath, tableName));
				}
				continue;
			}
			if (inImportTables && !line.startsWith(" ") && !line.startsWith("\t")) {
				inImportTables = false;
			}
			continue;
		}

		if (!line || line.startsWith("#")) {
			continue;
		}

		const fields = line.split("\t").map(field => field.trim()).filter(Boolean);
		if (fields.length === 0) {
			continue;
		}

		const text = fields[0];
		if (!text) {
			continue;
		}
		const code = fields[1] ?? text;
		const weight = parseWeight(fields[2]);
		entries.push({
			text,
			code,
			weight,
			source: filePath,
			score: 0,
		});
	}

	return { importTables, entries };
}

export async function collectRimeEntries(rootPath: string): Promise<CandidateEntry[]> {
	const visited = new Set<string>();
	const aggregated: CandidateEntry[] = [];

	async function visit(filePath: string): Promise<void> {
		const resolved = path.resolve(filePath);
		if (visited.has(resolved)) {
			return;
		}
		visited.add(resolved);

		const parsed = await parseRimeDictionary(resolved);
		for (const entry of parsed.entries) {
			aggregated.push(entry);
		}
		for (const imported of parsed.importTables) {
			await visit(imported);
		}
	}

	await visit(rootPath);
	return aggregated;
}
