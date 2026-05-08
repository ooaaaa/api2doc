<template>
  <div class="api-detail">
    <a-card :bordered="false" class="detail-card">
      <!-- 主 Tab 切换 -->
      <a-tabs v-model:activeKey="activeMainTab" class="main-tabs-top">
        <!-- 文档 Tab -->
        <a-tab-pane key="doc" tab="文档">
          <ApiHeader :api="api" @copy-path="copyPath" />
          
          <!-- 接口类型提示 -->
          <a-alert v-if="apiType !== 'http'" :type="getApiTypeAlertType()" show-icon style="margin-bottom: 16px">
            <template #message>
              <span style="font-weight: 600;">{{ getApiTypeTitle() }}</span>
            </template>
            <template #description>
              <div v-html="getApiTypeDescription()"></div>
            </template>
          </a-alert>

          <!-- 接口描述 -->
          <div v-if="api.description" class="section">
            <div class="section-title">接口描述</div>
            <div class="description-text">{{ api.description }}</div>
          </div>

          <!-- 路径参数 -->
          <ParameterTable
            v-if="pathParameters.length"
            title="路径参数"
            :columns="paramColumns"
            :data-source="pathParameters"
            :expanded-keys="[]"
            :has-children="false"
            :is-all-expanded="false"
            :show-example="false"
          />

          <!-- 查询参数 -->
          <ParameterTable
            v-if="queryParametersDoc.length"
            title="查询参数"
            :columns="paramColumns"
            :data-source="queryParametersDoc"
            :expanded-keys="queryExpandedKeys"
            :has-children="hasQueryChildren"
            :is-all-expanded="isQueryAllExpanded"
            :show-example="false"
            @toggle-expand="toggleQueryExpand"
            @expand="onQueryExpand"
          />

          <!-- 请求头参数 -->
          <ParameterTable
            v-if="headerParametersDoc.length"
            title="请求头"
            :columns="paramColumns"
            :data-source="headerParametersDoc"
            :expanded-keys="[]"
            :has-children="false"
            :is-all-expanded="false"
            :show-example="false"
          />

          <!-- 请求体 -->
          <ParameterTable
            v-if="requestBodySchema"
            title="请求体"
            :columns="bodyColumns"
            :data-source="requestBodySchema"
            :expanded-keys="requestBodyExpandedKeys"
            :has-children="hasRequestBodyChildren"
            :is-all-expanded="isRequestBodyAllExpanded"
            :show-example="shouldShowBodyExample"
            :example-visible="showBodyExample"
            @toggle-expand="toggleRequestBodyExpand"
            @toggle-example="showBodyExample = !showBodyExample"
            @expand="onRequestBodyExpand"
            @copy-example="copyBodyExample"
          >
            <template #example>
              <CodeEditor 
                :model-value="generateBodyExample()" 
                language="json" 
                :readonly="true"
                min-height="120px"
                max-height="400px"
              />
            </template>
          </ParameterTable>

          <!-- 响应参数 -->
          <ParameterTable
            v-if="firstResponse"
            title="响应参数"
            :columns="bodyColumns"
            :data-source="firstResponseSchema"
            :expanded-keys="firstResponseExpandedKeys"
            :has-children="hasFirstResponseChildren"
            :is-all-expanded="isFirstResponseAllExpanded"
            :show-example="firstResponseSchema.length > 0"
            :example-visible="showFirstResponseExample"
            @toggle-expand="toggleFirstResponseExpand"
            @toggle-example="showFirstResponseExample = !showFirstResponseExample"
            @expand="onFirstResponseExpand"
            @copy-example="copyFirstResponseExample"
          >
            <template #example>
              <CodeEditor 
                :model-value="firstResponseExampleJson" 
                language="json" 
                :readonly="true"
                min-height="120px"
                max-height="400px"
              />
            </template>
          </ParameterTable>

          <!-- cURL 示例 -->
          <div class="section curl-section">
            <div class="section-title">
              <span>cURL 示例</span>
            </div>
            <div class="example-section">
              <div class="example-header">
                <span class="example-title">示例</span>
                <a-button size="small" @click="copyCurlCode" class="copy-btn">
                  复制
                </a-button>
              </div>
              <CodeEditor 
                :model-value="curlCode" 
                language="shell" 
                :readonly="true"
                min-height="60px"
                max-height="400px"
              />
            </div>
          </div>
        </a-tab-pane>

        <!-- 调试 Tab -->
        <a-tab-pane key="debug" tab="调试">
          <ApiDebugger 
            :api="api" 
            :base-url="baseUrl" 
            :body-example="generateBodyExample()"
            :curl-code="curlCode"
            :wget-code="wgetCode"
            :node-fetch-code="nodeFetchCode"
            :axios-code="axiosCode"
            :jquery-code="jqueryCode"
            @copy-code="copyCode"
          />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import ApiDebugger from '../ApiDebugger.vue'
