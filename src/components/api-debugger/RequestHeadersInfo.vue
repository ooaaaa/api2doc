<template>
  <div class="headers-info">
    <a-collapse v-model:activeKey="activeKey" ghost>
      <a-collapse-panel key="1" header="请求头说明">
        <div class="info-content">
          <a-alert 
            :message="getHeadersDescription()" 
            type="info" 
            show-icon
            style="margin-bottom: 12px"
          />
          
          <div class="headers-preview">
            <div class="preview-title">当前场景完整请求头预览</div>
            <pre class="headers-code">{{ previewHeaders }}</pre>
          </div>

          <div v-if="validation.warnings.length > 0" class="validation-warnings">
            <div class="warning-title">建议补充的字段</div>
            <ul>
              <li v-for="(warning, index) in validation.warnings" :key="index">
                {{ warning }}
              </li>
            </ul>
          </div>

          <div v-if="validation.missing.length > 0" class="validation-errors">
            <div class="error-title">缺失的必备字段</div>
            <ul>
              <li v-for="(missing, index) in validation.missing" :key="index">
                {{ missing }}
              </li>
            </ul>
          </div>
        </div>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { generateRequestHeaders, validateRequestHeaders, getHeadersDescription as getHeadersDesc } from '../../utils/request-headers'

interface Props {
  method: string
  url: string
  interfaceType: 'http' | 'websocket' | 'sse' | 'streamable'
  contentType?: string
  customHeaders?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  customHeaders: () => ({})
})

const activeKey = ref<string[]>([])

// 获取请求头说明
const getHeadersDescription = () => {
  return getHeadersDesc(props.interfaceType)
}

// 生成预览请求头
const previewHeaders = computed(() => {
  const headers = generateRequestHeaders({
    method: props.method,
    url: props.url,
    interfaceType: props.interfaceType,
    contentType: props.contentType,
    customHeaders: props.customHeaders
  })

  let result = ''
  Object.entries(headers).forEach(([key, value]) => {
    result += `${key}: ${value}\n`
  })
  return result
})

// 验证请求头
const validation = computed(() => {
  const headers = generateRequestHeaders({
    method: props.method,
    url: props.url,
    interfaceType: props.interfaceType,
    contentType: props.contentType,
    customHeaders: props.customHeaders
  })

  return validateRequestHeaders(headers, props.interfaceType)
})
</script>

<style scoped>
.headers-info {
  margin-top: 8px;
}

.info-content {
  padding: 0;
}

.headers-preview {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.headers-code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.validation-warnings,
.validation-errors {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.validation-warnings {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.validation-errors {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.warning-title,
.error-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.warning-title {
  color: #faad14;
}

.error-title {
  color: #ff4d4f;
}

.validation-warnings ul,
.validation-errors ul {
  margin: 0;
  padding-left: 20px;
}

.validation-warnings li,
.validation-errors li {
  font-size: 12px;
  line-height: 1.8;
}

.validation-warnings li {
  color: #ad8b00;
}

.validation-errors li {
  color: #cf1322;
}

:deep(.ant-collapse-ghost > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box) {
  padding: 12px 0;
}

:deep(.ant-collapse-header) {
  padding: 8px 0 !important;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary) !important;
}

:deep(.ant-collapse-header:hover) {
  color: #5568d3 !important;
}
</style>
