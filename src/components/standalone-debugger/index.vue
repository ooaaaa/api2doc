<template>
  <div class="standalone-debugger">
    <!-- 顶部标题栏（仅独立页面模式显示） -->
    <div v-if="!embedded" class="debugger-toolbar">
      <div class="toolbar-left">
        <Api2DocLogo :size="22" :show-text="true" :small="true" />
        <div class="toolbar-divider"></div>
        <span class="toolbar-title">API 调试器</span>
      </div>
      <div class="toolbar-right">
        <a-button size="small" type="primary" @click="resetAll" class="action-btn">
          重置
        </a-button>
        <a class="toolbar-btn back-link" :href="basePath" title="返回文档页">
          返回文档
        </a>
      </div>
    </div>

    <!-- 嵌入模式的头部 -->
    <div v-if="embedded" class="embedded-header">
      <span class="header-label">请求配置</span>
      <div class="header-actions">
        <a-button size="small" type="primary" @click="resetAll" class="action-btn">
          重置
        </a-button>
        <a-button size="small" type="primary" @click="$emit('toggleCode')" class="action-btn">
          代码
        </a-button>
      </div>
    </div>

    <!-- URL 栏 -->
    <div class="url-section" :class="{ 'url-section-embedded': embedded }">
      <div class="url-bar">
        <a-select v-model:value="currentMethod" class="method-select">
          <a-select-option v-for="method in availableMethods" :key="method" :value="method">
            {{ method }}
          </a-select-option>
        </a-select>
        <a-input
          v-model:value="editableUrl"
          class="url-input"
          :placeholder="embedded ? '请求 URL' : '输入请求 URL，例如 https://api.example.com/users'"
          @pressEnter="handleSendOrConnect"
          @blur="syncUrlToParams"
        />
        <a-button
          :type="isActive ? 'default' : 'primary'"
          :danger="isActive"
          @click="isActive ? handleAbort() : handleSendOrConnect()"
          class="send-btn"
        >
          {{ sendButtonText }}
        </a-button>
      </div>
      <!-- 特殊接口提示 -->
      <a-alert
        v-if="isSpecialInterface"
        :message="specialInterfaceTip"
        type="info"
        show-icon
        style="margin-top: 12px"
      />
    </div>

    <!-- 主体区域 -->
    <div class="debugger-body" :class="{ 'debugger-body-embedded': embedded }">
      <!-- 左侧：请求配置（折叠面板） -->
      <div class="request-panel" :class="{ 'request-panel-embedded': embedded }">
        <div class="request-sections">
          <!-- Query 参数区块 -->
          <div class="request-section">
            <div class="section-header" @click="toggleSection('query')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.query }">&#9654;</span>
              <span class="section-title">Query 参数</span>
              <span class="section-badge" v-if="enabledQueryCount > 0">{{ enabledQueryCount }}</span>
            </div>
            <div v-show="expandedSections.query" class="section-content">
              <RequestParams
                v-model:parameters="queryParameters"
                type="query"
                add-button-text="添加参数"
                @add="addQueryParam"
                @remove="removeQueryParam"
              />
            </div>
          </div>

          <!-- Path 参数区块（仅有 path 参数时显示） -->
          <div v-if="pathParameters.length > 0" class="request-section">
            <div class="section-header" @click="toggleSection('path')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.path }">&#9654;</span>
              <span class="section-title">Path 参数</span>
              <span class="section-badge">{{ pathParameters.length }}</span>
            </div>
            <div v-show="expandedSections.path" class="section-content">
              <RequestParams
                v-model:parameters="pathParameters"
                type="path"
              />
            </div>
          </div>

          <!-- 请求头区块 -->
          <div class="request-section">
            <div class="section-header" @click="toggleSection('headers')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.headers }">&#9654;</span>
              <span class="section-title">请求头</span>
              <span class="section-badge" v-if="enabledHeadersCount > 0">{{ enabledHeadersCount }}</span>
            </div>
            <div v-show="expandedSections.headers" class="section-content">
              <RequestParams
                v-model:parameters="headerParameters"
                type="header"
                add-button-text="添加 Header"
                @add="addHeaderParam"
                @remove="removeHeaderParam"
              />
            </div>
          </div>

          <!-- 请求体区块（非特殊接口时显示） -->
          <div v-if="!isSpecialInterface" class="request-section">
            <div class="section-header" @click="toggleSection('body')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.body }">&#9654;</span>
              <span class="section-title">请求体</span>
              <div class="section-header-actions" @click.stop>
                <a-select
                  v-model:value="activeBodyTab"
                  size="small"
                  class="body-format-select"
                >
                  <a-select-option value="json">JSON</a-select-option>
                  <a-select-option value="form">Form</a-select-option>
                  <a-select-option value="xml">XML</a-select-option>
                  <a-select-option value="text">Text</a-select-option>
                </a-select>
              </div>
            </div>
            <div v-show="expandedSections.body" class="section-content">
              <RequestBody
                v-model:active-body-tab="activeBodyTab"
                v-model:body-content="bodyContent"
                v-model:form-fields="formFields"
                @add-form-field="addFormField"
                @remove-form-field="removeFormField"
                @file-change="handleFileChange"
              />
            </div>
          </div>

          <!-- WebSocket 消息输入（连接后显示） -->
          <div v-if="interfaceType === 'websocket' && wsConnected" class="ws-message-section">
            <CodeEditor
              v-model="wsMessage"
              language="json"
              :readonly="false"
              min-height="100px"
              max-height="200px"
            />
            <a-button type="primary" @click="sendWebSocketMessage" style="margin-top: 8px">
              发送消息
            </a-button>
          </div>
        </div>
      </div>

      <!-- 右侧：响应结果 -->
      <div class="response-panel" :class="{ 'response-panel-embedded': embedded }">
        <ResponseViewer
          v-if="hasResult"
          :result="responseResult"
          :display-result="displayResult"
          :status="responseStatus"
          :can-beautify="canBeautify"
          :is-image-response="isImageResponse"
          :image-preview-url="imagePreviewUrl"
          :image-info="imageInfo"
          :is-special-interface="isSpecialInterface"
          :is-binary-response="isBinaryResponse"
          :binary-content-type="binaryContentType"
          :binary-size="binarySize"
          :binary-filename="binaryFilename"
          :duration="responseTiming.duration"
          :response-headers="responseHeaders"
          :request-method="currentMethod"
          :request-url="computedUrl"
          :request-headers="actualRequestHeaders"
          :request-body="bodyContent"
          @copy="copyResponse"
          @beautify="beautifyResponse"
          @clear="clearResult"
          @maximize="maximizedModalVisible = true"
          @download-image="downloadImage"
          @download-binary="downloadBinary"
        />
        <div v-else class="empty-response">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="empty-text">发送请求后查看响应结果</p>
        </div>
      </div>
    </div>

    <!-- 最大化弹窗 -->
    <a-modal
      v-model:open="maximizedModalVisible"
      title="响应结果"
      width="90%"
      :footer="null"
      :bodyStyle="{ padding: '16px', maxHeight: '80vh', overflow: 'auto' }"
    >
      <ResponseViewer
        v-if="hasResult"
        :result="responseResult"
        :display-result="displayResult"
        :status="responseStatus"
        :can-beautify="canBeautify"
        :is-image-response="isImageResponse"
        :image-preview-url="imagePreviewUrl"
        :image-info="imageInfo"
        :is-special-interface="isSpecialInterface"
        :is-binary-response="isBinaryResponse"
        :binary-content-type="binaryContentType"
        :binary-size="binarySize"
        :binary-filename="binaryFilename"
        :duration="responseTiming.duration"
        :response-headers="responseHeaders"
        :request-method="currentMethod"
        :request-url="computedUrl"
        :request-headers="actualRequestHeaders"
        :request-body="bodyContent"
        @copy="copyResponse"
        @beautify="beautifyResponse"
        @clear="clearResult"
        @maximize="() => {}"
        @download-image="downloadImage"
        @download-binary="downloadBinary"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import RequestParams from '../api-debugger/RequestParams.vue'
