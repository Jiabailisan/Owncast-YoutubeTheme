# Owncast-YoutubeTheme
仿 YouTube Live 主题（支持深色 / 日间自动与手动切换）

## 使用方式

1. **自定义 CSS**（`Configuration -> General -> Appearance -> Customize your page styling with CSS`）：
   - **纯原版 Owncast**：使用 `youtube-live.original.css`（包含仿魔改版的现代悬浮播放器控制栏样式，不含流模式切换与统计面板）。
   - **魔改版 Owncast（内置 WebRTC / 现代控制栏）**：使用 `youtube-live.css`。

2. **自定义脚本**（`Configuration -> General -> Custom Scripting -> Customize your page with Javascript`）：
   - 填入 `youtube-live.js`（负责顶栏 Auto / Dark / Light 主题切换、Emoji Picker Shadow DOM 修正、聊天粘贴清理）。

3. **OBS 聊天弹幕叠加层**：
   - 浏览器源地址填 `https://ip:port/embed/chat/readonly`，自定义 CSS 填入 `obs-chat.css`。

预览：https://live-1.fantasyworld.ltd
