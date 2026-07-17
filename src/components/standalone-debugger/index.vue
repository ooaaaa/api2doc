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
        <a-button size="small" @click="openCurlImport" class="action-btn secondary-action-btn">
          <template #icon><ImportOutlined /></template>
          导入 cURL
        </a-button>
        <a-button size="small" @click="copyAsCurl" class="action-btn secondary-action-btn">
          <template #icon><CopyOutlined /></template>
          复制 cURL
        </a-button>
        <a-button size="small" type="text" danger @click="resetAll" class="action-btn reset-action-btn">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
        <a class="toolbar-btn back-link" :href="basePath" title="返回文档页">返回文档</a>
      </div>
    </div>

    <!-- 嵌入模式的头部 -->
    <div v-if="embedded" class="embedded-header">
      <span class="header-label">请求配置</span>
      <div class="header-actions">
        <a-button size="small" @click="openCurlImport" class="action-btn secondary-action-btn">
          <template #icon><ImportOutlined /></template>
          导入 cURL
        </a-button>
        <a-button size="small" @click="copyAsCurl" class="action-btn secondary-action-btn">
          <template #icon><CopyOutlined /></template>
          复制 cURL
        </a-button>
        <a-button size="small" type="text" danger @click="resetAll" class="action-btn reset-action-btn">
          <template #icon><ReloadOutlined /></template>
          重置
        </a-button>
        <a-button size="small" @click="$emit('toggleCode')" class="action-btn code-action-btn">
          <template #icon><CodeOutlined /></template>
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
          @pressEnter="handleUrlPressEnter"
          @blur="handleUrlBlur"
        />
        <a-button
          :type="isActive ? 'default' : 'primary'"
          :danger="isActive"
          @click="isActive ? handleAbort() : handleSendOrConnect()"
          class="send-btn"
        >
          <template #icon>
            <StopOutlined v-if="isActive" />
            <SendOutlined v-else />
          </template>
          {{ sendButtonText }}
        </a-button>
      </div>
      <!-- 特殊接口提示 -->
      <a-alert v-if="isSpecialInterface" :message="specialInterfaceTip" type="info" show-icon style="margin-top: 12px" />
    </div>

    <!-- Tab 导航栏 -->
    <div class="tab-bar" :class="{ 'tab-bar-embedded': embedded }">
      <button
        v-for="tab in visibleTabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- 主体区域 -->
    <div class="debugger-body" :class="{ 'debugger-body-embedded': embedded }">
      <!-- 请求配置区（Tab 内容） -->
      <div class="request-panel" :class="{ 'request-panel-embedded': embedded }">
        <!-- Params Tab：Query + Path -->
        <div v-show="activeTab === 'params'" class="tab-content">
          <div class="tab-content-toolbar">
            <a-button size="small" type="text" @click="openImport('params')">
              <template #icon><ImportOutlined /></template>
              批量导入
            </a-button>
          </div>
          <div class="param-group">
            <div class="param-group-title">Query 参数</div>
            <RequestParams
              v-model:parameters="queryParameters"
              type="query"
              add-button-text="添加参数"
              @add="addQueryParam"
              @remove="removeQueryParam"
            />
          </div>
          <div v-if="pathParameters.length > 0" class="param-group">
            <div class="param-group-title">Path 参数</div>
            <RequestParams
              v-model:parameters="pathParameters"
              type="path"
              add-button-text="添加 Path 参数"
              @add="addPathParam"
              @remove="removePathParam"
            />
          </div>
        </div>

        <!-- Headers Tab -->
        <div v-show="activeTab === 'headers'" class="tab-content">
          <div class="tab-content-toolbar">
            <a-button size="small" type="text" @click="openImport('headers')">
              <template #icon><ImportOutlined /></template>
              批量导入
            </a-button>
          </div>
          <RequestHeaders
            :headers="headerParameters"
            v-model:auto-inject="headerAutoInject"
            :method="currentMethod"
            :url="computedUrl"
            :interface-type="interfaceType"
            :content-type="request.getContentType()"
            @update:headers="headerParameters = $event"
            @add="addHeaderParam"
            @remove="removeHeaderParam"
          />
        </div>

        <!-- Body Tab -->
        <div v-show="activeTab === 'body'" class="tab-content">
          <div class="body-format-bar">
            <a-select v-model:value="activeBodyTab" size="small" class="body-format-select">
              <a-select-option value="json">JSON</a-select-option>
              <a-select-option value="form">Form</a-select-option>
              <a-select-option value="xml">XML</a-select-option>
              <a-select-option value="text">Text</a-select-option>
            </a-select>
            <span class="body-format-spacer"></span>
            <a-button size="small" type="text" @click="openImport('body')">
              <template #icon><ImportOutlined /></template>
              批量导入
            </a-button>
          </div>
          <RequestBody
            v-model:active-body-tab="activeBodyTab"
            v-model:body-content="bodyContent"
            v-model:form-fields="formFields"
            @add-form-field="addFormField"
            @remove-form-field="removeFormField"
            @file-change="handleFileChange"
          />
        </div>

        <!-- Cookies Tab -->
        <div v-show="activeTab === 'cookies'" class="tab-content">
          <div class="tab-content-toolbar">
            <a-button size="small" type="text" @click="openImport('cookies')">
              <template #icon><ImportOutlined /></template>
              批量导入
            </a-button>
          </div>
          <RequestCookies
            v-model:cookies="cookieParameters"
            v-model:auto-inject="cookieAutoInject"
            :request-url="computedUrl"
            @add="addCookieParam"
            @remove="removeCookieParam"
          />
        </div>

        <!-- WebSocket 消息输入 -->
        <div v-if="interfaceType === 'websocket' && request.wsConnected.value" class="ws-message-section">
          <CodeEditor v-model="request.wsMessage.value" language="json" :readonly="false" min-height="100px" max-height="200px" />
          <a-button type="primary" @click="request.sendWebSocketMessage" style="margin-top: 8px">发送消息</a-button>
        </div>
      </div>

      <!-- 响应结果 -->
      <div class="response-panel" :class="{ 'response-panel-embedded': embedded }">
        <ResponseViewer
          v-if="request.hasResult.value"
          :result="request.responseResult.value"
          :display-result="request.displayResult.value"
          :status="request.responseStatus.value"
          :can-beautify="request.canBeautify.value"
          :is-image-response="request.isImageResponse.value"
          :image-preview-url="request.imagePreviewUrl.value"
          :image-info="request.imageInfo.value"
          :is-special-interface="isSpecialInterface"
          :is-binary-response="request.isBinaryResponse.value"
          :binary-content-type="request.binaryContentType.value"
          :binary-size="request.binarySize.value"
          :binary-filename="request.binaryFilename.value"
          :duration="request.responseTiming.value.duration"
          :response-headers="request.responseHeaders.value"
          :request-method="currentMethod"
          :request-url="computedUrl"
          :request-headers="actualRequestHeaders"
          :request-body="bodyContent"
          @copy="request.copyResponse"
          @beautify="request.beautifyResponse"
          @clear="request.clearResult"
          @maximize="maximizedModalVisible = true"
          @download-image="request.downloadImage"
          @download-binary="request.downloadBinary"
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

    <!-- 请求完整过程 -->
    <div v-if="request.hasResult.value && !isSpecialInterface" class="full-transaction-panel" :class="{ 'full-transaction-embedded': embedded }">
      <div class="transaction-header" @click="transactionExpanded = !transactionExpanded">
        <span class="collapse-icon" :class="{ expanded: transactionExpanded }">&#9654;</span>
        <span class="transaction-title">请求完整过程</span>
        <span class="transaction-meta">
          {{ currentMethod }} {{ transactionRequestPath }} → {{ request.responseStatus.value }} {{ transactionStatusText }}
        </span>
        <div class="transaction-actions" @click.stop>
          <a-button size="small" type="text" @click="copyFullTransaction" class="action-btn">复制全部</a-button>
        </div>
      </div>
      <div v-show="transactionExpanded" class="transaction-content">
        <div class="transaction-blocks">
          <div class="transaction-block">
            <div class="transaction-block-label">Request</div>
            <pre class="transaction-raw"><span class="raw-request-line">{{ transactionRequestLine }}</span>
