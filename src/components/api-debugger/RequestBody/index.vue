<template>
  <div class="request-body">
    <!-- Body 子标签页 -->
    <a-tabs :active-key="activeBodyTab" @update:active-key="$emit('update:activeBodyTab', $event)" size="small" class="body-sub-tabs">
      <!-- JSON 格式 -->
      <a-tab-pane key="json" tab="JSON">
        <div class="body-editor-wrapper">
          <div class="body-editor-actions">
            <a-button size="small" type="primary" @click="beautifyJson" :disabled="!canBeautifyJson" class="green-btn">
              美化
            </a-button>
            <a-button size="small" type="primary" @click="maximizeJson" class="green-btn">
              最大化
            </a-button>
          </div>
          <div class="body-editor">
            <CodeEditor 
              :model-value="bodyContent" 
              @update:model-value="$emit('update:bodyContent', $event)"
              language="json" 
              :readonly="false"
              min-height="80px"
              max-height="450px"
            />
          </div>
        </div>
      </a-tab-pane>

      <!-- Form 表单格式 -->
      <a-tab-pane key="form" tab="Form">
        <FormBodyEditor
          :form-fields="formFields"
          @update:form-fields="$emit('update:formFields', $event)"
          @add="$emit('addFormField')"
          @remove="$emit('removeFormField', $event)"
          @file-change="(info, index) => $emit('fileChange', { info, index })"
        />
      </a-tab-pane>

      <!-- XML 格式 -->
      <a-tab-pane key="xml" tab="XML">
        <div class="body-editor">
          <CodeEditor 
            :model-value="bodyContent" 
            @update:model-value="$emit('update:bodyContent', $event)"
            language="xml" 
            :readonly="false"
            min-height="80px"
            max-height="450px"
          />
        </div>
      </a-tab-pane>

      <!-- Text 纯文本格式 -->
      <a-tab-pane key="text" tab="Text">
        <div class="body-editor">
          <CodeEditor 
            :model-value="bodyContent" 
            @update:model-value="$emit('update:bodyContent', $event)"
            language="text" 
            :readonly="false"
            min-height="80px"
            max-height="450px"
          />
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>

  <!-- 最大化弹窗 -->
  <a-modal 
    v-model:open="maximizedModalVisible" 
    title="请求Body" 
    width="90%"
    :bodyStyle="{ padding: '16px', maxHeight: '80vh', overflow: 'auto' }"
    ok-text="关闭"
    :cancel-button-props="{ style: { display: 'none' } }"
    @ok="maximizedModalVisible = false"
  >
    <div class="maximized-body">
      <div class="maximized-actions">
        <a-button size="small" @click="beautifyMaximizedJson" :disabled="!canBeautifyMaximizedJson">
          美化
        </a-button>
      </div>
      
      <CodeEditor 
        v-model="maximizedContent"
        language="json" 
        :readonly="false"
        min-height="400px"
      />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import CodeEditor from '../../CodeEditor.vue'
import FormBodyEditor from './FormBodyEditor.vue'
import type { FormField } from './FormBodyEditor.vue'

interface Props {
  activeBodyTab: string
  bodyContent: string
  formFields: FormField[]
}

interface Emits {
  (e: 'update:activeBodyTab', value: string): void
  (e: 'update:bodyContent', value: string): void
  (e: 'update:formFields', value: FormField[]): void
  (e: 'addFormField'): void
  (e: 'removeFormField', index: number): void
  (e: 'fileChange', payload: { info: any; index: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 判断JSON是否可以美化
const canBeautifyJson = computed(() => {
  if (!props.bodyContent) return false
  try {
    JSON.parse(props.bodyContent)
    return true
  } catch {
    return false
  }
})

// 美化JSON
const beautifyJson = () => {
  try {
    const parsed = JSON.parse(props.bodyContent)
    const beautified = JSON.stringify(parsed, null, 2)
    emit('update:bodyContent', beautified)
    message.success('JSON已美化')
  } catch (e) {
    message.error('JSON格式错误，无法美化')
  }
}

// 最大化弹窗状态
const maximizedModalVisible = ref(false)
const maximizedContent = computed({
  get: () => props.bodyContent,
  set: (value) => emit('update:bodyContent', value)
})

// 最大化显示JSON
const maximizeJson = () => {
  maximizedModalVisible.value = true
}

// 在最大化弹窗中美化JSON
const beautifyMaximizedJson = () => {
  try {
    const parsed = JSON.parse(maximizedContent.value)
    const beautified = JSON.stringify(parsed, null, 2)
    maximizedContent.value = beautified
    message.success('JSON已美化')
  } catch (e) {
    message.error('JSON格式错误，无法美化')
  }
}

// 判断最大化弹窗中的JSON是否可以美化
const canBeautifyMaximizedJson = computed(() => {
  if (!maximizedContent.value) return false
  try {
    JSON.parse(maximizedContent.value)
    return true
  } catch {
    return false
  }
})
</script>

<style scoped>
.request-body {
  margin-top: 0;
}

.body-sub-tabs {
  margin-top: 0;
}

:deep(.body-sub-tabs .ant-tabs-nav) {
  margin-bottom: 4px;
}

:deep(.body-sub-tabs .ant-tabs-content) {
  padding: 0;
  min-height: auto;
}

:deep(.body-sub-tabs .ant-tabs-tabpane) {
  padding: 0;
  min-height: auto;
}

.body-editor-wrapper {
  position: relative;
}

.body-editor-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.body-editor-actions :deep(.ant-btn) {
  border-radius: 4px;
  font-size: 12px;
  height: 26px;
  padding: 0 10px;
}

.body-editor-actions :deep(.green-btn) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.body-editor-actions :deep(.green-btn:hover) {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.body-editor-actions :deep(.green-btn:disabled) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  opacity: 0.5;
  color: #fff;
}

.body-editor {
  background: #fff;
  border-radius: 6px;
}

.maximized-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.maximized-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}
</style>
