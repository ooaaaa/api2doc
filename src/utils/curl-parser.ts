/**
 * cURL 命令解析器
 * 将 curl 命令字符串解析为结构化的请求参数
 */

export interface ParsedCurl {
  /** HTTP 方法 */
  method: string
  /** 完整 URL（不含 query 参数） */
  url: string
  /** Query 参数 */
  queryParams: Array<{ name: string; value: string }>
  /** 请求头 */
  headers: Array<{ name: string; value: string }>
  /** 请求体内容 */
  body: string
  /** 请求体格式 */
  bodyFormat: 'json' | 'form' | 'xml' | 'text'
  /** Content-Type */
  contentType: string
}

/**
 * 将 curl 命令中的续行符和多余空白合并为单行
 */
function normalizeCurlString(input: string): string {
  return input
    .replace(/\\\s*\n/g, ' ')  // 合并续行
    .replace(/\s+/g, ' ')       // 多空白合并
    .trim()
}

/**
 * 分词：支持单引号、双引号、$'...' 转义字符串
 */
function tokenize(input: string): string[] {
  const tokens: string[] = []
  let i = 0
  const len = input.length

  while (i < len) {
    // 跳过空白
    while (i < len && /\s/.test(input[i])) i++
    if (i >= len) break

    let token = ''

    // $'...' ANSI-C 引用
    if (input[i] === '$' && i + 1 < len && input[i + 1] === "'") {
      i += 2
      while (i < len && input[i] !== "'") {
        if (input[i] === '\\' && i + 1 < len) {
          i++
          switch (input[i]) {
            case 'n': token += '\n'; break
            case 't': token += '\t'; break
            case 'r': token += '\r'; break
            case '\\': token += '\\'; break
            case "'": token += "'"; break
            default: token += '\\' + input[i]
          }
        } else {
          token += input[i]
        }
        i++
      }
      i++ // 跳过结尾引号
      tokens.push(token)
      continue
    }

    // 单引号字符串
    if (input[i] === "'") {
      i++
      while (i < len && input[i] !== "'") {
        token += input[i]
        i++
      }
      i++ // 跳过结尾引号
      tokens.push(token)
      continue
    }

    // 双引号字符串
    if (input[i] === '"') {
      i++
      while (i < len && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < len) {
          i++
          switch (input[i]) {
            case '"': token += '"'; break
            case '\\': token += '\\'; break
            case 'n': token += '\n'; break
            case 't': token += '\t'; break
            default: token += '\\' + input[i]
          }
        } else {
          token += input[i]
        }
        i++
      }
      i++ // 跳过结尾引号
      tokens.push(token)
      continue
    }

    // 普通 token（无引号）
    while (i < len && !/\s/.test(input[i])) {
      token += input[i]
      i++
    }
    tokens.push(token)
  }

  return tokens
}

/**
 * 根据 Content-Type 推断 body 格式
 */
function inferBodyFormat(contentType: string): 'json' | 'form' | 'xml' | 'text' {
  if (contentType.includes('application/json')) return 'json'
  if (contentType.includes('application/x-www-form-urlencoded')) return 'form'
  if (contentType.includes('application/xml') || contentType.includes('text/xml')) return 'xml'
  return 'text'
}

/**
 * 尝试根据 body 内容推断格式
 */
function inferBodyFormatFromContent(body: string): 'json' | 'form' | 'xml' | 'text' {
  const trimmed = body.trim()
  // JSON 检测
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return 'json' } catch { /* 不是有效 JSON */ }
  }
  // XML 检测
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml'
  // form-urlencoded 检测（key=value&key=value 格式）
  if (/^[\w%+.-]+=[\w%+.-]*(&[\w%+.-]+=[\w%+.-]*)*$/.test(trimmed)) return 'form'
  return 'text'
}

/**
 * 解析 curl 命令字符串
 */
