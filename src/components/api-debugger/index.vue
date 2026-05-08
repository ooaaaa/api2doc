<template>
  <div class="api-debugger">
    <div class="debugger-layout">
      <!-- URL 栏 - 顶部全宽 -->
      <div class="url-bar-wrapper">
        <div class="url-bar-header">
          <span class="header-label">请求配置</span>
          <div class="header-actions">
            <a-button 
              size="small" 
              type="primary" 
              @click="resetToDefault" 
              title="恢复默认测试数据" 
              class="action-btn"
            >
              重置
            </a-button>
            <a-button 
              size="small" 
              type="primary" 
              @click="toggleCodePanel" 
              title="查看代码示例"
              class="action-btn"
            >
              代码
            </a-button>
          </div>
        </div>

        <RequestUrlBar
          v-model:current-method="currentMethod"
          :test-url="testUrl"
          :testing="testing"
          :is-multi-method="isMultiMethod"
          :available-methods="availableMethods"
          :button-text="getTestButtonText()"
          @test="handleTest"
          @abort="abortRequest"
          @update:test-url="handleUrlUpdate"
        />

        <!-- 特殊接口提示 -->
        <a-alert 
          v-if="isSpecialInterface" 
          :message="getSpecialInterfaceTip()" 
          type="info" 
          show-icon
          style="margin-top: 12px" 
        />
      </div>

      <!-- 左右分栏主体 -->
      <div class="panels-container">
        <!-- 左侧：请求配置 -->
        <div class="panel-left">
          <!-- 参数输入区 - 仅普通 HTTP 接口显示 -->
          <div v-if="!isSpecialInterface" class="request-sections">
            <!-- Query 参数区块 - 始终显示 -->
            <div class="request-section">
              <div class="section-header" @click="toggleRequestSection('query')">
                <span class="collapse-icon" :class="{ expanded: expandedRequestSections.query }">&#9654;</span>
                <span class="section-title">Query 参数</span>
                <span class="section-badge" v-if="enabledQueryCount > 0">{{ enabledQueryCount }}</span>
              </div>
              <div v-show="expandedRequestSections.query" class="section-content">
                <RequestParams
                  v-model:parameters="queryParameters"
                  type="query"
                  add-button-text="添加参数"
                  @add="addQueryParam"
                  @remove="removeQueryParam"
                />
              </div>
            </div>

            <!-- Path 参数区块 - 始终显示 -->
            <div class="request-section">
              <div class="section-header" @click="toggleRequestSection('path')">
                <span class="collapse-icon" :class="{ expanded: expandedRequestSections.path }">&#9654;</span>
                <span class="section-title">Path 参数</span>
                <span class="section-badge" v-if="pathParameters.length > 0">{{ pathParameters.length }}</span>
              </div>
              <div v-show="expandedRequestSections.path" class="section-content">
                <RequestParams
                  v-model:parameters="pathParameters"
                  type="path"
                />
              </div>
            </div>

            <!-- 请求头区块 - 始终显示 -->
            <div class="request-section">
              <div class="section-header" @click="toggleRequestSection('headers')">
                <span class="collapse-icon" :class="{ expanded: expandedRequestSections.headers }">&#9654;</span>
                <span class="section-title">请求头</span>
                <span class="section-badge" v-if="enabledHeadersCount > 0">{{ enabledHeadersCount }}</span>
              </div>
              <div v-show="expandedRequestSections.headers" class="section-content">
                <RequestParams
                  v-model:parameters="headerParameters"
                  type="header"
                  add-button-text="添加Header"
                  @add="addHeaderParam"
                  @remove="removeHeaderParam"
                />
                <div class="auto-headers-hint">
                  <span class="auto-headers-label">自动附加</span>
                  <a-tooltip title="请求目标主机，从 URL 中自动提取">
                    <a-tag class="auto-header-tag">Host</a-tag>
                  </a-tooltip>
                  <a-tooltip title="api2doc/1.0">
                    <a-tag class="auto-header-tag">User-Agent</a-tag>
                  </a-tooltip>
                  <a-tooltip title="*/*">
                    <a-tag class="auto-header-tag">Accept</a-tag>
                  </a-tooltip>
                  <a-tooltip v-if="currentMethod !== 'GET' && currentMethod !== 'HEAD'" :title="requestBodyContentType">
                    <a-tag class="auto-header-tag">Content-Type</a-tag>
                  </a-tooltip>
                </div>
              </div>
            </div>

            <!-- 请求体区块 - 始终显示 -->
            <div class="request-section">
              <div class="section-header" @click="toggleRequestSection('body')">
                <span class="collapse-icon" :class="{ expanded: expandedRequestSections.body }">&#9654;</span>
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
              <div v-show="expandedRequestSections.body" class="section-content">
                <RequestBody
                  v-model:active-body-tab="activeBodyTab"
                  v-model:body-content="testParams"
                  v-model:form-fields="formFields"
                  @add-form-field="addFormField"
                  @remove-form-field="removeFormField"
                  @file-change="({ info, index }) => handleFileChange(info, index)"
                />
              </div>
            </div>
          </div>

          <!-- WebSocket 消息输入 -->
          <div v-if="interfaceType === 'websocket' && wsConnected" class="ws-message-input">
            <CodeEditor 
              v-model="wsMessage" 
              language="json" 
              :readonly="false"
              min-height="120px"
              max-height="300px"
            />
            <a-button type="primary" @click="sendWebSocketMessage" :disabled="!wsConnected" style="margin-top: 8px">
              发送消息
            </a-button>
          </div>
        </div>

        <!-- 右侧：响应结果 -->
        <div class="panel-right">
          <ResponseViewer
            v-if="hasResult"
            :result="testResult"
            :display-result="displayResult"
            :status="testResultStatus"
            :can-beautify="canBeautify"
            :is-image-response="isImageResponse"
            :image-preview-url="imagePreviewUrl"
            :image-info="imageInfo"
            :is-special-interface="isSpecialInterface"
            :is-binary-response="isBinaryResponse"
            :binary-content-type="binaryContentType"
            :binary-size="binarySize"
            :binary-filename="binaryFilename"
            :duration="testResultTiming.duration"
            :response-headers="testResultHeaders"
            :request-method="currentMethod"
            :request-url="testUrl"
            :request-headers="actualRequestHeaders"
            :request-body="requestBodyForRaw"
            @copy="copyResponse"
            @beautify="beautifyResponse"
            @clear="clearResult"
            @maximize="showMaximizedModal"
            @download-image="downloadImage"
            @download-binary="downloadBinary"
          />

          <a-empty v-else description="发送请求后查看响应结果" class="empty-response" />
        </div>
      </div>

      <!-- 代码面板（右侧抽屉） -->
      <div v-if="showCodePanel" class="code-drawer">
        <div class="drawer-header">
          <span class="drawer-title">代码示例</span>
          <a-button size="small" type="text" @click="closeRightPanel" class="close-drawer-btn">
            关闭
          </a-button>
        </div>
        <div class="drawer-content">
          <div class="code-selector">
            <a-select v-model:value="activeCodeTab" style="width: 200px">
              <a-select-option value="curl">cURL</a-select-option>
              <a-select-option value="wget">wget</a-select-option>
              <a-select-option value="node-fetch">node-fetch</a-select-option>
              <a-select-option value="axios">Axios</a-select-option>
              <a-select-option value="jquery">jQuery</a-select-option>
            </a-select>
            <a-button size="small" @click="copyCurrentCode" class="copy-btn">
              复制
            </a-button>
          </div>
          <div class="code-content">
            <pre class="code-block"><code>{{ currentCodeContent }}</code></pre>
          </div>
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
    <div class="maximized-response">
      <ResponseViewer
        :result="testResult"
        :display-result="displayResult"
        :status="testResultStatus"
        :can-beautify="canBeautify"
        :is-image-response="isImageResponse"
        :image-preview-url="imagePreviewUrl"
        :image-info="imageInfo"
        :is-special-interface="isSpecialInterface"
        :is-binary-response="isBinaryResponse"
        :binary-content-type="binaryContentType"
        :binary-size="binarySize"
        :binary-filename="binaryFilename"
        :duration="testResultTiming.duration"
        :response-headers="testResultHeaders"
        :request-method="currentMethod"
        :request-url="testUrl"
        :request-headers="actualRequestHeaders"
        :request-body="requestBodyForRaw"
        @copy="copyResponse"
        @beautify="beautifyResponse"
        @clear="clearResult"
        @maximize="() => {}"
        @download-image="downloadImage"
        @download-binary="downloadBinary"
      />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import CodeEditor from '../CodeEditor.vue'