<template v-for="(value, key) in actualRequestHeaders" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="bodyContent">
<span class="raw-body">{{ bodyContent }}</span></template></pre>
          </div>
          <div class="transaction-block">
            <div class="transaction-block-label">Response</div>
            <pre class="transaction-raw"><span class="raw-status-line">HTTP/1.1 {{ request.responseStatus.value }} {{ transactionStatusText }}</span>
<template v-for="(value, key) in request.responseHeaders.value" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="request.responseResult.value">
<span class="raw-body">{{ transactionResponseBody }}</span></template></pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 最大化弹窗 -->
    <a-modal v-model:open="maximizedModalVisible" title="响应结果" width="90%" :footer="null" :bodyStyle="{ padding: '16px', maxHeight: '80vh', overflow: 'auto' }">
      <ResponseViewer
        v-if="request.hasResult.value"
        :result="request.responseResult.value"
        :display-result="request.displayResult.value"
        :status="request.responseStatus.value"
        :can-beautify="request.canBeautify.value"
        :is-image-response="request.isImageResponse.value"
        :image-preview-url="request.imagePreviewUrl.value"
        :image-info="request.imageInfo.value"
        :is-special-interface="isSpecialInterface"
        :is-binary-response="request.isBinaryResponse.value"
        :binary-content-type="request.binaryContentType.value"
        :binary-size="request.binarySize.value"
        :binary-filename="request.binaryFilename.value"
        :duration="request.responseTiming.value.duration"
        :response-headers="request.responseHeaders.value"
        :request-method="currentMethod"
        :request-url="computedUrl"
        :request-headers="actualRequestHeaders"
        :request-body="bodyContent"
        @copy="request.copyResponse"
        @beautify="request.beautifyResponse"
        @clear="request.clearResult"
        @maximize="() => {}"
        @download-image="request.downloadImage"
        @download-binary="request.downloadBinary"
        @use-cookie="handleUseCookie"
      />
    </a-modal>

    <!-- cURL 导入弹窗 -->
    <a-modal
      v-model:open="curl.curlImportVisible.value"
      title="导入 cURL"
      :width="600"
      :mask-closable="false"
      :keyboard="false"
      @ok="curl.handleCurlImport"
      ok-text="导入"
      cancel-text="取消"
    >
      <p class="curl-import-tip">粘贴 cURL 命令，将自动解析为请求参数</p>
      <a-textarea
        v-model:value="curl.curlImportText.value"
        :rows="10"
        placeholder="curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -d '{&quot;name&quot;: &quot;test&quot;}'"
        class="curl-import-textarea"
      />
    </a-modal>

    <!-- 批量导入弹窗 -->
    <a-modal
      v-model:open="importModalVisible"
      :title="importModalTitle"
      :width="560"
      :mask-closable="false"
      @ok="handleImportConfirm"
      ok-text="导入"
      cancel-text="取消"
    >
      <p class="import-tip">{{ importModalHint }}</p>
      <a-textarea
        v-model:value="importText"
        :rows="8"
        :placeholder="importModalPlaceholder"
        class="curl-import-textarea"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { CodeOutlined, CopyOutlined, ImportOutlined, ReloadOutlined, SendOutlined, StopOutlined } from '@ant-design/icons-vue'