import CodeEditor from '../CodeEditor.vue'
import ApiHeader from './ApiHeader.vue'
import ParameterTable from './ParameterTable.vue'
import { useApiParser } from '../../composables/useApiParser'
import { useCodeGenerator } from './composables/useCodeGenerator'
import { getExampleValue, generateExampleFromTree } from '../../utils/example-utils'

const props = defineProps<{
  api: any
  baseUrl: string
  schemas?: Record<string, any>
}>()

// 使用API解析器检测接口类型
const { detectApiType } = useApiParser(ref(null))
const apiType = computed(() => detectApiType(props.api))

const activeMainTab = ref('doc')
const showQueryExample = ref(true)
const showHeaderExample = ref(true)
const showBodyExample = ref(true)
const showFirstResponseExample = ref(true)

// 表格展开状态
const queryExpandedKeys = ref<string[]>([])
const requestBodyExpandedKeys = ref<string[]>([])
const firstResponseExpandedKeys = ref<string[]>([])

// 参数表格列定义
const paramColumns = [
  {
    title: '字段',
    dataIndex: 'name',
    key: 'name',
    width: 150,
    customRender: ({ record }: any) => {
      return {
        children: record.name,
        attrs: {
          class: 'field-name-cell'
        }
      }
    }
  },
  {
    title: '字段描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '示例',
    dataIndex: 'example',
    key: 'example',
    width: 150,
    customRender: ({ record }: any) => {
      const exampleValue = record.example !== undefined ? record.example : 
                          (record.default !== undefined ? record.default : '-')
      return {
        children: exampleValue,
        attrs: {
          class: 'example-cell'
        }
      }
    }
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
    customRender: ({ record }: any) => {
      return record.type || '-'
    }
  },
  {
    title: '是否必填',
    dataIndex: 'required',
    key: 'required',
    width: 100,
    customRender: ({ record }: any) => {
      return {
        children: record.required ? '是' : '否',
        attrs: {
          class: record.required ? 'required-yes' : 'required-no'
        }
      }
    }
  }
]

// 请求体/响应体表格列定义
const bodyColumns = [
  {
    title: '字段',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    customRender: ({ record }: any) => {
      return {
        children: record.name,
        attrs: {
          class: 'field-name-cell'
        }
      }
    }
  },
  {
    title: '字段描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true
  },
  {
    title: '示例',
    dataIndex: 'example',
    key: 'example',
    width: 150,
    customRender: ({ record }: any) => {
      const exampleValue = record.example !== undefined ? record.example : 
                          (record.default !== undefined ? record.default : '-')
      return {
        children: exampleValue,
        attrs: {
          class: 'example-cell'
        }
      }
    }
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120
  },
  {
    title: '是否必填',
    dataIndex: 'required',
    key: 'required',
    width: 100,
    customRender: ({ record }: any) => {
      return {
        children: record.required ? '是' : '否',
        attrs: {
          class: record.required ? 'required-yes' : 'required-no'
        }
      }
    }
  }
]

