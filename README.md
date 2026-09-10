# Baidu Course Notes Importer

将百度网盘课程的 AI 笔记和带时间戳字幕导入 Obsidian。本项目是 [Netdisk AI Notes Importer](https://github.com/hyq2890-blip/netdisk-ai-notes-importer) 的定制分支。

## 主要功能

- 从 Obsidian Web Viewer 中已登录的百度网盘页面导入 AI 笔记。
- 导入完整带时间戳字幕，支持 FCB 页面和桌面缓存文件回退。
- 把 AI 笔记与字幕合并进同一篇 Markdown 笔记。
- 导入时选择 Vault 中的任意目标文件夹。
- 可把 AI 笔记图片保存到笔记当前目录下的自定义子目录，也可保留远程链接。
- 时间戳保留原课程语义，便于后续配合 Media Extended 或 AI/Skill 整理学习笔记。

## BRAT 安装

1. 在 Obsidian 第三方插件市场安装 **Obsidian42 - BRAT**。
2. 执行命令 **BRAT: Add a beta plugin for testing**。
3. 粘贴仓库地址 `https://github.com/Tyukeying/baidu-course-notes-importer`。
4. 选择跟随最新版本，然后在“设置 → 第三方插件”中启用本插件。

BRAT 会从 GitHub Release 下载 `main.js`、`manifest.json` 和 `styles.css`。更新时会保留你本地的 `data.json`。

## 手动安装

1. 从 [最新 Release](https://github.com/Tyukeying/baidu-course-notes-importer/releases/latest) 下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 放入 `Vault/.obsidian/plugins/baidu-course-notes-importer/`。
3. 重启 Obsidian，并在第三方插件页启用。

更新时不要删除或覆盖 `data.json`，其中包含本地设置和部分页面映射。

## 使用要求与限制

- 仅支持 Obsidian 桌面端，需开启核心插件 **Web Viewer（网页浏览器）**。
- 插件只能读取当前账号有权访问、且已在 Web Viewer 中加载的页面。
- 百度网盘的页面结构或播放器实现改变后，可能需要更新适配。
- Windows 和 Linux 上的百度网盘缓存位置不同；自动扫描失败时需手动指定字幕文件或目录。

## 图片与隐私

开启“下载 AI 笔记图片”后，插件会从笔记页面中的原始图片地址下载图片到 Vault。关闭时，Markdown 保留百度或其 CDN 的远程图片链接；以后显示仍取决于登录状态、链接有效期和网络。

插件会在 Vault 内保存导入的 Markdown、可选图片和来源地址，并在插件目录的 `data.json` 中保存设置。代码不包含自建后端、遥测或广告。登录和会话由百度网盘页面及 Obsidian Web Viewer 管理。

## 声明

本项目与百度、百度网盘、Obsidian 和 Media Extended 的开发者没有隶属、授权或合作关系。请仅导入你有权访问和使用的内容。

## 许可证

本定制版延续上游项目的 [MIT License](LICENSE)。上游项目与内置第三方组件的详细声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
