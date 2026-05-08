import { getExampleValue, generateExampleFromSchema } from '../../../utils/example-utils'

/**
 * 调试器参数接口
 */
export interface DebuggerParameter {
  name: string
  value: string
  enabled: boolean
  type?: string
  required?: boolean
  description?: string
  in?: string
}

/**
 * 表单字段接口
 */
export interface DebuggerFormField {
  name: string
  type: 'text' | 'file'
  value: string
  enabled: boolean
  fromSchema: boolean
  isMultipleFile?: boolean
  fileList?: unknown[]
}

/**
 * 接口类型
 */
export type InterfaceType = 'http' | 'websocket' | 'sse' | 'streamable'

/**
 * 从 API 对象解析出的调试参数
 */
export interface ParsedApiParams {
  method: string
  url: string
  pathParameters: DebuggerParameter[]
  queryParameters: DebuggerParameter[]
  headerParameters: DebuggerParameter[]
  bodyContent: string
  bodyFormat: 'json' | 'form' | 'xml' | 'text'
  formFields: DebuggerFormField[]
  interfaceType: InterfaceType
  expandedSections: {
    query: boolean
    path: boolean
    headers: boolean
    body: boolean
  }
}

/**
 * 从 Swagger/OpenAPI 的 API 对象中解析出调试器所需的初始参数
 */
export function parseApiToParams(
  api: Record<string, unknown>,
  baseUrl: string,
  bodyExample?: string
): ParsedApiParams {
  const parameters = (api.parameters || []) as Array<Record<string, unknown>>
  const requestBody = api.requestBody as Record<string, unknown> | undefined
  const method = resolveMethod(api)

  // 解析路径参数
  const pathParameters = parameters
    .filter(p => p.in === 'path')
    .map(p => paramToDebuggerParam(p))

  // 解析 Query 参数
  const queryParameters = parameters
    .filter(p => p.in === 'query')
    .map(p => paramToDebuggerParam(p))

  // 解析 Header 参数
  const headerParameters = parameters
    .filter(p => p.in === 'header')
    .map(p => paramToDebuggerParam(p))

  // 解析请求体
  const { bodyContent, bodyFormat, formFields } = parseRequestBody(requestBody, method, bodyExample)

  // 构建 URL（替换 path 参数）
  let url = `${baseUrl}${api.path as string}`
  pathParameters.forEach(param => {
    url = url.replace(`{${param.name}}`, param.value || 'value')
  })

  // 检测接口类型
  const interfaceType = detectInterfaceType(url, (api.summary as string) || '')

  // 智能展开有数据的区块
  const expandedSections = {
    query: queryParameters.length > 0,
    path: pathParameters.length > 0,
    headers: headerParameters.length > 0,
    body: method !== 'GET' && method !== 'HEAD' && !!requestBody
  }

  return {
    method,
    url,
    pathParameters,
    queryParameters,
    headerParameters,
    bodyContent,
    bodyFormat,
    formFields,
    interfaceType,
    expandedSections
  }
}

/**
 * 检测接口类型
 */
export function detectInterfaceType(url: string, summary: string): InterfaceType {
  if (url.includes('/ws') || summary.includes('WebSocket')) return 'websocket'
  if (url.includes('/sse') || summary.includes('SSE')) return 'sse'
  if (url.includes('/streamable') || summary.includes('Streamable')) return 'streamable'
  return 'http'
}

/**
 * 解析 API 的 HTTP 方法
 */
function resolveMethod(api: Record<string, unknown>): string {
  if (api.method === 'MULTI' && Array.isArray(api.methodList) && api.methodList.length > 0) {
    return api.methodList[0] as string
  }
  return (api.method as string) || 'GET'
}

/**
 * 将 Swagger parameter 转换为调试器参数
 */
function paramToDebuggerParam(param: Record<string, unknown>): DebuggerParameter {
  const schema = param.schema as Record<string, unknown> | undefined
  const exampleValue = (param.example as string) ?? getExampleValue(schema || { type: 'string' })

  return {
    name: param.name as string,
    value: String(exampleValue ?? ''),
    enabled: true,
    type: (schema?.type as string) || 'string',
    required: (param.required as boolean) || false,
    description: (param.description as string) || '',
    in: param.in as string
  }
}

/**
 * 解析请求体
 */
