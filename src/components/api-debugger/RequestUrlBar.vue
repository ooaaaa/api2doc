<template>
  <div class="request-url-section">
    <div class="url-bar">
      <a-select 
        :value="currentMethod" 
        @update:value="$emit('update:currentMethod', $event)"
        class="method-select"
      >
        <a-select-option v-for="method in availableMethods" :key="method" :value="method">
          {{ method }}
        </a-select-option>
      </a-select>
      <a-input 
        :value="editableUrl" 
        @update:value="handleUrlChange"
        @blur="handleUrlBlur"
        @pressEnter="handleUrlBlur"
        class="url-input"
        placeholder="请求 URL"
      />
      <a-button 
        :type="testing ? 'default' : 'primary'"
        :danger="testing"
        @click="testing ? $emit('abort') : $emit('test')" 
        class="send-btn"
      >
        {{ testing ? '停止' : buttonText }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  currentMethod: string
  testUrl: string
  testing: boolean
  isMultiMethod: boolean
  availableMethods: string[]
  buttonText: string
}

interface Emits {
  (e: 'update:currentMethod', value: string): void
  (e: 'update:testUrl', value: string): void
  (e: 'test'): void
  (e: 'abort'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editableUrl = ref(props.testUrl)

// 监听 testUrl 变化，同步到 editableUrl
watch(() => props.testUrl, (newUrl) => {
  editableUrl.value = newUrl
})

const handleUrlChange = (value: string) => {
  editableUrl.value = value
}

const handleUrlBlur = () => {
  // 失焦时通知父组件更新 URL
  emit('update:testUrl', editableUrl.value)
}
</script>

<style scoped>
.request-url-section {
  margin-bottom: 8px;
}

.url-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-select {
  flex-shrink: 0;
  width: 100px;
}

.url-input {
  flex: 1;
}

:deep(.url-input .ant-input) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.send-btn {
  flex-shrink: 0;
}
</style>
