# 桌面待办便签 🗒️

一款贴在桌面上的轻量待办便签应用。每个便签是一个独立悬浮窗口，支持拖动、缩放、置顶、多便签管理，数据本地持久化，重启不丢失。

## ✨ 特性

- **常驻桌面** — 无边框透明窗口，紧贴桌面显示
- **多便签管理** — 右上角「+」或系统托盘新建/删除便签，每个便签独立位置、尺寸、置顶状态
- **待办管理** — 添加 / 勾选完成 / 删除，勾选有弹性动效与删除线划过动画
- **持久化** — 数据自动保存到本地 JSON，重启自动恢复
- **置顶 & 缩放** — 一键置顶显示，八方向边缘拖拽自由调整大小
- **双主题** — 宣纸暖白 / 墨黑夜读，纸墨编辑风视觉
- **键盘操作** — 全键盘可用（Tab 聚焦 / Space 切换完成 / Backspace 删除）

## 🖼 界面

「纸墨 · 编辑风」视觉：暖米白纸底、墨色文字、朱砂红强调、纸张噪点纹理。

![preview](preview/preview.png)

## 🛠 技术栈

- Electron 31 + electron-vite 2 + Vite 5
- React 18 + TypeScript + Zustand
- electron-builder 打包

## 🚀 开发

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 构建
npm run build

# 打包 Windows 安装包（NSIS + 便携版）
npm run dist
```

打包产物在 `note-dist/` 目录：
- `桌面待办便签 Setup *.exe` — 安装器（可选安装目录）
- `桌面待办便签-*-便携版.exe` — 免安装便携版

> 国内网络如遇下载失败，可先配置镜像（项目已内置 `.npmrc`，无需额外操作）。

## 📁 目录结构

```
src/
├─ main/       # 主进程：窗口管理、JSON 持久化、托盘、IPC
├─ preload/    # 桥接层：contextBridge 暴露 noteAPI
└─ renderer/   # 渲染进程：React 便签 UI
```

## 📄 License

MIT
