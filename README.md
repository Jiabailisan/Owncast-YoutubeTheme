# Owncast-YoutubeTheme

仿 YouTube Live 风格的 Owncast 主题，支持深色 / 日间自动跟随与手动切换，并附带 OBS 透明聊天弹幕样式。

A YouTube Live-inspired theme for Owncast with automatic/manual Dark & Light mode switching and a transparent OBS chat overlay stylesheet.

## 预览 / Live Previews

- **魔改版 / Modified Owncast** (`youtube-live.css`): https://live-1.fantasyworld.ltd
- **原版 / Original Owncast** (`youtube-live.original.css`): https://live-2.fantasyworld.ltd

---

## 中文说明

### 文件说明

- `youtube-live.original.css`：适配 **纯原版 Owncast**，在完整主题基础上附带仿魔改版的现代悬浮 Video.js 播放器控制栏皮肤（不含流模式切换与统计面板）。
- `youtube-live.css`：适配 **魔改版 Owncast**（已内置 WebRTC / 现代播放器控制栏），仅保留播放器外框样式，其余全部 21 节与原版逐行一致。
- `youtube-live.js`：配套脚本，负责在顶栏注入 `Auto / Dark / Light` 主题切换按钮、修正 Emoji Picker 的 Shadow DOM 样式，以及清理聊天输入框粘贴时的多余首尾空白。
- `obs-chat.css`：用于 OBS 浏览器源的透明聊天弹幕叠加层样式。

### 使用方式

1. **自定义 CSS**：进入后台 `Configuration -> General -> Appearance -> Customize your page styling with CSS`，按所用 Owncast 版本填入 `youtube-live.original.css` 或 `youtube-live.css` 的内容。
2. **自定义脚本**：进入后台 `Configuration -> General -> Custom Scripting -> Customize your page with Javascript`，填入 `youtube-live.js` 的内容。
3. **OBS 聊天叠加层**：在 OBS 中添加浏览器源，URL 填写 `https://<host>/embed/chat/readonly`，自定义 CSS 填入 `obs-chat.css`。

---

## English

### Files

- `youtube-live.original.css`: For **vanilla Owncast**. Includes the full theme plus a modern floating Video.js player skin matching the modified player look (without transport switcher or stats panel).
- `youtube-live.css`: For **modified Owncast** (with built-in WebRTC / modern player controls). Keeps only the outer player frame styling while staying line-for-line identical across all other sections.
- `youtube-live.js`: Companion script that injects the `Auto / Dark / Light` theme toggle into the header, fixes Emoji Picker Shadow DOM layout, and trims extra leading/trailing whitespace on chat paste.
- `obs-chat.css`: Transparent chat overlay stylesheet for OBS Browser Source.

### Usage

1. **Custom CSS**: Go to `Configuration -> General -> Appearance -> Customize your page styling with CSS` and paste either `youtube-live.original.css` (vanilla Owncast) or `youtube-live.css` (modified Owncast).
2. **Custom JavaScript**: Go to `Configuration -> General -> Custom Scripting -> Customize your page with Javascript` and paste `youtube-live.js`.
3. **OBS Chat Overlay**: Add a Browser Source in OBS pointing to `https://<host>/embed/chat/readonly` and paste `obs-chat.css` into its Custom CSS field.