import RequestUrlBar from './RequestUrlBar.vue'
import RequestParams from './RequestParams.vue'
import RequestBody from './RequestBody/index.vue'
import ResponseViewer from './ResponseViewer.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useSSE } from './composables/useSSE'
import { useHttpRequest } from './composables/useHttpRequest'
import { getExampleValue, generateExampleFromSchema } from '../../utils/example-utils'
import type { FormField } from './RequestBody/FormBodyEditor.vue'

// 参数接口定义
interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  enabled: boolean
  value: string
  in?: string
  example?: any
  default?: any
  schema?: {
    type?: string
    example?: any
    default?: any
    enum?: any[]
    [key: string]: any
  }
}

// Props 定义
const props = defineProps<{
  api: any
  baseUrl: string
  bodyExample?: string
  curlCode?: string
  wgetCode?: string
  nodeFetchCode?: string
  axiosCode?: string
  jqueryCode?: string
}>()

// Emits 定义
const emit = defineEmits<{
  (e: 'copy-code', lang: string): void
}>()

// 使用 composables
const ws = useWebSocket()
const sse = useSSE()
const http = useHttpRequest()

// 状态管理
const activeRequestTab = ref('headers')
const activeBodyTab = ref('json')
const activeResponseTab = ref('json')

// 请求区折叠状态
const expandedRequestSections = ref({
  query: false,
  path: false,
  headers: false,
  body: false
})

const toggleRequestSection = (section: keyof typeof expandedRequestSections.value) => {
  expandedRequestSections.value[section] = !expandedRequestSections.value[section]
}

// 已启用的 Query 参数数量
const enabledQueryCount = computed(() => {
  return queryParameters.value.filter(p => p.enabled && p.value).length
})

// 已启用的请求头数量
const enabledHeadersCount = computed(() => {
  return headerParameters.value.filter(h => h.enabled && h.value).length
})
const activeCodeTab = ref('curl')
const showCodePanel = ref(false)
const testParams = ref('')
const testResult = ref('')
const testResultStatus = ref(0)
const testResultHeaders = ref<Record<string, string>>({})
const testResultTiming = ref<{
  startTime?: Date
  endTime?: Date
  duration?: number
}>({})
const wsMessage = ref('{}')
const isBeautified = ref(false)
const maximizedModalVisible = ref(false)

// 原始报文用：实际发送的请求头
const actualRequestHeaders = computed(() => {
  const headers: Record<string, string> = {}
  
  // 自定义请求头
  headerParameters.value.forEach(h => {
    if (h.enabled && h.value) {
      headers[h.name] = h.value
    }
  })
  
  // 自动附加的协议头
  try {
    const url = new URL(testUrl.value)
    headers['Host'] = url.host
  } catch { /* ignore */ }
  
  headers['User-Agent'] = 'api2doc/1.0'
  headers['Accept'] = '*/*'
  
  // Content-Type（非 GET/HEAD 时）
  if (currentMethod.value !== 'GET' && currentMethod.value !== 'HEAD') {
    if (activeBodyTab.value === 'form') {
      const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
      headers['Content-Type'] = hasFile ? 'multipart/form-data' : 'application/x-www-form-urlencoded'
    } else {
      headers['Content-Type'] = requestBodyContentType.value
    }
  }
  
  return headers
})

// 原始报文用：请求体内容
const requestBodyForRaw = computed(() => {
  if (currentMethod.value === 'GET' || currentMethod.value === 'HEAD') return ''
  
  if (activeBodyTab.value === 'form') {
    const parts: string[] = []
    formFields.value.forEach(field => {
      if (field.enabled && field.name) {
        if (field.type === 'file' && field.fileList && field.fileList.length > 0) {
          field.fileList.forEach(file => {
            parts.push(`${field.name}=@${file.name}`)
          })
        } else if (field.type === 'text') {
          parts.push(`${field.name}=${field.value}`)
        }
      }
    })
    return parts.join('&')
  }
  
  return testParams.value || ''
})

// 切换代码面板
const toggleCodePanel = () => {
  showCodePanel.value = !showCodePanel.value
}

// 关闭右侧面板
const closeRightPanel = () => {
  showCodePanel.value = false
}

// 当前选中的代码内容
const currentCodeContent = computed(() => {
  switch (activeCodeTab.value) {
    case 'curl':
      return generateDynamicCurl.value
    case 'wget':
      return generateDynamicWget.value
    case 'node-fetch':
      return generateDynamicNodeFetch.value
    case 'axios':
      return generateDynamicAxios.value
    case 'jquery':
      return generateDynamicJQuery.value
    default:
      return ''
  }
})

// 复制当前代码
const copyCurrentCode = async () => {
  try {
    await navigator.clipboard.writeText(currentCodeContent.value)
    showMessage('success', '代码已复制到剪贴板')
  } catch (e) {
    showMessage('error', '复制失败')
  }
}

// 复制动态生成的代码
const copyDynamicCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    showMessage('success', '代码已复制到剪贴板')
  } catch (e) {
    showMessage('error', '复制失败')
  }
}

// 根据当前调试参数生成代码
const generateDynamicCurl = computed(() => {
  const url = testUrl.value
  const method = currentMethod.value

  // 检测特殊接口类型
  const currentType = interfaceType.value
  
  if (currentType === 'websocket') {
    return `# WebSocket 接口无法使用 cURL 直接测试
# 请使用 WebSocket 客户端工具，例如：
# - wscat: pnpm add -g wscat
# - websocat: https://github.com/vi/websocat

# 使用 wscat 连接示例：
wscat -c ${url.replace(/^http/, 'ws')}

# 连接后可以直接输入消息发送`
  }

  if (currentType === 'sse') {
    return `# Server-Sent Events (SSE) 接口
curl -N '${url}'

# -N 参数禁用缓冲，实时显示流式数据
# 按 Ctrl+C 停止接收`
  }

  if (currentType === 'streamable') {
    return `# HTTP Streamable 流式传输接口
curl -N '${url}'

# -N 参数禁用缓冲，实时显示流式数据
# 按 Ctrl+C 停止接收`
  }

  let cmd = `curl -X ${method} '${url}'`

  // 添加启用的 headers
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  if (enabledHeaders.length > 0) {
    enabledHeaders.forEach(h => {
      cmd += ` \\\n  -H '${h.name}: ${h.value}'`
    })
  }

  // 添加 body
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = requestBodyContentType.value
    
    if (activeBodyTab.value === 'form') {
      const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
      
      if (hasFile) {
        cmd += ` \\\n  -H 'Content-Type: multipart/form-data'`
        formFields.value.forEach(field => {
          if (field.enabled && field.name) {
            if (field.type === 'file' && field.fileList && field.fileList.length > 0) {
              field.fileList.forEach(file => {
                cmd += ` \\\n  -F '${field.name}=@${file.name}'`
              })
            } else if (field.type === 'text') {
              cmd += ` \\\n  -F '${field.name}=${field.value}'`
            }
          }
        })
      } else {
        const formData: string[] = []
        formFields.value.forEach(field => {
          if (field.enabled && field.name && field.type === 'text') {
            formData.push(`${field.name}=${encodeURIComponent(field.value)}`)
          }
        })
        if (formData.length > 0) {
          cmd += ` \\\n  -H 'Content-Type: application/x-www-form-urlencoded' \\\n  -d '${formData.join('&')}'`
        }
      }
    } else {
      const bodyContent = testParams.value || '{}'
      cmd += ` \\\n  -H 'Content-Type: ${contentType}' \\\n  -d '${bodyContent}'`
    }
  }

  return cmd
})

