# Role-Play Frontend

基于 Vue 3 + Vite + TypeScript + Tailwind CSS 的前端应用。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建**: Vite 5
- **样式**: Tailwind CSS
- **状态管理**: Pinia
- **路由**: Vue Router
- **PWA**: vite-plugin-pwa

## 目录结构

```
frontend/
├── public/             # 静态资源
├── src/
│   ├── api/           # API 接口封装
│   ├── components/    # 公共组件
│   ├── composables/   # 组合式函数
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── views/         # 页面组件
│   │   ├── admin/    # 管理后台页面
│   │   └── chat/     # 聊天页面
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts     # Vite 配置
├── tailwind.config.js # Tailwind 配置
└── tsconfig.json      # TypeScript 配置
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
VITE_API_BASE_URL=
```

## 主要功能

### 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 聊天界面 |
| `/admin` | 管理后台 |
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

### 组合式函数

| 函数 | 说明 |
|------|------|
| `useAvatar` | 头像处理 |
| `useCharacter` | 角色操作 |
| `useChat` | 聊天功能 |
| `useCustomModel` | 自定义模型配置 |

## 响应式设计

项目支持 PC 和移动端：

- 使用 Tailwind CSS 响应式断点
- 移动端优先设计
- 触摸友好的交互

## PWA 支持

生产构建自动生成 PWA 支持：

- 离线访问
- 添加到主屏幕
- 自动更新