import RequestParams from '../api-debugger/RequestParams.vue'
import RequestHeaders from '../api-debugger/RequestHeaders.vue'
import RequestCookies from '../api-debugger/RequestCookies.vue'
import RequestBody from '../api-debugger/RequestBody/index.vue'
import ResponseViewer from '../api-debugger/ResponseViewer.vue'
import CodeEditor from '../CodeEditor.vue'
import Api2DocLogo from '../Api2DocLogo.vue'
import { parseApiToParams, detectInterfaceType, saveToStorage, restoreFromStorage, clearStorage } from '../api-debugger/composables/useApiToParams'
import type { DebuggerParameter, DebuggerFormField, InterfaceType } from '../api-debugger/composables/useApiToParams'
import type { UploadChangeParam } from 'ant-design-vue'
import { generateRequestHeaders } from '../../utils/request-headers'
import { useDebuggerRequest } from './composables/useDebuggerRequest'
import { useDebuggerCurl } from './composables/useDebuggerCurl'
import { useCookieJar } from '../../composables/useCookieJar'

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

const basePath = import.meta.env.BASE_URL || '/'
const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

// ========== 状态 ==========
const currentMethod = ref('GET')
const requestUrl = ref('')
const editableUrl = ref('')
const maximizedModalVisible = ref(false)
const transactionExpanded = ref(false)
const activeTab = ref<'params' | 'headers' | 'body' | 'cookies'>('params')

// 参数数据
const pathParameters = ref<DebuggerParameter[]>([])
const queryParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const headerParameters = ref<DebuggerParameter[]>([{ name: '', value: '', enabled: true }])
const cookieParameters = ref<{ name: string; value: string; enabled: boolean }[]>([{ name: '', value: '', enabled: true }])
const formFields = ref<DebuggerFormField[]>([])
const bodyContent = ref('')
const activeBodyTab = ref<'json' | 'form' | 'xml' | 'text'>('json')

// Cookie
const cookieJar = useCookieJar()
const cookieAutoInject = ref(true)
const headerAutoInject = ref(true)

// ========== 计算属性 ==========
const interfaceType = computed<InterfaceType>(() => {
  if (props.api) return detectInterfaceType(computedUrl.value, (props.api.summary as string) || '')
  return 'http'
})
const isSpecialInterface = computed(() => interfaceType.value !== 'http')

const availableMethods = computed(() => {
  if (props.api?.method === 'MULTI' && Array.isArray(props.api.methodList)) return props.api.methodList as string[]
  if (props.api?.method) { const m = props.api.method as string; return [m, ...allMethods.filter(x => x !== m)] }
  return allMethods
})

const computedUrl = computed(() => {
  if (!props.api) {
    let url = requestUrl.value
    pathParameters.value.forEach(p => {
      if (p.name && p.value && p.enabled) url = url.replace(`{${p.name}}`, encodeURIComponent(p.value))
    })
    const enabled = queryParameters.value.filter(p => p.enabled && p.name)
    if (enabled.length > 0) {
      const sep = url.includes('?') ? '&' : '?'
      url += sep + enabled.map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join('&')
    }
    return url
  }
  let url = `${props.baseUrl}${props.api.path as string}`
  pathParameters.value.forEach(p => {
    if (!p.name) return
    const value = p.enabled && p.value ? encodeURIComponent(p.value) : `{${p.name}}`
    url = url.replace(`{${p.name}}`, value)
  })
  const enabled = queryParameters.value.filter(p => p.enabled && p.name)
  if (enabled.length > 0) {
    const searchParams = new URLSearchParams()
    enabled.forEach(p => searchParams.append(p.name, p.value))
    url += `?${searchParams.toString()}`
  }
  return url
})