// 解析 schema 为树形结构
const parseSchemaToTree = (schema: any, requiredFields: string[] = [], parentKey = ''): any[] => {
  if (!schema) return []

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    if (props.schemas && props.schemas[refName]) {
      return parseSchemaToTree(props.schemas[refName], requiredFields, parentKey)
    }
  }

  const properties = schema.properties || {}
  const required = schema.required || requiredFields

  return Object.entries(properties).map(([key, value]: [string, any], index) => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key
    const item: any = {
      key: `${fullKey}-${index}`,
      name: key,
      type: value.type || 'object',
      required: required.includes(key),
      description: value.description || '-',
      schema: value
    }

    if (value.type === 'object' && value.properties) {
      item.children = parseSchemaToTree(value, value.required || [], fullKey)
    }

    if (value.type === 'array' && value.items) {
      item.type = `array<${value.items.type || 'object'}>`
      if (value.items.properties) {
        item.children = parseSchemaToTree(value.items, value.items.required || [], fullKey)
      } else if (value.items.$ref) {
        const refName = value.items.$ref.split('/').pop()
        if (props.schemas && props.schemas[refName]) {
          item.children = parseSchemaToTree(props.schemas[refName], [], fullKey)
        }
      }
    }

    if (value.$ref) {
      const refName = value.$ref.split('/').pop()
      item.type = refName
      if (props.schemas && props.schemas[refName]) {
        item.children = parseSchemaToTree(props.schemas[refName], [], fullKey)
      }
    }

    return item
  })
}

// 文档展示用的参数
const pathParameters = computed(() => {
  return (props.api.parameters || [])
    .filter((p: any) => p.in === 'path')
    .map((p: any) => ({
      name: p.name,
      type: p.schema?.type || 'string',
      required: p.required || false,
      description: p.description || '-',
      example: p.example ?? p.schema?.example,
      default: p.default ?? p.schema?.default
    }))
})

const queryParametersDoc = computed(() => {
  const queryParams = (props.api.parameters || [])
    .filter((p: any) => p.in === 'query')

  return queryParams.map((p: any, index: number) => {
    const item: any = {
      key: `query-${p.name}-${index}`,
      name: p.name,
      type: p.schema?.type || 'string',
      required: p.required || false,
      description: p.description || '-',
      example: p.example ?? p.schema?.example,
      default: p.default ?? p.schema?.default
    }

    if (p.schema?.type === 'object' && p.schema.properties) {
      item.children = parseSchemaToTree(p.schema, p.schema.required || [], p.name)
    }

    if (p.schema?.type === 'array' && p.schema.items) {
      item.type = `array<${p.schema.items.type || 'object'}>`
      if (p.schema.items.properties) {
        item.children = parseSchemaToTree(p.schema.items, p.schema.items.required || [], p.name)
      }
    }

    return item
  })
})

const headerParametersDoc = computed(() => {
  return (props.api.parameters || [])
    .filter((p: any) => p.in === 'header')
    .map((p: any) => ({
      name: p.name,
      type: p.schema?.type || 'string',
      required: p.required || false,
      description: p.description || '-',
      example: p.example ?? p.schema?.example,
      default: p.default ?? p.schema?.default
    }))
})

// 请求体 Content-Type
const requestBodyContentType = computed(() => {
  if (!props.api.requestBody?.content) return null
  
  const content = props.api.requestBody.content
  if (content['application/json']) return 'application/json'
  if (content['application/x-www-form-urlencoded']) return 'application/x-www-form-urlencoded'
  if (content['multipart/form-data']) return 'multipart/form-data'
  if (content['application/xml'] || content['text/xml']) return 'application/xml'
  if (content['text/plain']) return 'text/plain'
  
  return Object.keys(content)[0] || null
})

// 请求体 schema
const requestBodySchema = computed(() => {
  if (!props.api.requestBody) return null

  const content = props.api.requestBody.content
  const jsonContent = content?.['application/json'] || content?.['application/x-www-form-urlencoded']

  if (!jsonContent?.schema) return null

  return parseSchemaToTree(jsonContent.schema)
})

