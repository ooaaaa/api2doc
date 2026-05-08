<template>
  <div class="api-header">
    <div class="api-title-line">
      <h2 class="api-summary">{{ api.summary || '接口详情' }}</h2>
      <a-tooltip v-if="api.method === 'MULTI'" :title="`该接口支持多个请求方式：${api.methodList.join('、')}`">
        <span class="method-tag-large">⋯</span>
      </a-tooltip>
      <span v-else class="method-tag-large">{{ api.method }}</span>
    </div>
    <div class="api-path-line">
      <code class="api-path">{{ api.path }}</code>
      <a-button size="small" type="text" @click="$emit('copyPath')" class="copy-path-btn">
        复制
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  api: any
}

interface Emits {
  (e: 'copyPath'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.api-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-light);
}

.api-title-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.api-summary {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.method-tag-large {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  margin: 0;
  min-width: 48px;
  text-align: center;
  display: inline-block;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.api-path-line {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 0;
}

.api-path {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  color: #374151;
  background: transparent;
  border: none;
  padding: 0;
}

.copy-path-btn {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 2px 8px;
  height: 24px;
  border-radius: 4px;
}

.copy-path-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
</style>
