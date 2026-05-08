<template>
  <div class="api-debugger">
    <StandaloneDebugger
      :embedded="true"
      :api="api"
      :base-url="baseUrl"
      :body-example="bodyExample"
      @toggle-code="toggleCodePanel"
    />

    <!-- 代码面板（右侧抽屉） -->
    <div v-if="showCodePanel" class="code-drawer">
      <div class="drawer-header">
        <span class="drawer-title">代码示例</span>
        <a-button size="small" type="text" @click="showCodePanel = false" class="close-drawer-btn">
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
          <a-button size="small" @click="copyCode" class="copy-btn">复制</a-button>
        </div>
        <div class="code-content">
          <pre class="code-block"><code>{{ currentCodeContent }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import StandaloneDebugger from '../standalone-debugger/index.vue'

interface Props {
  api: Record<string, unknown>
  baseUrl: string
  bodyExample?: string
}

const props = defineProps<Props>()

const showCodePanel = ref(false)
const activeCodeTab = ref('curl')

const toggleCodePanel = () => { showCodePanel.value = !showCodePanel.value }

// 代码生成（基于当前 API 信息）
const currentCodeContent = computed(() => {
  const url = `${props.baseUrl}${props.api.path as string}`
  const method = (props.api.method as string) || 'GET'

  switch (activeCodeTab.value) {
    case 'curl': return generateCurl(url, method)
    case 'wget': return generateWget(url, method)
    case 'node-fetch': return generateNodeFetch(url, method)
    case 'axios': return generateAxios(url, method)
    case 'jquery': return generateJQuery(url, method)
    default: return ''
  }
})

const generateCurl = (url: string, method: string): string => {
  let cmd = `curl -X ${method} '${url}'`
  if (method !== 'GET' && method !== 'HEAD') {
    cmd += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '{}'`
  }
  return cmd
}

const generateWget = (url: string, method: string): string => {
  let cmd = `wget --method=${method}`
  if (method !== 'GET' && method !== 'HEAD') {
    cmd += ` \\\n  --header='Content-Type: application/json' \\\n  --body-data='{}'`
  }
  cmd += ` \\\n  -O- '${url}'`
  return cmd
}

const generateNodeFetch = (url: string, method: string): string => {
  let code = `import fetch from 'node-fetch';\n\n`
  code += `const resp = await fetch('${url}', {\n  method: '${method}'`
  if (method !== 'GET' && method !== 'HEAD') {
    code += `,\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({})`
  }
  code += `\n});\n\nconst data = await resp.json();\nconsole.log(data);`
  return code
}

const generateAxios = (url: string, method: string): string => {
  let code = `import axios from 'axios';\n\n`
  code += `const { data } = await axios({\n  url: '${url}',\n  method: '${method.toLowerCase()}'`
  if (method !== 'GET' && method !== 'HEAD') {
    code += `,\n  data: {}`
  }
  code += `\n});\n\nconsole.log(data);`
  return code
}

const generateJQuery = (url: string, method: string): string => {
  let code = `$.ajax({\n  url: '${url}',\n  type: '${method}'`
  if (method !== 'GET' && method !== 'HEAD') {
    code += `,\n  contentType: 'application/json',\n  data: JSON.stringify({})`
  }
  code += `,\n  success: (data) => console.log(data)\n});`
  return code
}

const copyCode = async () => {
  try { await navigator.clipboard.writeText(currentCodeContent.value); message.success('代码已复制') }
  catch { message.error('复制失败') }
}
</script>

<style scoped>
.api-debugger { display: flex; flex-direction: column; width: 100%; }

.code-drawer { position: fixed; top: 0; right: 0; width: 500px; height: 100vh; background: #fff; border-left: 1px solid #e8e8e8; box-shadow: -4px 0 16px rgba(0,0,0,0.08); z-index: 100; display: flex; flex-direction: column; animation: slideInRight 0.25s ease; }
@keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
.drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e8e8e8; background: #fafafa; flex-shrink: 0; }
.drawer-title { font-size: 15px; font-weight: 600; color: #1a1a1a; }
.close-drawer-btn { padding: 4px 12px; font-size: 13px; color: #666; }
.close-drawer-btn:hover { color: var(--color-primary); background: var(--color-primary-bg); }
.drawer-content { flex: 1; overflow-y: auto; padding: 16px; }
.code-selector { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e8e8e8; }
.code-block { background: #f5f7fa; color: #2c3e50; padding: 16px; border-radius: 6px; margin: 0; border: 1px solid #e0e4e8; overflow-x: hidden; overflow-y: auto; max-height: calc(100vh - 200px); }
.code-block code { font-family: 'Fira Code', Monaco, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.8; white-space: pre-wrap; word-wrap: break-word; display: block; }
.copy-btn { border-radius: 4px; font-weight: 500; font-size: 12px; height: 26px; padding: 2px 10px; }
.copy-btn:hover { color: var(--color-primary); border-color: var(--color-primary); background: var(--color-primary-bg); }

@media (max-width: 900px) { .code-drawer { width: 100%; } }
</style>