// 是否显示请求体示例
const shouldShowBodyExample = computed(() => {
  const contentType = requestBodyContentType.value
  return contentType === 'application/json'
})

// 获取第一个响应
const firstResponse = computed(() => {
  if (!props.api.responses) return null
  
  if (props.api.responses['200']) {
    return props.api.responses['200']
  }
  
  const firstKey = Object.keys(props.api.responses)[0]
  return firstKey ? props.api.responses[firstKey] : null
})

// 获取响应 schema
const getResponseSchema = (response: any) => {
  if (!response.content) return []

  const jsonContent = response.content['application/json']
  if (!jsonContent?.schema) return []

  return parseSchemaToTree(jsonContent.schema)
}

const firstResponseSchema = computed(() => {
  if (!firstResponse.value) return []
  return getResponseSchema(firstResponse.value)
})

const hasFirstResponseChildren = computed(() => {
  return firstResponseSchema.value.some(item => item.children && item.children.length > 0)
})

const isFirstResponseAllExpanded = computed(() => {
  if (!hasFirstResponseChildren.value) return false
  const allKeys = getAllExpandableKeys(firstResponseSchema.value)
  return allKeys.length > 0 && allKeys.every(key => firstResponseExpandedKeys.value.includes(key))
})

const firstResponseExampleJson = computed(() => {
  if (!firstResponse.value) return '{}'
  return generateResponseExample(firstResponse.value)
})

const getMethodColor = (method: string) => {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
    HEAD: 'cyan',
    OPTIONS: 'geekblue',
    MULTI: 'purple'
  }

  return colors[method] || 'default'
}

const copyPath = () => {
  navigator.clipboard.writeText(props.api.path)
  message.success('路径已复制')
}

// 获取API类型的Alert类型
const getApiTypeAlertType = () => {
  const types: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    websocket: 'info',
    sse: 'success',
    streamable: 'warning'
  }
  return types[apiType.value] || 'info'
}

const getApiTypeTitle = () => {
  const titles: Record<string, string> = {
    websocket: 'WebSocket 双向通信接口',
    sse: 'Server-Sent Events 服务器推送接口',
    streamable: 'HTTP 流式传输接口'
  }
  return titles[apiType.value] || ''
}

const getApiTypeDescription = () => {
  const descriptions: Record<string, string> = {
    websocket: `
      <p style="margin-bottom: 8px;">WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议。</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>支持客户端和服务器之间的双向实时通信</li>
        <li>连接建立后可以持续发送和接收消息</li>
        <li>适用于聊天应用、实时通知、协作编辑等场景</li>
      </ul>
    `,
    sse: `
      <p style="margin-bottom: 8px;">Server-Sent Events 是一种服务器向客户端推送数据的技术。</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>单向通信：服务器主动推送数据到客户端</li>
        <li>基于 HTTP 协议，使用简单</li>
        <li>自动重连机制</li>
        <li>适用于实时数据推送、进度更新、日志流等场景</li>
      </ul>
    `,
    streamable: `
      <p style="margin-bottom: 8px;">HTTP 流式传输允许服务器分块发送响应数据。</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>数据以流的形式逐步传输，无需等待全部数据生成</li>
        <li>支持大文件下载、实时数据处理</li>
        <li>可以使用 NDJSON (换行分隔的JSON) 格式</li>
        <li>适用于大数据传输、AI 流式响应等场景</li>
      </ul>
    `
  }
  return descriptions[apiType.value] || ''
}

// 生成查询参数示例
const generateQueryExample = () => {
  const queryParams = (props.api.parameters || [])
    .filter((p: any) => p.in === 'query')

  if (queryParams.length === 0) {
    return `${props.api.path}`
  }

  const params = queryParams.map((p: any) => {
    // 优先使用参数级别的 example，其次使用 schema 中的示例
    const exampleValue = p.example ?? getExampleValue(p.schema || { type: 'string' })
    return `${p.name}=${exampleValue}`
  })

  return `${props.api.path}?${params.join('&')}`
}

