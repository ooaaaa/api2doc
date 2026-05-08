#!/usr/bin/env node

/**
 * api2doc CLI
 * 
 * 用法:
 *   npx api2doc                # 默认端口 5200
 *   npx api2doc -p 8080        # 指定端口
 *   npx api2doc --no-open      # 不自动打开浏览器
 */

import { parseArgs } from 'node:util'
import { startServer } from './server.js'

const { values } = parseArgs({
  options: {
    port: { type: 'string', short: 'p', default: '5200' },
    'no-open': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
})

if (values.help) {
  console.log(`
  api2doc - 本地 API 文档查看器

  用法:
    api2doc [选项]

  选项:
    -p, --port <端口>    指定服务端口 (默认: 5200)
    --no-open            不自动打开浏览器
    -h, --help           显示帮助信息
`)
  process.exit(0)
}

const port = parseInt(values.port, 10) || 5200
const shouldOpen = !values['no-open']

startServer({ port, open: shouldOpen })
