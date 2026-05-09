<template>
  <div class="standalone-debugger" :class="{ 'is-embedded': embedded }">
    <!-- 顶部标题栏（仅独立页面模式显示） -->
    <div v-if="!embedded" class="debugger-toolbar">
      <div class="toolbar-left">
        <Api2DocLogo :size="22" :show-text="true" :small="true" />
        <div class="toolbar-divider"></div>
        <span class="toolbar-title">API 调试器</span>
      </div>
      <div class="toolbar-right">
        <a-button size="small" @click="openCurlImport" class="action-btn">
          导入 cURL
        </a-button>
        <a-button size="small" @click="copyAsCurl" class="action-btn">
          复制 cURL
        </a-button>
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
        <a-button size="small" @click="openCurlImport" class="action-btn">
          导入 cURL
        </a-button>
        <a-button size="small" @click="copyAsCurl" class="action-btn">
          复制 cURL
        </a-button>
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
        />
        <a-tooltip title="解析 URL 到参数面板">
          <a-button
            size="small"
            @click="syncUrlToParams"
            class="parse-url-btn"
          >
            解析
          </a-button>
        </a-tooltip>
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

          <!-- Path 参数区块 -->
          <div class="request-section">
            <div class="section-header" @click="toggleSection('path')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.path }">&#9654;</span>
              <span class="section-title">Path 参数</span>
              <span class="section-badge" v-if="pathParameters.length > 0">{{ pathParameters.length }}</span>
            </div>
            <div v-show="expandedSections.path" class="section-content">
              <RequestParams
                v-model:parameters="pathParameters"
                type="path"
                add-button-text="添加 Path 参数"
                @add="addPathParam"
                @remove="removePathParam"
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

          <!-- Cookie 区块 -->
          <div class="request-section">
            <div class="section-header" @click="toggleSection('cookies')">
              <span class="collapse-icon" :class="{ expanded: expandedSections.cookies }">&#9654;</span>
              <span class="section-title">Cookie</span>
              <span class="section-badge" v-if="enabledCookieCount > 0">{{ enabledCookieCount }}</span>
            </div>
            <div v-show="expandedSections.cookies" class="section-content">
              <RequestCookies
                v-model:cookies="cookieParameters"
                v-model:auto-inject="cookieAutoInject"
                :request-url="computedUrl"
                @add="addCookieParam"
                @remove="removeCookieParam"
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
          @use-cookie="handleUseCookie"
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

    <!-- 请求完整过程（与请求/响应同级，响应成功后展示） -->
    <div v-if="hasResult && !isSpecialInterface" class="full-transaction-panel" :class="{ 'full-transaction-embedded': embedded }">
      <div class="transaction-header" @click="transactionExpanded = !transactionExpanded">
        <span class="collapse-icon" :class="{ expanded: transactionExpanded }">&#9654;</span>
        <span class="transaction-title">请求完整过程</span>
        <span class="transaction-meta">
          {{ currentMethod }} {{ transactionRequestPath }} → {{ responseStatus }} {{ transactionStatusText }}
        </span>
        <div class="transaction-actions" @click.stop>
          <a-button size="small" type="text" @click="copyFullTransaction" class="action-btn">
            复制全部
          </a-button>
        </div>
      </div>
      <div v-show="transactionExpanded" class="transaction-content">
        <div class="transaction-blocks">
          <!-- 请求报文 -->
          <div class="transaction-block">
            <div class="transaction-block-label">Request</div>
            <pre class="transaction-raw"><span class="raw-request-line">{{ transactionRequestLine }}</span>
<template v-for="(value, key) in actualRequestHeaders" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="bodyContent">
<span class="raw-body">{{ bodyContent }}</span></template></pre>
          </div>
          <!-- 响应报文 -->
          <div class="transaction-block">
            <div class="transaction-block-label">Response</div>
            <pre class="transaction-raw"><span class="raw-status-line">HTTP/1.1 {{ responseStatus }} {{ transactionStatusText }}</span>