// Tab 栏数据（始终可见，badge 显示数量）
const paramsBadge = computed(() => {
  const q = queryParameters.value.filter(p => p.enabled && p.name && p.value).length
  const p = pathParameters.value.filter(x => x.enabled && x.name && x.value).length
  return q + p
})
const headersBadge = computed(() => headerParameters.value.filter(h => h.enabled && h.name && h.value).length)
const bodyBadge = computed(() => {
  if (activeBodyTab.value === 'form') return formFields.value.filter(f => f.enabled && f.name).length
  return bodyContent.value ? 1 : 0
})
const cookiesBadge = computed(() => {
  const manual = cookieParameters.value.filter(c => c.enabled && c.name && c.value).length
  const jar = cookieAutoInject.value ? cookieJar.getMatchingCookies(computedUrl.value).length : 0
  return manual + jar
})

const visibleTabs = computed(() => {
  const tabs: { key: 'params' | 'headers' | 'body' | 'cookies'; label: string; badge: number }[] = [
    { key: 'params', label: 'Params', badge: paramsBadge.value },
    { key: 'headers', label: 'Headers', badge: headersBadge.value }
  ]
  if (!isSpecialInterface.value) {
    tabs.push({ key: 'body', label: 'Body', badge: bodyBadge.value })
  }
  tabs.push({ key: 'cookies', label: 'Cookies', badge: cookiesBadge.value })
  return tabs
})

const actualRequestHeaders = computed(() => {
  const custom: Record<string, string> = {}
  headerParameters.value.forEach(x => { if (x.enabled && x.name && x.value) custom[x.name] = x.value })
  if (!headerAutoInject.value) return custom
  const builtin = generateRequestHeaders({
    method: currentMethod.value,
    url: computedUrl.value,
    interfaceType: interfaceType.value,
    contentType: request.getContentType(),
    customHeaders: {}
  })
  return { ...builtin, ...custom }
})

const specialInterfaceTip = computed(() => {
  if (interfaceType.value === 'websocket') return 'WebSocket 双向通信接口，点击"连接"建立连接后可发送消息'
  if (interfaceType.value === 'sse') return 'Server-Sent Events 服务器推送接口，点击"开始接收"后将持续接收服务器消息'
  if (interfaceType.value === 'streamable') return 'HTTP 流式传输接口，点击"开始接收"后将持续接收数据流'
  return ''
})

// ========== 请求逻辑 ==========
const request = useDebuggerRequest({
  computedUrl: () => computedUrl.value,
  currentMethod: () => currentMethod.value,
  interfaceType: () => interfaceType.value,
  headerParameters: () => headerParameters.value,
  cookieParameters: () => cookieParameters.value,
  cookieAutoInject: () => cookieAutoInject.value,
  cookieJar,
  bodyContent: () => bodyContent.value,
  activeBodyTab: () => activeBodyTab.value,
  formFields: () => formFields.value
})

const { handleSendOrConnect: sendOrConnect, handleAbort, isActive, sendButtonText } = request

// ========== cURL ==========
const curl = useDebuggerCurl({
  currentMethod, editableUrl, requestUrl,
  queryParameters, headerParameters, bodyContent, activeBodyTab,
  expandedSections: ref({ query: false, path: false, headers: false, cookies: false, body: false }),
  cookieParameters, cookieAutoInject, cookieJar,
  formFields: formFields as unknown as { value: { name: string; value: string; type: string; enabled: boolean }[] },
  isApiMode: !!props.api,
  getComputedUrl: () => computedUrl.value,
  getContentType: () => request.getContentType()
})

const { openCurlImport, copyAsCurl } = curl

// ========== 请求完整过程 ==========
const transactionStatusText = computed(() => {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed',
    500: 'Internal Server Error', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout'
  }
  const s = request.responseStatus.value
  return map[s] || (s >= 200 && s < 300 ? 'OK' : 'Error')
})
const transactionRequestPath = computed(() => {
  try { const url = new URL(computedUrl.value); return url.pathname + url.search } catch { return computedUrl.value }
})
const transactionRequestLine = computed(() => `${currentMethod.value} ${transactionRequestPath.value} HTTP/1.1`)
const transactionResponseBody = computed(() => {
  try { return JSON.stringify(JSON.parse(request.responseResult.value), null, 2) } catch { return request.responseResult.value }
})
const copyFullTransaction = async () => {
  let text = `${transactionRequestLine.value}\n`
  Object.entries(actualRequestHeaders.value).forEach(([key, value]) => { text += `${key}: ${value}\n` })
  if (bodyContent.value) text += `\n${bodyContent.value}\n`
  text += `\n---\n\n`
  text += `HTTP/1.1 ${request.responseStatus.value} ${transactionStatusText.value}\n`
  Object.entries(request.responseHeaders.value).forEach(([key, value]) => { text += `${key}: ${value}\n` })
  if (request.responseResult.value) text += `\n${transactionResponseBody.value}\n`
  try { await navigator.clipboard.writeText(text); message.success('请求完整过程已复制') } catch { message.error('复制失败') }
}

