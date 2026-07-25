<template>
  <a-layout-header class="header">
    <div class="header-content">
      <!-- 左侧：Logo + 服务选择 -->
      <div class="header-left">
        <div class="logo-area" @click="$emit('goHome')" title="返回首页">
          <Api2DocLogo :size="24" :show-text="true" :small="true" />
        </div>
        <div class="header-divider"></div>
        <div class="service-trigger" @click="showManageModal = true">
          <span class="service-trigger-name">{{ activeServiceName }}</span>
          <DownOutlined class="service-trigger-arrow" />
        </div>
      </div>

      <!-- 中间：搜索框 -->
      <div class="header-center">
        <a-input
          :value="searchText"
          @update:value="$emit('update:searchText', $event)"
          placeholder="搜索接口名称、描述、路径、目录..."
          class="search-input"
          allow-clear
        >
          <template #prefix>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style="margin-right: 4px;"
            >
              <circle cx="11" cy="11" r="7" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
              <path d="M20 20L16.5 16.5" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
            </svg>
          </template>
        </a-input>
      </div>

      <!-- 右侧：文档导出 + 调试器 + GitHub 项目链接 -->
      <div class="header-right">
        <a-dropdown :disabled="!hasDocuments || exportingDocuments" placement="bottomRight">
          <a
            class="document-export-link"
            :class="{ disabled: !hasDocuments || exportingDocuments }"
            @click.prevent
            title="导出全部 API 文档"
          >
            <LoadingOutlined v-if="exportingDocuments" spin />
            <DownloadOutlined v-else />
            <span>{{ exportingDocuments ? '导出中' : '导出文档' }}</span>
            <DownOutlined class="export-arrow" />
          </a>
          <template #overlay>
            <a-menu @click="handleDocumentExport">
              <a-menu-item key="pdf">下载为 PDF</a-menu-item>
              <a-menu-item key="word">下载为 Word</a-menu-item>
              <a-menu-item key="markdown">下载为 Markdown</a-menu-item>
              <a-menu-item key="json">下载为 JSON</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <a 
          class="debugger-link"
          @click="$emit('openDebugger')"
          title="打开独立 API 调试器"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>调试器</span>
        </a>
        <a 
          href="https://github.com/ooaaaa/api2doc" 
          target="_blank" 
          rel="noopener noreferrer"
          class="github-link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>

    <!-- 服务管理弹窗（大弹窗，内嵌所有操作） -->
    <a-modal
      v-model:open="showManageModal"
      title="服务管理"
      :footer="null"
      width="860px"
      :mask-closable="false"
      :keyboard="false"
      :body-style="{ padding: '20px 24px' }"
    >
      <!-- 顶部操作栏 -->
      <div class="manage-toolbar">
        <a-input
          v-model:value="serviceSearchText"
          placeholder="搜索服务名称或地址..."
          style="width: 260px;"
          allow-clear
        >
          <template #prefix>
            <SearchOutlined style="color: #bbb;" />
          </template>
        </a-input>
        <div class="manage-toolbar-right">
          <a-tooltip v-if="isProxyMode" title="本地代理解决跨域问题">
            <span class="proxy-hint">本地代理已启用</span>
          </a-tooltip>
          <a-tooltip title="添加新服务">
            <a-button class="btn-green-solid" @click="startAdd">
              <template #icon><PlusOutlined /></template>
              添加
            </a-button>
          </a-tooltip>
          <a-tooltip title="从 JSON 文件导入服务配置">
            <a-button class="btn-green-solid" @click="panelMode = 'import'">
              <template #icon><ImportOutlined /></template>
              导入JSON
            </a-button>
          </a-tooltip>
          <a-tooltip title="导出所有服务配置为 JSON 文件">
            <a-button class="btn-green-solid" @click="handleExport">
              <template #icon><ExportOutlined /></template>
              导出JSON
            </a-button>
          </a-tooltip>
        </div>
      </div>

      <!-- 内容区：列表 / 编辑表单 / 导入 -->
      <div class="manage-body">
        <!-- 列表模式 -->
        <template v-if="panelMode === 'list'">
          <div class="manage-list">
            <div
              v-for="service in filteredServices"
              :key="service.id"
              class="manage-item"
              :class="{ active: service.id === activeServiceId }"
              @click="handleSelect(service.id)"
            >
              <div class="manage-item-left">
                <div class="manage-item-name">
                  {{ service.name }}
                  <a-tag v-if="service.id === activeServiceId" color="green" class="current-tag">当前</a-tag>
                </div>
                <div class="manage-item-url">{{ service.url }}</div>
              </div>
              <div class="manage-item-actions" @click.stop>
                <a-tooltip title="编辑">
                  <a-button type="text" size="small" @click="startEdit(service)">
                    <template #icon><EditOutlined /></template>
                  </a-button>
                </a-tooltip>
                <a-tooltip title="删除">
                  <a-popconfirm
                    title="确定删除该服务？"
                    @confirm="handleRemove(service.id)"
                    placement="left"
                  >
                    <a-button type="text" size="small" danger>
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </a-popconfirm>
                </a-tooltip>
              </div>
            </div>

            <div v-if="filteredServices.length === 0 && !serviceSearchText" class="empty-guide">
              <div class="empty-guide-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17l10 5 10-5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12l10 5 10-5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p class="empty-guide-title">添加你的 Swagger 文档地址开始使用</p>
              <p class="empty-guide-desc">
                点击上方「添加」按钮，填入 Swagger/OpenAPI 的 JSON 地址<br/>
                例如：<code>http://localhost:8080/v3/api-docs</code>
              </p>
              <p class="empty-guide-proxy">
                默认支持本地代理，无需担心跨域问题
              </p>
            </div>
            <a-empty
              v-if="filteredServices.length === 0 && serviceSearchText"
              description="未找到匹配的服务"
              style="padding: 60px 0;"
            />
          </div>
        </template>

        <!-- 添加/编辑模式 -->
        <template v-if="panelMode === 'form'">
          <div class="manage-form">
            <div class="form-header">
              <h4>{{ editingService ? '编辑服务' : '添加服务' }}</h4>
              <a-button type="text" @click="panelMode = 'list'">返回列表</a-button>
            </div>
            <a-form :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
              <a-form-item label="名称">
                <a-input v-model:value="formName" placeholder="如：用户服务-测试环境" />
              </a-form-item>
              <a-form-item label="地址">
                <a-input v-model:value="formUrl" placeholder="如：http://localhost:8080/v3/api-docs" />
              </a-form-item>
              <a-form-item :wrapper-col="{ offset: 3 }">
                <a-space>
                  <a-button class="btn-green-solid" :disabled="!formName || !formUrl" @click="handleSubmit">
                    {{ editingService ? '保存' : '添加' }}
                  </a-button>
                  <a-button @click="panelMode = 'list'">取消</a-button>
                </a-space>
              </a-form-item>
            </a-form>
            <p class="empty-guide-proxy" style="text-align: center; margin-top: 12px;">
              默认支持本地代理，无需担心跨域问题
            </p>
          </div>
        </template>

        <!-- 导入模式 -->
        <template v-if="panelMode === 'import'">
          <div class="manage-form">
            <div class="form-header">
              <h4>导入配置</h4>
              <a-button type="text" @click="panelMode = 'list'">返回列表</a-button>
            </div>
            <p style="margin-bottom: 16px; color: #666; font-size: 13px;">
              选择之前导出的 JSON 配置文件，将覆盖当前所有服务配置。
            </p>
            <div class="import-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleFileDrop">
              <input ref="fileInputRef" type="file" accept=".json" style="display: none;" @change="handleFileSelect" />
              <div class="upload-icon">
                <ImportOutlined style="font-size: 32px; color: #10b981;" />
              </div>
              <p class="upload-text">点击选择文件或拖拽文件到此处</p>
              <p class="upload-hint">仅支持 .json 格式的配置文件</p>
            </div>
          </div>
        </template>
      </div>
    </a-modal>
  </a-layout-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  LoadingOutlined,
  ImportOutlined,
  ExportOutlined,
} from '@ant-design/icons-vue'
import type { ServiceConfig } from '../../config'
import type { DocumentFormat } from '../../utils/document-download'
import Api2DocLogo from '../Api2DocLogo.vue'

