/**
 * cURL 命令生成器（纯函数，可被组件和导出工具复用）
 */

import { getExampleValue } from './example-utils'

interface CurlOptions {
  /** 完整请求 URL（含 query 参数） */
  url: string
  /** HTTP 方法 */
  method: string
  /** 接口摘要（用于检测特殊接口类型） */
  summary?: string
  /** header 参数列表 */
  headerParams: Array<{ name: string; schema?: any }>
  /** 是否有请求体 */
  hasBody: boolean
  /** Content-Type */
  contentType: string
  /** 请求体示例 JSON 字符串 */
  bodyExample: string
}

/**
 * 生成 cURL 命令
 */
export function buildCurlCommand(options: CurlOptions): string {
  const { url, method, summary = '', headerParams, hasBody, contentType, bodyExample } = options

  // 检测特殊接口类型
  const text = `${url} ${summary}`.toLowerCase()
  const isWebSocket = url.includes('/ws') || text.includes('websocket')
  const isSSE = url.includes('/sse') || text.includes('sse')
  const isStreamable = url.includes('/streamable') || text.includes('streamable') || text.includes('stream')

  if (isWebSocket) {
    return `# WebSocket 接口无法使用 cURL 直接测试
# 请使用 WebSocket 客户端工具，例如：
# - wscat: pnpm add -g wscat
# - websocat: https://github.com/vi/websocat

# 使用 wscat 连接示例：
wscat -c ${url.replace(/^http/, 'ws')}

# 连接后可以直接输入消息发送`
  }

  if (isSSE) {
    return `# Server-Sent Events (SSE) 接口
curl -N '${url}'

# -N 参数禁用缓冲，实时显示流式数据
# 按 Ctrl+C 停止接收`
  }

  if (isStreamable) {
    return `# HTTP Streamable 流式传输接口
curl -N '${url}'

# -N 参数禁用缓冲，实时显示流式数据
# 按 Ctrl+C 停止接收`
  }

  // 普通 HTTP 接口
  let cmd = `curl -X ${method} '${url}'`

  // 添加 headers
  if (headerParams.length > 0) {
    headerParams.forEach(param => {
      const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
      cmd += ` \\\n  -H '${param.name}: ${exampleValue}'`
    })
  }

  // 添加 body
  if (method !== 'GET' && hasBody) {
    if (contentType === 'application/x-www-form-urlencoded') {
      try {
        const jsonData = JSON.parse(bodyExample)
        const formData = Object.entries(jsonData)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
        cmd += ` \\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\n  -d '${formData}'`
      } catch {
        cmd += ` \\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\n  -d '${bodyExample}'`
      }
    } else if (contentType === 'application/json') {
      cmd += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${bodyExample}'`
    } else {
      cmd += ` \\\n  -H 'Content-Type: ${contentType}' \\\n  -d '${bodyExample}'`
    }
  }

  return cmd
}
