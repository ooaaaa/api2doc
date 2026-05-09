<template>
  <div class="headers-editor">
    <!-- 内置默认请求头提示 -->
    <div class="builtin-hint">
      <div class="builtin-hint-header" @click="builtinExpanded = !builtinExpanded">
        <span class="builtin-icon">&#x1f4e1;</span>
        <span class="builtin-label">内置请求头 ({{ builtinHeaderCount }})</span>
        <span class="builtin-tip">同名 Header 可覆盖</span>
        <span class="builtin-toggle">{{ builtinExpanded ? '收起' : '展开' }}</span>
        <a-switch
          v-model:checked="autoInjectModel"
          size="small"
          class="builtin-switch"
          @click.stop
        />
      </div>
      <div v-if="autoInjectModel && builtinExpanded" class="builtin-headers">
        <div
          v-for="(value, key) in builtinHeaders"
          :key="key"
          class="builtin-header-item"
        >
          <span class="builtin-header-name">{{ key }}</span>
          <span class="builtin-header-sep">:</span>
          <span class="builtin-header-value">{{ value }}</span>
        </div>
      </div>
    </div>

    <!-- 手动请求头编辑 -->
    <div class="manual-headers">
      <div class="param-list">
        <div v-for="(header, index) in headers" :key="index" class="param-item">
          <a-checkbox
            :checked="header.enabled"
            @update:checked="updateHeader(index, 'enabled', $event)"
          />
          <a-input
            :value="header.name"
            @update:value="updateHeader(index, 'name', $event)"
            placeholder="Header 名"
            size="small"
            class="header-name-input"
          />
          <a-input
            :value="header.value"
            @update:value="updateHeader(index, 'value', $event)"
            placeholder="Header 值"
            size="small"
          />
          <a-button
            size="small"
            danger
            type="text"
            @click="$emit('remove', index)"
            class="delete-btn"
          >
            删除
          </a-button>
        </div>
      </div>
      <a-button
        type="dashed"
        block
        @click="$emit('add')"
        style="margin-top: 8px"
        class="add-btn"
      >
        添加 Header
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { generateRequestHeaders } from '../../utils/request-headers'

interface HeaderParam {
  name: string
  value: string
  enabled: boolean
}

interface Props {
  headers: HeaderParam[]
  autoInject: boolean
  method: string
  url: string
  interfaceType: 'http' | 'websocket' | 'sse' | 'streamable'
  contentType?: string
}

interface Emits {
  (e: 'update:headers', value: HeaderParam[]): void
  (e: 'update:autoInject', value: boolean): void
  (e: 'add'): void
  (e: 'remove', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 内置请求头默认收起
const builtinExpanded = ref(false)

const autoInjectModel = computed({
  get: () => props.autoInject,
  set: (v: boolean) => emit('update:autoInject', v)
})

// 生成内置请求头（不包含用户自定义的）
const builtinHeaders = computed((): Record<string, string> => {
  if (!props.url) return {}
  return generateRequestHeaders({
    method: props.method,
    url: props.url,
    interfaceType: props.interfaceType,
    contentType: props.contentType,
    customHeaders: {}
  })
})

const builtinHeaderCount = computed(() => Object.keys(builtinHeaders.value).length)

const updateHeader = (index: number, field: string, value: string | boolean) => {
  const newHeaders = [...props.headers]
  newHeaders[index] = { ...newHeaders[index], [field]: value }
  emit('update:headers', newHeaders)
}
</script>

<style scoped>
.headers-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.builtin-hint {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 10px 12px;
}

.builtin-hint-header {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.builtin-icon {
  font-size: 14px;
}

.builtin-label {
  font-size: 12px;
  font-weight: 500;
  color: #166534;
}

.builtin-tip {
  font-size: 11px;
  color: #6b7280;
  margin-left: 4px;
  flex: 1;
}

.builtin-toggle {
  font-size: 11px;
  color: #166534;
  cursor: pointer;
  margin-right: 8px;
  user-select: none;
}

.builtin-toggle:hover {
  text-decoration: underline;
}

.builtin-switch {
  flex-shrink: 0;
}

.builtin-headers {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.builtin-header-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dcfce7;
  line-height: 1.5;
}

.builtin-header-name {
  color: #166534;
  font-weight: 600;
  flex-shrink: 0;
}

.builtin-header-sep {
  color: #6b7280;
  flex-shrink: 0;
}

.builtin-header-value {
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manual-headers {
  padding: 0;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: grid;
  grid-template-columns: 32px 180px 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.param-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-primary-bg);
}

.header-name-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.header-name-input :deep(.ant-input) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.delete-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 40px;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}

.add-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
</style>