const generateDynamicWget = computed(() => {
  const url = testUrl.value
  const method = currentMethod.value

  let cmd = `wget --method=${method}`

  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  if (enabledHeaders.length > 0) {
    enabledHeaders.forEach(h => {
      cmd += ` \\\n  --header='${h.name}: ${h.value}'`
    })
  }

  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = requestBodyContentType.value
    const bodyContent = testParams.value || '{}'
    
    cmd += ` \\\n  --header='Content-Type: ${contentType}' \\\n  --body-data='${bodyContent}'`
  }

  cmd += ` \\\n  -O- '${url}'`

  return cmd
})

const generateDynamicNodeFetch = computed(() => {
  const url = testUrl.value
  const method = currentMethod.value

  let code = `// 安装: pnpm add node-fetch\nimport fetch from 'node-fetch';\n\n`
  code += `const url = '${url}';\n`

  const options: string[] = [`  method: '${method}'`]

  const headers: string[] = []
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  if (enabledHeaders.length > 0) {
    enabledHeaders.forEach(h => {
      headers.push(`    '${h.name}': '${h.value}'`)
    })
  }

  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = requestBodyContentType.value
    headers.push(`    'Content-Type': '${contentType}'`)
  }

  if (headers.length > 0) {
    options.push(`  headers: {\n${headers.join(',\n')}\n  }`)
  }

  if (method !== 'GET' && method !== 'HEAD') {
    const bodyContent = testParams.value || '{}'
    const contentType = requestBodyContentType.value
    
    if (contentType === 'application/x-www-form-urlencoded') {
      options.push(`  body: new URLSearchParams(${bodyContent}).toString()`)
    } else if (contentType === 'application/json') {
      options.push(`  body: JSON.stringify(${bodyContent})`)
    } else {
      options.push(`  body: ${bodyContent}`)
    }
  }

  code += `const options = {\n${options.join(',\n')}\n};\n\n`
  code += `fetch(url, options)\n`
  code += `  .then(res => res.json())\n`
  code += `  .then(data => console.log(data))\n`
  code += `  .catch(err => console.error('Error:', err));`

  return code
})

const generateDynamicAxios = computed(() => {
  const url = testUrl.value
  const method = currentMethod.value.toLowerCase()

  let code = `// 安装: pnpm add axios\nimport axios from 'axios';\n\n`

  const config: string[] = [`  url: '${url}'`, `  method: '${method}'`]

  const headers: string[] = []
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  if (enabledHeaders.length > 0) {
    enabledHeaders.forEach(h => {
      headers.push(`    '${h.name}': '${h.value}'`)
    })
  }

  if (headers.length > 0) {
    config.push(`  headers: {\n${headers.join(',\n')}\n  }`)
  }

  if (method !== 'get' && method !== 'head') {
    const bodyContent = testParams.value || '{}'
    const contentType = requestBodyContentType.value
    
    if (contentType === 'application/x-www-form-urlencoded') {
      config.push(`  data: new URLSearchParams(${bodyContent})`)
    } else if (contentType === 'application/json') {
      config.push(`  data: ${bodyContent}`)
    } else {
      config.push(`  data: ${bodyContent}`)
    }
  }

  code += `axios({\n${config.join(',\n')}\n})\n`
  code += `  .then(response => console.log(response.data))\n`
  code += `  .catch(error => console.error('Error:', error));`

  return code
})

const generateDynamicJQuery = computed(() => {
  const url = testUrl.value
  const method = currentMethod.value

  let code = `// 确保已引入 jQuery\n$.ajax({\n`
  code += `  url: '${url}',\n`
  code += `  type: '${method}',\n`

  const headers: string[] = []
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  if (enabledHeaders.length > 0) {
    enabledHeaders.forEach(h => {
      headers.push(`    '${h.name}': '${h.value}'`)
    })
  }

  if (headers.length > 0) {
    code += `  headers: {\n${headers.join(',\n')}\n  },\n`
  }

  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = requestBodyContentType.value
    const bodyContent = testParams.value || '{}'
    
    code += `  contentType: '${contentType}',\n`
    
    if (contentType === 'application/x-www-form-urlencoded') {
      code += `  data: ${bodyContent},\n`
    } else if (contentType === 'application/json') {
      code += `  data: JSON.stringify(${bodyContent}),\n`
    } else {
      code += `  data: ${bodyContent},\n`
    }
  }

  code += `  success: function(data) {\n`
  code += `    console.log(data);\n`
  code += `  },\n`
  code += `  error: function(xhr, status, error) {\n`
  code += `    console.error('Error:', error);\n`
  code += `  }\n`
  code += `});`

  return code
})

// 图片响应相关
const isImageResponse = ref(false)
const imagePreviewUrl = ref('')
const imageBlob = ref<Blob | null>(null)
const imageInfo = ref('')

// 二进制响应相关
const isBinaryResponse = ref(false)
const binaryBlob = ref<Blob | null>(null)
const binaryContentType = ref('')
const binarySize = ref('')
const binaryFilename = ref('')

// 参数列表
const pathParameters = ref<ApiParameter[]>([])
const queryParameters = ref<ApiParameter[]>([])
const headerParameters = ref<ApiParameter[]>([])
const formFields = ref<FormField[]>([])

// 多方法支持
const currentMethod = ref('')
const isMultiMethod = computed(() => props.api.method === 'MULTI')
const availableMethods = computed(() => {
  // 支持所有常用 HTTP 方法
  const allMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  
  if (isMultiMethod.value && props.api.methodList) {
    return props.api.methodList
  }
  
  // 返回所有方法，但将当前方法放在第一位
  const currentMethodValue = props.api.method
  return [currentMethodValue, ...allMethods.filter(m => m !== currentMethodValue)]
})

// 初始化当前方法
watch(() => props.api, () => {
  if (isMultiMethod.value && props.api.methodList && props.api.methodList.length > 0) {
    currentMethod.value = props.api.methodList[0]
  } else {
    currentMethod.value = props.api.method
  }
}, { immediate: true })

// 是否正在同步 URL（防止循环更新）
const isSyncingUrl = ref(false)

