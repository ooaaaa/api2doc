<template>
  <a-config-provider>
    <div class="empty-guide-page">
      <a-layout>
        <!-- 复用头部组件 -->
        <AppHeader
          :api-info="{ title: '', version: '', description: '' }"
          :search-text="''"
          :services="services"
          :active-service-id="activeServiceId"
          :is-proxy-mode="isProxyMode"
          :has-documents="false"
          :exporting-documents="false"
          @update:search-text="() => {}"
          @go-home="() => {}"
          @switch-service="$emit('switchService', $event)"
          @add-service="$emit('addService', $event)"
          @edit-service="(id, data) => $emit('editService', id, data)"
          @remove-service="$emit('removeService', $event)"
          @import-config="$emit('importConfig', $event)"
          @export-config="$emit('exportConfig')"
          @open-debugger="$emit('openDebugger')"
        />

        <!-- 空状态引导内容 -->
        <a-layout-content class="empty-guide-content">
          <div class="empty-guide-card">
            <div class="empty-guide-icon">
              <Api2DocLogo :size="48" :show-text="false" />
            </div>
            <h2 class="empty-guide-title">添加 Swagger 文档地址开始使用</h2>
            <p class="empty-guide-desc">
              点击顶部服务选择器，在弹窗中添加你的 Swagger/OpenAPI JSON 地址
            </p>
            <div class="empty-guide-examples">
              <div class="example-item">
                <span class="example-label">Spring Boot</span>
                <code>http://localhost:8080/v3/api-docs</code>
              </div>
              <div class="example-item">
                <span class="example-label">FastAPI</span>
                <code>http://localhost:8000/openapi.json</code>
              </div>
              <div class="example-item">
                <span class="example-label">Express</span>
                <code>http://localhost:3000/api-docs.json</code>
              </div>
            </div>
            <div class="empty-guide-proxy-tip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="1.5"/>
                <path d="M12 7v6" stroke="#10b981" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#10b981"/>
              </svg>
              <span>默认支持本地代理，无需担心跨域问题</span>
            </div>
          </div>
        </a-layout-content>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import type { ServiceConfig } from '../../config'
import AppHeader from '../layout/AppHeader.vue'
import Api2DocLogo from '../Api2DocLogo.vue'

defineProps<{
  services: ServiceConfig[]
  activeServiceId: string | null
  isProxyMode: boolean
}>()

defineEmits<{
  switchService: [id: string]
  addService: [data: { name: string; url: string }]
  editService: [id: string, data: { name?: string; url?: string }]
  removeService: [id: string]
  importConfig: [json: string]
  exportConfig: []
  openDebugger: []
}>()
</script>

<style scoped>
.empty-guide-page {
  height: 100%;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
}

.empty-guide-page :deep(.ant-layout) {
  height: 100%;
}

.empty-guide-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - 48px);
  padding: 32px;
}

.empty-guide-card {
  text-align: center;
  max-width: 520px;
  width: 100%;
}

.empty-guide-icon {
  margin-bottom: 20px;
}

.empty-guide-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px;
}

.empty-guide-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 24px;
  line-height: 1.6;
}

.empty-guide-examples {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  text-align: left;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.example-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 80px;
  flex-shrink: 0;
}

.example-item code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--color-text);
  word-break: break-all;
}

.empty-guide-proxy-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #10b981;
  padding: 8px 16px;
  background: rgba(16, 185, 129, 0.06);
  border-radius: 20px;
}
</style>
