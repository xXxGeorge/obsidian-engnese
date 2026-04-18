# Engnese

[简体中文](./README.zh-CN.md)

Engnese is an Obsidian desktop plugin for English-first pinyin completion.

It allows users to keep typing English letters in the editor while treating the current token as pinyin in the background. When a candidate is accepted, the already inserted English token is replaced in place with Chinese text.

## What It Does

- Keeps the normal English typing flow and avoids inline preedit.
- Reads local Rime `.dict.yaml` dictionaries, including `import_tables`.
- Falls back to the longest valid prefix when a full pinyin stream has no direct match.
- Supports configurable candidate shortcuts and paging.
- Supports optional double-space to accept the first candidate.
- Avoids triggering inside fenced code blocks, inline code, and math contexts.

## Examples

- `woaini` -> `我爱你`
- `ni` + double-space -> `你`
- `chunfengyichui` -> select `春风`, then continue with `yichui`

If a full-token match does not exist, Engnese uses the longest available prefix and leaves the remaining suffix in the editor so the next completion cycle can continue from there.

## Requirements

- Obsidian desktop
- A local Rime dictionary file
- Node.js and npm if building from source

The plugin is desktop-only because it reads dictionaries from the local filesystem.

## Install From Source

```bash
git clone https://github.com/xXxGeorge/obsidian-engnese.git
cd obsidian-engnese
npm install
npm run build
```

Copy the build output into:

```text
<vault>/.obsidian/plugins/engnese/
```

Required files:

- `manifest.json`
- `main.js`
- `styles.css`

Then enable `Engnese` in Obsidian Community Plugins.

## Development

Run the watcher:

```bash
npm run dev
```

Build a production bundle:

```bash
npm run build
```

The plugin ID is `engnese`, so the target plugin directory should also be named `engnese`.

## Dictionary Path

Default path:

```text
~/Library/Rime/rime_ice.dict.yaml
```

If path expansion causes issues, use an absolute path such as:

```text
/Users/<user>/Library/Rime/rime_ice.dict.yaml
```

## Settings

### General

- `Enable plugin`: turn Engnese on or off
- `Rime dictionary path`: main dictionary entry file
- `Rebuild dictionary index`: re-parse the configured dictionary and refresh the in-memory index

### Candidate behavior

- `Double Space selects first candidate`
- `Double Space timeout`
- `Keep space after Double Space selection`

### Selection shortcuts

- `Selection keys`: candidate 1
- `Select candidate 2`
- `Select candidate 3`
- `Select candidate 4`
- `Select candidate 5`
- `Previous page`
- `Next page`

Default shortcuts:

- `Tab`: candidate 1
- `Ctrl-;`: candidate 2
- `Ctrl-'`: candidate 3
- `Ctrl-/`: candidate 4
- `Ctrl-[`: candidate 5
- `Ctrl-,`: previous page
- `Ctrl-.`: next page

In some environments, `Ctrl-[` is interpreted as `Escape`. If that happens, remap `Select candidate 5` in plugin settings.

### Context guards

- `Disable in code blocks`
- `Disable in inline code`
- `Disable in math`

## Limitations

- The dictionary index is currently kept in memory only and is rebuilt on demand.
- Candidate ranking is dictionary-weight based with a few simple heuristics; there is no adaptive learning yet.
- The plugin currently targets desktop usage only.

## Troubleshooting

- Dictionary load error: verify the configured path and try an absolute path.
- Dictionary changed but results did not update: click `Rebuild dictionary index`.
- `Ctrl-[` behaves like `Escape`: remap candidate 5 to another shortcut.
- Double-space keeps a trailing space unexpectedly: disable `Keep space after Double Space selection`.

## License

This project is licensed under `MIT`. See [LICENSE](./LICENSE).