// 构建测试 URL
const testUrl = computed(() => {
  let url = `${props.baseUrl}${props.api.path}`
  
  // 替换路径参数
  pathParameters.value.forEach((param) => {
    url = url.replace(`{${param.name}}`, param.value || 'value')
  })
  
  // 拼接Query参数
  const enabledQueryParams = queryParameters.value.filter(p => p.enabled && p.name && p.value)
  if (enabledQueryParams.length > 0) {
    const queryString = enabledQueryParams
      .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`)
      .join('&')
    url += `?${queryString}`
  }
  
  return url
})

// 处理 URL 更新（从地址栏手动编辑）
const handleUrlUpdate = (newUrl: string) => {
  if (isSyncingUrl.value) return
  
  isSyncingUrl.value = true
  
  try {
    const urlObj = new URL(newUrl)
    
    // 更新 Query 参数
    const searchParams = new URLSearchParams(urlObj.search)
    queryParameters.value.forEach(param => {
      const value = searchParams.get(param.name)
      if (value !== null) {
        param.value = value
        param.enabled = true
      } else {
        param.enabled = false
      }
    })
    
    // 更新 Path 参数（从路径中提取）
    // 获取 API 路径模板，例如 /api/url-params/path/{id}
    const pathTemplate = props.api.path
    const urlPath = urlObj.pathname.replace(props.baseUrl.replace(/^https?:\/\/[^/]+/, ''), '')
    
    // 提取路径参数值
    const templateParts = pathTemplate.split('/')
    const urlParts = urlPath.split('/')
    
    templateParts.forEach((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const paramName = part.slice(1, -1)
        const param = pathParameters.value.find(p => p.name === paramName)
        if (param && urlParts[index]) {
          param.value = decodeURIComponent(urlParts[index])
        }
      }
    })
  } catch (e) {
    console.warn('URL 解析失败:', e)
  } finally {
    setTimeout(() => {
      isSyncingUrl.value = false
    }, 100)
  }
}

// 检测接口类型
const interfaceType = computed(() => {
  const url = testUrl.value
  const summary = props.api.summary || ''

  if (url.includes('/ws') || summary.includes('WebSocket')) {
    return 'websocket'
  }
  if (url.includes('/sse') || summary.includes('SSE')) {
    return 'sse'
  }
  if (url.includes('/streamable') || summary.includes('Streamable')) {
    return 'streamable'
  }
  return 'http'
})

const isSpecialInterface = computed(() => interfaceType.value !== 'http')
const hasResult = computed(() => testResult.value !== '')
const wsConnected = computed(() => ws.connected.value)
const sseConnected = computed(() => sse.connected.value)
const testing = computed(() => {
  const currentType = interfaceType.value
  if (currentType === 'websocket') {
    return wsConnected.value
  } else if (currentType === 'sse') {
    return sseConnected.value
  } else if (currentType === 'streamable') {
    return http.testing.value
  } else {
    return http.testing.value
  }
})

// 显示的结果（可能是美化后的）
const displayResult = computed(() => {
  if (!isBeautified.value) {
    return testResult.value
  }
  
  try {
    const parsed = JSON.parse(testResult.value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return testResult.value
  }
})

// 判断是否可以美化
const canBeautify = computed(() => {
  if (!testResult.value) return false
  
  try {
    JSON.parse(testResult.value)
    return true
  } catch {
    return false
  }
})

// 请求体 Content-Type
const requestBodyContentType = computed(() => {
  const requestBody = props.api.requestBody
  if (!requestBody?.content) return 'application/json'
  
  if (requestBody.content['application/x-www-form-urlencoded']) return 'application/x-www-form-urlencoded'
  if (requestBody.content['multipart/form-data']) return 'multipart/form-data'
  if (requestBody.content['application/json']) return 'application/json'
  if (requestBody.content['application/xml'] || requestBody.content['text/xml']) return 'application/xml'
  if (requestBody.content['text/plain']) return 'text/plain'
  
  return 'application/json'
})

// 完整请求过程
const fullRequestProcess = computed(() => {
  if (!testResult.value) return ''
  
  const type = interfaceType.value
  if (type === 'sse' || type === 'streamable') {
    return '流式接口不支持显示完整请求过程，请查看其他标签页'
  }
  
  let result = ''
  
  // 解析URL获取Host和Path
  let host = ''
  let path = ''
  try {
    const url = new URL(testUrl.value)
    host = url.host
    path = url.pathname + url.search
  } catch {
    // 如果URL解析失败，使用原始URL
    host = testUrl.value.split('/')[2] || 'unknown'
    path = testUrl.value
  }
  
  // ========== 请求信息概览 ==========
  if (testResultTiming.value.startTime) {
    result += `请求时间: ${testResultTiming.value.startTime.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })}\n`
  }
  if (testResultTiming.value.duration !== undefined) {
    result += `请求耗时: ${testResultTiming.value.duration} ms\n`
  }
  result += `请求地址: ${testUrl.value}\n`
  result += `\n`
  
  // ========== 请求部分 ==========
  result += `======================================================================\n`
  result += `                           请求报文                                    \n`
  result += `======================================================================\n\n`
  result += `${currentMethod.value} ${path} HTTP/1.1\r\n`
  result += `----------------------------------------------------------------------\n\n`
  
  // 构建完整的请求头（包含协议必备字段）
  const allRequestHeaders: Record<string, string> = {
    'Host': host,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  }

  // 根据接口类型添加特定请求头
  const currentInterfaceType = interfaceType.value
  if (currentInterfaceType === 'websocket') {
    allRequestHeaders['Upgrade'] = 'websocket'
    allRequestHeaders['Connection'] = 'Upgrade'
    allRequestHeaders['Sec-WebSocket-Key'] = 'dGhlIHNhbXBsZSBub25jZQ=='
    allRequestHeaders['Sec-WebSocket-Version'] = '13'
    allRequestHeaders['Accept'] = '*/*'
  } else if (currentInterfaceType === 'sse') {
    allRequestHeaders['Accept'] = 'text/event-stream'
    allRequestHeaders['Cache-Control'] = 'no-cache'
    allRequestHeaders['Connection'] = 'keep-alive'
    allRequestHeaders['Keep-Alive'] = 'timeout=60, max=100'
    allRequestHeaders['Pragma'] = 'no-cache'
    allRequestHeaders['X-Requested-With'] = 'XMLHttpRequest'
  } else if (currentInterfaceType === 'streamable') {
    allRequestHeaders['Accept'] = '*/*'
    allRequestHeaders['Accept-Encoding'] = 'chunked, gzip, deflate, br'
    allRequestHeaders['Connection'] = 'keep-alive'
    allRequestHeaders['Keep-Alive'] = 'timeout=60, max=100'
    allRequestHeaders['Cache-Control'] = 'no-cache'
    allRequestHeaders['Pragma'] = 'no-cache'
    allRequestHeaders['TE'] = 'trailers'
  } else {
    allRequestHeaders['Accept'] = '*/*'
    allRequestHeaders['Connection'] = 'keep-alive'
    allRequestHeaders['Keep-Alive'] = 'timeout=60, max=100'
  }
  
  // 合并自定义请求头（自定义请求头优先级更高）
  const enabledHeaders = headerParameters.value.filter(h => h.enabled && h.value)
  enabledHeaders.forEach(h => {
    allRequestHeaders[h.name] = h.value
  })

  // 输出所有请求头
  Object.entries(allRequestHeaders).forEach(([key, value]) => {
    result += `${key}: ${value}\r\n`
  })
  
  // 请求体相关头部
  const hasBody = currentMethod.value !== 'GET' && currentMethod.value !== 'HEAD'
  const contentType = requestBodyContentType.value
  
  if (hasBody) {
    let bodyContent = ''
    let actualContentType = contentType
    
    if (activeBodyTab.value === 'form') {
      const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
      
      if (hasFile) {
        actualContentType = 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
        result += `Content-Type: ${actualContentType}\n`
        
        // 计算body长度（简化处理）
        let bodyLength = 0
        formFields.value.forEach(field => {
          if (field.enabled && field.name) {
            if (field.type === 'file' && field.fileList && field.fileList.length > 0) {
              field.fileList.forEach(file => {
                bodyLength += file.size + 200 // 估算boundary和header长度
              })
            } else if (field.type === 'text') {
              bodyLength += field.value.length + 100
            }
          }
        })
        result += `Content-Length: ${bodyLength}\n`
        
        // 构建multipart body
        result += `\n`
        formFields.value.forEach(field => {
          if (field.enabled && field.name) {
            if (field.type === 'file' && field.fileList && field.fileList.length > 0) {
              field.fileList.forEach(file => {
                result += `------WebKitFormBoundary7MA4YWxkTrZu0gW\n`
                result += `Content-Disposition: form-data; name="${field.name}"; filename="${file.name}"\n`
                result += `Content-Type: ${file.type || 'application/octet-stream'}\n\n`
                result += `[二进制文件内容: ${file.name}, 大小: ${(file.size / 1024).toFixed(2)} KB]\n\n`
              })
            } else if (field.type === 'text') {
              result += `------WebKitFormBoundary7MA4YWxkTrZu0gW\n`
              result += `Content-Disposition: form-data; name="${field.name}"\n\n`
              result += `${field.value}\n\n`
            }
          }
        })
        result += `------WebKitFormBoundary7MA4YWxkTrZu0gW--\n`
      } else {
        // application/x-www-form-urlencoded
        actualContentType = 'application/x-www-form-urlencoded'
        const formData: string[] = []
        formFields.value.forEach(field => {
          if (field.enabled && field.name && field.type === 'text') {
            formData.push(`${field.name}=${encodeURIComponent(field.value)}`)
          }
        })
        bodyContent = formData.join('&')
        result += `Content-Type: ${actualContentType}\n`
        result += `Content-Length: ${bodyContent.length}\n`
        result += `\n${bodyContent}\n`
      }
    } else {
      // JSON/XML/Text body
      bodyContent = testParams.value || ''
      result += `Content-Type: ${actualContentType}\n`
      result += `Content-Length: ${new Blob([bodyContent]).size}\n`
      result += `\n${bodyContent}\n`
    }
  }
  
  // ========== 请求/响应分隔线 ==========
  result += `\n`
  result += `======================================================================\n`
  result += `                           响应报文                                    \n`
  result += `======================================================================\n\n`
  
  // 响应时间信息
  if (testResultTiming.value.endTime) {
    result += `响应时间: ${testResultTiming.value.endTime.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })}\n`
  }
  if (testResultTiming.value.duration !== undefined) {
    result += `响应耗时: ${testResultTiming.value.duration} ms\n`
  }
  result += `\n`
  
  // ========== 响应部分 ==========
  if (testResultStatus.value > 0) {
    // HTTP状态码对应的标准原因短语
    const statusMessages: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    }
    
    const statusText = statusMessages[testResultStatus.value] || 
                      (testResultStatus.value >= 200 && testResultStatus.value < 300 ? 'OK' : 'Error')
    
    result += `HTTP/1.1 ${testResultStatus.value} ${statusText}\n`
    result += `----------------------------------------------------------------------\n\n`
  }
  
  // 响应头
  if (Object.keys(testResultHeaders.value).length > 0) {
    Object.entries(testResultHeaders.value).forEach(([key, value]) => {
      result += `${key}: ${value}\n`
    })
    result += `\n`
  }
  
  // 响应体
  if (testResult.value) {
    // 尝试格式化JSON响应
    try {
      const jsonData = JSON.parse(testResult.value)
      result += JSON.stringify(jsonData, null, 2)
    } catch {
      // 不是JSON，直接输出
      result += testResult.value
    }
  }
  
  return result
})

// 根据Content-Type处理响应并选择合适的标签页
const handleResponseByContentType = async (response: Response, contentType: string) => {
  // 重置图片相关状态
  isImageResponse.value = false
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = ''
  imageBlob.value = null
  imageInfo.value = ''

  // 重置二进制相关状态
  isBinaryResponse.value = false
  binaryBlob.value = null
  binaryContentType.value = ''
  binarySize.value = ''
  binaryFilename.value = ''

  // 根据Content-Type处理响应
  if (contentType.includes('image/')) {
    // 图片响应 - 特殊接口不支持图片预览
    if (isSpecialInterface.value) {
      const text = await response.text()
      testResult.value = text || '(空响应)'
      activeResponseTab.value = 'text'
    } else {
      const blob = await response.blob()
      imageBlob.value = blob
      imagePreviewUrl.value = URL.createObjectURL(blob)
      
      const sizeKB = (blob.size / 1024).toFixed(2)
      imageInfo.value = `类型: ${contentType} | 大小: ${sizeKB} KB`
      
      if (contentType.includes('svg')) {
        const text = await blob.text()
        testResult.value = text
      } else {
        testResult.value = `[图片数据 - ${contentType}]`
      }
      
      isImageResponse.value = true
      activeResponseTab.value = 'image'
    }
  } else if (contentType.includes('application/json')) {
    // JSON响应
    const data = await response.json()
    testResult.value = JSON.stringify(data, null, 2)
    activeResponseTab.value = 'json'
    isBeautified.value = true
  } else if (contentType.includes('text/html')) {
    // HTML响应
    const text = await response.text()
    testResult.value = text || '(空响应)'
    activeResponseTab.value = 'html'
  } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
    // XML响应
    const text = await response.text()
    testResult.value = text || '(空响应)'
    activeResponseTab.value = 'xml'
  } else if (
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf') ||
    contentType.includes('application/zip') ||
    contentType.includes('application/x-zip-compressed') ||
    contentType.includes('application/vnd.') ||
    contentType.includes('application/msword') ||
    contentType.includes('application/vnd.openxmlformats-officedocument') ||
    contentType.includes('video/') ||
    contentType.includes('audio/')
  ) {
    // 二进制文件响应 - 直接触发下载
    const blob = await response.blob()
    binaryBlob.value = blob
    binaryContentType.value = contentType
    
    // 计算文件大小
    const sizeKB = blob.size / 1024
    if (sizeKB < 1024) {
      binarySize.value = `${sizeKB.toFixed(2)} KB`
    } else {
      binarySize.value = `${(sizeKB / 1024).toFixed(2)} MB`
    }
    
    // 尝试从响应头获取文件名
    const contentDisposition = testResultHeaders.value['content-disposition'] || ''
    let filename = ''
    
    console.log('Content-Disposition:', contentDisposition)
    
    if (contentDisposition) {
      // 尝试解析 filename 参数
      const filenameMatch = contentDisposition.match(/filename\s*=\s*"([^"]+)"/i) ||
                           contentDisposition.match(/filename\s*=\s*([^;,\s]+)/i)
      
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].trim()
        console.log('解析到的文件名:', filename)
      }
    }
    
    // 如果没有从响应头获取到文件名，根据Content-Type生成合适的文件名
    if (!filename) {
      if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')) {
        filename = '测试下载.docx'
      } else if (contentType.includes('application/pdf')) {
        filename = '测试下载.pdf'
      } else if (contentType.includes('application/zip')) {
        filename = '测试下载.zip'
      } else if (contentType.includes('application/msword')) {
        filename = '测试下载.doc'
      } else {
        const ext = contentType.split('/')[1]?.split(';')[0] || 'bin'
        filename = `测试下载.${ext}`
      }
      console.log('使用默认文件名:', filename)
    }
    
    binaryFilename.value = filename
    
    testResult.value = `[二进制文件 - ${contentType}]`
    isBinaryResponse.value = true
    activeResponseTab.value = 'other'
    
    // 自动触发下载
    try {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = binaryFilename.value
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showMessage('success', `文件下载成功: ${binaryFilename.value}`)
    } catch (e: any) {
      showMessage('error', `自动下载失败: ${e.message}`)
    }
  } else {
    // 其他类型，尝试解析为文本
    const text = await response.text()
    testResult.value = text || '(空响应)'
    
    // 尝试判断是否为JSON格式
    try {
      JSON.parse(text)
      activeResponseTab.value = 'json'
    } catch {
      activeResponseTab.value = 'text'
    }
  }
}

// 统一的消息提示函数
const showMessage = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
  message[type](text)
}

// 复制响应内容
const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(displayResult.value)
    showMessage('success', '已复制到剪贴板')
  } catch (e) {
    showMessage('error', '复制失败')
  }
}

// 美化响应内容
const beautifyResponse = () => {
  if (!canBeautify.value) {
    showMessage('warning', '当前内容不是有效的JSON格式')
    return
  }
  
  isBeautified.value = !isBeautified.value
  showMessage('success', isBeautified.value ? 'JSON已美化' : '已恢复原始格式')
}

// 清空结果
const clearResult = () => {
  testResult.value = ''
  testResultStatus.value = 0
  testResultHeaders.value = {}
  testResultTiming.value = {}
  isBeautified.value = false
  
  // 清空图片相关
  isImageResponse.value = false
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = ''
  imageBlob.value = null
  imageInfo.value = ''
  
  // 清空二进制相关
  isBinaryResponse.value = false
  binaryBlob.value = null
  binaryContentType.value = ''
  binarySize.value = ''
  binaryFilename.value = ''
}

// 下载图片
const downloadImage = () => {
  if (!imageBlob.value) {
    showMessage('error', '没有可下载的图片')
    return
  }

  try {
    const contentDisposition = testResultHeaders.value['content-disposition'] || ''
    let filename = 'download.svg'
    
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '')
    }

    const url = URL.createObjectURL(imageBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showMessage('success', '图片下载成功')
  } catch (e: any) {
    showMessage('error', `下载失败: ${e.message}`)
  }
}

// 下载二进制文件
const downloadBinary = () => {
  if (!binaryBlob.value) {
    showMessage('error', '没有可下载的文件')
    return
  }

  try {
    const url = URL.createObjectURL(binaryBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = binaryFilename.value || 'download.bin'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showMessage('success', '文件下载成功')
  } catch (e: any) {
    showMessage('error', `下载失败: ${e.message}`)
  }
}

// 显示最大化弹窗
const showMaximizedModal = () => {
  maximizedModalVisible.value = true
}

// 终止请求
const abortRequest = () => {
  const currentType = interfaceType.value
  
  if (currentType === 'streamable' || currentType === 'http') {
    http.abort()
    if (!testResult.value.includes('已停止') && !testResult.value.includes('已终止')) {
      testResult.value += '\n⏹ 请求已终止\n'
    }
  } else if (currentType === 'sse') {
    closeSSE()
  } else if (currentType === 'websocket') {
    closeWebSocket()
  }
  
  showMessage('info', '请求已终止')
}

// 关闭 WebSocket
const closeWebSocket = (silent = false) => {
  ws.close(silent)
  if (!silent) {
    testResult.value += '\n🔌 WebSocket 连接已关闭\n'
    showMessage('info', 'WebSocket 连接已关闭')
  }
}

// 关闭 SSE
const closeSSE = (silent = false) => {
  console.log('调用closeSSE, silent:', silent, 'sseConnected:', sseConnected.value)
  
  if (sseConnected.value || sse.instance.value) {
    sse.close(silent)
    
    if (!silent) {
      testResult.value += '\n🔌 SSE 连接已关闭\n'
      showMessage('info', 'SSE 连接已关闭')
    }
  }
}

// 关闭所有连接
const closeAllConnections = (silent = false) => {
  http.abort()
  closeWebSocket(silent)
  closeSSE(silent)
}

// 参数操作
const addQueryParam = () => {
  queryParameters.value.push({
    name: '',
    type: 'string',
    required: false,
    description: '自定义参数',
    enabled: true,
    value: ''
  })
}

const removeQueryParam = (index: number) => {
  queryParameters.value.splice(index, 1)
}

const addHeaderParam = () => {
  headerParameters.value.push({
    name: '',
    type: 'string',
    required: false,
    description: '自定义Header',
    enabled: true,
    value: ''
  })
}

const removeHeaderParam = (index: number) => {
  headerParameters.value.splice(index, 1)
}

const addFormField = () => {
  formFields.value.push({
    name: '',
    type: 'text',
    value: '',
    enabled: true,
    fromSchema: false,
    isMultipleFile: false,
    fileList: []
  })
}

const removeFormField = (index: number) => {
  formFields.value.splice(index, 1)
  syncFormFieldsToJson()
}

const handleFileChange = (info: any, index: number) => {
  formFields.value[index].fileList = info.fileList
}

// 表单字段同步
const syncFormFieldsToJson = () => {
  const obj: any = {}
  formFields.value.forEach(field => {
    if (field.enabled && field.name && field.type === 'text') {
      obj[field.name] = field.value
    }
  })
  testParams.value = JSON.stringify(obj, null, 2)
}

const syncJsonToFormFields = () => {
  try {
    const jsonData = JSON.parse(testParams.value)
    formFields.value.forEach(field => {
      if (field.fromSchema && jsonData.hasOwnProperty(field.name)) {
        field.value = String(jsonData[field.name])
      }
    })
  } catch (e) {
    // JSON 解析失败，忽略
  }
}

// 生成 Body 示例数据
const generateBodyExample = (): string => {
  if (props.bodyExample) {
    return props.bodyExample
  }

  const requestBody = props.api.requestBody
  
  if (!requestBody || !requestBody.content) {
    return JSON.stringify({ key: 'value' }, null, 2)
  }

  const xmlContent = requestBody.content['application/xml'] || requestBody.content['text/xml']
  if (xmlContent) {
    if (xmlContent.example) {
      return xmlContent.example
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
  <success>true</success>
</response>`
  }

  const textContent = requestBody.content['text/plain']
  if (textContent) {
    if (textContent.example) {
      return textContent.example
    }
    return `这是一段纯文本内容`
  }

  return JSON.stringify({ key: 'value' }, null, 2)
}