<template v-for="(value, key) in responseHeaders" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="responseResult">
<span class="raw-body">{{ transactionResponseBody }}</span></template></pre>
          </div>
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
        @use-cookie="handleUseCookie"
      />
    </a-modal>

    <!-- cURL 导入弹窗 -->
    <a-modal
      v-model:open="curlImportVisible"
      title="导入 cURL"
      :width="600"
      :mask-closable="false"
      :keyboard="false"
      @ok="handleCurlImport"
      ok-text="导入"
      cancel-text="取消"
    >
      <p class="curl-import-tip">粘贴 cURL 命令，将自动解析为请求参数</p>
      <a-textarea
        v-model:value="curlImportText"
        :rows="10"
        placeholder="curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -d '{&quot;name&quot;: &quot;test&quot;}'"
        class="curl-import-textarea"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import RequestParams from '../api-debugger/RequestParams.vue'
import RequestCookies from '../api-debugger/RequestCookies.vue'
import RequestBody from '../api-debugger/RequestBody/index.vue'
import ResponseViewer from '../api-debugger/ResponseViewer.vue'
import CodeEditor from '../CodeEditor.vue'
import Api2DocLogo from '../Api2DocLogo.vue'
import { useHttpRequest } from '../api-debugger/composables/useHttpRequest'
import { useWebSocket } from '../api-debugger/composables/useWebSocket'
import { useSSE } from '../api-debugger/composables/useSSE'
import { useCookieJar } from '../../composables/useCookieJar'
import { parseApiToParams, detectInterfaceType, saveToStorage, restoreFromStorage, clearStorage } from '../api-debugger/composables/useApiToParams'
import type { DebuggerParameter, DebuggerFormField, InterfaceType } from '../api-debugger/composables/useApiToParams'
import type { UploadChangeParam } from 'ant-design-vue'
import { parseCurl } from '../../utils/curl-parser'

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
const transactionExpanded = ref(false)

const expandedSections = ref({ query: false, path: false, headers: false, cookies: false, body: false })
const pathParameters = ref<DebuggerParameter[]>([])
const queryParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const headerParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const formFields = ref<DebuggerFormField[]>([])

// Cookie 相关状态
const cookieJar = useCookieJar()
const cookieParameters = ref<{ name: string; value: string; enabled: boolean }[]>([{ name: '', value: '', enabled: true }])
const cookieAutoInject = ref(true)

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
const enabledCookieCount = computed(() => {
  const manual = cookieParameters.value.filter(c => c.enabled && c.name && c.value).length
  const jar = cookieAutoInject.value ? cookieJar.getMatchingCookies(computedUrl.value).length : 0
  return manual + jar
})

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
  if (!props.api) {
    let url = requestUrl.value
    // 独立模式：将 path 参数替换到 URL 中
    pathParameters.value.forEach(p => {
      if (p.name && p.value && p.enabled) {
        url = url.replace(`{${p.name}}`, encodeURIComponent(p.value))
      }
    })
    const enabled = queryParameters.value.filter(p => p.enabled && p.name && p.value)
    if (enabled.length > 0) {
      const sep = url.includes('?') ? '&' : '?'
      url += sep + enabled.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&')
    }
    return url
  }
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

// 请求完整过程相关
const transactionStatusText = computed(() => {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed',
    500: 'Internal Server Error', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout'
  }
  return map[responseStatus.value] || (responseStatus.value >= 200 && responseStatus.value < 300 ? 'OK' : 'Error')
})

const transactionRequestPath = computed(() => {
  try {
    const url = new URL(computedUrl.value)
    return url.pathname + url.search
  } catch {
    return computedUrl.value
  }
})

const transactionRequestLine = computed(() => {
  return `${currentMethod.value} ${transactionRequestPath.value} HTTP/1.1`
})

