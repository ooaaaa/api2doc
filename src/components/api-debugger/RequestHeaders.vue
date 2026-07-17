<template>
  <div class="headers-editor">
    <!-- 内置默认请求头提示 -->
    <div class="builtin-hint">
      <div class="builtin-hint-header" @click="builtinExpanded = !builtinExpanded">
        <span class="builtin-collapse-icon" :class="{ expanded: builtinExpanded }">&#9654;</span>
        <span class="builtin-label">内置请求头 ({{ builtinHeaderCount }})</span>
        <span class="builtin-tip-warning">手动添加同名 Header 可覆盖默认值</span>
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

/* 内置请求头优化 */
.builtin-hint {
  background: #f6ffed;
  border: 1px solid #d3f261;
  border-radius: 4px;
  padding: 8px 10px;
}

.builtin-hint-header {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.builtin-label {
  font-size: 12px;
  font-weight: 500;
  color: #389e0d;
}

.builtin-tip {
  font-size: 11px;
  color: #8c8c8c;
  margin-left: 4px;
  flex: 1;
}

.builtin-tip-warning {
  font-size: 11px;
  color: #ff4d4f;
  font-weight: 500;
  margin-left: 4px;
  flex: 1;
}

.builtin-collapse-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 8px;
  color: #8c8c8c;
  transition: transform 0.2s ease;
}

.builtin-collapse-icon.expanded {
  transform: rotate(90deg);
  color: #52c41a;
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
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  padding: 3px 8px;
  background: #fff;
  border-radius: 3px;
  line-height: 1.6;
}

.builtin-header-name {
  color: #389e0d;
  font-weight: 600;
  flex-shrink: 0;
}

.builtin-header-sep {
  color: #8c8c8c;
  flex-shrink: 0;
}

.builtin-header-value {
  color: #595959;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 手动请求头 - 与 Params 统一 */
.manual-headers {
  padding: 0;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item {
  display: grid;
  grid-template-columns: 24px 160px 1fr 36px;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.param-item:hover {
  background: #f0f0f0;
}

.header-name-input :deep(.ant-input) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  background: #fff;
}

:deep(.ant-input) {
  font-size: 12px;
  background: #fff;
}

:deep(.ant-checkbox-wrapper) {
  display: flex;
  align-items: center;
}

.delete-btn {
  font-size: 11px;
  padding: 0;
  height: 24px;
  min-width: 36px;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(255, 77, 79, 0.08);
}

.add-btn {
  margin-top: 8px;
  font-size: 12px;
  height: 28px;
  border-style: dashed;
  border-color: #d9d9d9;
  color: #8c8c8c;
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}
</style>
