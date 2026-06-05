#!/bin/bash

# ============================================
# 发布到 npm 仓库
# ============================================
#
# 用法:
#   ./scripts/release.sh [patch|minor|major]
#
# 版本类型:
#   patch  1.0.0 -> 1.0.1 (默认)
#   minor  1.0.0 -> 1.1.0
#   major  1.0.0 -> 2.0.0
#
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NPM_ENV="$SCRIPT_DIR/npm.env"

# 加载 npm token
if [ ! -f "$NPM_ENV" ]; then
  echo "错误: 缺少 $NPM_ENV"
  exit 1
fi

export $(grep -v '^#' "$NPM_ENV" | xargs)

if [ -z "$NPM_TOKEN" ]; then
  echo "错误: NPM_TOKEN 未设置"
  exit 1
fi

VERSION_TYPE=${1:-patch}

echo "准备发布 $VERSION_TYPE 版本..."

# 切换到 npm 官方源
npm config set registry https://registry.npmjs.org/
npm config set //registry.npmjs.org/:_authToken="$NPM_TOKEN"

cleanup() {
  npm config delete //registry.npmjs.org/:_authToken 2>/dev/null
  npm config set registry https://registry.npmmirror.com
}
trap cleanup EXIT

# 更新版本号
npm version "$VERSION_TYPE" --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "新版本: $NEW_VERSION"

# 发布，失败则回退版本号
if npm publish --access public --tag latest; then
  echo "发布成功: api2doc@$NEW_VERSION"
else
  echo "发布失败，回退版本号..."
  git checkout package.json 2>/dev/null || true
  exit 1
fi
