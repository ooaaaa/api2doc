<template>
  <div class="response-panel">
    <!-- 响应概览栏 -->
    <div class="response-summary">
      <span class="summary-label">响应</span>
      <span 
        v-if="status > 0"
        class="status-badge"
        :class="status >= 200 && status < 300 ? 'status-success' : 'status-error'"
      >
        {{ status }} {{ statusText }}
      </span>
      <span v-if="duration !== undefined" class="duration-badge">
        {{ duration }} ms
      </span>
      <div class="summary-actions">
        <a-button size="small" type="text" @click="$emit('clear')" class="action-btn">
          清空
        </a-button>
      </div>
    </div>

    <!-- 响应体区块 -->
    <div class="response-section">
      <div class="section-header" @click="toggleSection('body')">
        <span class="collapse-icon" :class="{ expanded: expandedSections.body }">&#9654;</span>
        <span class="section-title">响应体</span>
        <span class="section-meta">{{ detectedFormat }}</span>
        <div class="section-actions" @click.stop>
          <a-select 
            v-model:value="viewFormat" 
            size="small" 
            class="format-select"
            :options="formatOptions"
          />
        </div>
      </div>
      <div v-show="expandedSections.body" class="section-content">
        <div class="body-actions">
          <a-button size="small" type="text" @click="$emit('copy')" class="action-btn" title="复制">
            复制
          </a-button>
          <a-button 
            size="small" 
            type="text" 
            @click="$emit('beautify')" 
            class="action-btn" 
            title="美化"
            :disabled="!canBeautify"
          >
            美化
          </a-button>
          <a-button size="small" type="text" @click="$emit('maximize')" class="action-btn" title="最大化">
            最大化
          </a-button>
        </div>
        <!-- 文本类响应：代码高亮框 -->
        <template v-if="currentViewMode === 'code'">
          <CodeEditor 
            :model-value="displayResult" 
            :language="codeLanguage" 
            :readonly="true"
            min-height="120px"
            max-height="500px"
          />
        </template>
        <!-- HTML 渲染预览 -->
        <template v-else-if="currentViewMode === 'html-render'">
          <div class="response-html-render" v-html="result"></div>
        </template>
        <!-- 图片预览 -->
        <template v-else-if="currentViewMode === 'image'">
          <div class="response-image-container">
            <img :src="imagePreviewUrl" alt="响应图片" class="response-image" />
            <div class="image-meta">
              <span class="image-info-text">{{ imageInfo }}</span>
              <a-button size="small" type="primary" @click="$emit('downloadImage')">下载图片</a-button>
            </div>
          </div>
        </template>
        <!-- 二进制文件 -->
        <template v-else-if="currentViewMode === 'binary'">
          <div class="binary-card">
            <div class="binary-item">
              <span class="binary-label">文件类型</span>
              <span class="binary-value">{{ binaryContentType }}</span>
            </div>
            <div class="binary-item" v-if="binarySize">
              <span class="binary-label">文件大小</span>
              <span class="binary-value">{{ binarySize }}</span>
            </div>
            <div class="binary-item" v-if="binaryFilename">
              <span class="binary-label">文件名</span>
              <span class="binary-value">{{ binaryFilename }}</span>
            </div>
            <div class="binary-item status-item">
              <span class="binary-label">状态</span>
              <span class="binary-value success-text">已自动下载</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 响应头区块 -->
    <div v-if="responseHeaders && Object.keys(responseHeaders).length > 0" class="response-section">
      <div class="section-header" @click="toggleSection('headers')">
        <span class="collapse-icon" :class="{ expanded: expandedSections.headers }">&#9654;</span>
        <span class="section-title">响应头</span>
        <span class="section-badge">{{ Object.keys(responseHeaders).length }}</span>
      </div>
      <div v-show="expandedSections.headers" class="section-content">
        <div class="headers-table">
          <div 
            v-for="(value, key) in responseHeaders" 
            :key="key" 
            class="header-row"
          >
            <span class="header-name">{{ key }}</span>
            <span class="header-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cookie 区块（仅在有 Set-Cookie 时显示） -->
    <div v-if="parsedCookies.length > 0" class="response-section">
      <div class="section-header" @click="toggleSection('cookies')">
        <span class="collapse-icon" :class="{ expanded: expandedSections.cookies }">&#9654;</span>
        <span class="section-title">Cookie</span>
        <span class="section-badge">{{ parsedCookies.length }}</span>
      </div>
      <div v-show="expandedSections.cookies" class="section-content">
        <div v-for="(cookie, index) in parsedCookies" :key="index" class="cookie-card">
          <div class="cookie-name">{{ cookie.name }}</div>
          <div class="cookie-detail">
            <span class="cookie-label">值:</span>
            <span class="cookie-value">{{ cookie.value }}</span>
          </div>
          <div class="cookie-attrs">
            <span v-if="cookie.domain" class="cookie-attr">域: {{ cookie.domain }}</span>
            <span v-if="cookie.path" class="cookie-attr">路径: {{ cookie.path }}</span>
            <span v-if="cookie.expires" class="cookie-attr">过期: {{ cookie.expires }}</span>
            <span v-if="cookie.httpOnly" class="cookie-attr tag">HttpOnly</span>
            <span v-if="cookie.secure" class="cookie-attr tag">Secure</span>
            <span v-if="cookie.sameSite" class="cookie-attr tag">SameSite={{ cookie.sameSite }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 原始报文区块 -->
    <div v-if="!isSpecialInterface" class="response-section raw-section">
      <div class="section-header" @click="toggleSection('raw')">
        <span class="collapse-icon" :class="{ expanded: expandedSections.raw }">&#9654;</span>
        <span class="section-title">原始报文</span>
        <span class="section-meta-inline">
          {{ requestMethod }} {{ requestPath }} → {{ status }} {{ statusText }}
        </span>
        <div class="section-actions" @click.stop>
          <a-button size="small" type="text" @click="copyRawTransaction" class="action-btn">
            复制全部
          </a-button>
        </div>
      </div>
      <div v-show="expandedSections.raw" class="section-content">
        <div class="raw-transaction">
          <!-- 请求报文 -->
          <div class="raw-block">
            <div class="raw-label">Request</div>
            <pre class="raw-content"><span class="raw-request-line">{{ requestLine }}</span>
<template v-for="(value, key) in requestHeadersForRaw" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="requestBodyRaw">
<span class="raw-body">{{ requestBodyRaw }}</span></template></pre>
          </div>
          <!-- 响应报文 -->
          <div class="raw-block">
            <div class="raw-label">Response</div>
            <pre class="raw-content"><span class="raw-status-line">HTTP/1.1 {{ status }} {{ statusText }}</span>
<template v-for="(value, key) in responseHeaders" :key="key"><span class="raw-header-name">{{ key }}</span>: <span class="raw-header-value">{{ value }}</span>
</template><template v-if="result">
<span class="raw-body">{{ rawResponseBody }}</span></template></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import CodeEditor from '../CodeEditor.vue'

// Cookie 解析结果
interface ParsedCookie {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: string
  httpOnly: boolean
  secure: boolean
  sameSite?: string
}

interface Props {
  result: string
  displayResult: string
  status: number
  canBeautify: boolean
  isImageResponse: boolean
  imagePreviewUrl: string
  imageInfo: string
  duration?: number
  isSpecialInterface?: boolean
  isBinaryResponse?: boolean
  binaryContentType?: string
  binarySize?: string
  binaryFilename?: string
  // 新增 props
  responseHeaders?: Record<string, string>
  requestMethod?: string
  requestUrl?: string
  requestHeaders?: Record<string, string>
  requestBody?: string
}

interface Emits {
  (e: 'copy'): void
  (e: 'beautify'): void
  (e: 'clear'): void
  (e: 'maximize'): void
  (e: 'downloadImage'): void
  (e: 'downloadBinary'): void
}

const props = withDefaults(defineProps<Props>(), {
  responseHeaders: () => ({}),
  requestMethod: 'GET',
  requestUrl: '',
  requestHeaders: () => ({}),
  requestBody: ''
})

const emit = defineEmits<Emits>()

// 折叠状态 - 有数据的自动展开
const expandedSections = ref({
  body: true,
  headers: false,
  cookies: false,
  raw: false
})

const toggleSection = (section: keyof typeof expandedSections.value) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// 状态码文本
const statusText = computed(() => {
  const map: Record<number, string> = {
    200: 'OK', 201: 'Created', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed',
    500: 'Internal Server Error', 502: 'Bad Gateway',
    503: 'Service Unavailable', 504: 'Gateway Timeout'
  }
  return map[props.status] || (props.status >= 200 && props.status < 300 ? 'OK' : 'Error')
})

// 格式检测
const detectedFormat = computed(() => {
  const ct = props.responseHeaders?.['content-type'] || ''
  if (ct.includes('application/json')) return 'JSON'
  if (ct.includes('text/html')) return 'HTML'
  if (ct.includes('application/xml') || ct.includes('text/xml')) return 'XML'
  if (ct.startsWith('image/')) return '图片'
  if (ct.includes('octet-stream') || ct.includes('pdf')) return '文件'
  // 尝试 JSON 解析
  try { JSON.parse(props.result); return 'JSON' } catch { /* ignore */ }
  return '文本'
})

// 格式选择
const viewFormat = ref('auto')
const formatOptions = computed(() => {
  const opts = [
    { label: '自动', value: 'auto' },
    { label: 'JSON', value: 'json' },
    { label: 'XML', value: 'xml' },
    { label: '文本', value: 'text' },
    { label: 'HTML 渲染', value: 'html-render' },
    { label: 'HTML 源码', value: 'html-source' },
  ]
  if (props.isImageResponse) {
    opts.push({ label: '图片', value: 'image' })
  }
  if (props.isBinaryResponse) {
    opts.push({ label: '文件', value: 'binary' })
  }
  return opts
})

// 当前视图模式
const currentViewMode = computed(() => {
  if (viewFormat.value !== 'auto') {
    if (viewFormat.value === 'image') return 'image'
    if (viewFormat.value === 'binary') return 'binary'
    if (viewFormat.value === 'html-render') return 'html-render'
    return 'code'
  }
  // 自动检测
  if (props.isImageResponse) return 'image'
  if (props.isBinaryResponse) return 'binary'
  const fmt = detectedFormat.value
  if (fmt === 'HTML') return 'html-render'
  return 'code'
})

// 代码高亮语言
const codeLanguage = computed((): 'json' | 'html' | 'xml' | 'text' => {
  if (viewFormat.value !== 'auto') {
    const map: Record<string, 'json' | 'html' | 'xml' | 'text'> = {
      json: 'json', xml: 'xml', text: 'text', 'html-source': 'html'
    }
    return map[viewFormat.value] || 'text'
  }
  const fmt = detectedFormat.value
  if (fmt === 'JSON') return 'json'
  if (fmt === 'XML') return 'xml'
  if (fmt === 'HTML') return 'html'
  return 'text'
})

// Cookie 解析
const parsedCookies = computed((): ParsedCookie[] => {
  const setCookie = props.responseHeaders?.['set-cookie']
  if (!setCookie) return []
  
  // set-cookie 可能是多个值用逗号分隔（但要注意 expires 里也有逗号）
  const cookies: ParsedCookie[] = []
  const parts = setCookie.split(/,(?=\s*\w+=)/)
  
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    
    const segments = trimmed.split(';').map(s => s.trim())
    const [nameValue, ...attrs] = segments
    const eqIndex = nameValue.indexOf('=')
    if (eqIndex === -1) continue
    
    const cookie: ParsedCookie = {
      name: nameValue.substring(0, eqIndex),
      value: nameValue.substring(eqIndex + 1),
      httpOnly: false,
      secure: false
    }
    
    for (const attr of attrs) {
      const lower = attr.toLowerCase()
      if (lower === 'httponly') cookie.httpOnly = true
      else if (lower === 'secure') cookie.secure = true
      else if (lower.startsWith('domain=')) cookie.domain = attr.substring(7)
      else if (lower.startsWith('path=')) cookie.path = attr.substring(5)
      else if (lower.startsWith('expires=')) cookie.expires = attr.substring(8)
      else if (lower.startsWith('samesite=')) cookie.sameSite = attr.substring(9)
    }
    
    cookies.push(cookie)
  }
  
  return cookies
})