// localStorage 操作
// 简单的MD5哈希函数（用于生成唯一key）
const simpleHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString(36)
}

const getStorageKey = (type: 'path' | 'query' | 'header' | 'body'): string => {
  // 使用分组名+接口名+方法+路径生成唯一标识
  // 确保使用当前实际的方法，而不是API定义的方法（因为可能是多方法接口）
  let method = currentMethod.value
  if (!method) {
    // 如果currentMethod还没初始化，使用API的方法
    if (isMultiMethod.value && props.api.methodList && props.api.methodList.length > 0) {
      method = props.api.methodList[0]
    } else {
      method = props.api.method || 'GET'
    }
  }
  
  // 获取分组名（tags的第一个）
  const tag = props.api.tags?.[0] || 'default'
  // 获取接口名（summary）
  const summary = props.api.summary || ''
  
  // 组合唯一标识：分组名+接口名+方法
  const uniqueId = `${tag}|${summary}|${method}`
  const hash = simpleHash(uniqueId)
  
  // 使用哈希值作为key，格式：api_{type}_{hash}
  return `api_${type}_${hash}`
}

const restoreFromStorage = (type: 'path' | 'query' | 'header' | 'body'): any => {
  try {
    const key = getStorageKey(type)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch (e) {
    return null
  }
}

const saveToStorage = (type: 'path' | 'query' | 'header' | 'body', data: any) => {
  try {
    const key = getStorageKey(type)
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('保存到 localStorage 失败:', e)
  }
}

// 初始化表单字段
const initFormFields = () => {
  formFields.value = []
  
  const requestBody = props.api.requestBody
  if (!requestBody?.content) return

  const content = requestBody.content['application/x-www-form-urlencoded'] || 
                  requestBody.content['multipart/form-data']
  
  if (!content?.schema?.properties) return

  const properties = content.schema.properties
  
  Object.keys(properties).forEach(key => {
    const prop = properties[key]
    const isFile = prop.type === 'string' && prop.format === 'binary'
    const isMultipleFile = prop.type === 'array' && prop.items?.type === 'string' && prop.items?.format === 'binary'
    
    formFields.value.push({
      name: key,
      type: (isFile || isMultipleFile) ? 'file' : 'text',
      value: (isFile || isMultipleFile) ? '' : String(getExampleValue(prop)),
      enabled: true,
      fromSchema: true,
      isMultipleFile: isMultipleFile,
      fileList: []
    })
  })
}

// 初始化参数
const initParameters = (useCache = true) => {
  const params = props.api.parameters || []

  const savedPath = useCache ? restoreFromStorage('path') : null
  const savedQuery = useCache ? restoreFromStorage('query') : null
  const savedHeader = useCache ? restoreFromStorage('header') : null
  const savedBody = useCache ? restoreFromStorage('body') : null

  // 初始化路径参数
  pathParameters.value = params
    .filter((p: ApiParameter) => p.in === 'path')
    .map((p: ApiParameter) => {
      const saved = savedPath?.find((s: any) => s.name === p.name)
      let savedValue = saved?.value
      if (savedValue !== undefined && p.schema?.enum) {
        if (!p.schema.enum.includes(savedValue)) {
          savedValue = undefined
        }
      }
      
      // 优先使用参数级别的 example，其次使用 schema 中的示例
      const exampleValue = p.example ?? getExampleValue(p.schema || { type: 'string' })
      
      return {
        name: p.name,
        type: p.schema?.type || 'string',
        required: p.required || false,
        description: p.description || '-',
        enabled: true,
        value: savedValue ?? exampleValue
      }
    })

  // 初始化 Query 参数
  queryParameters.value = params
    .filter((p: ApiParameter) => p.in === 'query')
    .map((p: ApiParameter) => {
      const saved = savedQuery?.find((s: any) => s.name === p.name)
      let savedValue = saved?.value
      if (savedValue !== undefined && p.schema?.enum) {
        if (!p.schema.enum.includes(savedValue)) {
          savedValue = undefined
        }
      }
      
      // 优先使用参数级别的 example，其次使用 schema 中的示例
      const exampleValue = p.example ?? getExampleValue(p.schema || { type: 'string' })
      
      return {
        name: p.name,
        type: p.schema?.type || 'string',
        required: p.required || false,
        description: p.description || '-',
        enabled: saved?.enabled ?? true,
        value: savedValue ?? exampleValue
      }
    })

  // 初始化 Header 参数
  headerParameters.value = params
    .filter((p: ApiParameter) => p.in === 'header')
    .map((p: ApiParameter) => {
      const saved = savedHeader?.find((s: any) => s.name === p.name)
      let savedValue = saved?.value
      if (savedValue !== undefined && p.schema?.enum) {
        if (!p.schema.enum.includes(savedValue)) {
          savedValue = undefined
        }
      }
      
      // 优先使用参数级别的 example，其次使用 schema 中的示例
      const exampleValue = p.example ?? getExampleValue(p.schema || { type: 'string' })
      
      return {
        name: p.name,
        type: p.schema?.type || 'string',
        required: p.required || false,
        description: p.description || '-',
        enabled: saved?.enabled ?? true,
        value: savedValue ?? exampleValue
      }
    })

  // 恢复 Body 数据
  if (savedBody) {
    testParams.value = savedBody
  } else if (currentMethod.value !== 'GET' && currentMethod.value !== 'HEAD') {
    testParams.value = generateBodyExample()
  } else {
    // GET 和 HEAD 请求默认为空
    testParams.value = ''
  }

  // 初始化表单字段
  initFormFields()

  // 智能展开有数据的折叠区块，无数据的保持折叠
  expandedRequestSections.value.query = queryParameters.value.length > 0
  expandedRequestSections.value.path = pathParameters.value.length > 0
  expandedRequestSections.value.headers = headerParameters.value.length > 0
  expandedRequestSections.value.body = (currentMethod.value !== 'GET' && currentMethod.value !== 'HEAD' && !!props.api.requestBody)

  // 根据 Content-Type 智能切换 Body 子标签页
  const contentType = requestBodyContentType.value
  if (contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data') {
    activeBodyTab.value = 'form'
  } else if (contentType === 'application/xml') {
    activeBodyTab.value = 'xml'
  } else if (contentType === 'text/plain') {
    activeBodyTab.value = 'text'
  } else {
    activeBodyTab.value = 'json'
  }
}

// 重置为默认测试数据
const resetToDefault = () => {
  try {
    localStorage.removeItem(getStorageKey('path'))
    localStorage.removeItem(getStorageKey('query'))
    localStorage.removeItem(getStorageKey('header'))
    localStorage.removeItem(getStorageKey('body'))
  } catch (e) {
    console.error('清除 localStorage 失败:', e)
  }

  initParameters(false)
  clearResult()
  
  showMessage('success', '已恢复默认测试数据')
}

// 获取测试按钮文本
const getTestButtonText = () => {
  if (testing.value) return '请求中...'

  switch (interfaceType.value) {
    case 'websocket':
      return wsConnected.value ? '已连接' : '连接'
    case 'sse':
      return sseConnected.value ? '停止接收' : '开始接收'
    case 'streamable':
      return '开始接收'
    default:
      return '发送请求'
  }
}

// 获取特殊接口提示
const getSpecialInterfaceTip = () => {
  switch (interfaceType.value) {
    case 'websocket':
      return 'WebSocket 双向通信接口，点击"连接"建立连接后可发送消息'
    case 'sse':
      return 'Server-Sent Events 服务器推送接口，点击"开始接收"后将持续接收服务器消息'
    case 'streamable':
      return 'HTTP 流式传输接口，点击"开始接收"后将持续接收数据流'
    default:
      return ''
  }
}

// 处理测试请求
const handleTest = async () => {
  switch (interfaceType.value) {
    case 'websocket':
      await handleWebSocketTest()
      break
    case 'sse':
      await handleSSETest()
      break
    case 'streamable':
      await handleStreamableTest()
      break
    default:
      await handleHttpTest()
      break
  }
}

// WebSocket 测试
const handleWebSocketTest = async () => {
  if (wsConnected.value) {
    showMessage('info', 'WebSocket 已连接')
    return
  }

  testResult.value = '🔄 正在连接 WebSocket...\n'
  testResultStatus.value = 0

  try {
    let wsUrl = testUrl.value.replace(/^http/, 'ws')
    
    if (props.api.path === '/ws') {
      const baseWsUrl = props.baseUrl.replace(/^http/, 'ws').replace(/\/api.*$/, '')
      wsUrl = `${baseWsUrl}/ws`
    }
    
    ws.connect(wsUrl, {
      onOpen: () => {
        testResult.value += '✅ WebSocket 连接成功\n'
        testResult.value += `📍 连接地址: ${wsUrl}\n`
        testResult.value += '💡 现在可以发送消息了\n\n'
        testResultStatus.value = 101
        showMessage('success', 'WebSocket 连接成功')
      },
      onMessage: (event: MessageEvent) => {
        const timestamp = new Date().toLocaleTimeString()
        testResult.value += `[${timestamp}] 📨 收到消息:\n${event.data}\n\n`
      },
      onError: () => {
        testResult.value += `❌ WebSocket 连接错误\n`
        showMessage('error', 'WebSocket 连接错误')
      },
      onClose: () => {
        testResult.value += '🔌 WebSocket 连接已关闭\n'
        showMessage('info', 'WebSocket 连接已关闭')
      }
    })
  } catch (e: any) {
    testResult.value += `❌ 连接失败: ${e.message}\n`
    testResultStatus.value = 0
    showMessage('error', 'WebSocket 连接失败')
  }
}

// 发送 WebSocket 消息
const sendWebSocketMessage = () => {
  if (!wsConnected.value) {
    showMessage('error', 'WebSocket 未连接')
    return
  }

  try {
    JSON.parse(wsMessage.value)

    if (ws.send(wsMessage.value)) {
      const timestamp = new Date().toLocaleTimeString()
      testResult.value += `[${timestamp}] 📤 发送消息:\n${wsMessage.value}\n\n`
      showMessage('success', '消息已发送')
    }
  } catch (e: any) {
    showMessage('error', '消息格式错误，请输入有效的 JSON')
  }
}

// SSE 测试
const handleSSETest = async () => {
  if (sseConnected.value) {
    // 如果已经连接，则断开连接
    closeSSE()
    return
  }

  testResult.value = '📡 正在连接 SSE...\n'
  testResultStatus.value = 0

  try {
    const url = testUrl.value

    sse.connect(url, {
      onMessage: (event: MessageEvent) => {
        const timestamp = new Date().toLocaleTimeString()
        testResult.value += `[${timestamp}] 📨 收到消息:\n${event.data}\n\n`
      },
      onError: () => {
        testResult.value += `❌ SSE 连接错误或已断开\n`
        // 确保状态同步
        if (sseConnected.value) {
          closeSSE(true)
        }
      }
    })

    // 等待一小段时间确保连接建立
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (sseConnected.value) {
      testResultStatus.value = 200
      testResult.value += '✅ SSE 连接成功\n'
      testResult.value += `📍 连接地址: ${url}\n`
      testResult.value += '📡 正在接收消息...\n\n'
      showMessage('success', 'SSE 连接成功')
    } else {
      throw new Error('连接建立失败')
    }
  } catch (e: any) {
    testResult.value += `❌ 连接失败: ${e.message}\n`
    testResultStatus.value = 0
    // 确保清理状态
    closeSSE(true)
    showMessage('error', 'SSE 连接失败')
  }
}

// HTTP Streamable 测试
const handleStreamableTest = async () => {
  testResult.value = '📡 正在连接流式传输...\n'
  testResultStatus.value = 0
  http.testing.value = true

  // 创建新的 AbortController
  http.abortController.value = new AbortController()

  try {
    const url = testUrl.value
    const response = await fetch(url, { signal: http.abortController.value.signal })
    testResultStatus.value = response.status

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    testResult.value += '✅ 连接成功\n'
    testResult.value += `📍 请求地址: ${url}\n`
    testResult.value += '📡 正在接收数据流...\n\n'

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            testResult.value += '\n✅ 流式传输完成\n'
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          const timestamp = new Date().toLocaleTimeString()
          testResult.value += `[${timestamp}] 📦 收到数据:\n${chunk}\n\n`
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          testResult.value += '\n⏹ 流式传输已停止\n'
        } else {
          throw e
        }
      } finally {
        reader.releaseLock()
      }
    }

    showMessage('success', '流式数据接收完成')
  } catch (e: any) {
    if (e.name === 'AbortError') {
      testResult.value += '\n⏹ 流式传输已停止\n'
    } else {
      testResult.value += `❌ 错误: ${e.message}\n`
      showMessage('error', '流式传输失败')
    }
  } finally {
    http.testing.value = false
    http.abortController.value = null
  }
}



