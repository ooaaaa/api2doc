# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

api2doc - 美观、易用的 API 文档查看器，Swagger UI 的现代替代方案。基于 Vue 3 + TypeScript + Vite 构建的前端应用，配合轻量级 Node.js CLI 服务。

## 技术栈

- **前端**: Vue 3 + TypeScript + Ant Design Vue + CodeMirror
- **CLI 服务**: Node.js 原生 http + sirv
- **构建**: Vite
- **包管理**: pnpm

## 开发命令

```bash
pnpm install              # 安装依赖
pnpm dev                  # 启动 Vite 开发服务器 (端口 5200)
pnpm dev:api              # 启动 API 示例服务 (端口 3010，用于联调)
pnpm build                # 构建前端产物到 dist/
pnpm serve                # 本地测试 CLI 模式
pnpm type-check           # TypeScript 类型检查
```

## 项目结构

```
api2doc/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   │   ├── api-debugger/   # API 调试器组件 (请求/响应)
│   │   ├── api-detail/     # API 详情展示组件
│   │   └── layout/         # 布局组件 (Header/Sidebar/Content)
│   ├── composables/        # 组合式函数
│   │   ├── useSwaggerData.ts    # Swagger 数据加载
│   │   ├── useApiParser.ts      # OpenAPI 解析
│   │   ├── useApiNavigation.ts  # API 导航/分组
│   │   ├── useServiceManager.ts # 多服务管理 (localStorage)
│   │   └── useCookieJar.ts      # Cookie 管理
│   ├── utils/              # 工具函数
│   │   ├── curl-generator.ts    # cURL 命令生成
│   │   ├── curl-parser.ts       # cURL 解析
│   │   ├── doc-export.ts        # 文档导出
│   │   └── request-headers.ts   # 请求头处理
│   └── types/              # TypeScript 类型定义
├── api/                    # API 示例服务 (Express + Swagger)
│   ├── config/             # 配置 (端口/CORS/Swagger 定义)
│   ├── middleware/         # 中间件 (日志/错误处理)
│   ├── routes/             # 路由模块
│   └── server.js           # 入口文件
├── cli/                    # CLI 工具
│   ├── index.js            # CLI 入口 (参数解析)
│   └── server.js           # 本地服务 (静态文件 + 代理)
├── dist/                   # 构建产物
└── docs/                   # 文档
    └── npm-publish.md      # npm 发布流程
```

## 架构说明

### CLI 工作模式

`npx api2doc` 启动本地服务，提供：
1. 静态文件服务 (dist/)
2. `/proxy?url=xxx` - 代理获取 OpenAPI JSON (解决跨域)
3. `/proxy/api` - 代理转发 API 调试请求

### 开发模式代理

Vite 开发服务器内置 `devProxyPlugin` (见 `vite.config.ts`)，提供与生产环境 CLI 相同的 `/proxy` 接口，开发时无需额外配置 CORS。

### 核心数据流

1. **服务管理**: `useServiceManager` 管理多个 Swagger 服务配置 (localStorage 持久化)
2. **数据加载**: `useSwaggerData` 通过 `/proxy?url=<swagger-url>` 获取 OpenAPI 规范
3. **解析分组**: `useApiParser` 解析规范，`useApiNavigation` 按 tag 分组生成导航树
4. **调试请求**: 用户请求 → `/proxy/api` → 目标 API → 返回响应

### 关键组件

- `Api2Doc.vue` - 主应用组件
- `api-debugger/index.vue` - API 调试器主界面
- `api-detail/index.vue` - API 详情展示
- `AppHeader.vue` / `AppSidebar.vue` - 应用布局

## 发布流程

详见 `docs/npm-publish.md`，核心步骤：

```bash
pnpm build                    # 构建前端
./publish.sh                  # 一键发布 (patch 版本)
./publish.sh minor            # 次版本升级
./publish.sh major            # 主版本升级
```

发布前需确保 `.env` 中配置 `NPM_TOKEN`。

## 注意事项

- 使用 pnpm 管理依赖，不要使用 npm/yarn
- 构建配置见 `vite.config.ts`，包含代码分割和优化策略
- CLI 服务使用 Node.js 原生模块，运行时依赖仅 sirv (~20KB)
- 前端内置代理插件，开发与生产环境行为一致
