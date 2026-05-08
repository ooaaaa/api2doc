<template>
  <div class="search-result">
    <div class="search-result-content">
      <div class="search-result-icon">✨</div>
      <h2 class="search-result-title">找到 {{ resultCount }} 个匹配的接口</h2>
      <p class="search-result-message">
        搜索关键词：<span class="search-keyword">{{ searchText }}</span>
      </p>
      <div class="search-result-tip">
        <span class="tip-icon">👈</span>
        <span class="tip-text">点击左侧接口查看详情</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义Props
interface Props {
  searchText: string
  resultCount: number
}

defineProps<Props>()
</script>

<style scoped>
.search-result {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--color-bg);
  overflow-y: auto;
}

.search-result-content {
  max-width: 500px;
  padding: 60px 40px;
  text-align: center;
}

.search-result-icon {
  font-size: 48px;
  margin-bottom: 24px;
}

.search-result-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary-hover);
}

.search-result-message {
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

.search-result-tip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-border-light);
}

.tip-icon {
  font-size: 14px;
  opacity: 0.8;
}

.tip-text {
  font-size: 13px;
  color: var(--color-link);
  font-weight: 500;
}
</style>