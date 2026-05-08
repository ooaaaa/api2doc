<template>
  <div class="code-container">
    <!-- 特殊接口类型提示 -->
    <a-alert 
      v-if="apiType !== 'http'" 
      :message="getCodeTabTip()" 
      type="info" 
      show-icon 
      style="margin-bottom: 16px" 
    />
    
    <a-tabs v-model:activeKey="activeCodeTab" class="code-tabs">
      <!-- cURL -->
      <a-tab-pane key="curl" tab="cURL">
        <div class="code-header">
          <span class="code-title">{{ getCodeTitle('curl') }}</span>
          <a-button size="small" @click="$emit('copy', 'curl')" class="copy-btn">
            复制
          </a-button>
        </div>
        <pre class="code-block"><code>{{ curlCode }}</code></pre>
      </a-tab-pane>

      <!-- wget -->
      <a-tab-pane key="wget" tab="wget">
        <div class="code-header">
          <span class="code-title">{{ getCodeTitle('wget') }}</span>
          <a-button size="small" @click="$emit('copy', 'wget')" class="copy-btn">
            复制
          </a-button>
        </div>
        <pre class="code-block"><code>{{ wgetCode }}</code></pre>
      </a-tab-pane>

      <!-- node-fetch -->
      <a-tab-pane key="node-fetch" tab="node-fetch">
        <div class="code-header">
          <span class="code-title">{{ getCodeTitle('node-fetch') }}</span>
          <a-button size="small" @click="$emit('copy', 'node-fetch')" class="copy-btn">
            复制
          </a-button>
        </div>
        <pre class="code-block"><code>{{ nodeFetchCode }}</code></pre>
      </a-tab-pane>

      <!-- Axios -->
      <a-tab-pane key="axios" tab="Axios">
        <div class="code-header">
          <span class="code-title">{{ getCodeTitle('axios') }}</span>
          <a-button size="small" @click="$emit('copy', 'axios')" class="copy-btn">
            复制
          </a-button>
        </div>
        <pre class="code-block"><code>{{ axiosCode }}</code></pre>
      </a-tab-pane>

      <!-- jQuery -->
      <a-tab-pane key="jquery" tab="jQuery">
        <div class="code-header">
          <span class="code-title">{{ getCodeTitle('jquery') }}</span>
          <a-button size="small" @click="$emit('copy', 'jquery')" class="copy-btn">
            复制
          </a-button>
        </div>
        <pre class="code-block"><code>{{ jqueryCode }}</code></pre>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  apiType: string
  curlCode: string
  wgetCode: string
  nodeFetchCode: string
  axiosCode: string
  jqueryCode: string
}

interface Emits {
  (e: 'copy', lang: string): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const activeCodeTab = ref('curl')

// 获取代码Tab提示信息
const getCodeTabTip = () => {
  const tips: Record<string, string> = {
    websocket: '以下代码示例展示了如何连接和使用 WebSocket 接口',
    sse: '以下代码示例展示了如何接收 Server-Sent Events 消息',
    streamable: '以下代码示例展示了如何处理 HTTP 流式传输数据'
  }
  return tips[props.apiType] || ''
}

// 获取代码标题
const getCodeTitle = (lang: string) => {
  const titles: Record<string, string> = {
    curl: '复制以下命令到终端执行',
    wget: '使用 wget 命令行工具',
    'node-fetch': '使用 node-fetch 库 (Node.js)',
    axios: '使用 Axios HTTP 客户端',
    jquery: '使用 jQuery.ajax 方法'
  }
  return titles[lang] || ''
}
</script>

<style scoped>
.code-container {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e8e8e8;
}

.code-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.code-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.code-block {
  background: #f5f7fa;
  color: #2c3e50;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid #e0e4e8;
  max-height: 500px;
  overflow-y: auto;
}

.code-block code {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre;
}

/* 按钮样式优化 */
.copy-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}
</style>
