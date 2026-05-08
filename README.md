# Role-Play Frontend

<img src="https://github.com/smanx/role-play/blob/master/public/pwa-192x192.png?raw=true" alt="Role-Play Logo" width="128" />

基于 Vue 3 + Vite + TypeScript + Tailwind CSS 的前端应用。

## 项目简介

Role-Play 是一个基于 LLM 的角色扮演聊天应用，支持：

- 🎭 创建和管理自定义角色
- 💬 与 AI 角色进行流畅对话
- 🌍 世界书和正则脚本增强角色设定
- 📱 响应式设计，支持 PC 和移动端
- 🔄 聊天记录同步（登录后）
- 👥 群聊功能，支持多角色互动
- 📤 角色导入/导出，支持多种格式
- 🎨 主题切换和个性化设置
- 📦 离线 PWA 支持

## 截图展示

### PC端
<img src="https://github.com/smanx/role-play/blob/master/docs/imgs/pc-home-light.jpg?raw=true" alt="PC端主页" width="800" />

### 移动端
<p float="left">
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-list.jpg?raw=true" alt="移动端列表" width="300" />
  <img src="https://github.com/smanx/role-play/blob/master/docs/imgs/phone-home-chat.jpg?raw=true" alt="移动端聊天" width="300" />
</p>

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

## 登录与未登录功能对比

| 功能 | 未登录 | 已登录 |
|------|--------|--------|
| 好友列表 | ✅ 本地保存 | ✅ 本地保存 |
| 聊天记录 | ✅ 本地保存 | ✅ 本地保存 |
| 大模型 API 配置 | ✅ 本地保存 | ✅ 本地保存 |
| 使用内置大模型 | ❌ | ✅ |
| 浏览角色评论 | ❌ | ✅ |
| 角色点赞 | ❌ | ✅ |
| 添加在线角色 | ❌ | ✅ |
| 分享角色到在线列表 | ❌ | ✅ |
| 同步和分享聊天记录 | ❌ | ✅ (手动触发) |

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

# 是否显示登录入口和管理员入口 (默认 false)
# 设置为 true 时显示登录按钮和管理员入口
VITE_SHOW_AUTH_ENTRY=false
```

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
- API 代理: `/api` -> `http://localhost:3001`
- 构建输出: `../dist`
- 路径别名: `@` -> `src/`

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
