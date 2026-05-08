<template>
  <div class="app-root">
    <Api2Doc
      v-if="currentSwaggerUrl"
      :key="activeServiceId || 'none'"
      :swagger-url="currentSwaggerUrl"
      :services="services"
      :active-service-id="activeServiceId"
      :is-proxy-mode="isProxyMode"
      @switch-service="switchService"
      @add-service="handleAdd"
      @edit-service="handleEdit"
      @remove-service="removeService"
      @import-config="handleImport"
      @export-config="handleExport"
      @open-debugger="openDebuggerPage"
    />
    <!-- 无服务时展示空状态引导页 -->
    <EmptyGuide
      v-else
      :services="services"
      :active-service-id="activeServiceId"
      :is-proxy-mode="isProxyMode"
      @switch-service="switchService"
      @add-service="handleAdd"
      @edit-service="handleEdit"
      @remove-service="removeService"
      @import-config="handleImport"
      @export-config="handleExport"
      @open-debugger="openDebuggerPage"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { message } from 'ant-design-vue'
import Api2Doc from './components/Api2Doc.vue'
import EmptyGuide from './components/states/EmptyGuide.vue'
import { useServiceManager } from './composables'

const {
  services,
  activeServiceId,
  currentSwaggerUrl,
  isProxyMode,
  init,
  addService,
  updateService,
  removeService,
  switchService,
  exportConfig,
  importConfig,
} = useServiceManager()

async function handleAdd(data: { name: string; url: string }) {
  const service = addService(data)
  switchService(service.id)
}

function handleEdit(id: string, data: { name?: string; url?: string }) {
  updateService(id, data)
}

function handleExport() {
  const json = exportConfig()
  // 下载为文件
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'api2doc-config.json'
  a.click()
  URL.revokeObjectURL(url)
  message.success('配置已导出')
}

function handleImport(json: string) {
  const result = importConfig(json)
  if (result.success) {
    message.success(result.message)
  } else {
    message.error(result.message)
  }
}

function openDebuggerPage() {
  window.open('/debugger.html', '_blank', 'noopener')
}

onMounted(() => {
  init()
})
</script>

<style>
.app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