// 普通 HTTP 测试
const handleHttpTest = async () => {
  testResult.value = ''
  testResultStatus.value = 0

  try {
    const url = testUrl.value
    const headers: Record<string, string> = {}
    
    const contentType = requestBodyContentType.value

    // 收集自定义请求头
    headerParameters.value.forEach((h: ApiParameter) => {
      if (h.enabled && h.value) {
        headers[h.name] = h.value
      }
    })

    // 准备请求体
    let body: any = undefined
    if (currentMethod.value !== 'GET' && currentMethod.value !== 'HEAD') {
      if (activeBodyTab.value === 'form') {
        const hasFile = formFields.value.some(f => f.enabled && f.type === 'file' && f.fileList && f.fileList.length > 0)
        
        if (hasFile || contentType === 'multipart/form-data') {
          const formData = new FormData()
          formFields.value.forEach(field => {
            if (field.enabled && field.name) {
              if (field.type === 'file' && field.fileList && field.fileList.length > 0) {
                if (field.isMultipleFile) {
                  field.fileList.forEach(file => {
                    formData.append(field.name, file.originFileObj)
                  })
                } else {
                  formData.append(field.name, field.fileList[0].originFileObj)
                }
              } else if (field.type === 'text') {
                formData.append(field.name, field.value)
              }
            }
          })
          body = formData
          delete headers['Content-Type']
        } else {
          const formData = new URLSearchParams()
          formFields.value.forEach(field => {
            if (field.enabled && field.name && field.type === 'text') {
              formData.append(field.name, field.value)
            }
          })
          body = formData.toString()
        }
      } else {
        if (contentType === 'application/x-www-form-urlencoded') {
          try {
            const jsonData = JSON.parse(testParams.value)
            const formData = new URLSearchParams()
            Object.keys(jsonData).forEach(key => {
              formData.append(key, String(jsonData[key]))
            })
            body = formData.toString()
          } catch (e) {
            showMessage('error', '请求体格式错误，请输入有效的 JSON')
            return
          }
        } else if (contentType === 'application/json') {
          body = testParams.value
        } else {
          body = testParams.value
        }
      }
    }

    const result = await http.sendRequest(url, currentMethod.value, headers, body, interfaceType.value, contentType)
    testResultStatus.value = result.status

    // 保存请求耗时信息
    if (result.timing) {
      testResultTiming.value = result.timing
    }

    // 保存实际发送的请求头（用于完整请求过程展示）
    if (result.requestHeaders) {
      Object.entries(result.requestHeaders).forEach(([key, value]) => {
        if (!headers[key]) {
          headers[key] = value
        }
      })
    }

    // 保存响应头
    testResultHeaders.value = {}
    result.headers.forEach((value, key) => {
      testResultHeaders.value[key] = value
    })

    const responseContentType = result.headers.get('content-type') || ''
    
    // 根据Content-Type智能选择响应标签页
    await handleResponseByContentType(result.response as Response, responseContentType)

    // 检查是否为二进制文件下载
    const isBinaryDownload = responseContentType.includes('application/octet-stream') ||
                            responseContentType.includes('application/pdf') ||
                            responseContentType.includes('application/zip') ||
                            responseContentType.includes('application/x-zip-compressed') ||
                            responseContentType.includes('application/vnd.') ||
                            responseContentType.includes('application/msword') ||
                            responseContentType.includes('application/vnd.openxmlformats-officedocument') ||
                            responseContentType.includes('video/') ||
                            responseContentType.includes('audio/')

    if (result.ok || isBinaryDownload) {
      showMessage('success', '请求成功')
    } else {
      showMessage('error', '请求失败')
    }


  } catch (e: any) {
    if (e.message === 'REQUEST_ABORTED') {
      testResult.value = '⏹ 请求已终止'
    } else {
      testResult.value = `错误: ${e.message}`
      testResultStatus.value = 0
      showMessage('error', '请求异常')
    }
  }
}

