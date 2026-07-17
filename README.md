# Role-Play Frontend

English | [中文](docs/README_ZH.md)

<img src="https://github.com/smanx/role-play/blob/master/public/pwa-192x192.png?raw=true" alt="Role-Play Logo" width="128" />

A frontend application built with Vue 3 + Vite + TypeScript + Tailwind CSS.

## Project Overview

Role-Play is an LLM-based role-play chat application that supports:

- 🎭 创建和管理自定义角色
- 💬 与 AI 角色进行流畅对话
- 🌍 世界书和正则脚本增强角色设定
- 📱 响应式设计，支持 PC 和移动端
- 💾 本地聊天记录备份、恢复与纯文本导出
- 👥 群聊功能，支持多角色互动
- 📤 角色导入/导出，支持多种格式
- 🎨 主题切换和个性化设置
- 📦 离线 PWA 支持

## Screenshots

### PC
<img src="https://github.com/smanx/role-play/blob/master/docs/imgs/pc-home-light.jpg?raw=true" alt="PC Home" width="800" />

### Mobile
<div align="center">
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-list.jpg?raw=true" alt="Mobile List" width="300" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-chat.jpg?raw=true" alt="Mobile Chat" width="300" />
</div>

## Try Online

🚀 **[https://rp.good.hidns.vip/](https://rp.good.hidns.vip/)**

## Tech Stack

- **Framework**: Vue 3 + TypeScript
- **Build**: Vite 5
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **PWA**: vite-plugin-pwa
- **Database**: IndexedDB (Dexie)
- **Markdown**: marked + dompurify
- **Drag & Drop**: sortablejs + vuedraggable
- **Compression**: pako

## 运行模式

| 功能 | 纯前端模式 | 后端模式 |
|------|------------|----------|
| 角色与聊天记录 | 浏览器本地保存 | 浏览器本地保存 |
| 模型服务 | 每位用户配置自己的 API Key | 可使用自定义或内置模型 |
| 角色导入/导出 | ✅ | ✅ |
| 聊天记录 JSONL 导入/导出 | ✅ | ✅ |
| 聊天记录 TXT 导出 | ✅ | ✅ |
| 登录、签到、在线角色 | ❌ | 按后端配置启用 |
| 聊天记录同步 | ❌ | 登录后手动触发 |

纯前端部署适合多人访问同一个 IP 和端口。数据按“协议 + 主机 + 端口 + 浏览器配置文件”隔离，不同设备或不同浏览器配置文件不会共享数据；同一浏览器配置文件访问同一地址时会共用本地数据。

### 纯前端首次使用流程

1. 首次进入时填写“剧本中怎么称呼你”，未设置前不使用默认访客名称。
2. 随后完成自定义模型配置。新配置默认使用“美团龙猫”、`https://api.longcat.chat/openai/v1` 和 `LongCat-2.0`，API Key 由每位用户自行填写；也可切换为其他 **OpenAI 兼容** 或 **Anthropic** 服务。
3. 提供商使用按钮切换；切换提供商不会覆盖已填写的 API 地址。
4. OpenAI 兼容服务可以尝试获取模型列表；Anthropic 模型名称需要手动填写。
5. 聊天内容、角色、称呼和模型配置均保存在当前浏览器中，请定期导出本地数据备份。

模型配置支持粘贴三至四行文本快速导入，顺序为：配置名字、API 地址、API Key、模型名（可省略）。省略模型名时会自动获取模型列表并选择第一个模型。

聊天页右上角的三点菜单提供“编辑角色”，可直接修改当前角色；角色列表保留角色导入、导出和创建能力。

首次访问会从 `public/1/` 自动导入两个内置角色。初始化完成后不会重复导入；用户主动删除内置角色后，刷新页面不会自动恢复。

## Development

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

启动后，本机访问 `http://localhost:3000`。同一局域网内的其他设备使用 `http://服务器IP:3000`，每位用户进入“自定义模型配置”，填写自己的 API 地址、API Key 和模型名称。

## 环境变量

Create a `.env` file:

```env
# Backend API URL (optional)
# Development mode: Leave empty to use Vite proxy
# Production mode: Set full backend URL
# Example: VITE_API_BASE_URL=http://192.168.1.100:3001/api
VITE_API_BASE_URL=

# 是否启用配套后端（纯前端个人 Key 模式保持 false）
VITE_BACKEND_ENABLED=false

# 是否显示登录入口和管理员入口 (默认 false)
# 仅当 VITE_BACKEND_ENABLED=true 时生效
VITE_SHOW_AUTH_ENTRY=false
```

### 纯前端多人模式

保持 `VITE_BACKEND_ENABLED=false` 时，应用只使用浏览器本地数据和每位使用者自行配置的模型 API Key。登录、签到、在线角色、聊天同步、内置模型和管理后台会被禁用，同源 `/api` 请求也会被阻止。不同设备或浏览器用户配置文件的数据相互隔离。

环境变量在构建时写入前端资源；修改 `.env` 后需要重新运行 `npm run dev` 或 `npm run build`。

### 本地备份与恢复

- “聊天记录导出”生成 JSONL 文件，保留完整消息结构，可通过“聊天记录导入”恢复。
- “导出纯文本（TXT）”只保留消息正文，适合阅读和归档，不能用于恢复聊天。
- 角色支持单独导入和导出。
- 本地用户数据设置提供分类导入/导出和“全部导入/全部导出”。
- 自定义模型配置和聊天内容仅保存在当前浏览器，不会在不同浏览器或设备之间自动同步。
- 清除浏览器网站数据会删除本地配置和记录，建议定期导出 JSONL 和本地用户数据备份。

## 响应式设计

The project supports PC and mobile:

- Uses Tailwind CSS responsive breakpoints
- Mobile-first design
- Touch-friendly interactions
- Minimum button size 48px

## PWA Support

Production builds automatically include PWA support:

- Offline access
- Add to home screen
- Automatic updates
- Google Fonts caching

### iOS Immersive Experience

iOS users can add the app to the home screen via Safari's "Add to Home Screen" feature. When launched from the home screen, the app runs in full-screen mode, hiding the Safari address bar and toolbar, providing a native app-like immersive experience.

<div align="center">
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-ios-pwa.jpg?raw=true" alt="ios app" width="300" />
</div>

## Main Dependencies

### Production Dependencies

- `vue` - Vue 3 framework
- `vue-router` - Routing management
- `pinia` - State management
- `dexie` - IndexedDB wrapper
- `marked` - Markdown parser
- `dompurify` - HTML sanitization
- `sortablejs` - Drag and drop sorting
- `vuedraggable` - Vue drag and drop component
- `pako` - Gzip compression/decompression

### Development Dependencies

- `vite` - Build tool
- `vite-plugin-pwa` - PWA plugin
- `typescript` - TypeScript support
- `tailwindcss` - CSS framework
- `postcss` - CSS processing
- `autoprefixer` - CSS auto-prefixing
- `sharp` - Image processing

## Build Configuration

### Vite Configuration

- Dev server port: 3000
- API proxy: `/api` -&gt; `http://localhost:3001`
- Build output: `../dist`
- Path alias: `@` -&gt; `src/`

### PWA Configuration

- App name: Role-Play
- Theme color: #1f2937
- Background color: #f3f4f6
- Display mode: standalone
- Cache strategy: CacheFirst (Google Fonts)

## IndexedDB Database

Database name: `SillyTavernDB`

Main storage:
- Chat history: `silly_tavern_chat_{characterID}`
- Character sprites
- Local character data
- User settings

## Development Guidelines

### Naming Conventions

- **File names**: kebab-case (e.g., `chat-view.ts`)
- **Component names**: PascalCase (e.g., `ChatView.vue`)
- **Variables/functions**: camelCase
- **CSS class names**: kebab-case (Tailwind CSS)

### Code Style

- Use TypeScript
- Use Vue 3 Composition API
- Use Pinia for state management
- Use Tailwind CSS for styling

## License

MIT License

Copyright (c) 2026 Role-Play Lab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