// 构建完整的示例 URL
const buildExampleUrl = (): string => {
  let url = `${props.baseUrl}${props.api.path}`
  
  const pathParams = (props.api.parameters || []).filter((p: any) => p.in === 'path')
  
  pathParams.forEach((param: any) => {
    // 优先使用参数级别的 example，其次使用 schema 中的示例
    const exampleValue = String(param.example ?? getExampleValue(param.schema || { type: 'string' }))
    url = url.replace(`{${param.name}}`, exampleValue)
  })
  
  const queryParams = (props.api.parameters || []).filter((p: any) => p.in === 'query')
  if (queryParams.length > 0) {
    const queryString = queryParams
      .map((param: any) => {
        // 优先使用参数级别的 example，其次使用 schema 中的示例
        const exampleValue = String(param.example ?? getExampleValue(param.schema || { type: 'string' }))
        return `${encodeURIComponent(param.name)}=${encodeURIComponent(exampleValue)}`
      })
      .join('&')
    url += `?${queryString}`
  }
  
  return url
}

const copyQueryExample = () => {
  navigator.clipboard.writeText(generateQueryExample())
  message.success('示例已复制')
}

// 生成请求头示例
const generateHeaderExample = () => {
  const headerParams = (props.api.parameters || [])
    .filter((p: any) => p.in === 'header')

  if (headerParams.length === 0) {
    return '// 无请求头参数'
  }

  const headers = headerParams.map((p: any) => {
    // 优先使用参数级别的 example，其次使用 schema 中的示例
    const exampleValue = String(p.example ?? getExampleValue(p.schema || { type: 'string' }))
    return `${p.name}: ${exampleValue}`
  })

  return headers.join('\n')
}

const copyHeaderExample = () => {
  navigator.clipboard.writeText(generateHeaderExample())
  message.success('示例已复制')
}

// 生成请求体示例
const generateBodyExample = () => {
  if (!requestBodySchema.value || requestBodySchema.value.length === 0) {
    return '{}'
  }

  const exampleObj = generateExampleFromTree(requestBodySchema.value)
  return JSON.stringify(exampleObj, null, 2)
}

const copyBodyExample = () => {
  navigator.clipboard.writeText(generateBodyExample())
  message.success('示例已复制')
}

// 生成响应示例
const generateResponseExample = (response: any) => {
  const schema = getResponseSchema(response)
  if (!schema || schema.length === 0) {
    return '{}'
  }

  const exampleObj = generateExampleFromTree(schema)
  return JSON.stringify(exampleObj, null, 2)
}

const copyFirstResponseExample = () => {
  navigator.clipboard.writeText(firstResponseExampleJson.value)
  message.success('示例已复制')
}

// 使用代码生成器
const {
  generateCurl,
  generateWget,
  generateNodeFetch,
  generateAxios,
  generateJQuery
} = useCodeGenerator(
  props.api,
  props.baseUrl,
  buildExampleUrl,
  generateBodyExample,
  requestBodySchema,
  requestBodyContentType.value || 'application/json'
)