interface Props {
  apiInfo: {
    title: string
    version: string
    description: string
  }
  searchText: string
  services: ServiceConfig[]
  activeServiceId: string | null
  isProxyMode: boolean
  hasDocuments: boolean
  exportingDocuments: boolean
}

interface Emits {
  'update:searchText': [value: string]
  'goHome': []
  'switchService': [id: string]
  'addService': [data: { name: string; url: string }]
  'editService': [id: string, data: { name?: string; url?: string }]
  'removeService': [id: string]
  'importConfig': [json: string]
  'exportConfig': []
  'exportDocuments': [format: DocumentFormat]
  'openDebugger': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 弹窗状态
const showManageModal = ref(false)
const serviceSearchText = ref('')

// 面板模式：list / form / import
const panelMode = ref<'list' | 'form' | 'import'>('list')

// 表单状态
const formName = ref('')
const formUrl = ref('')
const editingService = ref<ServiceConfig | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 当前选中服务名称
const activeServiceName = computed(() => {
  const service = props.services.find(s => s.id === props.activeServiceId)
  return service?.name || '选择服务'
})

// 过滤后的服务列表
const filteredServices = computed(() => {
  if (!serviceSearchText.value) return props.services
  const keyword = serviceSearchText.value.toLowerCase()
  return props.services.filter(s =>
    s.name.toLowerCase().includes(keyword) ||
    s.url.toLowerCase().includes(keyword)
  )
})

function handleSelect(id: string) {
  emit('switchService', id)
  showManageModal.value = false
}

function startAdd() {
  editingService.value = null
  formName.value = ''
  formUrl.value = ''
  panelMode.value = 'form'
}

function startEdit(service: ServiceConfig) {
  editingService.value = service
  formName.value = service.name
  formUrl.value = service.url
  panelMode.value = 'form'
}

function handleSubmit() {
  if (!formName.value || !formUrl.value) return
  if (editingService.value) {
    emit('editService', editingService.value.id, { name: formName.value, url: formUrl.value })
  } else {
    emit('addService', { name: formName.value, url: formUrl.value })
  }
  // 回到列表
  panelMode.value = 'list'
  formName.value = ''
  formUrl.value = ''
  editingService.value = null
}

function handleRemove(id: string) {
  emit('removeService', id)
}

function handleExport() {
  emit('exportConfig')
}

function handleDocumentExport(event: { key: string | number }) {
  emit('exportDocuments', String(event.key) as DocumentFormat)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    readAndImportFile(file)
  }
  // 重置 input，允许重复选择同一文件
  input.value = ''
}

function handleFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    readAndImportFile(file)
  }
}

function readAndImportFile(file: File) {
  if (!file.name.endsWith('.json')) {
    emit('importConfig', '')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (content) {
      emit('importConfig', content)
      panelMode.value = 'list'
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.header {
  background: #ffffff;
  padding: 0 20px;
  box-shadow: none;
  z-index: 10;
  border-bottom: 1px solid var(--color-border-light);
  height: 48px !important;
  line-height: 48px !important;
}

.header-content {
  display: flex;
  align-items: center;
  height: 48px;
  gap: 16px;
}

/* 左侧：Logo + 服务选择器 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.logo-area {
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
  display: flex;
  align-items: center;
}

.logo-area:hover {
  background: var(--color-primary-bg);
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border-light);
}

.service-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  user-select: none;
}

.service-trigger:hover {
  background: var(--color-primary-bg);
}

.service-trigger-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-trigger-arrow {
  font-size: 10px;
  color: var(--color-text-muted);
}

/* 中间 */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 480px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
}

:deep(.search-input .ant-input-affix-wrapper) {
  border-radius: 16px;
  border-color: var(--color-border);
  transition: all 0.2s ease;
}

:deep(.search-input .ant-input-affix-wrapper:hover) {
  border-color: rgba(16, 185, 129, 0.4);
}

:deep(.search-input .ant-input-affix-wrapper-focused) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.08);
}