// 原始报文相关
const requestPath = computed(() => {
  try {
    const url = new URL(props.requestUrl)
    return url.pathname + url.search
  } catch {
    return props.requestUrl
  }
})

const requestLine = computed(() => {
  return `${props.requestMethod} ${requestPath.value} HTTP/1.1`
})

const requestHeadersForRaw = computed(() => {
  return props.requestHeaders || {}
})

const requestBodyRaw = computed(() => {
  return props.requestBody || ''
})

const rawResponseBody = computed(() => {
  // 尝试格式化 JSON
  try {
    const parsed = JSON.parse(props.result)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.result
  }
})

// 复制原始报文
const copyRawTransaction = async () => {
  let text = `${requestLine.value}\n`
  Object.entries(requestHeadersForRaw.value).forEach(([key, value]) => {
    text += `${key}: ${value}\n`
  })
  if (requestBodyRaw.value) {
    text += `\n${requestBodyRaw.value}\n`
  }
  text += `\n---\n\n`
  text += `HTTP/1.1 ${props.status} ${statusText.value}\n`
  Object.entries(props.responseHeaders || {}).forEach(([key, value]) => {
    text += `${key}: ${value}\n`
  })
  if (props.result) {
    text += `\n${rawResponseBody.value}\n`
  }
  
  try {
    await navigator.clipboard.writeText(text)
    message.success('原始报文已复制')
  } catch {
    message.error('复制失败')
  }
}