const curlCode = computed(() => {
  const url = buildExampleUrl()
  const method = props.api.method

  // WebSocket 接口
  if (url.includes('/ws') || props.api.summary?.includes('WebSocket')) {
    return `# WebSocket 接口无法使用 cURL 直接测试\n# 使用 wscat 连接示例：\nwscat -c ${url.replace(/^http/, 'ws')}`
  }

  // SSE / Streamable 接口
  if (url.includes('/sse') || props.api.summary?.includes('SSE') ||
      url.includes('/streamable') || props.api.summary?.includes('Streamable')) {
    return `curl -N '${url}'`
  }

  let cmd = `curl -X ${method} '${url}'`

  // 请求头
  const headerParams = (props.api.parameters || []).filter((p: any) => p.in === 'header')
  headerParams.forEach((param: any) => {
    const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
    cmd += ` \\\n  -H '${param.name}: ${exampleValue}'`
  })

  // 请求体
  if (method !== 'GET' && props.api.requestBody) {
    const contentType = requestBodyContentType.value || 'application/json'
    const bodyExample = generateBodyExample()

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
})
const wgetCode = computed(() => generateWget())
const nodeFetchCode = computed(() => generateNodeFetch())
const axiosCode = computed(() => generateAxios())
const jqueryCode = computed(() => generateJQuery())

const copyCode = (lang: string) => {
  let code = ''
  switch (lang) {
    case 'curl':
      code = curlCode.value
      break
    case 'wget':
      code = wgetCode.value
      break
    case 'node-fetch':
      code = nodeFetchCode.value
      break
    case 'axios':
      code = axiosCode.value
      break
    case 'jquery':
      code = jqueryCode.value
      break
  }

  navigator.clipboard.writeText(code)
  message.success('代码已复制')
}

const copyCurlCode = () => {
  navigator.clipboard.writeText(curlCode.value)
  message.success('cURL 已复制')
}

// 获取所有可展开的 keys
const getAllExpandableKeys = (data: any[]): string[] => {
  const keys: string[] = []
  const traverse = (items: any[]) => {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        keys.push(item.key)
        traverse(item.children)
      }
    })
  }
  traverse(data)
  return keys
}

// 检查是否有子节点
const hasQueryChildren = computed(() => {
  return queryParametersDoc.value.some(item => item.children && item.children.length > 0)
})

const hasRequestBodyChildren = computed(() => {
  return requestBodySchema.value && requestBodySchema.value.some(item => item.children && item.children.length > 0)
})

// 查询参数展开/收起
const isQueryAllExpanded = computed(() => {
  if (!hasQueryChildren.value) return false
  const allKeys = getAllExpandableKeys(queryParametersDoc.value)
  return allKeys.length > 0 && allKeys.every(key => queryExpandedKeys.value.includes(key))
})

const toggleQueryExpand = () => {
  if (isQueryAllExpanded.value) {
    queryExpandedKeys.value = []
  } else {
    queryExpandedKeys.value = getAllExpandableKeys(queryParametersDoc.value)
  }
}

const onQueryExpand = (payload: any) => {
  const { expanded, record } = payload
  if (expanded) {
    if (!queryExpandedKeys.value.includes(record.key)) {
      queryExpandedKeys.value.push(record.key)
    }
  } else {
    queryExpandedKeys.value = queryExpandedKeys.value.filter(key => key !== record.key)
  }
}

// 请求体展开/收起
const isRequestBodyAllExpanded = computed(() => {
  if (!hasRequestBodyChildren.value || !requestBodySchema.value) return false
  const allKeys = getAllExpandableKeys(requestBodySchema.value)
  return allKeys.length > 0 && allKeys.every(key => requestBodyExpandedKeys.value.includes(key))
})

const toggleRequestBodyExpand = () => {
  if (isRequestBodyAllExpanded.value) {
    requestBodyExpandedKeys.value = []
  } else {
    requestBodyExpandedKeys.value = getAllExpandableKeys(requestBodySchema.value!)
  }
}

const onRequestBodyExpand = (payload: any) => {
  const { expanded, record } = payload
  if (expanded) {
    if (!requestBodyExpandedKeys.value.includes(record.key)) {
      requestBodyExpandedKeys.value.push(record.key)
    }
  } else {
    requestBodyExpandedKeys.value = requestBodyExpandedKeys.value.filter(key => key !== record.key)
  }
}

const toggleFirstResponseExpand = () => {
  if (isFirstResponseAllExpanded.value) {
    firstResponseExpandedKeys.value = []
  } else {
    firstResponseExpandedKeys.value = getAllExpandableKeys(firstResponseSchema.value)
  }
}

const onFirstResponseExpand = (payload: any) => {
  const { expanded, record } = payload
  if (expanded) {
    if (!firstResponseExpandedKeys.value.includes(record.key)) {
      firstResponseExpandedKeys.value.push(record.key)
    }
  } else {
    firstResponseExpandedKeys.value = firstResponseExpandedKeys.value.filter(key => key !== record.key)
  }
}