import RequestBody from '../api-debugger/RequestBody/index.vue'
import ResponseViewer from '../api-debugger/ResponseViewer.vue'
import CodeEditor from '../CodeEditor.vue'
import Api2DocLogo from '../Api2DocLogo.vue'
import { useHttpRequest } from '../api-debugger/composables/useHttpRequest'
import { useWebSocket } from '../api-debugger/composables/useWebSocket'
import { useSSE } from '../api-debugger/composables/useSSE'
import { parseApiToParams, detectInterfaceType, saveToStorage, restoreFromStorage, clearStorage } from '../api-debugger/composables/useApiToParams'
import type { DebuggerParameter, DebuggerFormField, InterfaceType } from '../api-debugger/composables/useApiToParams'
import type { UploadChangeParam } from 'ant-design-vue'

interface Props {
  embedded?: boolean
  api?: Record<string, unknown>
  baseUrl?: string
  bodyExample?: string
}

const props = withDefaults(defineProps<Props>(), {
  embedded: false,
  api: undefined,
  baseUrl: '',
  bodyExample: undefined
})

defineEmits<{ toggleCode: [] }>()

const http = useHttpRequest()
const ws = useWebSocket()
const sse = useSSE()
const basePath = import.meta.env.BASE_URL || '/'
const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

