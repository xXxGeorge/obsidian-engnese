# Engnese

[简体中文](./README.zh-CN.md)

Engnese is an Obsidian desktop plugin for English-first pinyin completion.

It lets you type raw English letters directly into the editor, while also treating the current token as pinyin in the background. When you pick a candidate, the already-inserted English token is replaced with Chinese text in place.

## Highlights

- English-first typing flow with no inline preedit
- Rime dictionary support via local `.dict.yaml` files
- Prefix fallback for long pinyin streams
- Configurable candidate selection shortcuts
- Optional double-space to accept the first candidate
- Context guards for code blocks, inline code, and math

## How It Works

Examples:

- `woaini` -> `我爱你`
- `ni` + double-space -> `你`
- `chunfengyichui` -> `春风` first, then continue with `yichui`

If a full-token match does not exist, Engnese falls back to the longest valid prefix and lets you continue selecting the rest.

## Requirements

- Obsidian desktop
- A local Rime dictionary
- Node.js and npm for building from source

This plugin is desktop-only because it reads dictionaries from the local filesystem.

## Install From Source

```bash
git clone <your-repo-url>
cd obsidian-pinyin-completion
npm install
npm run build
```

Copy these files into:

```text
<YourVault>/.obsidian/plugins/pinyin-completion/
```

Files to copy:

- `manifest.json`
- `main.js`
- `styles.css`

Then enable `Engnese` in Obsidian Community Plugins.

## Development

Run the watcher:

```bash
npm run dev
```

The plugin ID is still:

```text
pinyin-completion
```

So the vault plugin folder should remain `pinyin-completion`.

## Recommended Dictionary Path

Default:

```text
~/Library/Rime/rime_ice.dict.yaml
```

If needed, use an absolute path such as:

```text
/Users/<your-name>/Library/Rime/rime_ice.dict.yaml
```

## Settings

### General

- `Enable plugin`: enable or disable Engnese
- `Rime dictionary path`: root dictionary file
- `Rebuild dictionary index`: re-parse the configured dictionary

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

Note: in some environments, `Ctrl-[` is interpreted as `Escape`. If that happens, change `Select candidate 5` in settings.

### Context guards

- `Disable in code blocks`
- `Disable in inline code`
- `Disable in math`

## Troubleshooting

- Dictionary load error: verify the configured path and try an absolute path
- Changed dictionary path: click `Rebuild dictionary index`
- `Ctrl-[` acts like Escape: remap candidate 5 to another shortcut
- Unexpected trailing space after double-space selection: disable `Keep space after Double Space selection`

## License

This project is licensed under `0-BSD`. See [LICENSE](./LICENSE).