// ========== URL 双向同步 ==========
let syncSource: 'params' | 'url' | null = null

// 参数面板变化 → URL 更新
watch(computedUrl, (url) => {
  if (syncSource === 'url') return
  syncSource = 'params'
  if (editableUrl.value !== url) editableUrl.value = url
  syncSource = null
}, { immediate: true })

const syncParamsFromUrl = () => {
  const url = editableUrl.value.trim()
  if (!url) return

  syncSource = 'url'
  try {
    const urlObj = new URL(url)
    const searchParams = new URLSearchParams(urlObj.search)

    // URL 是 Query 的事实来源：保持顺序和重复参数，同时尽量保留 OpenAPI 元数据
    const existingByName = new Map<string, DebuggerParameter[]>()
    queryParameters.value.forEach(param => {
      if (!param.name) return
      const sameNameParams = existingByName.get(param.name) || []
      sameNameParams.push(param)
      existingByName.set(param.name, sameNameParams)
    })
    const syncedQueryParameters: DebuggerParameter[] = []
    searchParams.forEach((value, name) => {
      const existing = existingByName.get(name)?.shift()
      syncedQueryParameters.push(existing
        ? { ...existing, value, enabled: true }
        : { name, value, enabled: true })
    })
    queryParameters.value = [
      ...syncedQueryParameters,
      { name: '', value: '', enabled: true }
    ]

    if (!props.api) {
      // 独立模式只能识别 URL 中显式存在的 {path} 占位符
      const pathname = decodeURIComponent(urlObj.pathname)
      requestUrl.value = `${urlObj.origin}${pathname}`
      const pathNames = [...pathname.matchAll(/\{([^}]+)\}/g)].map(match => match[1])
      const existingPathParams = new Map(pathParameters.value.map(param => [param.name, param]))
      pathParameters.value = pathNames.map(name => existingPathParams.get(name) || { name, value: '', enabled: true })
    } else if (props.api.path) {
      // API 模式按 OpenAPI path 模板的位置更新参数值，参数名保持接口定义
      const templateSegments = (props.api.path as string).split('/').filter(Boolean)
      const basePathname = props.baseUrl ? new URL(props.baseUrl).pathname : '/'
      const baseSegmentCount = basePathname.split('/').filter(Boolean).length
      const actualSegments = urlObj.pathname.split('/').filter(Boolean).slice(baseSegmentCount)
      templateSegments.forEach((segment, index) => {
        const match = segment.match(/^\{([^}]+)\}$/)
        if (!match) return
        const param = pathParameters.value.find(item => item.name === match[1])
        if (!param) return
        param.value = actualSegments[index] === undefined ? '' : decodeURIComponent(actualSegments[index])
        param.enabled = true
      })
    }
  } catch {
    // URL 输入过程中可能暂时不合法，保留上一次有效参数状态
  } finally {
    syncSource = null
  }
}

const triggerUrlSync = () => {
  if (syncSource === 'params') return
  if (editableUrl.value !== computedUrl.value) syncParamsFromUrl()
}

const handleSendOrConnect = () => {
  triggerUrlSync()
  sendOrConnect()
}

const handleUrlPressEnter = () => { 
  // 回车时只同步 URL，不发送请求
  triggerUrlSync()
}
const handleUrlBlur = () => { triggerUrlSync() }

// ========== 初始化与重置 ==========
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

  const savedBody = restoreFromStorage(props.api, currentMethod.value, 'body')
  if (savedBody) bodyContent.value = savedBody as string
}

watch(() => props.api, () => {
  if (props.api) { initFromApi(); request.resetResponseState(); request.closeAllConnections(true) }
}, { immediate: true })

watch([pathParameters, queryParameters, headerParameters, bodyContent], () => {
  if (!props.api) return
  saveToStorage(props.api, currentMethod.value, 'path', pathParameters.value)
  saveToStorage(props.api, currentMethod.value, 'query', queryParameters.value)
  saveToStorage(props.api, currentMethod.value, 'header', headerParameters.value)
  saveToStorage(props.api, currentMethod.value, 'body', bodyContent.value)
}, { deep: true })

// ========== 批量导入 ==========
const importModalVisible = ref(false)
const importText = ref('')
const importTarget = ref<'params' | 'headers' | 'body' | 'cookies'>('params')