export function parseCurl(curlCommand: string): ParsedCurl {
  const normalized = normalizeCurlString(curlCommand)
  const tokens = tokenize(normalized)

  let method = ''
  let url = ''
  let body = ''
  let contentType = ''
  const headers: Array<{ name: string; value: string }> = []
  let hasDataFlag = false

  let i = 0
  // 跳过 "curl" 命令本身
  if (tokens[0]?.toLowerCase() === 'curl') i = 1

  while (i < tokens.length) {
    const token = tokens[i]

    // 方法
    if (token === '-X' || token === '--request') {
      i++
      if (i < tokens.length) method = tokens[i].toUpperCase()
      i++
      continue
    }

    // 请求头
    if (token === '-H' || token === '--header') {
      i++
      if (i < tokens.length) {
        const headerStr = tokens[i]
        const colonIdx = headerStr.indexOf(':')
        if (colonIdx > 0) {
          const name = headerStr.substring(0, colonIdx).trim()
          const value = headerStr.substring(colonIdx + 1).trim()
          // 记录 Content-Type 但不加入 headers 列表（会自动处理）
          if (name.toLowerCase() === 'content-type') {
            contentType = value
          } else {
            headers.push({ name, value })
          }
        }
      }
      i++
      continue
    }

    // 请求体 -d / --data / --data-raw / --data-binary / --data-urlencode
    if (token === '-d' || token === '--data' || token === '--data-raw' ||
        token === '--data-binary' || token === '--data-urlencode') {
      hasDataFlag = true
      i++
      if (i < tokens.length) {
        body = tokens[i]
      }
      i++
      continue
    }

    // 忽略常见的无关参数
    if (token === '-k' || token === '--insecure' ||
        token === '-s' || token === '--silent' ||
        token === '-S' || token === '--show-error' ||
        token === '-L' || token === '--location' ||
        token === '-v' || token === '--verbose' ||
        token === '-i' || token === '--include' ||
        token === '-N' || token === '--no-buffer' ||
        token === '--compressed') {
      i++
      continue
    }

    // 带值的参数跳过
    if (token === '-o' || token === '--output' ||
        token === '-u' || token === '--user' ||
        token === '--connect-timeout' || token === '--max-time' ||
        token === '-A' || token === '--user-agent' ||
        token === '-e' || token === '--referer' ||
        token === '--cookie' || token === '-b') {
      i += 2
      continue
    }

    // URL（不以 - 开头的 token，且看起来像 URL）
    if (!token.startsWith('-') && (token.startsWith('http') || token.startsWith('/') || token.includes('://'))) {
      url = token
      i++
      continue
    }

    // 其他未识别的 token 跳过
    i++
  }

  // 推断方法：如果没有显式指定，有 body 则为 POST，否则为 GET
  if (!method) {
    method = hasDataFlag ? 'POST' : 'GET'
  }

  // 解析 URL 中的 query 参数
  const queryParams: Array<{ name: string; value: string }> = []
  let baseUrl = url

  try {
    const urlObj = new URL(url)
    baseUrl = `${urlObj.origin}${urlObj.pathname}`
    urlObj.searchParams.forEach((value, name) => {
      queryParams.push({ name, value })
    })
  } catch {
    // URL 解析失败，尝试手动分割
    const qIdx = url.indexOf('?')
    if (qIdx > 0) {
      baseUrl = url.substring(0, qIdx)
      const queryStr = url.substring(qIdx + 1)
      queryStr.split('&').forEach(pair => {
        const eqIdx = pair.indexOf('=')
        if (eqIdx > 0) {
          queryParams.push({
            name: decodeURIComponent(pair.substring(0, eqIdx)),
            value: decodeURIComponent(pair.substring(eqIdx + 1))
          })
        }
      })
    }
  }

  // 推断 body 格式
  let bodyFormat: 'json' | 'form' | 'xml' | 'text' = 'json'
  if (contentType) {
    bodyFormat = inferBodyFormat(contentType)
  } else if (body) {
    bodyFormat = inferBodyFormatFromContent(body)
    // 根据推断结果设置 contentType
    if (bodyFormat === 'json') contentType = 'application/json'
    else if (bodyFormat === 'form') contentType = 'application/x-www-form-urlencoded'
    else if (bodyFormat === 'xml') contentType = 'application/xml'
    else contentType = 'text/plain'
  }

  // 美化 JSON body
  if (bodyFormat === 'json' && body) {
    try { body = JSON.stringify(JSON.parse(body), null, 2) } catch { /* 保持原样 */ }
  }

  return {
    method,
    url: baseUrl,
    queryParams,
    headers,
    body,
    bodyFormat,
    contentType
  }
}
