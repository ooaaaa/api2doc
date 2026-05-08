<template>
  <div class="params-editor">
    <div class="param-list">
      <div v-for="(param, index) in parameters" :key="index" class="param-item">
        <a-checkbox 
          :checked="param.enabled" 
          @update:checked="updateParam(index, 'enabled', $event)"
          :disabled="type === 'path'"
        />
        <a-input 
          :value="param.name" 
          @update:value="updateParam(index, 'name', $event)"
          placeholder="参数名" 
          size="small" 
          class="param-name-input"
          :disabled="type === 'path'"
        />
        <a-input 
          :value="param.value" 
          @update:value="updateParam(index, 'value', $event)"
          placeholder="参数值" 
          size="small"
        />
        <a-button 
          v-if="type !== 'path'"
          size="small" 
          danger 
          type="text" 
          @click="$emit('remove', index)"
          class="delete-btn"
        >
          删除
        </a-button>
        <span v-else style="width: 40px"></span>
      </div>
    </div>
    <a-button 
      v-if="type !== 'path'"
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
  min-height: auto;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  min-height: auto;
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

.param-name-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.param-name-input :deep(.ant-input) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

/* 按钮样式优化 */
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
