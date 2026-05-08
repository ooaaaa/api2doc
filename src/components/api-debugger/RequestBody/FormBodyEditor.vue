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
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e8e8e8;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field-item {
  display: grid;
  grid-template-columns: 32px 180px 100px 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.form-field-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-primary-bg);
}

.field-name-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.field-value-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
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

.file-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.file-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
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
