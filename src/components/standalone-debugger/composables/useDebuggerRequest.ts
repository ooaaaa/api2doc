/**
 * 调试器请求逻辑 — HTTP / WebSocket / SSE / Streamable
 */
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { useHttpRequest } from '../../api-debugger/composables/useHttpRequest'
import { useWebSocket } from '../../api-debugger/composables/useWebSocket'
import { useSSE } from '../../api-debugger/composables/useSSE'
import type { InterfaceType, DebuggerFormField } from '../../api-debugger/composables/useApiToParams'
import type { UseCookieJarReturn } from '../../../composables/useCookieJar'

interface RequestContext {
  computedUrl: () => string
  currentMethod: () => string
  interfaceType: () => InterfaceType
  headerParameters: () => { name: string; value: string; enabled: boolean }[]
  cookieParameters: () => { name: string; value: string; enabled: boolean }[]
  cookieAutoInject: () => boolean
  cookieJar: UseCookieJarReturn
  bodyContent: () => string
  activeBodyTab: () => 'json' | 'form' | 'xml' | 'text'
  formFields: () => DebuggerFormField[]
}

export function useDebuggerRequest(ctx: RequestContext) {
  const http = useHttpRequest()
  const ws = useWebSocket()
  const sse = useSSE()

  // 响应状态
  const responseResult = ref('')
  const responseStatus = ref(0)
  const responseHeaders = ref<Record<string, string>>({})
  const responseTiming = ref<{ startTime?: Date; endTime?: Date; duration?: number }>({})
  const isBeautified = ref(false)
  const isImageResponse = ref(false)
  const imagePreviewUrl = ref('')
  const imageBlob = ref<Blob | null>(null)
  const imageInfo = ref('')
  const isBinaryResponse = ref(false)
  const binaryBlob = ref<Blob | null>(null)
  const binaryContentType = ref('')
  const binarySize = ref('')
  const binaryFilename = ref('')

  const wsConnected = computed(() => ws.connected.value)
  const sseConnected = computed(() => sse.connected.value)
  const hasResult = computed(() => responseResult.value !== '')

  const isActive = computed(() => {
    if (ctx.interfaceType() === 'websocket') return wsConnected.value
    if (ctx.interfaceType() === 'sse') return sseConnected.value
    return http.testing.value
  })

  const sendButtonText = computed(() => {
    if (ctx.interfaceType() === 'websocket') return wsConnected.value ? '断开' : '连接'
    if (ctx.interfaceType() === 'sse') return sseConnected.value ? '停止接收' : '开始接收'
    if (ctx.interfaceType() === 'streamable') return http.testing.value ? '停止' : '开始接收'
    return http.testing.value ? '停止' : '发送请求'
  })

  const displayResult = computed(() => {
    if (!isBeautified.value) return responseResult.value
    try { return JSON.stringify(JSON.parse(responseResult.value), null, 2) } catch { return responseResult.value }
  })

  const canBeautify = computed(() => {
    try { JSON.parse(responseResult.value); return true } catch { return false }
  })

  // 辅助方法
  const getContentType = (): string | undefined => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(ctx.currentMethod())) return undefined
    const tab = ctx.activeBodyTab()
    if (tab === 'form') {
      const hasFile = ctx.formFields().some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
      return hasFile ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
    }
    if (tab === 'json') return 'application/json'
    if (tab === 'xml') return 'application/xml'
    return 'text/plain'
  }

  const buildBody = (): string | FormData | undefined => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(ctx.currentMethod())) return undefined
    const tab = ctx.activeBodyTab()
    if (tab === 'form') {
      const fields = ctx.formFields()
      const hasFile = fields.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
      if (hasFile) {
        const fd = new FormData()
        fields.forEach(f => {
          if (f.enabled && f.name) {
            if (f.type === 'file' && f.fileList) f.fileList.forEach((file: Record<string, unknown>) => fd.append(f.name, (file.originFileObj || file) as Blob))
            else if (f.type === 'text') fd.append(f.name, f.value)
          }
        })
        return fd
      }
      const params = new URLSearchParams()
      fields.forEach(f => { if (f.enabled && f.name && f.type === 'text') params.append(f.name, f.value) })
      return params.toString()
    }
    return ctx.bodyContent() || undefined
  }

  const resetResponseState = () => {
    responseResult.value = ''
    responseStatus.value = 0
    responseHeaders.value = {}
    responseTiming.value = {}
    isBeautified.value = false
    isImageResponse.value = false
    if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
    imagePreviewUrl.value = ''
    imageBlob.value = null
    imageInfo.value = ''
    isBinaryResponse.value = false
    binaryBlob.value = null
    binaryContentType.value = ''
    binarySize.value = ''
    binaryFilename.value = ''
  }

  const extractFilename = (r: Response): string => {
    const d = r.headers.get('content-disposition')
    if (d) { const m = d.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if (m) return m[1].replace(/['"]/g, '') }
    return ''
  }

  const handleDirectResponse = async (response: Response, contentType: string) => {
    if (contentType.includes('image/')) {
      const blob = await response.blob()
      imageBlob.value = blob
      imagePreviewUrl.value = URL.createObjectURL(blob)
      imageInfo.value = `类型: ${contentType} | 大小: ${(blob.size / 1024).toFixed(2)} KB`
      responseResult.value = contentType.includes('svg') ? await blob.text() : `[图片数据 - ${contentType}]`
      isImageResponse.value = true
    } else if (contentType.includes('application/json')) {
      responseResult.value = JSON.stringify(await response.json(), null, 2)
      isBeautified.value = true
    } else if (['application/octet-stream', 'application/pdf', 'application/zip', 'audio/', 'video/'].some(t => contentType.includes(t))) {
      const blob = await response.blob()
      binaryBlob.value = blob
      binaryContentType.value = contentType
      binarySize.value = blob.size < 1024 * 1024 ? `${(blob.size / 1024).toFixed(2)} KB` : `${(blob.size / 1024 / 1024).toFixed(2)} MB`
      binaryFilename.value = extractFilename(response) || 'download'
      isBinaryResponse.value = true
      responseResult.value = `[二进制文件 - ${contentType}, ${binarySize.value}]`
    } else {
      responseResult.value = await response.text() || '(空响应)'
    }
  }

  // 请求处理
  const handleHttp = async () => {
    const url = ctx.computedUrl().trim()
    if (!url) { message.warning('请输入请求 URL'); return }
    resetResponseState()
    const headers: Record<string, string> = {}
    ctx.headerParameters().forEach(h => { if (h.enabled && h.name && h.value) headers[h.name] = h.value })

    // 注入 Cookie
    const cookieParts: string[] = []
    if (ctx.cookieAutoInject()) {
      const jarHeader = ctx.cookieJar.buildCookieHeader(url)
      if (jarHeader) cookieParts.push(jarHeader)
    }
    const manualCookies = ctx.cookieParameters()
      .filter(c => c.enabled && c.name && c.value)
      .map(c => `${c.name}=${c.value}`)
    cookieParts.push(...manualCookies)
    if (cookieParts.length > 0) headers['Cookie'] = cookieParts.join('; ')

    const body = buildBody()
    const contentType = getContentType()
    if (contentType && !(body instanceof FormData)) headers['Content-Type'] = contentType

    try {
      if (body instanceof FormData) {
        const result = await http.sendRequest(url, ctx.currentMethod(), headers, body, 'http', contentType)
        responseStatus.value = result.status
        responseTiming.value = result.timing
        const rh: Record<string, string> = {}
        result.headers.forEach((v: string, k: string) => { rh[k] = v })
        responseHeaders.value = rh
        if (rh['set-cookie']) ctx.cookieJar.parseAndStore(rh['set-cookie'], url)
        await handleDirectResponse(result.response, result.headers.get('content-type') || '')
        return
      }
      // 代理请求
      const start = Date.now()
      const proxyBody: Record<string, unknown> = { url, method: ctx.currentMethod(), headers }
      if (body !== undefined) proxyBody.body = body
      const resp = await fetch('/proxy/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proxyBody) })
      const duration = Date.now() - start
      if (!resp.ok) { const e = await resp.json(); responseResult.value = `代理请求失败: ${e.error || resp.statusText}`; return }
      const data = await resp.json()
      responseStatus.value = data.status
      responseTiming.value = { startTime: new Date(start), endTime: new Date(), duration }
      responseHeaders.value = data.headers || {}

      if (data.headers?.['set-cookie']) ctx.cookieJar.parseAndStore(data.headers['set-cookie'], url)

      const ct = (Object.entries(data.headers || {}).find(([k]) => k.toLowerCase() === 'content-type')?.[1] as string) || ''
      if (ct.startsWith('image/')) {
        const mimeType = ct.split(';')[0].trim()
        let blob: Blob
        if (data.bodyEncoding === 'base64') {
          const binary = atob(data.body)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          blob = new Blob([bytes], { type: mimeType })
          responseResult.value = `[图片数据 - ${mimeType}]`
        } else {
          blob = new Blob([data.body], { type: mimeType })
          responseResult.value = data.body
        }
        imageBlob.value = blob
        imagePreviewUrl.value = URL.createObjectURL(blob)
        imageInfo.value = `类型: ${mimeType} | 大小: ${(blob.size / 1024).toFixed(2)} KB`
        isImageResponse.value = true
      } else if (ct.includes('application/json')) {
        try { responseResult.value = JSON.stringify(JSON.parse(data.body), null, 2); isBeautified.value = true } catch { responseResult.value = data.body }
      } else {
        responseResult.value = data.body || '(空响应)'
      }
    } catch (e: unknown) {
      responseResult.value = `请求失败: ${e instanceof Error ? e.message : String(e)}`
    }
  }

  const wsMessage = ref('{}')

  const handleWebSocket = () => {
    if (wsConnected.value) { ws.close(); responseResult.value += '\n🔌 WebSocket 连接已关闭\n'; return }
    const url = ctx.computedUrl().trim().replace(/^http/, 'ws')
    if (!url) { message.warning('请输入 URL'); return }
    resetResponseState()
    responseResult.value = '🔄 正在连接 WebSocket...\n'
    ws.connect(url, {
      onOpen: () => { responseResult.value += '✅ WebSocket 连接成功\n💡 现在可以发送消息了\n\n'; responseStatus.value = 101 },
      onMessage: (e: MessageEvent) => { responseResult.value += `[${new Date().toLocaleTimeString()}] 📨 收到:\n${e.data}\n\n` },
      onError: () => { responseResult.value += '❌ WebSocket 连接错误\n' },
      onClose: () => { responseResult.value += '🔌 连接已关闭\n' }
    })
  }

  const sendWebSocketMessage = () => {
    if (!wsConnected.value) { message.error('WebSocket 未连接'); return }
    try { JSON.parse(wsMessage.value) } catch { message.error('请输入有效的 JSON'); return }
    if (ws.send(wsMessage.value)) {
      responseResult.value += `[${new Date().toLocaleTimeString()}] 📤 发送:\n${wsMessage.value}\n\n`
    }
  }

  const handleSSE = () => {
    if (sseConnected.value) { sse.close(); responseResult.value += '\n🔌 SSE 连接已关闭\n'; return }
    const url = ctx.computedUrl().trim()
    if (!url) { message.warning('请输入 URL'); return }
    resetResponseState()
    responseResult.value = '📡 正在连接 SSE...\n'
    sse.connect(url, {
      onMessage: (e: MessageEvent) => { responseResult.value += `[${new Date().toLocaleTimeString()}] 📨 收到:\n${e.data}\n\n` },
      onError: () => { responseResult.value += '❌ SSE 连接错误\n'; sse.close(true) }
    })
    setTimeout(() => { if (sseConnected.value) { responseResult.value += '✅ SSE 连接成功，正在接收...\n\n'; responseStatus.value = 200 } }, 100)
  }

  const handleStreamable = async () => {
    const url = ctx.computedUrl().trim()
    if (!url) { message.warning('请输入 URL'); return }
    resetResponseState()
    responseResult.value = '📡 正在连接流式传输...\n'
    http.testing.value = true
    http.abortController.value = new AbortController()
    try {
      const resp = await fetch(url, { signal: http.abortController.value.signal })
      responseStatus.value = resp.status
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      responseResult.value += '✅ 连接成功，正在接收...\n\n'
      const reader = resp.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) { responseResult.value += '\n✅ 流式传输完成\n'; break }
          responseResult.value += `[${new Date().toLocaleTimeString()}] 📦 ${decoder.decode(value, { stream: true })}\n\n`
        }
        reader.releaseLock()
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('abort') || msg.includes('Abort')) responseResult.value += '\n⏹ 已停止\n'
      else responseResult.value += `❌ 错误: ${msg}\n`
    } finally {
      http.testing.value = false
      http.abortController.value = null
    }
  }

  const handleSendOrConnect = () => {
    switch (ctx.interfaceType()) {
      case 'websocket': handleWebSocket(); break
      case 'sse': handleSSE(); break
      case 'streamable': handleStreamable(); break
      default: handleHttp(); break
    }
  }

  const handleAbort = () => {
    if (ctx.interfaceType() === 'websocket') { ws.close(); responseResult.value += '\n🔌 WebSocket 连接已关闭\n' }
    else if (ctx.interfaceType() === 'sse') { sse.close(); responseResult.value += '\n🔌 SSE 连接已关闭\n' }
    else { http.abort(); responseResult.value += '\n⏹ 请求已终止\n' }
  }

  const closeAllConnections = (silent = false) => { http.abort(); ws.close(silent); sse.close(silent) }

  // 响应操作
  const copyResponse = async () => {
    try { await navigator.clipboard.writeText(displayResult.value); message.success('已复制') } catch { message.error('复制失败') }
  }
  const beautifyResponse = () => { isBeautified.value = !isBeautified.value }
  const clearResult = () => { resetResponseState() }
  const downloadImage = () => {
    if (!imageBlob.value) return
    const u = URL.createObjectURL(imageBlob.value)
    const a = document.createElement('a'); a.href = u; a.download = 'image'; a.click()
    URL.revokeObjectURL(u)
  }
  const downloadBinary = () => {
    if (!binaryBlob.value) return
    const u = URL.createObjectURL(binaryBlob.value)
    const a = document.createElement('a'); a.href = u; a.download = binaryFilename.value || 'download'; a.click()
    URL.revokeObjectURL(u)
  }

  return {
    // 响应状态
    responseResult, responseStatus, responseHeaders, responseTiming,
    isBeautified, isImageResponse, imagePreviewUrl, imageBlob, imageInfo,
    isBinaryResponse, binaryBlob, binaryContentType, binarySize, binaryFilename,
    wsConnected, sseConnected, hasResult, isActive, sendButtonText,
    displayResult, canBeautify, wsMessage,
    // 方法
    getContentType, handleSendOrConnect, handleAbort,
    sendWebSocketMessage, closeAllConnections, resetResponseState,
    copyResponse, beautifyResponse, clearResult, downloadImage, downloadBinary
  }
}