// 初始化展开状态
const initExpandedKeys = () => {
  if (hasQueryChildren.value) {
    queryExpandedKeys.value = getAllExpandableKeys(queryParametersDoc.value)
  }
  
  if (hasRequestBodyChildren.value && requestBodySchema.value) {
    requestBodyExpandedKeys.value = getAllExpandableKeys(requestBodySchema.value)
  }
  
  if (hasFirstResponseChildren.value) {
    firstResponseExpandedKeys.value = getAllExpandableKeys(firstResponseSchema.value)
  }
}

// URL Tab 状态管理
const updateUrlWithTab = (tab: string) => {
  const hash = window.location.hash
  const [path] = hash.split('?')
  
  if (tab === 'doc') {
    window.history.replaceState(null, '', path)
  } else {
    window.history.replaceState(null, '', `${path}?tab=${tab}`)
  }
}

const restoreTabFromUrl = () => {
  const hash = window.location.hash
  const urlParams = new URLSearchParams(hash.split('?')[1] || '')
  const tab = urlParams.get('tab')
  
  if (tab && ['doc', 'debug'].includes(tab)) {
    activeMainTab.value = tab
  } else {
    activeMainTab.value = 'doc'
  }
}

let isRestoringFromUrl = false

watch(activeMainTab, (newTab) => {
  if (!isRestoringFromUrl) {
    updateUrlWithTab(newTab)
  }
})

const handleHashChange = () => {
  isRestoringFromUrl = true
  restoreTabFromUrl()
  isRestoringFromUrl = false
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange)
  isRestoringFromUrl = true
  restoreTabFromUrl()
  isRestoringFromUrl = false
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})

watch(() => props.api, () => {
  initExpandedKeys()
  isRestoringFromUrl = true
  restoreTabFromUrl()
  isRestoringFromUrl = false
}, { immediate: true })
</script>


<style scoped>
.api-detail {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-card {
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.detail-card .ant-card-body) {
  padding: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section {
  margin: 16px 0;
  padding: 0;
  background: transparent;
}

.section:first-child {
  margin-top: 0;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  letter-spacing: 0;
}

.description-text {
  color: var(--color-text-secondary);
  line-height: 1.5;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 2px solid var(--color-primary);
  font-size: 13px;
}

/* 主 Tab 样式 */
.main-tabs-top {
  margin: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.main-tabs-top .ant-tabs-nav) {
  margin-bottom: 0;
  background: #ffffff;
  padding: 0 12px;
  border-radius: 0;
  flex-shrink: 0;
  box-shadow: none;
  border-bottom: 1px solid var(--color-border-light);
}

:deep(.main-tabs-top > .ant-tabs-content-holder) {
  flex: 1;
  overflow-y: auto;
}

:deep(.main-tabs-top .ant-tabs-tab) {
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  margin: 0;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

:deep(.main-tabs-top .ant-tabs-tab:hover) {
  color: var(--color-primary);
}

:deep(.main-tabs-top .ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: var(--color-primary);
}

:deep(.main-tabs-top .ant-tabs-ink-bar) {
  height: 2px;
  background: var(--color-primary);
}

:deep(.main-tabs-top .ant-tabs-content) {
  height: auto;
}

:deep(.main-tabs-top .ant-tabs-tabpane) {
  padding: 16px;
  background: #fff;
}

/* cURL 示例区域样式 */
.curl-section {
  margin-top: 20px;
}

.curl-section .example-section {
  margin-top: 10px;
  background: #fafafa;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e8e8e8;
}

.curl-section .example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.curl-section .example-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.curl-section .copy-btn {
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  height: 24px;
  line-height: 1;
  color: var(--color-primary);
  border-color: var(--color-primary);
  transition: all 0.2s ease;
}

.curl-section .copy-btn:hover {
  color: #fff;
  border-color: var(--color-primary);
  background: var(--color-primary);
}
</style>
