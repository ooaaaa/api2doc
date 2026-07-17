<template>
  <div class="params-editor">
    <div class="param-list">
      <div v-for="(param, index) in parameters" :key="index" class="param-item">
        <a-checkbox 
          :checked="param.enabled" 
          @update:checked="updateParam(index, 'enabled', $event)"
        />
        <a-input 
          :value="param.name" 
          @update:value="updateParam(index, 'name', $event)"
          placeholder="参数名" 
          size="small" 
          class="param-name-input"
        />
        <a-input 
          :value="param.value" 
          @update:value="updateParam(index, 'value', $event)"
          placeholder="参数值" 
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
      {{ addButtonText }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
interface Parameter {
  name: string
  value: string
  enabled: boolean
  type?: string
  required?: boolean
  description?: string
}

interface Props {
  parameters: Parameter[]
  type: 'query' | 'path' | 'header'
  addButtonText?: string
}

interface Emits {
  (e: 'update:parameters', value: Parameter[]): void
  (e: 'add'): void
  (e: 'remove', index: number): void
}

const props = withDefaults(defineProps<Props>(), {
  addButtonText: '添加参数'
})

const emit = defineEmits<Emits>()

const updateParam = (index: number, field: string, value: any) => {
  const newParams = [...props.parameters]
  newParams[index] = { ...newParams[index], [field]: value }
  emit('update:parameters', newParams)
}
</script>

<style scoped>
.params-editor {
  padding: 0;
  margin: 0;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
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

.param-name-input :deep(.ant-input) {
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

/* 删除按钮优化 */
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

/* 添加按钮优化 */
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
