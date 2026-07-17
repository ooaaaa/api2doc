<template>
  <div class="error">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h2 class="error-title">后端 Swagger 服务错误</h2>
      <p class="error-message">无法连接到 API 文档服务，请检查后端服务是否正常运行</p>
      <div class="error-details">
        <div class="error-detail-text">{{ error }}</div>
        <div class="error-explain">请检查后端 Swagger 服务是否正常运行，确认文档地址可访问</div>
      </div>
      <div class="error-actions">
        <a-button type="primary" :loading="retrying" @click="handleRetry">
          重新加载
        </a-button>
      </div>
      <div class="error-tips">
        <div class="tip-title">💡 常见解决方案：</div>
        <ul class="tip-list">
          <li>确认后端服务已启动</li>
          <li>检查 Swagger 文档路径是否正确</li>
          <li>查看浏览器控制台是否有 CORS 跨域错误</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// 定义Props
interface Props {
  error: string
}

// 定义Emits
interface Emits {
  (e: 'retry'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const retrying = ref(false)

// 重新加载：触发父组件重新加载数据
const handleRetry = () => {
  retrying.value = true
  emit('retry')
}

// 监听 error 变化，如果 error 有值说明重试失败，恢复按钮状态
watch(() => props.error, (newError) => {
  if (newError && retrying.value) {
    setTimeout(() => {
      retrying.value = false
    }, 500)
  }
})
</script>

<style scoped>
.error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  overflow: auto;
}

.error-content {
  max-width: 600px;
  padding: 60px 40px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.error-title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-error-text);
}

.error-message {
  margin: 0 0 32px;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.error-details {
  margin-bottom: 32px;
  padding: 16px;
  background: var(--color-error-bg);
  border-radius: var(--radius-md);
  border: 1px solid rgba(207, 34, 46, 0.15);
  text-align: left;
}

.error-detail-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  word-break: break-word;
  line-height: 1.5;
  white-space: pre-wrap;
}

.error-explain {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border-light);
  font-size: 13px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.error-actions {
  margin-bottom: 32px;
}

.error-tips {
  text-align: left;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.tip-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.tip-list li {
  position: relative;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  padding-left: 12px;
}

.tip-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-primary);
}
</style>