// 监听 API 变化
watch(() => props.api, () => {
  initParameters()
  clearResult()
  closeAllConnections(true)
}, { immediate: true })

// 监听参数变化并保存
watch(pathParameters, (newVal) => {
  saveToStorage('path', newVal)
}, { deep: true })

watch(queryParameters, (newVal) => {
  saveToStorage('query', newVal)
}, { deep: true })

watch(headerParameters, (newVal) => {
  saveToStorage('header', newVal)
}, { deep: true })

watch(testParams, (newVal) => {
  saveToStorage('body', newVal)
})

// 监听 Body 子标签页切换
watch(activeBodyTab, (newTab, oldTab) => {
  if (newTab === 'form') {
    // 切换到Form时，将JSON数据同步到表单字段
    syncJsonToFormFields()
  } else if (oldTab === 'form' && newTab === 'json') {
    // 只有从Form切换回JSON时，才将表单数据同步到JSON
    // 并且只有当表单有数据时才同步
    const hasFormData = formFields.value.some(field => field.enabled && field.name && field.value)
    if (hasFormData) {
      syncFormFieldsToJson()
    }
  }
})

// 监听表单字段变化
watch(formFields, () => {
  if (activeBodyTab.value === 'form') {
    syncFormFieldsToJson()
  }
}, { deep: true })

