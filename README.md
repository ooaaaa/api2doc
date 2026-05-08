# Nice API Doc

美观的 API 文档查看器，替代 Swagger UI。

内置本地代理解决跨域，支持管理多个服务，配置持久化到浏览器本地存储。

## 快速使用

```bash
npx nice-apidoc
```

启动后自动打开浏览器，点击右上角 `+` 打开服务管理，添加你的 Swagger/OpenAPI JSON 地址即可。

## 命令行选项

```bash
npx nice-apidoc                   # 默认端口 4523，自动打开浏览器
npx nice-apidoc --port 8080       # 自定义端口
npx nice-apidoc --no-open         # 不自动打开浏览器
```

## 功能

- 美观的 API 文档展示，支持多级目录分组
- 交互式 API 调试（通过本地代理转发请求）
- 内置代理，无需后端配置 CORS
- 多服务管理：添加、编辑、删除、搜索、切换
- 配置导入/导出，方便换浏览器或分享给团队
- 支持 Swagger 2.0 和 OpenAPI 3.0/3.1
- 搜索过滤、代码示例生成

## 服务管理

点击左上角当前服务名称或右上角 `+` 按钮，打开服务管理弹窗：

- **添加** - 填写名称和 OpenAPI JSON 地址
- **编辑** - hover 服务条目，点击编辑图标
- **删除** - hover 服务条目，点击删除图标
- **切换** - 点击服务条目即可切换
- **搜索** - 按名称或地址过滤服务列表
- **导入/导出** - JSON 格式，方便迁移和团队共享

数据存储在浏览器 localStorage 中，刷新不丢失。

## 工作原理

`npx nice-apidoc` 在本地启动一个轻量 Node.js 服务：

1. 提供前端静态页面
2. `/proxy?url=xxx` - 代理转发 OpenAPI JSON 请求（解决跨域）
3. `/proxy/api` - 代理转发 API 调试请求

所有请求通过本地代理中转，不存在跨域问题。

## 常见 OpenAPI 地址

| 框架 | 地址 |
|------|------|
| Spring Boot 3.x (springdoc) | `http://localhost:8080/v3/api-docs` |
| Spring Boot 2.x (springfox) | `http://localhost:8080/v2/api-docs` |
| FastAPI | `http://localhost:8000/openapi.json` |
| Express + swagger-jsdoc | `http://localhost:3000/api-docs.json` |
| NestJS | `http://localhost:3000/api-json` |
| ASP.NET Core | `http://localhost:5000/swagger/v1/swagger.json` |
| Gin (Go) | `http://localhost:8080/swagger/doc.json` |

## 开发

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动 Vite 开发服务器（端口 5200）
pnpm build          # 构建前端产物到 dist/
pnpm serve          # 本地测试 CLI 模式（端口 4523）
```

## 技术栈

- 前端：Vue 3 + TypeScript + Ant Design Vue + CodeMirror
- CLI：Node.js 原生 http + sirv（唯一运行时依赖，~20KB）
- 构建：Vite

## 发布

```bash
pnpm build          # 构建前端
npm publish         # 发布到 npm
```

发布后用户通过 `npx nice-apidoc` 即可使用，无需全局安装。

## License

MIT