// 状态
const currentMethod = ref('GET')
const requestUrl = ref('')
const editableUrl = ref('')
const activeBodyTab = ref<'json' | 'form' | 'xml' | 'text'>('json')
const bodyContent = ref('')
const maximizedModalVisible = ref(false)
const wsMessage = ref('{}')

const expandedSections = ref({ query: false, path: false, headers: false, body: false })
const pathParameters = ref<DebuggerParameter[]>([])
const queryParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const headerParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const formFields = ref<DebuggerFormField[]>([])

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

// 计算属性
const interfaceType = computed<InterfaceType>(() => {
  if (props.api) {
    return detectInterfaceType(computedUrl.value, (props.api.summary as string) || '')
  }
  return 'http'
})
const isSpecialInterface = computed(() => interfaceType.value !== 'http')
const wsConnected = computed(() => ws.connected.value)
const sseConnected = computed(() => sse.connected.value)

const isActive = computed(() => {
  if (interfaceType.value === 'websocket') return wsConnected.value
  if (interfaceType.value === 'sse') return sseConnected.value
  return http.testing.value
})

const hasResult = computed(() => responseResult.value !== '')
const enabledQueryCount = computed(() => queryParameters.value.filter(p => p.enabled && p.name && p.value).length)
const enabledHeadersCount = computed(() => headerParameters.value.filter(h => h.enabled && h.name && h.value).length)

const availableMethods = computed(() => {
  if (props.api?.method === 'MULTI' && Array.isArray(props.api.methodList)) {
    return props.api.methodList as string[]
  }
  if (props.api?.method) {
    const m = props.api.method as string
    return [m, ...allMethods.filter(x => x !== m)]
  }
  return allMethods
})

const computedUrl = computed(() => {
  if (!props.api) return requestUrl.value
  let url = `${props.baseUrl}${props.api.path as string}`
  pathParameters.value.forEach(p => { url = url.replace(`{${p.name}}`, p.value || 'value') })
  const enabled = queryParameters.value.filter(p => p.enabled && p.name && p.value)
  if (enabled.length > 0) {
    url += '?' + enabled.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&')
  }
  return url
})

const displayResult = computed(() => {
  if (!isBeautified.value) return responseResult.value
  try { return JSON.stringify(JSON.parse(responseResult.value), null, 2) } catch { return responseResult.value }
})
const canBeautify = computed(() => { try { JSON.parse(responseResult.value); return true } catch { return false } })

const actualRequestHeaders = computed(() => {
  const h: Record<string, string> = {}
  headerParameters.value.forEach(x => { if (x.enabled && x.name && x.value) h[x.name] = x.value })
  return h
})