// 响应到达时自动展开有数据的区块
watch(() => props.status, (newStatus) => {
  if (newStatus > 0) {
    expandedSections.value.body = true
    expandedSections.value.headers = Object.keys(props.responseHeaders || {}).length > 0
    expandedSections.value.cookies = parsedCookies.value.length > 0
    expandedSections.value.raw = false
  }
})

// 自动检测格式变化时重置 viewFormat
watch(() => props.result, () => {
  viewFormat.value = 'auto'
})
</script>

<style scoped>
.response-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 响应概览栏 */
.response-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px;
  line-height: 1.4;
}

.status-badge.status-success {
  color: #059669;
  background: rgba(16, 185, 129, 0.08);
}

.status-badge.status-error {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
}

.duration-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 3px;
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
}

.summary-actions {
  margin-left: auto;
}

/* 折叠区块 */
.response-section {
  border-bottom: 1px solid var(--color-border-light, #f0f0f0);
}

.response-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
}

.collapse-icon {
  font-size: 10px;
  color: #999;
  transition: transform 0.2s;
}

.collapse-icon.expanded {
  transform: rotate(90deg);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.section-meta {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.section-meta-inline {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.section-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--color-primary-bg, #f0f5ff);
  color: var(--color-primary, #4361ee);
}

.section-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  font-size: 12px;
  padding: 2px 8px;
  height: 24px;
  color: var(--color-text-muted);
}

.action-btn:hover {
  color: var(--color-primary);
}

.format-select {
  width: 90px;
}

:deep(.format-select .ant-select-selector) {
  height: 24px !important;
  font-size: 12px;
}

:deep(.format-select .ant-select-selection-item) {
  line-height: 22px !important;
  font-size: 12px;
}

.section-content {
  padding: 0 0 12px;
}

.body-actions {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

/* 响应头表格 */
.headers-table {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.header-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
}

.header-row:nth-child(odd) {
  background: #fafafa;
}

.header-name {
  font-weight: 600;
  color: #555;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  word-break: break-all;
}

.header-value {
  color: #333;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  word-break: break-all;
}

/* Cookie 卡片 */
.cookie-card {
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
}

.cookie-card:last-child {
  margin-bottom: 0;
}

.cookie-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.cookie-detail {
  font-size: 12px;
  margin-bottom: 6px;
  word-break: break-all;
}

.cookie-label {
  color: #999;
  margin-right: 4px;
}

.cookie-value {
  color: #333;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.cookie-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cookie-attr {
  font-size: 11px;
  color: #666;
  padding: 1px 6px;
  background: #fff;
  border-radius: 3px;
  border: 1px solid #e8e8e8;
}

.cookie-attr.tag {
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border-color: transparent;
  font-weight: 500;
}

/* HTML 渲染 */
.response-html-render {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
}

/* 图片预览 */
.response-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.response-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.image-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-info-text {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

/* 二进制文件卡片 */
.binary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.binary-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.binary-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.binary-value {
  font-size: 12px;
  color: #333;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  word-break: break-all;
}

.status-item {
  background: rgba(16, 185, 129, 0.04);
  border-color: rgba(16, 185, 129, 0.2);
}

.success-text {
  color: #059669;
  font-weight: 600;
}

/* 原始报文 */
.raw-transaction {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.raw-block {
  position: relative;
}

.raw-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary);
  margin-bottom: 6px;
  padding: 2px 8px;
  background: var(--color-primary-bg);
  border-radius: 3px;
  display: inline-block;
}

.raw-content {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.raw-request-line,
.raw-status-line {
  font-weight: 700;
  color: var(--color-primary);
}

.raw-header-name {
  color: #8b5cf6;
}

.raw-header-value {
  color: #333;
}

.raw-body {
  color: #059669;
}
</style>
