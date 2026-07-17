/**
 * HTTP请求头管理工具
 * 支持普通HTTP、WebSocket、SSE、HTTP Streamable等场景
 */

export interface RequestHeadersOptions {
  method: string
  url: string
  interfaceType: 'http' | 'websocket' | 'sse' | 'streamable'
  contentType?: string
  customHeaders?: Record<string, string>
  enableAuth?: boolean
  authToken?: string
  referer?: string // 请求来源
  lastEventId?: string // SSE重连时的最后事件ID
  wsProtocol?: string // WebSocket子协议
  wsExtensions?: string // WebSocket扩展
}

/**
 * 生成完整的HTTP请求头
 */
export function generateRequestHeaders(options: RequestHeadersOptions): Record<string, string> {
  const { 
    method, 
    url, 
    interfaceType, 
    contentType, 
    customHeaders = {}, 
    enableAuth, 
    authToken,
    referer,
    lastEventId,
    wsProtocol,
    wsExtensions
  } = options
  
  // 解析URL获取Host
  let host = ''
  try {
    const urlObj = new URL(url)
    host = urlObj.host
  } catch {
    host = 'localhost'
  }

  // 基础请求头（HTTP/1.1协议必备）
  const headers: Record<string, string> = {
    'Host': host,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  }

  // 添加Referer（如果提供）
  if (referer) {
    headers['Referer'] = referer
  }

  // 根据接口类型设置特定请求头
  switch (interfaceType) {
    case 'websocket':
      // WebSocket协议升级必备字段（RFC 6455）
      headers['Upgrade'] = 'websocket'
      headers['Connection'] = 'Upgrade' // 注意：这里必须是Upgrade，不能是keep-alive
      headers['Sec-WebSocket-Key'] = generateWebSocketKey()
      headers['Sec-WebSocket-Version'] = '13'
      headers['Accept'] = '*/*'
      
      // 可选：子协议协商（应用层协议）
      if (wsProtocol) {
        headers['Sec-WebSocket-Protocol'] = wsProtocol
      }
      
      // 可选：帧压缩扩展（减少传输数据量）
      if (wsExtensions) {
        headers['Sec-WebSocket-Extensions'] = wsExtensions
      } else {
        // 默认启用permessage-deflate压缩
        headers['Sec-WebSocket-Extensions'] = 'permessage-deflate; client_max_window_bits'
      }
      break

    case 'sse':
      // SSE专属请求头（Server-Sent Events规范）
      headers['Accept'] = 'text/event-stream' // 显式声明接受事件流
      headers['Cache-Control'] = 'no-cache' // 禁止缓存流数据
      headers['Connection'] = 'keep-alive' // 保持长连接
      headers['Keep-Alive'] = 'timeout=60, max=100' // 长连接参数：60秒超时，最多100个请求
      headers['Pragma'] = 'no-cache' // HTTP/1.0兼容的缓存控制
      headers['X-Requested-With'] = 'XMLHttpRequest' // 标识为AJAX请求
      
      // 重连时携带最后接收的事件ID（用于断点续传）
      if (lastEventId) {
        headers['Last-Event-ID'] = lastEventId
      }
      break

    case 'streamable':
      // HTTP流式传输专属请求头（Chunked Transfer Encoding）
      headers['Accept'] = '*/*'
      headers['Accept-Encoding'] = 'chunked, gzip, deflate, br' // 显式声明支持分块编码
      headers['Connection'] = 'keep-alive' // 保持长连接
      headers['Keep-Alive'] = 'timeout=60, max=100' // 长连接参数
      headers['Cache-Control'] = 'no-cache' // 禁止缓存
      headers['Pragma'] = 'no-cache' // HTTP/1.0兼容
      headers['TE'] = 'trailers' // 支持尾部元数据（Trailer Headers）
      break

    case 'http':
    default:
      // 普通HTTP请求
      headers['Accept'] = '*/*'
      headers['Connection'] = 'keep-alive' // 启用HTTP持久连接
      headers['Keep-Alive'] = 'timeout=60, max=100' // 长连接参数
      break
  }

  // 设置Content-Type（仅非GET/HEAD请求）
  // multipart/form-data 不手动设置，由浏览器 fetch 自动生成（包含 boundary）
  if (method !== 'GET' && method !== 'HEAD' && contentType && contentType !== 'multipart/form-data') {
    headers['Content-Type'] = contentType
  }

  // 认证相关（如果需要）
  if (enableAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  // 合并自定义请求头（自定义请求头优先级最高）
  Object.entries(customHeaders).forEach(([key, value]) => {
    if (value) {
      headers[key] = value
    }
  })

  return headers
}

/**
 * 生成WebSocket握手密钥
 */
function generateWebSocketKey(): string {
  // 生成16字节随机数据并转为Base64
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  return btoa(String.fromCharCode(...randomBytes))
}

/**
 * 格式化请求头为HTTP报文格式
 */
export function formatHeadersAsHttpMessage(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: string
): string {
  let message = `${method} ${path} HTTP/1.1\r\n`
  
  // 添加请求头
  Object.entries(headers).forEach(([key, value]) => {
    message += `${key}: ${value}\r\n`
  })
  
  // 请求头结束标记
  message += '\r\n'
  
  // 添加请求体
  if (body) {
    message += body
  }
  
  return message
}

/**
 * 验证请求头完整性
 */
export function validateRequestHeaders(
  headers: Record<string, string>,
  interfaceType: 'http' | 'websocket' | 'sse' | 'streamable'
): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = []
  const warnings: string[] = []

  // 检查基础必备字段
  if (!headers['Host']) missing.push('Host')
  if (!headers['User-Agent']) warnings.push('User-Agent（建议补充完整客户端标识）')

  // 根据接口类型检查特定字段
  switch (interfaceType) {
    case 'websocket':
      if (!headers['Upgrade'] || headers['Upgrade'] !== 'websocket') {
        missing.push('Upgrade: websocket')
      }
      if (!headers['Connection'] || !headers['Connection'].includes('Upgrade')) {
        missing.push('Connection: Upgrade')
      }
      if (!headers['Sec-WebSocket-Key']) missing.push('Sec-WebSocket-Key')
      if (!headers['Sec-WebSocket-Version']) missing.push('Sec-WebSocket-Version')
      break

    case 'sse':
      if (!headers['Accept'] || !headers['Accept'].includes('text/event-stream')) {
        warnings.push('Accept: text/event-stream（建议显式声明）')
      }
      if (!headers['Cache-Control'] || !headers['Cache-Control'].includes('no-cache')) {
        warnings.push('Cache-Control: no-cache（防止流数据缓存）')
      }
      break

    case 'streamable':
      if (!headers['Accept-Encoding'] || !headers['Accept-Encoding'].includes('chunked')) {
        warnings.push('Accept-Encoding: chunked（建议显式声明）')
      }
      if (!headers['Connection'] || !headers['Connection'].includes('keep-alive')) {
        warnings.push('Connection: keep-alive（长连接必备）')
      }
      break
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * 获取接口类型的推荐请求头说明
 */
export function getHeadersDescription(interfaceType: 'http' | 'websocket' | 'sse' | 'streamable'): string {
  const descriptions: Record<string, string> = {
    http: '标准HTTP请求头，支持短连接和长连接',
    websocket: 'WebSocket协议升级握手必备字段，包含Upgrade、Connection、Sec-WebSocket-Key等',
    sse: 'Server-Sent Events专属请求头，显式声明text/event-stream和no-cache',
    streamable: 'HTTP流式传输请求头，支持chunked编码和长连接控制'
  }
  
  return descriptions[interfaceType] || descriptions.http
}