const transactionResponseBody = computed(() => {
  try {
    const parsed = JSON.parse(responseResult.value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return responseResult.value
  }
})

const copyFullTransaction = async () => {
  let text = `${transactionRequestLine.value}\n`
  Object.entries(actualRequestHeaders.value).forEach(([key, value]) => {
    text += `${key}: ${value}\n`
  })
  if (bodyContent.value) {
    text += `\n${bodyContent.value}\n`
  }
  text += `\n---\n\n`
  text += `HTTP/1.1 ${responseStatus.value} ${transactionStatusText.value}\n`
  Object.entries(responseHeaders.value).forEach(([key, value]) => {
    text += `${key}: ${value}\n`
  })
  if (responseResult.value) {
    text += `\n${transactionResponseBody.value}\n`
  }
  try {
    await navigator.clipboard.writeText(text)
    message.success('请求完整过程已复制')
  } catch {
    message.error('复制失败')
  }
}

// 同步 editableUrl
let isSyncingFromComputed = false
watch(computedUrl, (v) => { isSyncingFromComputed = true; editableUrl.value = v }, { immediate: true })
watch(requestUrl, (v) => { if (!props.api) { isSyncingFromComputed = true; editableUrl.value = v } })

const syncUrlToParams = () => {
  if (!props.api) {
    // 独立模式：解析 URL 到 requestUrl，并提取 path 占位符
    const url = editableUrl.value.trim()
    if (!url) { requestUrl.value = ''; return }
    try {
      const urlObj = new URL(url)
      const pathname = decodeURIComponent(urlObj.pathname)
      // 提取 query 参数
      const entries = [...new URLSearchParams(urlObj.search).entries()]
      if (entries.length > 0) {
        queryParameters.value = entries.map(([name, value]) => ({ name, value, enabled: true }))
        queryParameters.value.push({ name: '', value: '', enabled: true })
      }
      // 提取 path 占位符 {paramName}
      const pathMatches = [...pathname.matchAll(/\{([^}]+)\}/g)]
      if (pathMatches.length > 0) {
        const newNames = pathMatches.map(m => m[1])
        const existingMap = new Map(pathParameters.value.map(p => [p.name, p]))
        pathParameters.value = newNames.map(name => existingMap.get(name) || { name, value: '', enabled: true })
        expandedSections.value.path = true
      }
      // requestUrl 保留原始模板（含占位符）
      requestUrl.value = urlObj.origin + pathname
    } catch {
      requestUrl.value = url
    }
    return
  }
  try {
    const urlObj = new URL(editableUrl.value)
    // 解析 query 参数：更新已有参数并添加 URL 中新出现的参数
    const searchParams = new URLSearchParams(urlObj.search)
    const existingNames = new Set(queryParameters.value.map(p => p.name).filter(Boolean))
    queryParameters.value.forEach(param => {
      if (!param.name) return
      const v = searchParams.get(param.name)
      if (v !== null) { param.value = v; param.enabled = true }
    })
    // 将 URL 中新增的 query 参数追加到列表
    searchParams.forEach((value, name) => {
      if (!existingNames.has(name)) {
        // 插入到末尾空行之前
        const emptyIdx = queryParameters.value.findIndex(p => !p.name && !p.value)
        const newParam = { name, value, enabled: true }
        if (emptyIdx >= 0) {
          queryParameters.value.splice(emptyIdx, 0, newParam)
        } else {
          queryParameters.value.push(newParam)
        }
      }
    })
    if (searchParams.size > 0) {
      expandedSections.value.query = true
    }
    // 解析 path 参数：将 URL 实际路径与 API 模板路径进行匹配
    if (pathParameters.value.length > 0 && props.api.path) {
      const templatePath = props.api.path as string
      const templateSegments = templatePath.split('/').filter(Boolean)
      // 计算 baseUrl 的路径前缀段数
      const basePath = props.baseUrl ? new URL(props.baseUrl).pathname : '/'
      const basePathSegments = basePath.split('/').filter(Boolean)
      // 实际 URL 去掉 baseUrl 路径前缀后的段
      const actualPathSegments = urlObj.pathname.split('/').filter(Boolean).slice(basePathSegments.length)
      for (let i = 0; i < templateSegments.length; i++) {
        const seg = templateSegments[i]
        const match = seg.match(/^\{([^}]+)\}$/)
        if (match && actualPathSegments[i] !== undefined) {
          const paramName = match[1]
          const param = pathParameters.value.find(p => p.name === paramName)
          if (param) {
            param.value = decodeURIComponent(actualPathSegments[i])
            param.enabled = true
          }
        }
      }
    }
  } catch { /* 忽略 */ }
}

// 输入 URL 时自动触发解析（防抖 300ms）
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(editableUrl, () => {
  if (isSyncingFromComputed) { isSyncingFromComputed = false; return }
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(() => syncUrlToParams(), 300)
})

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
  expandedSections.value = { ...parsed.expandedSections, cookies: false }

  // 尝试从缓存恢复
  const savedBody = restoreFromStorage(props.api, currentMethod.value, 'body')
  if (savedBody) bodyContent.value = savedBody as string
}

// 重置响应状态（需要在 watch 之前定义，避免 TDZ 错误）
const resetResponseState = () => {
  responseResult.value = ''; responseStatus.value = 0; responseHeaders.value = {}; responseTiming.value = {}; isBeautified.value = false
  isImageResponse.value = false; if (imagePreviewUrl.value) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = ''; imageBlob.value = null; imageInfo.value = ''
  isBinaryResponse.value = false; binaryBlob.value = null; binaryContentType.value = ''; binarySize.value = ''; binaryFilename.value = ''
}

