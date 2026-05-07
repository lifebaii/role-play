# Role-Play Frontend

<img src="https://github.com/smanx/role-play/blob/master/public/pwa-512x512.png?raw=true" alt="Role-Play Logo" width="128" />

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

## 目录结构

```
frontend/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml      # GitHub Pages 部署
├── public/                       # 静态资源
│   ├── default-avatar.svg
│   ├── favicon.png
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── api/                      # API 接口封装
│   │   └── index.ts
│   ├── components/               # 公共组件
│   │   ├── AuthNotification.vue  # 认证通知
│   │   ├── AvatarImage.vue       # 头像图片
│   │   ├── CharacterForm.vue     # 角色表单
│   │   ├── CharacterImageEditor.vue # 角色图片编辑器
│   │   ├── CharacterList.vue     # 角色列表
│   │   ├── CharacterSelectorList.vue # 角色选择列表
│   │   ├── CommentSection.vue    # 评论区
│   │   ├── Dialog.vue            # 对话框
│   │   ├── DialogContainer.vue   # 对话框容器
│   │   ├── ExportFormatModal.vue # 导出格式选择
│   │   ├── FriendSelector.vue    # 好友选择器
│   │   ├── LoginModal.vue        # 登录弹窗
│   │   ├── PresetEditor.vue      # 预设编辑器
│   │   ├── RegexEditor.vue       # 正则编辑器
│   │   ├── UserCharactersModal.vue # 用户角色弹窗
│   │   └── WorldInfoEditor.vue   # 世界书编辑器
│   ├── composables/              # 组合式函数
│   │   ├── useAvatar.ts          # 头像处理
│   │   ├── useCharacter.ts       # 角色操作
│   │   ├── useChat.ts            # 聊天功能
│   │   ├── useCustomModel.ts     # 自定义模型配置
│   │   └── useDialog.ts          # 对话框管理
│   ├── router/                   # 路由配置
│   │   └── index.ts
│   ├── stores/                   # Pinia 状态管理
│   │   ├── admin.ts              # 管理后台状态
│   │   ├── authorsNoteStore.ts   # 作者笔记
│   │   ├── chat.ts               # 聊天状态
│   │   ├── contextTemplateStore.ts # 上下文模板
│   │   ├── groupChatStore.ts     # 群聊状态
│   │   ├── instructStore.ts      # 指令模板
│   │   ├── modelConfig.ts        # 模型配置
│   │   ├── quickReplyStore.ts    # 快速回复
│   │   ├── settingsStore.ts      # 设置状态
│   │   ├── spriteStore.ts        # 角色精灵图
│   │   ├── themeStore.ts         # 主题状态
│   │   ├── user.ts               # 用户状态
│   │   └── userData.ts           # 用户数据
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/                    # 工具函数
│   │   ├── anonymousName.ts      # 匿名用户名生成
│   │   ├── anonymousUser.ts      # 匿名用户处理
│   │   ├── backgroundService.ts  # 背景服务
│   │   ├── characterImport.ts    # 角色导入
│   │   ├── chatBackupService.ts  # 聊天备份服务
│   │   ├── chatSync.ts           # 聊天同步
│   │   ├── config.ts             # 配置管理
│   │   ├── contextBuilder.ts     # 上下文构建
│   │   ├── dataTransferService.ts # 数据传输服务
│   │   ├── db.ts                 # IndexedDB 工具
│   │   ├── debugCharacterFile.ts # 调试工具
│   │   ├── eventBus.ts           # 事件总线
│   │   ├── gzipRequest.ts        # Gzip 请求处理
│   │   ├── llmClient.ts          # LLM 客户端
│   │   ├── localCharacterStorage.ts # 本地角色存储
│   │   ├── localFriendStorage.ts # 本地好友存储
│   │   ├── secretStorage.ts      # 密钥存储
│   │   ├── storageService.ts     # 存储服务
│   │   ├── theme.ts              # 主题管理
│   │   ├── thumbnailService.ts   # 缩略图服务
│   │   └── tokenCounter.ts       # Token 计数器
│   ├── views/                    # 页面组件
│   │   ├── admin/                # 管理后台页面
│   │   │   ├── AdminLayout.vue   # 管理后台布局
│   │   │   ├── CharacterForm.vue # 角色表单
│   │   │   ├── CharacterViewer.vue # 角色查看器
│   │   │   ├── Characters.vue    # 角色管理
│   │   │   ├── Dashboard.vue     # 仪表盘
│   │   │   ├── Login.vue         # 登录页
│   │   │   ├── Models.vue        # 模型配置
│   │   │   ├── OptimizationPresets.vue # 优化预设
│   │   │   ├── Presets.vue       # 预设管理
│   │   │   ├── Regex.vue         # 正则脚本
│   │   │   ├── Settings.vue      # 系统设置
│   │   │   └── WorldInfo.vue     # 世界书
│   │   └── chat/                 # 聊天页面
│   │       ├── ChatView.vue      # 聊天主视图
│   │       └── components/
│   │           ├── CharacterModal.vue # 角色弹窗
│   │           ├── ChatInput.vue      # 聊天输入框
│   │           ├── ChatMessages.vue   # 聊天消息列表
│   │           ├── ChatSidebar.vue    # 聊天侧边栏
│   │           ├── ChatSyncModal.vue  # 聊天同步弹窗
│   │           ├── CustomModelConfigModal.vue # 自定义模型配置
│   │           ├── UserDataSettingsModal.vue # 用户数据设置
│   │           └── UserSettingsModal.vue # 用户设置
│   ├── App.vue
│   ├── main.ts
│   ├── style.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # Tailwind 配置
├── postcss.config.js            # PostCSS 配置
├── tsconfig.json                # TypeScript 配置
└── tsconfig.node.json
```

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

