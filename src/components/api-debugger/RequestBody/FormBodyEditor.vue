<template>
  <div class="form-editor">
    <div class="form-fields">
      <div v-for="(field, index) in formFields" :key="index" class="form-field-item">
        <a-checkbox v-model:checked="field.enabled" />
        <a-input 
          v-model:value="field.name" 
          placeholder="字段名" 
          size="small" 
          class="field-name-input"
          :disabled="field.fromSchema"
        />
        <a-select 
          v-model:value="field.type" 
          size="small" 
          style="width: 100px"
          :disabled="field.fromSchema"
        >
          <a-select-option value="text">文本</a-select-option>
          <a-select-option value="file">文件</a-select-option>
        </a-select>
        <a-input 
          v-if="field.type === 'text'"
          v-model:value="field.value" 
          placeholder="字段值" 
          size="small"
          class="field-value-input"
        />
        <a-upload
          v-else
          :file-list="field.fileList"
          :before-upload="() => false"
          @change="(info) => $emit('fileChange', info, index)"
          :multiple="field.isMultipleFile"
          :max-count="field.isMultipleFile ? undefined : 1"
        >
          <a-button size="small" class="file-btn">
            {{ field.isMultipleFile ? '选择多个文件' : '选择文件' }}
          </a-button>
        </a-upload>
        <a-button 
          v-if="!field.fromSchema"
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
    <a-button type="dashed" block @click="$emit('add')" style="margin-top: 8px" class="add-btn">
      添加字段
    </a-button>
  </div>
</template>

<script setup lang="ts">
// 表单字段接口
export interface FormField {
  name: string
  type: 'text' | 'file'
  value: string
  enabled: boolean
  fromSchema: boolean
  isMultipleFile?: boolean
  fileList?: any[]
}

interface Props {
  formFields: FormField[]
}

interface Emits {
  (e: 'update:formFields', value: FormField[]): void
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'fileChange', info: any, index: number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.form-editor {
  padding: 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field-item {
  display: grid;
  grid-template-columns: 24px 140px 80px 1fr 36px;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.form-field-item:hover {
  background: #f0f0f0;
}

.field-name-input :deep(.ant-input) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  background: #fff;
}

.field-value-input :deep(.ant-input) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  background: #fff;
}

:deep(.ant-select-selector) {
  font-size: 12px !important;
  background: #fff !important;
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

.file-btn {
  font-size: 12px;
  height: 28px;
}

.file-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: rgba(16, 185, 129, 0.04);
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