// 组件卸载时清理
onUnmounted(() => {
  closeAllConnections(true)
})
</script>


<style scoped>
.api-debugger {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
}

.debugger-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* URL 栏区域 */
.url-bar-wrapper {
  flex-shrink: 0;
}

.url-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.header-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.header-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  transition: all 0.2s ease;
  padding: 2px 10px;
  height: 26px;
}

/* 上下分栏容器 */
.panels-container {
  display: flex;
  flex-direction: column;
}

.panel-left {
  min-width: 0;
}

.panel-right {
  min-width: 0;
  border-top: 1px solid var(--color-border-light, #f0f0f0);
  padding-top: 12px;
}

/* 代码面板（覆盖在右侧） */
.code-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 500px;
  height: 100vh;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
  z-index: 100;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.25s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-drawer-btn {
  padding: 4px 12px;
  font-size: 13px;
  color: #666;
}

.close-drawer-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 请求区折叠面板 */
.request-sections {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.request-section {
  border-bottom: 1px solid var(--color-border, #f0f0f0);
}

.request-section:last-child {
  border-bottom: none;
}

.request-section .section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
}

.request-section .collapse-icon {
  font-size: 10px;
  color: #999;
  transition: transform 0.2s;
}

.request-section .collapse-icon.expanded {
  transform: rotate(90deg);
}

.request-section .section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.request-section .section-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--color-primary-bg, #f0f5ff);
  color: var(--color-primary, #4361ee);
}

.request-section .section-header-actions {
  margin-left: auto;
}

.request-section .section-content {
  padding: 0 0 12px;
}

.auto-headers-hint {
  margin-top: 8px;
  font-size: 11px;
  color: var(--color-text-muted, #999);
}

.auto-headers-label {
  font-size: 11px;
  color: var(--color-text-muted, #999);
  margin-right: 2px;
}

.auto-header-tag {
  font-size: 11px;
  padding: 0 6px;
  background: #f0f0f0;
  color: #666;
  margin: 0;
}

.body-format-select {
  width: 80px;
}

/* 隐藏 RequestBody 内部的 tab 栏，由外部 select 控制 */
.request-section .section-content :deep(.body-sub-tabs .ant-tabs-nav) {
  display: none;
}

/* 代码面板 */
.code-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.code-content {
  flex: 1;
  overflow-y: auto;
}

.code-block {
  background: #f5f7fa;
  color: #2c3e50;
  padding: 16px;
  border-radius: 6px;
  margin: 0;
  border: 1px solid #e0e4e8;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.code-block code {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  display: block;
}

.copy-btn {
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  height: 26px;
  padding: 2px 10px;
}

.copy-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

/* WebSocket 消息输入 */
.ws-message-input {
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

/* 空态 */
.empty-response {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.empty-response :deep(.ant-empty-image) {
  height: 40px;
  margin-bottom: 8px;
}

.empty-response :deep(.ant-empty-description) {
  font-size: 13px;
  color: #999;
}

/* 最大化弹窗 */
.maximized-response {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 900px) {
  .code-drawer {
    width: 100%;
  }
}
</style>
