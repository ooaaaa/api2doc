<template>
  <div class="welcome-page">
    <div class="welcome-container">
      <!-- 上半部分：api2doc 信息 -->
      <div class="nice-section">
        <div class="nice-brand">
          <Api2DocLogo :size="48" :show-text="false" />
          <h1 class="nice-title">api2doc</h1>
        </div>
        <p class="nice-subtitle">开发者需要什么，我们就造什么</p>
        
        <!-- 统计数据 -->
        <div class="stats-compact">
          <div class="stat-compact-item">
            <div class="stat-compact-number">{{ totalApis }}</div>
            <div class="stat-compact-label">接口数量</div>
          </div>
          <div class="stat-compact-divider"></div>
          <div class="stat-compact-item">
            <div class="stat-compact-number">{{ totalTags }}</div>
            <div class="stat-compact-label">接口分组</div>
          </div>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 下半部分：项目信息 -->
      <div class="project-section">
        <div class="project-header">
          <h2 class="project-title">{{ apiInfo.title || 'API 文档' }}</h2>
          <span v-if="apiInfo.version" class="version-badge">v{{ apiInfo.version }}</span>
        </div>
        
        <!-- 渲染 Markdown 描述 -->
        <div v-if="apiInfo.description" class="project-description" v-html="renderedDescription"></div>

        <div v-if="baseUrl" class="base-url-section">
          <div class="base-url-label">服务地址</div>
          <div class="base-url-content">
            <code class="base-url">{{ baseUrl }}</code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import Api2DocLogo from '../Api2DocLogo.vue'

interface Props {
  apiInfo: any
  swaggerSpec: any
  baseUrl: string
  totalApis: number
  totalTags: number
}

const props = defineProps<Props>()

// 渲染 Markdown 描述
const renderedDescription = computed(() => {
  if (!props.apiInfo.description) return ''
  try {
    return marked.parse(props.apiInfo.description, { breaks: true }) as string
  } catch (e) {
    console.error('Markdown 渲染失败:', e)
    return props.apiInfo.description
  }
})

// 统计请求方法数量
const methodCount = computed(() => {
  const methods = new Set<string>()
  const paths = props.swaggerSpec?.paths || {}
  
  Object.values(paths).forEach((pathItem: any) => {
    Object.keys(pathItem).forEach(method => {
      if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
        methods.add(method.toUpperCase())
      }
    })
  })
  
  return methods.size
})
</script>

<style scoped>
.welcome-page {
  min-height: 100%;
  overflow-y: auto;
  padding: 20px 32px;
}

.welcome-container {
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* api2doc 区域 */
.nice-section {
  padding: 32px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: var(--color-bg-secondary);
}

.nice-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nice-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -1px;
}

.nice-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

/* 统计数据 */
.stats-compact {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 12px;
  padding: 16px 32px;
  background: var(--color-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  transition: all var(--transition-fast);
}

.stats-compact:hover {
  border-color: var(--color-border);
}

.stat-compact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-compact-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary-hover);
  line-height: 1;
}

.stat-compact-label {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-compact-divider {
  width: 1px;
  height: 32px;
  background: var(--color-border-light);
}

/* 分隔线 */
.divider {
  height: 1px;
  background: var(--color-border-light);
  margin: 0 32px;
}

/* 项目信息区域 */
.project-section {
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.project-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.version-badge {
  padding: 4px 12px;
  background: var(--color-primary-bg);
  color: var(--color-link);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--color-border-light);
}

.project-description {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--color-text-secondary);
  text-align: left;
  max-width: 780px;
}

/* Markdown 渲染样式 */
.project-description :deep(h1),
.project-description :deep(h2),
.project-description :deep(h3),
.project-description :deep(h4),
.project-description :deep(h5),
.project-description :deep(h6) {
  margin: 20px 0 8px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.project-description :deep(h1) { font-size: 24px; }
.project-description :deep(h2) { font-size: 20px; }
.project-description :deep(h3) { font-size: 18px; }
.project-description :deep(h4) { font-size: 16px; }

.project-description :deep(p) {
  margin: 14px 0;
  line-height: 1.65;
}

.project-description :deep(ul),
.project-description :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.project-description :deep(li) {
  margin: 4px 0;
  line-height: 1.65;
}

.project-description :deep(code) {
  padding: 2px 6px;
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  color: var(--color-link);
}

.project-description :deep(pre) {
  margin: 12px 0;
  padding: 12px;
  background: #f7f9f8;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  overflow-x: auto;
}

.project-description :deep(pre code) {
  padding: 0;
  background: none;
  color: var(--color-text);
}

.project-description :deep(strong) {
  font-weight: 600;
  color: var(--color-text);
}

.project-description :deep(a) {
  color: var(--color-link);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.project-description :deep(a:hover) {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.project-description :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 3px solid var(--color-primary);
  background: rgba(66, 184, 131, 0.03);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--color-text-secondary);
}

.project-description :deep(hr) {
  margin: 16px 0;
  border: none;
  border-top: 1px solid var(--color-border-light);
}

.base-url-section {
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.base-url-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.base-url-content {
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.base-url {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px;
  color: var(--color-text);
  word-break: break-all;
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-page {
    padding: 16px;
  }

  .nice-section,
  .project-section {
    padding: 24px 16px;
  }

  .nice-title {
    font-size: 28px;
  }

  .project-title {
    font-size: 20px;
  }

  .stats-compact {
    gap: 16px;
    padding: 12px 20px;
  }

  .stat-compact-number {
    font-size: 24px;
  }
}
</style>
