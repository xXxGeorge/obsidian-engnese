# Engnese

[English](./README.md)

Engnese 是一个运行在 Obsidian 桌面版里的“英文直出、拼音后台候选”插件。

你可以先把英文字符直接输入到编辑器中，插件会在后台把当前 token 当作拼音查询候选；当你选词时，已经上屏的英文 token 会被原地替换为中文。

## 特性

- 英文优先输入，不使用 inline preedit
- 支持本地 Rime `.dict.yaml` 词典
- 支持长拼音串的前缀回退
- 支持自定义候选快捷键
- 支持双击空格选首候选
- 支持在代码块、行内代码、数学环境中禁用

## 工作方式

示例：

- `woaini` -> `我爱你`
- `ni` + 双击空格 -> `你`
- `chunfengyichui` -> 先选 `春风`，再继续处理 `yichui`

如果整串拼音没有完整候选，Engnese 会回退到最长可用前缀，再让你继续处理剩余部分。

## 运行要求

- Obsidian 桌面版
- 本地可访问的 Rime 词典
- 如果从源码构建，需要安装 Node.js 和 npm

该插件是桌面版专用插件，因为需要访问本地文件系统读取词典。

## 从源码安装

```bash
git clone https://github.com/xXxGeorge/obsidian-engnese.git
cd obsidian-engnese
npm install
npm run build
```

将以下文件复制到：

```text
<你的Vault路径>/.obsidian/plugins/engnese/
```

需要复制的文件：

- `manifest.json`
- `main.js`
- `styles.css`

然后在 Obsidian 的 Community Plugins 中启用 `Engnese`。

## 开发

开发监听模式：

```bash
npm run dev
```

当前插件 ID 仍然是：

```text
engnese
```

所以 vault 中的插件目录名仍然应为 `engnese`。

## 推荐词典路径

默认值：

```text
~/Library/Rime/rime_ice.dict.yaml
```

如果有路径解析问题，建议直接填写绝对路径，例如：

```text
/Users/<你的用户名>/Library/Rime/rime_ice.dict.yaml
```

## 设置项

### 基础设置

- `Enable plugin`：启用或禁用插件
- `Rime dictionary path`：词典入口文件路径
- `Rebuild dictionary index`：重新解析当前词典

### 候选行为

- `Double Space selects first candidate`
- `Double Space timeout`
- `Keep space after Double Space selection`

### 选词快捷键

- `Selection keys`：第 1 项
- `Select candidate 2`
- `Select candidate 3`
- `Select candidate 4`
- `Select candidate 5`
- `Previous page`
- `Next page`

默认快捷键：

- `Tab`：第 1 项
- `Ctrl-;`：第 2 项
- `Ctrl-'`：第 3 项
- `Ctrl-/`：第 4 项
- `Ctrl-[`：第 5 项
- `Ctrl-,`：上一页
- `Ctrl-.`：下一页

注意：在某些环境里，`Ctrl-[` 会被解释为 `Escape`。如果有冲突，请在设置中修改第 5 项快捷键。

### 上下文禁用

- `Disable in code blocks`
- `Disable in inline code`
- `Disable in math`

## 常见问题

- 无法加载词典：检查词典路径，必要时改用绝对路径
- 改了词典路径没生效：点击 `Rebuild dictionary index`
- `Ctrl-[` 像 Escape：把第 5 项快捷键改成别的
- 双击空格后带多余空格：关闭 `Keep space after Double Space selection`

## 许可证

本项目使用 `0-BSD` 许可证。见 [LICENSE](./LICENSE)。