function parseRequestBody(
  requestBody: Record<string, unknown> | undefined,
  method: string,
  bodyExample?: string
): { bodyContent: string; bodyFormat: 'json' | 'form' | 'xml' | 'text'; formFields: DebuggerFormField[] } {
  const formFields: DebuggerFormField[] = []

  if (method === 'GET' || method === 'HEAD') {
    return { bodyContent: '', bodyFormat: 'json', formFields }
  }

  if (!requestBody) {
    return { bodyContent: bodyExample || '', bodyFormat: 'json', formFields }
  }

  const content = requestBody.content as Record<string, unknown> | undefined
  if (!content) {
    return { bodyContent: bodyExample || '', bodyFormat: 'json', formFields }
  }

  const contentType = detectContentType(content)
  let bodyFormat: 'json' | 'form' | 'xml' | 'text' = 'json'

  if (contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data') {
    bodyFormat = 'form'
    const formContent = (content['application/x-www-form-urlencoded'] || content['multipart/form-data']) as Record<string, unknown> | undefined
    if (formContent) {
      const schema = formContent.schema as Record<string, unknown> | undefined
      const properties = schema?.properties as Record<string, Record<string, unknown>> | undefined
      if (properties) {
        Object.keys(properties).forEach(key => {
          const prop = properties[key]
          const isFile = prop.type === 'string' && prop.format === 'binary'
          const isMultipleFile = prop.type === 'array' &&
            (prop.items as Record<string, unknown>)?.type === 'string' &&
            (prop.items as Record<string, unknown>)?.format === 'binary'

          formFields.push({
            name: key,
            type: (isFile || isMultipleFile) ? 'file' : 'text',
            value: (isFile || isMultipleFile) ? '' : String(getExampleValue(prop)),
            enabled: true,
            fromSchema: true,
            isMultipleFile,
            fileList: []
          })
        })
      }
    }
    return { bodyContent: '', bodyFormat, formFields }
  }

  if (contentType === 'application/xml' || contentType === 'text/xml') {
    bodyFormat = 'xml'
    const xmlContent = (content['application/xml'] || content['text/xml']) as Record<string, unknown> | undefined
    const example = xmlContent?.example as string | undefined
    return { bodyContent: bodyExample || example || `<?xml version="1.0" encoding="UTF-8"?>\n<root></root>`, bodyFormat, formFields }
  }

  if (contentType === 'text/plain') {
    bodyFormat = 'text'
    const textContent = content['text/plain'] as Record<string, unknown> | undefined
    const example = textContent?.example as string | undefined
    return { bodyContent: bodyExample || example || '', bodyFormat, formFields }
  }

  // 默认 JSON
  if (bodyExample) {
    return { bodyContent: bodyExample, bodyFormat: 'json', formFields }
  }

  const jsonContent = content['application/json'] as Record<string, unknown> | undefined
  if (jsonContent) {
    const schema = jsonContent.schema as Record<string, unknown> | undefined
    if (schema) {
      const example = generateExampleFromSchema(schema)
      return { bodyContent: JSON.stringify(example, null, 2), bodyFormat: 'json', formFields }
    }
  }

  return { bodyContent: JSON.stringify({ key: 'value' }, null, 2), bodyFormat: 'json', formFields }
}

/**
 * 检测请求体的 Content-Type
 */
function detectContentType(content: Record<string, unknown>): string {
  if (content['application/x-www-form-urlencoded']) return 'application/x-www-form-urlencoded'
  if (content['multipart/form-data']) return 'multipart/form-data'
  if (content['application/json']) return 'application/json'
  if (content['application/xml'] || content['text/xml']) return 'application/xml'
  if (content['text/plain']) return 'text/plain'
  return 'application/json'
}

// ========== localStorage 缓存工具 ==========

/**
 * 生成简单哈希
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * 生成 localStorage 存储 key
 */
export function getStorageKey(api: Record<string, unknown>, method: string, type: string): string {
  const tag = (api.tags as string[])?.[0] || 'default'
  const summary = (api.summary as string) || ''
  const uniqueId = `${tag}|${summary}|${method}`
  return `api_${type}_${simpleHash(uniqueId)}`
}

/**
 * 从 localStorage 恢复数据
 */
export function restoreFromStorage(api: Record<string, unknown>, method: string, type: string): unknown {
  try {
    const key = getStorageKey(api, method, type)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * 保存数据到 localStorage
 */
export function saveToStorage(api: Record<string, unknown>, method: string, type: string, data: unknown): void {
  try {
    const key = getStorageKey(api, method, type)
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // 忽略存储失败
  }
}

/**
 * 清除 localStorage 缓存
 */
export function clearStorage(api: Record<string, unknown>, method: string): void {
  try {
    ['path', 'query', 'header', 'body'].forEach(type => {
      localStorage.removeItem(getStorageKey(api, method, type))
    })
  } catch {
    // 忽略
  }
}