/* 右侧 */
.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.document-export-link,
.debugger-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-md);
  border: none;
  color: var(--color-primary, #10b981);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.document-export-link:hover,
.debugger-link:hover {
  background: var(--color-primary-bg, rgba(16, 185, 129, 0.08));
}

.document-export-link.disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.export-arrow {
  font-size: 9px;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-md);
  border: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.github-link:hover {
  color: var(--color-text);
  background: var(--color-bg-secondary);
}

/* 管理弹窗内部 */
.manage-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.manage-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.manage-body {
  min-height: 320px;
}

/* 列表 */
.manage-list {
  max-height: 480px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.manage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}

.manage-item:last-child {
  border-bottom: none;
}

.manage-item:hover {
  background: #fafafa;
}

.manage-item.active {
  background: var(--color-primary-bg);
}

.manage-item-left {
  flex: 1;
  min-width: 0;
}

.manage-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-tag {
  font-size: 11px;
  line-height: 18px;
  padding: 0 6px;
  margin: 0;
}

.manage-item-url {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态引导 */
.empty-guide {
  padding: 48px 24px;
  text-align: center;
}

.empty-guide-icon {
  margin-bottom: 16px;
}

.empty-guide-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
}

.empty-guide-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.8;
}

.empty-guide-desc code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
}

.empty-guide-proxy {
  font-size: 12px;
  color: #10b981;
  margin: 0;
}

.manage-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.manage-item:hover .manage-item-actions {
  opacity: 1;
}

/* 表单面板 */
.manage-form {
  padding: 8px 0;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.form-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* 文件上传区域 */
.import-upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.import-upload-area:hover {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.03);
}

.upload-icon {
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #333;
  margin: 0 0 6px;
}

.upload-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}
</style>

<style>
/* 非 scoped：覆盖 modal 内按钮样式（modal teleport 到 body，scoped 无法生效） */
.btn-green-solid.ant-btn {
  color: #fff !important;
  background: #10b981 !important;
  border-color: #10b981 !important;
}

.btn-green-solid.ant-btn:hover,
.btn-green-solid.ant-btn:focus {
  color: #fff !important;
  background: #059669 !important;
  border-color: #059669 !important;
}

.btn-green-solid.ant-btn[disabled],
.btn-green-solid.ant-btn[disabled]:hover {
  color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(16, 185, 129, 0.5) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
}

/* 禁止 modal 内按钮 hover 变大 */
.manage-toolbar .ant-btn {
  transform: none !important;
  transition: color 0.2s, background 0.2s, border-color 0.2s !important;
  outline: none !important;
  box-shadow: none !important;
}

.manage-toolbar .ant-btn:hover,
.manage-toolbar .ant-btn:focus,
.manage-toolbar .ant-btn:active {
  transform: none !important;
  box-shadow: none !important;
}

/* 全局覆盖：btn-green-solid 按钮禁止 hover 放大 */
.btn-green-solid.ant-btn {
  transform: none !important;
}

.btn-green-solid.ant-btn:hover,
.btn-green-solid.ant-btn:focus,
.btn-green-solid.ant-btn:active {
  transform: none !important;
}

.proxy-hint {
  font-size: 12px;
  color: #10b981;
  cursor: default;
}
</style>
