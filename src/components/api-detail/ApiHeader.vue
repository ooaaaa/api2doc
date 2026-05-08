<template>
  <div class="api-header">
    <div class="api-title-line">
      <div class="api-title-left">
        <h2 class="api-summary">{{ api.summary || '接口详情' }}</h2>
        <a-tooltip v-if="api.method === 'MULTI'" :title="`该接口支持多个请求方式：${api.methodList.join('、')}`">
          <span class="method-tag-large">⋯</span>
        </a-tooltip>
        <span v-else class="method-tag-large">{{ api.method }}</span>
      </div>
      <div class="api-title-actions">
        <a class="doc-action-link" @click="$emit('copyMarkdown')" title="复制为 Markdown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>复制 MD</span>
        </a>
        <a class="doc-action-link" @click="$emit('downloadWord')" title="下载 Word 文档">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>下载 Word</span>
        </a>
      </div>
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
  (e: 'copyMarkdown'): void
  (e: 'downloadWord'): void
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

.api-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.api-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.doc-action-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--color-text-muted, #9ca3af);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.doc-action-link:hover {
  color: var(--color-primary, #10b981);
  background: rgba(16, 185, 129, 0.06);
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
