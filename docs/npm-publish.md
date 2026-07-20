# npm 发版流程

## 前置条件

- 已安装 pnpm
- npm 已登录（`npm whoami` 能正常返回用户名）
- 如未登录，执行 `npm login`

## 发版步骤

```bash
# 1. 构建
pnpm build

# 2. 升版本号（patch / minor / major 按需选择）
npm version patch --no-git-tag-version

# 3. 发布
npm publish

# 4. 提交版本变更
git add package.json
git commit -m "release: v$(node -p "require('./package.json').version")"
git push
```

## 注意事项

- `npm publish` 依赖 `~/.npmrc` 中的 `_authToken`，token 失效时需重新 `npm login`
- `files` 字段只包含 `cli/` 和 `dist/`，发布前确认 `dist/` 已构建
- 包名 `api2doc`，scope 为 public