const importModalTitle = computed(() => {
  const map = { params: '导入 Query 参数', headers: '导入请求头', body: '导入请求体', cookies: '导入 Cookie' }
  return map[importTarget.value]
})
const importModalHint = computed(() => {
  const map = {
    params: '支持 key=value（每行一个或 & 分隔）或 JSON 对象 {"key": "value"}',
    headers: '支持 Key: Value（每行一个）或 JSON 对象 {"Key": "Value"}',
    body: '直接粘贴请求体内容（JSON / XML / Text）',
    cookies: '支持 key=value（分号或换行分隔）或 JSON 对象 {"key": "value"}'
  }
  return map[importTarget.value]
})
const importModalPlaceholder = computed(() => {
  const map = {
    params: 'page=1&size=20&keyword=test\n\n或 JSON 格式:\n{"page": "1", "size": "20"}',
    headers: 'Content-Type: application/json\nAuthorization: Bearer token123\n\n或 JSON 格式:\n{"Content-Type": "application/json"}',
    body: '{\n  "name": "test",\n  "age": 18\n}',
    cookies: 'session_id=abc123; token=xyz456\n\n或 JSON 格式:\n{"session_id": "abc123", "token": "xyz456"}'
  }
  return map[importTarget.value]
})

const openImport = (target: 'params' | 'headers' | 'body' | 'cookies') => {
  importTarget.value = target
  importText.value = ''
  importModalVisible.value = true
}

const handleImportConfirm = () => {
  const text = importText.value.trim()
  if (!text) { message.warning('请输入要导入的内容'); return }

  try {
    switch (importTarget.value) {
      case 'params': parseAndImportParams(text); break
      case 'headers': parseAndImportHeaders(text); break
      case 'body': parseAndImportBody(text); break
      case 'cookies': parseAndImportCookies(text); break
    }
    importModalVisible.value = false
    message.success('导入成功')
  } catch (e: unknown) {
    message.error(e instanceof Error ? e.message : '解析失败，请检查格式')
  }
}

const parseAndImportParams = (text: string) => {
  const trimmed = text.trim()
  // 尝试 JSON 对象
  if (trimmed.startsWith('{')) {
    const obj = JSON.parse(trimmed)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) throw new Error('JSON 格式应为对象 {"key": "value"}')
    const pairs = Object.entries(obj).map(([name, value]) => ({ name, value: String(value), enabled: true }))
    if (pairs.length === 0) throw new Error('JSON 对象为空')
    const existing = queryParameters.value.filter(p => p.name)
    queryParameters.value = [...existing, ...pairs, { name: '', value: '', enabled: true }]
    return
  }
  // key=value 格式（每行一个或 & 分隔）
  const pairs: { name: string; value: string }[] = []
  const lines = trimmed.split(/\n/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    const parts = line.split('&')
    for (const part of parts) {
      const p = part.trim()
      if (!p) continue
      const eqIdx = p.indexOf('=')
      if (eqIdx <= 0) throw new Error(`无法解析: "${p}"，格式应为 key=value`)
      pairs.push({ name: decodeURIComponent(p.slice(0, eqIdx).trim()), value: decodeURIComponent(p.slice(eqIdx + 1).trim()) })
    }
  }
  if (pairs.length === 0) throw new Error('未解析到有效参数')
  const existing = queryParameters.value.filter(p => p.name)
  queryParameters.value = [
    ...existing.map(p => ({ ...p })),
    ...pairs.map(p => ({ name: p.name, value: p.value, enabled: true })),
    { name: '', value: '', enabled: true }
  ]
}

const parseAndImportHeaders = (text: string) => {
  const trimmed = text.trim()
  // 尝试 JSON 对象
  if (trimmed.startsWith('{')) {
    const obj = JSON.parse(trimmed)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) throw new Error('JSON 格式应为对象 {"Key": "Value"}')
    const pairs = Object.entries(obj).map(([name, value]) => ({ name, value: String(value), enabled: true }))
    if (pairs.length === 0) throw new Error('JSON 对象为空')
    const existing = headerParameters.value.filter(h => h.name)
    headerParameters.value = [...existing, ...pairs, { name: '', value: '', enabled: true }]
    return
  }
  // Key: Value 格式
  const pairs: { name: string; value: string }[] = []
  const lines = trimmed.split(/\n/).map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx <= 0) throw new Error(`无法解析: "${line}"，格式应为 Key: Value`)
    pairs.push({ name: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() })
  }
  if (pairs.length === 0) throw new Error('未解析到有效请求头')
  const existing = headerParameters.value.filter(h => h.name)
  headerParameters.value = [
    ...existing.map(h => ({ ...h })),
    ...pairs.map(h => ({ name: h.name, value: h.value, enabled: true })),
    { name: '', value: '', enabled: true }
  ]
}

const parseAndImportBody = (text: string) => {
  // 自动检测格式
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // 尝试解析 JSON 验证格式
    try { JSON.parse(trimmed) } catch { throw new Error('JSON 格式无效，请检查语法') }
    bodyContent.value = trimmed
    activeBodyTab.value = 'json'
  } else if (trimmed.startsWith('<')) {
    bodyContent.value = trimmed
    activeBodyTab.value = 'xml'
  } else {
    bodyContent.value = trimmed
    activeBodyTab.value = 'text'
  }
}

