/**
 * api2doc 本地服务
 * 
 * 职责：
 * 1. 静态文件服务（serve 前端构建产物）
 * 2. 代理转发（解决跨域）
 */

import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import sirv from 'sirv'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const STATIC_DIR = join(__dirname, '../dist')

// ============ 请求处理工具 ============

function parseBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch {
        resolve(null)
      }
    })
  })
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

// ============ 路由处理 ============

async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const pathname = url.pathname

  // 代理模式检测（前端用来判断是否在 CLI 模式下）
  if (pathname === '/api/services' && req.method === 'GET') {
    json(res, 200, [])
    return true
  }

  // 代理：获取远端 openapi.json
  if (pathname === '/proxy' && req.method === 'GET') {
    const targetUrl = url.searchParams.get('url')
    if (!targetUrl) return json(res, 400, { error: '缺少 url 参数' })

    try {
      const headers = { Accept: 'application/json' }
      if (req.headers['x-custom-auth']) {
        headers['Authorization'] = req.headers['x-custom-auth']
      }

      let resp = await fetch(targetUrl, { headers })

      // 如果返回的是 HTML（可能是 Swagger UI 页面），尝试常见的 JSON 端点
      const contentType = resp.headers.get('content-type') || ''
      if (resp.ok && contentType.includes('text/html')) {
        const baseUrl = new URL(targetUrl)
        const fallbackPaths = [
          '/openapi.json',
          '/v3/api-docs',
          '/swagger.json',
          '/api-docs.json',
        ]
        for (const path of fallbackPaths) {
          const fallbackUrl = `${baseUrl.origin}${path}`
          if (fallbackUrl === targetUrl) continue
          const fallbackResp = await fetch(fallbackUrl, { headers })
          const fallbackCt = fallbackResp.headers.get('content-type') || ''
          if (fallbackResp.ok && fallbackCt.includes('application/json')) {
            resp = fallbackResp
            break
          }
        }
      }

      if (!resp.ok) {
        return json(res, resp.status, { error: `远端返回 ${resp.status}: ${resp.statusText}` })
      }

      const respContentType = resp.headers.get('content-type') || 'application/json'
      res.writeHead(200, { 'Content-Type': respContentType })
      res.end(await resp.text())
    } catch (err) {
      json(res, 502, { error: `代理请求失败: ${err.message}` })
    }
    return true
  }

  // 代理：转发 API 调试请求
  if (pathname === '/proxy/api' && req.method === 'POST') {
    const body = await parseBody(req)
    if (!body || !body.url) return json(res, 400, { error: '缺少 url' })

    try {
      const fetchOptions = {
        method: body.method || 'GET',
        headers: body.headers || {},
      }
      if (body.body && !['GET', 'HEAD'].includes(fetchOptions.method.toUpperCase())) {
        fetchOptions.body = typeof body.body === 'string' ? body.body : JSON.stringify(body.body)
      }

      const resp = await fetch(body.url, fetchOptions)
      const responseHeaders = {}
      resp.headers.forEach((value, key) => { responseHeaders[key] = value })

      // 特殊处理 set-cookie：多个值用逗号分隔保留完整信息
      const setCookies = resp.headers.getSetCookie?.() || []
      if (setCookies.length > 1) {
        responseHeaders['set-cookie'] = setCookies.join(', ')
      }

      const contentType = responseHeaders['content-type'] || ''
      // 二进制图片用 base64 编码传输，避免 text() 损坏数据
      const isBinaryImage = contentType.startsWith('image/') && !contentType.includes('svg')
      let responseBody
      let bodyEncoding
      if (isBinaryImage) {
        const buffer = Buffer.from(await resp.arrayBuffer())
        responseBody = buffer.toString('base64')
        bodyEncoding = 'base64'
      } else {
        responseBody = await resp.text()
      }

      json(res, 200, {
        status: resp.status,
        statusText: resp.statusText,
        headers: responseHeaders,
        body: responseBody,
        bodyEncoding,
      })
    } catch (err) {
      json(res, 502, { error: `API 代理请求失败: ${err.message}` })
    }
    return true
  }

  return false
}

// ============ 启动服务 ============

export function startServer({ port = 5200, open = true } = {}) {
  const serve = sirv(STATIC_DIR, { single: true, dev: true })

  const server = createServer(async (req, res) => {
    const handled = await handleRequest(req, res)
    if (!handled) {
      serve(req, res)
    }
  })

  server.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log('')
    console.log('  api2doc 已启动')
    console.log('')
    console.log(`  地址: ${url}`)
    console.log('')
    console.log('  按 Ctrl+C 停止')
    console.log('')

    if (open) {
      import('open').then(({ default: openBrowser }) => openBrowser(url)).catch(() => {})
    }
  })
}
