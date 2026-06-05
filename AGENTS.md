# AGENTS.md

## 全局规则

- **优先使用中文**响应用户，包括对话、代码注释、提交信息、文档内容。
- 文件命名优先使用中文，技术专有名词保留英文（如 `useApiParser.ts`、`vite.config.ts`）。
- 代码注释和 JSDoc 使用中文。

## 项目简介

Swagger UI 的现代替代方案。Vue 3 + TypeScript + Vite 构建的前端应用，通过 npm 包 `npx api2doc` 提供本地 Node.js 服务，内置代理解决跨域。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # Vite 开发服务器，端口 5200
pnpm dev:api          # Express 示例 API，端口 3010（联调用）
pnpm build            # 构建产物到 dist/
pnpm serve            # 本地运行 CLI 服务（需先 pnpm build）
pnpm type-check       # vue-tsc --noEmit（仅检查，不修复）
```

无 linter、formatter、test framework 配置。

## 架构要点

**两个 HTML 入口**（`vite.config.ts` rollup input 定义）：
- `index.html` → 主应用（`src/main.ts`）
- `debugger.html` → 独立调试器（`src/debugger-main.ts`）

**代理是核心机制。** CLI（`cli/server.js`）和 Vite 开发插件（`vite.config.ts:devProxyPlugin`）实现相同路由：
- `GET /proxy?url=<swagger-url>` — 代理获取 OpenAPI JSON（URL 返回 HTML 时自动 fallback）
- `POST /proxy/api` — 代理转发 API 调试请求
- `GET /api/services` — 代理模式检测信号

**数据流：** `useServiceManager`（localStorage）→ `useSwaggerData`（通过 `/proxy` 拉取）→ `useApiParser` → `useApiNavigation`（按 tag 分组）→ UI。

**运行时检测：** `src/config.ts:detectProxyMode()` 通过 `/api/services` 可用性判断 CLI 模式 vs 直连模式。

## 关键陷阱

- 存在 `pnpm-lock.yaml` → 必须用 pnpm，禁用 npm/yarn。
- `tsconfig.json`：`strict: false`、`noUnusedLocals: false`，类型检查宽松。
- 构建用 `terser` 配合 `drop_console` + `drop_debugger` — 生产环境无 console 输出。
- `cli/server.js` 使用 `sirv` 的 `{ single: true }` 做 SPA 路由。
- `.env` 含 `NPM_TOKEN` — 禁止提交真实 token，当前值是占位符。
- `api/` 目录是独立 Express 应用（有自己的 `package.json`），仅用于开发测试，不属于发布包。

## 重要文件索引

| 文件 | 作用 |
|---|---|
| `vite.config.ts` | 构建配置、代理插件、chunk 分割 |
| `cli/server.js` | 生产服务器（sirv + 代理） |
| `src/config.ts` | 代理模式检测、服务存储 |
| `src/composables/useSwaggerData.ts` | OpenAPI 数据加载 |
| `publish.sh` | npm 发布流程（版本号递增 → 发布 → 清理） |