const sendButtonText = computed(() => {
  if (interfaceType.value === 'websocket') return wsConnected.value ? '断开' : '连接'
  if (interfaceType.value === 'sse') return sseConnected.value ? '停止接收' : '开始接收'
  if (interfaceType.value === 'streamable') return http.testing.value ? '停止' : '开始接收'
  return http.testing.value ? '停止' : '发送请求'
})

const specialInterfaceTip = computed(() => {
  if (interfaceType.value === 'websocket') return 'WebSocket 双向通信接口，点击"连接"建立连接后可发送消息'
  if (interfaceType.value === 'sse') return 'Server-Sent Events 服务器推送接口，点击"开始接收"后将持续接收服务器消息'
  if (interfaceType.value === 'streamable') return 'HTTP 流式传输接口，点击"开始接收"后将持续接收数据流'
  return ''
})

// 同步 editableUrl
watch(computedUrl, (v) => { editableUrl.value = v }, { immediate: true })
watch(requestUrl, (v) => { if (!props.api) editableUrl.value = v })

const syncUrlToParams = () => {
  if (!props.api) { requestUrl.value = editableUrl.value; return }
  try {
    const urlObj = new URL(editableUrl.value)
    const searchParams = new URLSearchParams(urlObj.search)
    queryParameters.value.forEach(param => {
      const v = searchParams.get(param.name)
      if (v !== null) { param.value = v; param.enabled = true }
    })
  } catch { /* 忽略 */ }
}

// ========== 初始化 ==========
const initFromApi = () => {
  if (!props.api || !props.baseUrl) return
  const parsed = parseApiToParams(props.api, props.baseUrl, props.bodyExample)
  currentMethod.value = parsed.method
  pathParameters.value = parsed.pathParameters
  queryParameters.value = parsed.queryParameters.length > 0 ? parsed.queryParameters : [{ name: '', value: '', enabled: true }]
  headerParameters.value = parsed.headerParameters.length > 0 ? parsed.headerParameters : [{ name: '', value: '', enabled: true }]
  bodyContent.value = parsed.bodyContent
  activeBodyTab.value = parsed.bodyFormat
  formFields.value = parsed.formFields
  expandedSections.value = parsed.expandedSections

  // 尝试从缓存恢复
  const savedBody = restoreFromStorage(props.api, currentMethod.value, 'body')
  if (savedBody) bodyContent.value = savedBody as string
}

watch(() => props.api, () => {
  if (props.api) { initFromApi(); resetResponseState(); closeAllConnections(true) }
}, { immediate: true })

// 缓存参数变化
watch([pathParameters, queryParameters, headerParameters, bodyContent], () => {
  if (!props.api) return
  saveToStorage(props.api, currentMethod.value, 'path', pathParameters.value)
  saveToStorage(props.api, currentMethod.value, 'query', queryParameters.value)
  saveToStorage(props.api, currentMethod.value, 'header', headerParameters.value)
  saveToStorage(props.api, currentMethod.value, 'body', bodyContent.value)
}, { deep: true })

// ========== 请求逻辑 ==========
const getFullUrl = (): string => {
  if (props.api) return computedUrl.value
  let url = requestUrl.value.trim()
  if (!url) return ''
  const enabled = queryParameters.value.filter(p => p.enabled && p.name && p.value)
  if (enabled.length > 0) {
    const sep = url.includes('?') ? '&' : '?'
    url += sep + enabled.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&')
  }
  return url
}

const getContentType = (): string | undefined => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(currentMethod.value)) return undefined
  if (activeBodyTab.value === 'form') {
    const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
    return hasFile ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
  }
  if (activeBodyTab.value === 'json') return 'application/json'
  if (activeBodyTab.value === 'xml') return 'application/xml'
  return 'text/plain'
}