const parseAndImportCookies = (text: string) => {
  const trimmed = text.trim()
  // 尝试 JSON 对象
  if (trimmed.startsWith('{')) {
    const obj = JSON.parse(trimmed)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) throw new Error('JSON 格式应为对象 {"key": "value"}')
    const pairs = Object.entries(obj).map(([name, value]) => ({ name, value: String(value), enabled: true }))
    if (pairs.length === 0) throw new Error('JSON 对象为空')
    const existing = cookieParameters.value.filter(c => c.name)
    cookieParameters.value = [...existing, ...pairs, { name: '', value: '', enabled: true }]
    return
  }
  // key=value 格式（分号或换行分隔）
  const pairs: { name: string; value: string }[] = []
  const parts = trimmed.split(/[;\n]+/).map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx <= 0) throw new Error(`无法解析: "${part}"，格式应为 key=value`)
    pairs.push({ name: part.slice(0, eqIdx).trim(), value: part.slice(eqIdx + 1).trim() })
  }
  if (pairs.length === 0) throw new Error('未解析到有效 Cookie')
  const existing = cookieParameters.value.filter(c => c.name)
  cookieParameters.value = [
    ...existing.map(c => ({ ...c })),
    ...pairs.map(c => ({ name: c.name, value: c.value, enabled: true })),
    { name: '', value: '', enabled: true }
  ]
}

// ========== 操作方法 ==========
const addQueryParam = () => { queryParameters.value.push({ name: '', value: '', enabled: true }) }
const removeQueryParam = (i: number) => { queryParameters.value.splice(i, 1) }
const addPathParam = () => { pathParameters.value.push({ name: '', value: '', enabled: true }) }
const removePathParam = (i: number) => { pathParameters.value.splice(i, 1) }
const addHeaderParam = () => { headerParameters.value.push({ name: '', value: '', enabled: true }) }
const removeHeaderParam = (i: number) => { headerParameters.value.splice(i, 1) }
const addCookieParam = () => { cookieParameters.value.push({ name: '', value: '', enabled: true }) }
const removeCookieParam = (i: number) => { cookieParameters.value.splice(i, 1) }
const addFormField = () => { formFields.value.push({ name: '', value: '', type: 'text', enabled: true, fromSchema: false }) }
const removeFormField = (i: number) => { formFields.value.splice(i, 1) }
const handleFileChange = ({ info, index }: { info: UploadChangeParam; index: number }) => {
  if (formFields.value[index]) formFields.value[index].fileList = info.fileList
}

const handleUseCookie = (cookie: { name: string; value: string }) => {
  const existIdx = cookieParameters.value.findIndex(c => c.name === cookie.name)
  if (existIdx >= 0) {
    cookieParameters.value[existIdx].value = cookie.value
    cookieParameters.value[existIdx].enabled = true
  } else {
    const firstEmpty = cookieParameters.value.findIndex(c => !c.name && !c.value)
    if (firstEmpty >= 0) cookieParameters.value[firstEmpty] = { name: cookie.name, value: cookie.value, enabled: true }
    else cookieParameters.value.push({ name: cookie.name, value: cookie.value, enabled: true })
  }
  activeTab.value = 'cookies'
  message.success(`Cookie "${cookie.name}" 已添加到请求`)
}

const resetAll = () => {
  if (props.api) { clearStorage(props.api, currentMethod.value); initFromApi() } else {
    currentMethod.value = 'GET'
    requestUrl.value = ''
    queryParameters.value = [{ name: '', value: '', enabled: true }]
    headerParameters.value = [{ name: '', value: '', enabled: true }]
    cookieParameters.value = [{ name: '', value: '', enabled: true }]
    pathParameters.value = []
    formFields.value = []
    bodyContent.value = ''
    activeBodyTab.value = 'json'
  }
  activeTab.value = 'params'
  request.resetResponseState()
}

onUnmounted(() => {
  request.closeAllConnections(true)
})
</script>