const closeAllConnections = (silent = false) => { http.abort(); ws.close(silent); sse.close(silent) }

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
  return computedUrl.value.trim() || ''
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

  // 注入 Cookie：合并 Cookie Jar 自动匹配 + 手动编辑的 Cookie
  const cookieParts: string[] = []
  if (cookieAutoInject.value) {
    const jarHeader = cookieJar.buildCookieHeader(url)
    if (jarHeader) cookieParts.push(jarHeader)
  }
  const manualCookies = cookieParameters.value
    .filter(c => c.enabled && c.name && c.value)
    .map(c => `${c.name}=${c.value}`)
  cookieParts.push(...manualCookies)
  if (cookieParts.length > 0) {
    headers['Cookie'] = cookieParts.join('; ')
  }

  const body = buildBody()
  const contentType = getContentType()
  if (contentType && !(body instanceof FormData)) headers['Content-Type'] = contentType

  try {
    if (body instanceof FormData) {
      const result = await http.sendRequest(url, currentMethod.value, headers, body, 'http', contentType)
      responseStatus.value = result.status; responseTiming.value = result.timing
      const rh: Record<string, string> = {}; result.headers.forEach((v: string, k: string) => { rh[k] = v }); responseHeaders.value = rh
      // 将 Set-Cookie 存入 Cookie Jar
      const setCookieVal = rh['set-cookie']
      if (setCookieVal) {
        cookieJar.parseAndStore(setCookieVal, url)
      }
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

    // 将 Set-Cookie 存入 Cookie Jar
    const setCookie = data.headers?.['set-cookie']
    if (setCookie) {
      cookieJar.parseAndStore(setCookie, url)
    }

    const ct = (Object.entries(data.headers || {}).find(([k]) => k.toLowerCase() === 'content-type')?.[1] as string) || ''
    if (ct.startsWith('image/')) {
      // 图片类型：构建 Blob 用于预览
      const mimeType = ct.split(';')[0].trim()
      let blob: Blob
      if (data.bodyEncoding === 'base64') {
        // 二进制图片：从 base64 解码
        const binary = atob(data.body)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        blob = new Blob([bytes], { type: mimeType })
        responseResult.value = `[图片数据 - ${mimeType}]`
      } else {
        // SVG 等文本格式图片
        blob = new Blob([data.body], { type: mimeType })
        responseResult.value = data.body
      }
      imageBlob.value = blob
      imagePreviewUrl.value = URL.createObjectURL(blob)
      imageInfo.value = `类型: ${mimeType} | 大小: ${(blob.size / 1024).toFixed(2)} KB`
      isImageResponse.value = true
    } else if (ct.includes('application/json')) {
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

// ========== 状态管理 ==========

const toggleSection = (s: keyof typeof expandedSections.value) => { expandedSections.value[s] = !expandedSections.value[s] }
const addQueryParam = () => { queryParameters.value.push({ name: '', value: '', enabled: true }) }
const removeQueryParam = (i: number) => { queryParameters.value.splice(i, 1) }
const addPathParam = () => { pathParameters.value.push({ name: '', value: '', enabled: true }) }
const removePathParam = (i: number) => { pathParameters.value.splice(i, 1) }
const addHeaderParam = () => { headerParameters.value.push({ name: '', value: '', enabled: true }) }
const removeHeaderParam = (i: number) => { headerParameters.value.splice(i, 1) }
const addCookieParam = () => { cookieParameters.value.push({ name: '', value: '', enabled: true }) }
const removeCookieParam = (i: number) => { cookieParameters.value.splice(i, 1) }

// 响应 Cookie 一键回填到请求 Cookie 区块
const handleUseCookie = (cookie: { name: string; value: string }) => {
  // 检查是否已存在同名 Cookie
  const existIdx = cookieParameters.value.findIndex(c => c.name === cookie.name)
  if (existIdx >= 0) {
    cookieParameters.value[existIdx].value = cookie.value
    cookieParameters.value[existIdx].enabled = true
  } else {
    // 如果第一行是空的，直接填入
    const firstEmpty = cookieParameters.value.findIndex(c => !c.name && !c.value)
    if (firstEmpty >= 0) {
      cookieParameters.value[firstEmpty] = { name: cookie.name, value: cookie.value, enabled: true }
    } else {
      cookieParameters.value.push({ name: cookie.name, value: cookie.value, enabled: true })
    }
  }
  // 展开 Cookie 区块
  expandedSections.value.cookies = true
  message.success(`Cookie "${cookie.name}" 已添加到请求`)
}
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
    cookieParameters.value = [{ name: '', value: '', enabled: true }]
    activeBodyTab.value = 'json'; expandedSections.value = { query: false, path: false, headers: false, cookies: false, body: false }
  }
  resetResponseState()
}

// ========== cURL 导入/导出 ==========
const curlImportVisible = ref(false)
const curlImportText = ref('')

const openCurlImport = () => {
  curlImportText.value = ''
  curlImportVisible.value = true
}

const handleCurlImport = () => {
  const text = curlImportText.value.trim()
  if (!text) { message.warning('请粘贴 cURL 命令'); return }

  try {
    const parsed = parseCurl(text)

    // 填充方法
    currentMethod.value = parsed.method

    // 填充 URL
    if (props.api) {
      editableUrl.value = parsed.url
    } else {
      requestUrl.value = parsed.url
      editableUrl.value = parsed.url
    }

    // 填充 Query 参数
    if (parsed.queryParams.length > 0) {
      queryParameters.value = parsed.queryParams.map(p => ({ name: p.name, value: p.value, enabled: true }))
      expandedSections.value.query = true
    }

    // 填充请求头
    if (parsed.headers.length > 0) {
      headerParameters.value = parsed.headers.map(h => ({ name: h.name, value: h.value, enabled: true }))
      expandedSections.value.headers = true
    }

    // 填充请求体
    if (parsed.body) {
      bodyContent.value = parsed.body
      activeBodyTab.value = parsed.bodyFormat
      expandedSections.value.body = true
    }

    curlImportVisible.value = false
    message.success('cURL 导入成功')
  } catch {
    message.error('cURL 解析失败，请检查格式')
  }
}

const copyAsCurl = async () => {
  const url = getFullUrl()
  if (!url) { message.warning('请先填写请求 URL'); return }

  let cmd = `curl -X ${currentMethod.value} '${url}'`

  // 添加自定义请求头
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.name && h.value)
  enabledHeaders.forEach(h => {
    cmd += ` \\\n  -H '${h.name}: ${h.value}'`
  })

  // 添加 Cookie
  const cookieParts: string[] = []
  if (cookieAutoInject.value) {
    const jarHeader = cookieJar.buildCookieHeader(url)
    if (jarHeader) cookieParts.push(jarHeader)
  }
  const manualCookies = cookieParameters.value
    .filter(c => c.enabled && c.name && c.value)
    .map(c => `${c.name}=${c.value}`)
  cookieParts.push(...manualCookies)
  if (cookieParts.length > 0) {
    cmd += ` \\\n  -b '${cookieParts.join('; ')}'`
  }

  // 添加请求体
  if (!['GET', 'HEAD', 'OPTIONS'].includes(currentMethod.value)) {
    const ct = getContentType()
    if (ct) {
      cmd += ` \\\n  -H 'Content-Type: ${ct}'`
    }

    if (activeBodyTab.value === 'form') {
      const enabledFields = formFields.value.filter(f => f.enabled && f.name && f.type === 'text')
      if (enabledFields.length > 0) {
        const formData = enabledFields.map(f => `${encodeURIComponent(f.name)}=${encodeURIComponent(f.value)}`).join('&')
        cmd += ` \\\n  -d '${formData}'`
      }
    } else if (bodyContent.value) {
      // 压缩 JSON 为单行
      let bodyStr = bodyContent.value
      if (activeBodyTab.value === 'json') {
        try { bodyStr = JSON.stringify(JSON.parse(bodyStr)) } catch { /* 保持原样 */ }
      }
      cmd += ` \\\n  -d '${bodyStr}'`
    }
  }

  try {
    await navigator.clipboard.writeText(cmd)
    message.success('cURL 已复制到剪贴板')
  } catch {
    message.error('复制失败')
  }
}