const buildBody = (): string | FormData | undefined => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(currentMethod.value)) return undefined
  if (activeBodyTab.value === 'form') {
    const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
    if (hasFile) {
      const fd = new FormData()
      formFields.value.forEach(f => {
        if (f.enabled && f.name) {
          if (f.type === 'file' && f.fileList) f.fileList.forEach((file: Record<string, unknown>) => fd.append(f.name, (file.originFileObj || file) as Blob))
          else if (f.type === 'text') fd.append(f.name, f.value)
        }
      })
      return fd
    }
    const params = new URLSearchParams()
    formFields.value.forEach(f => { if (f.enabled && f.name && f.type === 'text') params.append(f.name, f.value) })
    return params.toString()
  }
  return bodyContent.value || undefined
}

const handleSendOrConnect = () => {
  switch (interfaceType.value) {
    case 'websocket': handleWebSocket(); break
    case 'sse': handleSSE(); break
    case 'streamable': handleStreamable(); break
    default: handleHttp(); break
  }
}

const handleAbort = () => {
  if (interfaceType.value === 'websocket') { ws.close(); responseResult.value += '\n🔌 WebSocket 连接已关闭\n' }
  else if (interfaceType.value === 'sse') { sse.close(); responseResult.value += '\n🔌 SSE 连接已关闭\n' }
  else { http.abort(); responseResult.value += '\n⏹ 请求已终止\n' }
}

const handleHttp = async () => {
  const url = getFullUrl()
  if (!url) { message.warning('请输入请求 URL'); return }
  resetResponseState()
  const headers: Record<string, string> = {}
  headerParameters.value.forEach(h => { if (h.enabled && h.name && h.value) headers[h.name] = h.value })
  const body = buildBody()
  const contentType = getContentType()
  if (contentType && !(body instanceof FormData)) headers['Content-Type'] = contentType

  try {
    if (body instanceof FormData) {
      const result = await http.sendRequest(url, currentMethod.value, headers, body, 'http', contentType)
      responseStatus.value = result.status; responseTiming.value = result.timing
      const rh: Record<string, string> = {}; result.headers.forEach((v: string, k: string) => { rh[k] = v }); responseHeaders.value = rh
      await handleDirectResponse(result.response, result.headers.get('content-type') || '')
      return
    }
    // 代理请求
    const start = Date.now()
    const proxyBody: Record<string, unknown> = { url, method: currentMethod.value, headers }
    if (body !== undefined) proxyBody.body = body
    const resp = await fetch('/proxy/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(proxyBody) })
    const duration = Date.now() - start
    if (!resp.ok) { const e = await resp.json(); responseResult.value = `代理请求失败: ${e.error || resp.statusText}`; return }
    const data = await resp.json()
    responseStatus.value = data.status
    responseTiming.value = { startTime: new Date(start), endTime: new Date(), duration }
    responseHeaders.value = data.headers || {}
    const ct = data.headers?.['content-type'] || ''
    if (ct.includes('application/json')) {
      try { responseResult.value = JSON.stringify(JSON.parse(data.body), null, 2); isBeautified.value = true } catch { responseResult.value = data.body }
    } else { responseResult.value = data.body || '(空响应)' }
  } catch (e: unknown) {
    responseResult.value = `请求失败: ${e instanceof Error ? e.message : String(e)}`
  }
}

const handleWebSocket = () => {
  if (wsConnected.value) { ws.close(); responseResult.value += '\n🔌 WebSocket 连接已关闭\n'; return }
  const url = getFullUrl().replace(/^http/, 'ws')
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
  if (ws.send(wsMessage.value)) { responseResult.value += `[${new Date().toLocaleTimeString()}] 📤 发送:\n${wsMessage.value}\n\n` }
}

const handleSSE = () => {
  if (sseConnected.value) { sse.close(); responseResult.value += '\n🔌 SSE 连接已关闭\n'; return }
  const url = getFullUrl()
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
  const url = getFullUrl()
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
  } finally { http.testing.value = false; http.abortController.value = null }
}

