# Role-Play

中文 | [English](docs/README_EN.md)

<img src="public/pwa-192x192.png" alt="Role-Play Logo" width="128" />

Role-Play 是一个基于 Vue 3、Vite 和 TypeScript 的角色扮演聊天前端。项目默认运行在纯前端模式，不要求用户登录，也不依赖配套后端；角色、聊天记录、模型配置和个人称呼均保存在当前浏览器中。

## 在线访问

GitHub Pages：**[https://lifebaii.github.io/role-play/](https://lifebaii.github.io/role-play/)**

## 主要功能

- 创建、导入、导出和编辑角色。
- 首次访问自动导入两个内置角色。
- 支持角色卡 JSON 和 PNG 文件。
- 使用自定义模型进行流式角色对话。
- 支持 OpenAI 兼容和 Anthropic 两种 API 协议。
- 支持多套模型配置、模型列表获取和手动填写模型名。
- 支持三至四行文本快速导入模型配置。
- 支持世界书、正则脚本、预设和角色背景。
- 聊天记录支持 JSONL 导入/导出和 TXT 纯文本导出。
- 本地用户数据支持分类备份、完整备份和恢复。
- 支持亮色、暗色主题、响应式布局和 PWA。

## 首次使用

1. 第一次进入时填写“剧本中怎么称呼你”。未设置前不会使用默认的“访客”名称。
2. 保存称呼后进入自定义模型配置。
3. 填写自己的 API Key，确认 API 地址和模型名称，然后关闭配置窗口。
4. 从左侧角色列表选择角色并开始聊天。

新模型配置默认提供以下公开参数，API Key 不包含在源码中：

| 配置项 | 默认值 |
|---|---|
| 配置名称 | 美团龙猫 |
| 提供商 | OpenAI 兼容 |
| API 地址 | `https://api.longcat.chat/openai/v1` |
| 模型 | `LongCat-2.0` |
| API Key | 空，由每位用户自行填写 |

切换提供商不会覆盖已经填写的 API 地址。

### 快速粘贴模型配置

模型配置窗口支持直接粘贴以下三行：

```text
配置名字
API 地址
API Key
```

也可以在第四行指定模型名：

```text
配置名字
API 地址
API Key
模型名
```

省略模型名时，应用会尝试获取模型列表并选择第一个模型。无法获取时可以手动填写。

## 内置角色

内置角色资源位于 `public/1/`。首次访问会将它们导入浏览器 IndexedDB：

- `v1.96万神的亚狄斯Lite•Preview`
- `放开那个女巫`

初始化成功后不会重复导入。用户主动删除内置角色后，刷新页面不会自动恢复；清除全部网站数据后会重新执行首次初始化。

聊天页右上角三点菜单中的“编辑角色”可以直接修改当前角色。

## 本地数据与多人访问

纯前端部署可以供多人访问同一个 IP、域名和端口。浏览器数据按“协议 + 主机 + 端口 + 浏览器配置文件”隔离：

- 不同设备、不同浏览器或不同浏览器配置文件不会共享数据。
- 同一浏览器配置文件访问同一站点时会使用同一份本地数据。
- API Key 只保存在当前浏览器，不会提交到仓库。
- 清除网站数据会删除角色、聊天记录和模型配置。

请定期使用导出功能备份数据。TXT 仅用于阅读，恢复聊天记录应使用 JSONL 或完整本地备份。

> 纯前端无法安全保存供所有人共用的 API Key，也无法可靠执行“每位用户固定调用次数”的服务端配额。需要真实共享 Key 或强制配额时，应增加服务端代理。

## 运行模式

| 功能 | 纯前端模式 | 后端模式 |
|---|---|---|
| 角色和聊天记录 | 浏览器本地保存 | 浏览器本地保存 |
| 自定义模型 | 每位用户配置自己的 Key | 支持 |
| 角色导入/导出 | 支持 | 支持 |
| JSONL 备份和恢复 | 支持 | 支持 |
| TXT 导出 | 支持 | 支持 |
| 登录、签到、在线角色 | 禁用 | 按后端实现启用 |
| 聊天同步、内置模型 | 禁用 | 按后端实现启用 |

当前仓库默认使用纯前端模式。

## 本地开发

### 环境要求

- Node.js 22
- npm

### 安装与启动

```bash
npm ci
npm run dev
```

开发服务器默认地址：

```text
http://localhost:3000/#/chat
```

局域网访问时使用：

```text
http://服务器IP:3000/#/chat
```

### 构建与预览

```bash
npm run build
npm run preview
```

生产文件输出到 `dist/`。由于 GitHub Pages 的仓库路径是 `/role-play/`，生产预览地址通常为：

```text
http://localhost:4173/role-play/#/chat
```

如果 `4173` 已被占用，Vite 会自动使用 `4174`。需要固定端口时执行：

```bash
npm run preview -- --port=4173 --strictPort
```

## 环境变量

复制 `.env.example` 或创建 `.env`：

```env
# 后端 API 地址；纯前端模式可留空
VITE_API_BASE_URL=

# 默认关闭配套后端
VITE_BACKEND_ENABLED=false

# 仅在启用后端时控制登录和管理员入口
VITE_SHOW_AUTH_ENTRY=false
```

修改环境变量后需要重新运行开发服务器或重新构建。

## GitHub Pages

仓库已配置 `.github/workflows/static.yml`：

- 监听 `master` 分支。
- 使用 Node.js 22 和 `npm ci`。
- 运行 `npm run build`。
- 上传 `dist/` 并部署到 GitHub Pages。
- Vite 生产环境 `base` 为 `/role-play/`。

推送到 `master` 后，GitHub Actions 会自动部署。

## 技术栈

- Vue 3
- TypeScript
- Vite 5
- Tailwind CSS
- Pinia
- Vue Router（Hash 模式）
- IndexedDB
- Dexie
- vite-plugin-pwa
- marked + DOMPurify

## 许可证

[MIT License](LICENSE)