onUnmounted(() => { closeAllConnections(true) })
</script>


<style scoped>
.standalone-debugger { display: flex; flex-direction: column; height: 100vh; background: #fff; overflow: hidden; }
.standalone-debugger.is-embedded { height: auto; min-height: 400px; overflow: visible; }
.debugger-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid var(--color-border-light, #f0f0f0); flex-shrink: 0; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-divider { width: 1px; height: 20px; background: var(--color-border, #e5e7eb); }
.toolbar-title { font-size: 14px; font-weight: 500; color: var(--color-text-secondary, #6b7280); }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.toolbar-btn { font-size: 12px; color: var(--color-text-secondary, #6b7280); }
.action-btn { font-size: 12px; }
.back-link { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 12px; transition: all 0.15s ease; }
.back-link:hover { background: rgba(16, 185, 129, 0.06); color: #10b981; }

.embedded-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.header-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
.header-actions { display: flex; gap: 6px; }

.url-section { padding: 12px 20px; border-bottom: 1px solid var(--color-border-light, #f0f0f0); flex-shrink: 0; }
.url-section-embedded { padding: 0; border-bottom: none; margin-bottom: 8px; }
.url-bar { display: flex; align-items: center; gap: 8px; }
.method-select { flex-shrink: 0; width: 110px; }
.url-input { flex: 1; }
:deep(.url-input .ant-input) { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
.send-btn { flex-shrink: 0; }

.debugger-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.debugger-body-embedded { flex-direction: column; overflow: visible; }
.request-panel { width: 100%; border-bottom: 1px solid var(--color-border-light, #f0f0f0); overflow-y: auto; }
.request-panel-embedded { overflow-y: visible; }
.response-panel { width: 100%; flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.response-panel-embedded { border-top: 1px solid var(--color-border-light, #f0f0f0); padding-top: 12px; }

.request-sections { padding: 8px 0; }
.request-section { border-bottom: 1px solid var(--color-border-light, #f0f0f0); }
.request-section:last-child { border-bottom: none; }
.section-header { display: flex; align-items: center; padding: 10px 20px; cursor: pointer; user-select: none; transition: background 0.15s ease; }
.request-panel-embedded .section-header { padding: 10px 0; }
.section-header:hover { background: var(--color-bg-secondary, #f9fafb); }
.collapse-icon { font-size: 10px; color: #9ca3af; margin-right: 8px; transition: transform 0.2s ease; display: inline-block; }
.collapse-icon.expanded { transform: rotate(90deg); }
.section-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
.section-badge { font-size: 11px; padding: 1px 6px; margin-left: 8px; border-radius: 10px; background: rgba(16, 185, 129, 0.08); color: #10b981; }
.section-header-actions { margin-left: 12px; }
.body-format-select { width: 80px; }
.section-content { padding: 8px 20px 16px; }
.request-panel-embedded .section-content { padding: 0 0 12px; }

/* 隐藏 RequestBody 内部的 tab 栏 */
.section-content :deep(.body-sub-tabs .ant-tabs-nav) { display: none; }

.ws-message-section { padding: 8px 20px 16px; }

.empty-response { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; padding: 40px; }
.empty-icon { margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 14px; color: #6b7280; margin-bottom: 4px; }

.curl-import-tip { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
.curl-import-textarea { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }

/* 请求完整过程 */
.full-transaction-panel { border-top: 1px solid var(--color-border-light, #f0f0f0); padding: 0 20px; }
.full-transaction-embedded { padding: 0; margin-top: 12px; }
.transaction-header { display: flex; align-items: center; gap: 8px; padding: 10px 0; cursor: pointer; user-select: none; }
.transaction-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
.transaction-meta { font-size: 11px; color: var(--color-text-muted, #6b7280); font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.transaction-actions { margin-left: 12px; display: flex; align-items: center; gap: 4px; }
.transaction-content { padding: 0 0 16px; }
.transaction-blocks { display: flex; flex-direction: column; gap: 12px; }
.transaction-block { position: relative; }
.transaction-block-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-primary, #4361ee); margin-bottom: 6px; padding: 2px 8px; background: var(--color-primary-bg, #f0f5ff); border-radius: 3px; display: inline-block; }
.transaction-raw { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 12px; line-height: 1.7; background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 0; white-space: pre-wrap; word-break: break-all; overflow-x: auto; max-height: 400px; overflow-y: auto; }
.transaction-raw .raw-request-line, .transaction-raw .raw-status-line { font-weight: 700; color: var(--color-primary, #4361ee); }
.transaction-raw .raw-header-name { color: #8b5cf6; }
.transaction-raw .raw-header-value { color: #333; }
.transaction-raw .raw-body { color: #059669; }
</style>