const handleDirectResponse = async (response: Response, contentType: string) => {
  if (contentType.includes('image/')) {
    const blob = await response.blob(); imageBlob.value = blob; imagePreviewUrl.value = URL.createObjectURL(blob)
    imageInfo.value = `类型: ${contentType} | 大小: ${(blob.size / 1024).toFixed(2)} KB`
    responseResult.value = contentType.includes('svg') ? await blob.text() : `[图片数据 - ${contentType}]`; isImageResponse.value = true
  } else if (contentType.includes('application/json')) {
    responseResult.value = JSON.stringify(await response.json(), null, 2); isBeautified.value = true
  } else if (['application/octet-stream','application/pdf','application/zip','audio/','video/'].some(t => contentType.includes(t))) {
    const blob = await response.blob(); binaryBlob.value = blob; binaryContentType.value = contentType
    binarySize.value = blob.size < 1024*1024 ? `${(blob.size/1024).toFixed(2)} KB` : `${(blob.size/1024/1024).toFixed(2)} MB`
    binaryFilename.value = extractFilename(response) || 'download'; isBinaryResponse.value = true
    responseResult.value = `[二进制文件 - ${contentType}, ${binarySize.value}]`
  } else { responseResult.value = await response.text() || '(空响应)' }
}

const extractFilename = (r: Response): string => {
  const d = r.headers.get('content-disposition')
  if (d) { const m = d.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if (m) return m[1].replace(/['"]/g, '') }
  return ''
}

const closeAllConnections = (silent = false) => { http.abort(); ws.close(silent); sse.close(silent) }

// ========== 状态管理 ==========
const resetResponseState = () => {
  responseResult.value = ''; responseStatus.value = 0; responseHeaders.value = {}; responseTiming.value = {}; isBeautified.value = false
  isImageResponse.value = false; if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = ''; imageBlob.value = null; imageInfo.value = ''
  isBinaryResponse.value = false; binaryBlob.value = null; binaryContentType.value = ''; binarySize.value = ''; binaryFilename.value = ''
}

const toggleSection = (s: keyof typeof expandedSections.value) => { expandedSections.value[s] = !expandedSections.value[s] }
const addQueryParam = () => { queryParameters.value.push({ name: '', value: '', enabled: true }) }
const removeQueryParam = (i: number) => { queryParameters.value.splice(i, 1) }
const addHeaderParam = () => { headerParameters.value.push({ name: '', value: '', enabled: true }) }
const removeHeaderParam = (i: number) => { headerParameters.value.splice(i, 1) }
const addFormField = () => { formFields.value.push({ name: '', value: '', type: 'text', enabled: true, fromSchema: false }) }
const removeFormField = (i: number) => { formFields.value.splice(i, 1) }
const handleFileChange = ({ info, index }: { info: UploadChangeParam; index: number }) => { if (formFields.value[index]) formFields.value[index].fileList = info.fileList }

const copyResponse = async () => { try { await navigator.clipboard.writeText(displayResult.value); message.success('已复制') } catch { message.error('复制失败') } }
const beautifyResponse = () => { isBeautified.value = !isBeautified.value }
const clearResult = () => { resetResponseState() }
const downloadImage = () => { if (!imageBlob.value) return; const u = URL.createObjectURL(imageBlob.value); const a = document.createElement('a'); a.href = u; a.download = 'image'; a.click(); URL.revokeObjectURL(u) }
const downloadBinary = () => { if (!binaryBlob.value) return; const u = URL.createObjectURL(binaryBlob.value); const a = document.createElement('a'); a.href = u; a.download = binaryFilename.value || 'download'; a.click(); URL.revokeObjectURL(u) }

const resetAll = () => {
  if (props.api) { clearStorage(props.api, currentMethod.value); initFromApi() } else {
    currentMethod.value = 'GET'; requestUrl.value = ''; queryParameters.value = [{ name: '', value: '', enabled: true }]
    headerParameters.value = [{ name: '', value: '', enabled: true }]; bodyContent.value = ''; formFields.value = []; pathParameters.value = []
    activeBodyTab.value = 'json'; expandedSections.value = { query: false, path: false, headers: false, body: false }
  }
  resetResponseState()
}

onUnmounted(() => { closeAllConnections(true) })
</script>