<style scoped>
.standalone-debugger { display: flex; flex-direction: column; height: 100vh; background: #fff; overflow: hidden; }
.standalone-debugger.is-embedded { height: auto; min-height: 400px; overflow: visible; }

/* 工具栏 */
.debugger-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-bottom: 1px solid var(--color-border-light, #f0f0f0); flex-shrink: 0; }
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-divider { width: 1px; height: 20px; background: var(--color-border, #e5e7eb); }
.toolbar-title { font-size: 14px; font-weight: 500; color: var(--color-text-secondary, #6b7280); }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.toolbar-btn { font-size: 12px; color: var(--color-text-secondary, #6b7280); }

/* 按钮通用 */
.action-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; height: 28px; padding: 0 10px; border-radius: 6px; font-size: 12px; font-weight: 500; box-shadow: none; transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease; }
.action-btn :deep(.anticon), .send-btn :deep(.anticon) { font-size: 13px; }
.secondary-action-btn { color: var(--color-text-secondary, #4b5563); background: #fff; border-color: var(--color-border, #d1d5db); }
.secondary-action-btn:hover, .secondary-action-btn:focus { color: var(--color-primary, #10b981); background: var(--color-primary-bg, #ecfdf5); border-color: var(--color-primary, #10b981); }
.reset-action-btn { padding-inline: 8px; }
.code-action-btn { color: #047857; background: #ecfdf5; border-color: #a7f3d0; }
.code-action-btn:hover, .code-action-btn:focus { color: #fff; background: var(--color-primary, #10b981); border-color: var(--color-primary, #10b981); }
.back-link { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 12px; transition: all 0.15s ease; }
.back-link:hover { background: rgba(16, 185, 129, 0.06); color: #10b981; }

/* 嵌入模式头部 */
.embedded-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.header-label { font-size: 13px; font-weight: 600; color: var(--color-text); }
.header-actions { display: flex; gap: 6px; }

/* URL 栏 */
.url-section { padding: 12px 20px; flex-shrink: 0; }
.url-section-embedded { padding: 0; margin-bottom: 0; }
.url-bar { display: flex; align-items: center; gap: 8px; }
.method-select { flex-shrink: 0; width: 110px; }
.url-input { flex: 1; }
:deep(.url-input .ant-input) { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }
.send-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex-shrink: 0; min-width: 104px; height: 28px; padding-inline: 16px; border-radius: 6px; font-weight: 600; box-shadow: 0 1px 2px rgba(5, 150, 105, 0.18); }

/* Tab 导航栏 */
.tab-bar { display: flex; gap: 0; padding: 0 20px; border-bottom: 1px solid var(--color-border-light, #f0f0f0); flex-shrink: 0; }
.tab-bar-embedded { padding: 0; margin-top: 10px; }
.tab-item {
  position: relative;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 14px; border: none; background: none;
  font-size: 13px; font-weight: 500; color: #6b7280;
  cursor: pointer; transition: color 0.15s ease;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.tab-item:hover { color: #374151; }
.tab-item.active { color: var(--color-primary, #10b981); border-bottom-color: var(--color-primary, #10b981); }
.tab-badge {
  font-size: 10px; min-width: 16px; height: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 4px; border-radius: 8px;
  background: rgba(16, 185, 129, 0.1); color: #10b981;
  font-weight: 600;
}

/* 主体区域 */
.debugger-body { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.debugger-body-embedded { overflow: visible; }
.request-panel { width: 100%; border-bottom: 1px solid var(--color-border-light, #f0f0f0); overflow-y: auto; }
.request-panel-embedded { overflow-y: visible; border-bottom: none; }
.response-panel { width: 100%; flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
.response-panel-embedded { border-top: 1px solid var(--color-border-light, #f0f0f0); padding-top: 12px; }

/* Tab 内容 */
.tab-content { padding: 12px 20px 16px; }
.request-panel-embedded .tab-content { padding: 12px 0 16px; }

/* 参数分组 */
.param-group { margin-bottom: 16px; }
.param-group:last-child { margin-bottom: 0; }
.param-group-title { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.3px; }

/* Body 格式选择 */
.body-format-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.body-format-select { width: 90px; }
.body-format-spacer { flex: 1; }

/* Tab 内容顶部工具栏 */
.tab-content-toolbar { display: flex; justify-content: flex-end; margin-bottom: 8px; }
.import-tip { font-size: 13px; color: #6b7280; margin-bottom: 12px; }

/* 隐藏 RequestBody 内部的 tab 栏 */
.tab-content :deep(.body-sub-tabs .ant-tabs-nav) { display: none; }

.ws-message-section { padding: 12px 20px 16px; }

/* 空响应 */
.empty-response { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; padding: 40px; }
.empty-icon { margin-bottom: 16px; opacity: 0.6; }
.empty-text { font-size: 14px; color: #6b7280; margin-bottom: 4px; }

/* cURL */
.curl-import-tip { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
.curl-import-textarea { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: 13px; }

/* 请求完整过程 */
.full-transaction-panel { border-top: 1px solid var(--color-border-light, #f0f0f0); padding: 0 20px; }
.full-transaction-embedded { padding: 0; margin-top: 12px; }
.transaction-header { display: flex; align-items: center; gap: 8px; padding: 10px 0; cursor: pointer; user-select: none; }
.collapse-icon { font-size: 10px; color: #9ca3af; margin-right: 4px; transition: transform 0.2s ease; display: inline-block; }
.collapse-icon.expanded { transform: rotate(90deg); }
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

@media (max-width: 640px) {
  .embedded-header { flex-direction: column; align-items: stretch; gap: 8px; }
  .header-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .header-actions .action-btn { width: 100%; }
  .url-bar { display: grid; grid-template-columns: 96px minmax(0, 1fr); }
  .method-select { width: 96px; }
  .send-btn { grid-column: 1 / -1; width: 100%; }
  .tab-item { padding: 8px 10px; font-size: 12px; }
}
</style>
