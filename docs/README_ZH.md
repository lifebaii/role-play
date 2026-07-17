# Role-Play Frontend

[English](../README.md) | 中文

<img src="https://github.com/smanx/role-play/blob/master/public/pwa-192x192.png?raw=true" alt="Role-Play Logo" width="128" />

基于 Vue 3 + Vite + TypeScript + Tailwind CSS 的前端应用。

## 项目简介

Role-Play 是一个基于 LLM 的角色扮演聊天应用，支持：

- 🎭 创建和管理自定义角色
- 💬 与 AI 角色进行流畅对话
- 🌍 世界书和正则脚本增强角色设定
- 📱 响应式设计，支持 PC 和移动端
- 💾 本地聊天记录备份、恢复与纯文本导出
- 👥 群聊功能，支持多角色互动
- 📤 角色导入/导出，支持多种格式
- 🎨 主题切换和个性化设置
- 📦 离线 PWA 支持

## 纯前端首次使用流程

1. 首次进入时填写“剧本中怎么称呼你”，未设置前不使用默认访客名称。
2. 随后完成自定义模型配置。新配置默认使用“美团龙猫”、`https://api.longcat.chat/openai/v1` 和 `LongCat-2.0`，API Key 由每位用户自行填写；也可切换为其他 **OpenAI 兼容** 或 **Anthropic** 服务。
3. 提供商使用按钮切换；切换提供商不会覆盖已填写的 API 地址。
4. OpenAI 兼容服务可以尝试获取模型列表；Anthropic 模型名称需要手动填写。
5. 聊天内容、角色、称呼和模型配置均保存在当前浏览器中，请定期导出本地数据备份。

模型配置支持粘贴三至四行文本快速导入，顺序为：配置名字、API 地址、API Key、模型名（可省略）。省略模型名时会自动获取模型列表并选择第一个模型。

聊天页右上角的三点菜单提供“编辑角色”，可直接修改当前角色；角色列表保留角色导入、导出和创建能力。

首次访问会从 `public/1/` 自动导入两个内置角色。初始化完成后不会重复导入；用户主动删除内置角色后，刷新页面不会自动恢复。

## 截图展示

### PC端
<img src="https://github.com/smanx/role-play/blob/master/docs/imgs/pc-home-light.jpg?raw=true" alt="PC端主页" width="800" />

### 移动端
<div align="center">
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-list.jpg?raw=true" alt="移动端列表" width="300" />
  &nbsp;&nbsp;&nbsp;
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-chat.jpg?raw=true" alt="移动端聊天" width="300" />
</div>

## 在线体验

🚀 **[https://rp.good.hidns.vip/](https://rp.good.hidns.vip/)**

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建**: Vite 5
- **样式**: Tailwind CSS
- **状态管理**: Pinia
- **路由**: Vue Router
- **PWA**: vite-plugin-pwa
- **数据库**: IndexedDB (Dexie)
- **Markdown**: marked + dompurify
- **拖拽**: sortablejs + vuedraggable
- **压缩**: pako

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

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (端口 3000)
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 环境变量

创建 `.env` 文件：

```env
# 后端 API 地址 (可选)
# 开发模式: 留空使用 Vite proxy 代理
# 生产模式: 设置完整的后端地址
# 示例: VITE_API_BASE_URL=http://192.168.1.100:3001/api
VITE_API_BASE_URL=

# 是否启用配套后端（纯前端个人 Key 模式保持 false）
VITE_BACKEND_ENABLED=false

# 是否显示登录入口和管理员入口 (默认 false)
# 仅当 VITE_BACKEND_ENABLED=true 时生效
VITE_SHOW_AUTH_ENTRY=false
```

保持 `VITE_BACKEND_ENABLED=false` 时，登录、签到、在线角色、聊天同步、内置模型和管理后台均被禁用。不同设备或浏览器配置文件的数据相互隔离；同一浏览器配置文件访问同一站点时会共用本地数据。

## 本地备份与恢复

- 聊天记录 JSONL 文件保留完整消息结构，可重新导入恢复。
- TXT 导出只保留对话正文，适合阅读和归档，不能用于恢复。
- 角色支持单独导入和导出。
- 本地用户数据设置支持分类或全部导入、导出。
- 清除浏览器网站数据会删除本地配置和聊天记录，请定期导出备份。

## 响应式设计

项目支持 PC 和移动端：

- 使用 Tailwind CSS 响应式断点
- 移动端优先设计
- 触摸友好的交互
- 按钮最小尺寸 48px

## PWA 支持

生产构建自动生成 PWA 支持：

- 离线访问
- 添加到主屏幕
- 自动更新
- Google Fonts 缓存

### iOS 沉浸式体验

iOS 用户可通过 Safari 的"添加到主屏幕"功能将应用添加到桌面。从主屏幕启动后，应用将以全屏模式运行，隐藏 Safari 地址栏和工具栏，提供类似原生 App 的沉浸式体验。

<div align="center">
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-ios-pwa.jpg?raw=true" alt="ios app" width="300" />
</div>

## 主要依赖

### 生产依赖

- `vue` - Vue 3 框架
- `vue-router` - 路由管理
- `pinia` - 状态管理
- `dexie` - IndexedDB 封装
- `marked` - Markdown 解析
- `dompurify` - HTML 净化
- `sortablejs` - 拖拽排序
- `vuedraggable` - Vue 拖拽组件
- `pako` - Gzip 压缩/解压

### 开发依赖

- `vite` - 构建工具
- `vite-plugin-pwa` - PWA 插件
- `typescript` - TypeScript 支持
- `tailwindcss` - CSS 框架
- `postcss` - CSS 处理
- `autoprefixer` - CSS 自动前缀
- `sharp` - 图像处理

## 构建配置

### Vite 配置

- 开发服务器端口: 3000
- API 代理: `/api` -&gt; `http://localhost:3001`
- 构建输出: `../dist`
- 路径别名: `@` -&gt; `src/`

### PWA 配置

- 应用名称: Role-Play
- 主题色: #1f2937
- 背景色: #f3f4f6
- 显示模式: standalone
- 缓存策略: CacheFirst (Google Fonts)

## IndexedDB 数据库

数据库名: `SillyTavernDB`

主要存储:
- 聊天记录: `silly_tavern_chat_{角色ID}`
- 角色精灵图
- 本地角色数据
- 用户设置

## 开发规范

### 命名规范

- **文件命名**: kebab-case (例如: `chat-view.ts`)
- **组件命名**: PascalCase (例如: `ChatView.vue`)
- **变量/函数**: camelCase
- **CSS 类名**: kebab-case (Tailwind CSS)

### 代码风格

- 使用 TypeScript
- 使用 Vue 3 Composition API
- 使用 Pinia 进行状态管理
- 使用 Tailwind CSS 进行样式

## 许可证

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
