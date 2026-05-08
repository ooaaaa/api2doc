<template>
  <div class="search-empty">
    <div class="search-empty-content">
      <div class="search-empty-icon">🔍</div>
      <h2 class="search-empty-title">未找到匹配的接口</h2>
      <p class="search-empty-message">
        没有找到包含 "<span class="search-keyword">{{ searchText }}</span>" 的接口
      </p>
      <div class="search-tips">
        <div class="search-tip-title">搜索提示：</div>
        <ul class="search-tip-list">
          <li>支持搜索接口名称、描述、路径</li>
          <li>尝试使用更简短的关键词</li>
          <li>检查拼写是否正确</li>
        </ul>
      </div>
      <a-button type="primary" @click="$emit('clearSearch')">
        清除搜索
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义Props
interface Props {
  searchText: string
}

// 定义Emits
interface Emits {
  (e: 'clearSearch'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.search-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--color-bg);
  overflow-y: auto;
}

.search-empty-content {
  max-width: 500px;
  padding: 60px 40px;
  text-align: center;
}

.search-empty-icon {
  font-size: 48px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.search-empty-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.search-empty-message {
  margin: 0 0 32px;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

.search-keyword {
  color: var(--color-link);
  font-weight: 600;
  padding: 2px 8px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
}

.search-tips {
  text-align: left;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  margin-bottom: 24px;
}

.search-tip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
}

.search-tip-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.search-tip-list li {
  position: relative;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  padding-left: 12px;
}

.search-tip-list li::before {
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