## 主要功能

### 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 重定向到 `/chat` |
| `/chat` | 聊天界面 |
| `/admin` | 管理后台首页 |
| `/admin/characters` | 角色管理 |
| `/admin/characters/new` | 新建角色 |
| `/admin/characters/:id/edit` | 编辑角色 |
| `/admin/presets` | 预设管理 |
| `/admin/worldinfo` | 世界书管理 |
| `/admin/regex` | 正则脚本管理 |
| `/admin/optimization-presets` | 优化预设管理 |
| `/admin/models` | 模型配置 |
| `/admin/settings` | 系统设置 |
| `/admin/character-viewer` | 角色查看器 |
| `/admin/login` | 管理员登录 |

### 状态管理

| Store | 说明 |
|-------|------|
| `user` | 用户状态 |
| `chat` | 聊天状态 |
| `modelConfig` | 模型配置 |
| `settingsStore` | 设置状态 |
| `themeStore` | 主题状态 |
| `admin` | 管理后台状态 |
| `groupChatStore` | 群聊状态 |
| `authorsNoteStore` | 作者笔记 |
| `instructStore` | 指令模板 |
| `contextTemplateStore` | 上下文模板 |
| `quickReplyStore` | 快速回复 |
| `spriteStore` | 角色精灵图 |
| `userData` | 用户数据（世界书、预设、正则脚本） |

### 组合式函数

| 函数 | 说明 |
|------|------|
| `useAvatar` | 头像处理 |
| `useCharacter` | 角色操作 |
| `useChat` | 聊天功能 |
| `useCustomModel` | 自定义模型配置 |
| `useDialog` | 对话框管理 |

### 工具函数

| 文件 | 说明 |
|------|------|
| `anonymousName.ts` | 匿名用户名生成 |
| `anonymousUser.ts` | 匿名用户处理 |
| `backgroundService.ts` | 背景服务 |
| `characterImport.ts` | 角色导入 |
| `chatBackupService.ts` | 聊天备份服务 |
| `chatSync.ts` | 聊天同步 |
| `config.ts` | 配置管理 |
| `contextBuilder.ts` | 上下文构建 |
| `dataTransferService.ts` | 数据传输服务 |
| `db.ts` | IndexedDB 工具 |
| `debugCharacterFile.ts` | 调试工具 |
| `eventBus.ts` | 事件总线 |
| `gzipRequest.ts` | Gzip 请求处理 |
| `llmClient.ts` | LLM 客户端 |
| `localCharacterStorage.ts` | 本地角色存储 |
| `localFriendStorage.ts` | 本地好友存储 |
| `secretStorage.ts` | 密钥存储 |
| `storageService.ts` | 存储服务 |
| `theme.ts` | 主题管理 |
| `thumbnailService.ts` | 缩略图服务 |
| `tokenCounter.ts` | Token 计数器 |

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
