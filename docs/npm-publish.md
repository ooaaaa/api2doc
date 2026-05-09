# 发布到 npm

## 前置条件

1. 拥有 [npmjs.com](https://www.npmjs.com/) 账号，且对 `api2doc` 包有发布权限
2. 在项目根目录 `.env` 文件中配置 `NPM_TOKEN`：

```bash
NPM_TOKEN=npm_xxxxxxxxxxxxxxxx
```

Token 获取方式：登录 npmjs.com → Access Tokens → Generate New Token（选择 Publish 类型）

## 发布流程

项目提供了 `publish.sh` 脚本，一键完成版本升级和发布：

```bash
# 补丁版本 2.0.3 -> 2.0.4（默认）
./publish.sh

# 次版本 2.0.3 -> 2.1.0
./publish.sh minor

# 主版本 2.0.3 -> 3.0.0
./publish.sh major
```

## 脚本做了什么

1. 从 `.env` 加载 `NPM_TOKEN`
2. 临时切换 registry 到 `https://registry.npmjs.org/`
3. 执行 `npm version <type> --no-git-tag-version` 升级版本号
4. 执行 `npm publish --tag latest` 发布
5. 发布完成后自动清理 token 并恢复镜像源（`https://registry.npmmirror.com`）

如果发布失败，脚本会自动回退 `package.json` 中的版本号。

## 发布内容

根据 `package.json` 的 `files` 字段，发布到 npm 的文件包括：

```
cli/          # CLI 入口和服务端代码
dist/         # vite build 产物（前端静态资源）
package.json
README.md
```

> 注意：发布前需确保 `dist/` 目录是最新的构建产物。脚本不会自动执行 build，如有改动请先手动运行：
>
> ```bash
> pnpm build
> ```

## 手动发布（不使用脚本）

```bash
# 1. 构建
pnpm build

# 2. 升级版本
npm version patch --no-git-tag-version

# 3. 切换源并发布
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken=<你的token>
npm publish --tag latest

# 4. 清理
npm config delete //registry.npmjs.org/:_authToken
npm config set registry https://registry.npmmirror.com
```

## 验证发布

```bash
# 查看最新版本
npm view api2doc version

# 测试安装
npx api2doc@latest --help
```
