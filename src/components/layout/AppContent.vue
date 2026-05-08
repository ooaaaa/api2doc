<template>
  <a-layout-content class="content">
    <!-- 侧边栏收起时的切换按钮 -->
    <a-button 
      v-if="sidebarCollapsed"
      type="primary"
      class="sidebar-toggle-btn"
      @click="emit('toggleSidebar')"
    >
      <MenuOutlined />
    </a-button>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <a-spin size="large" tip="加载中..." />
    </div>
    
    <!-- 错误状态 -->
    <ErrorState 
      v-else-if="error" 
      :error="error" 
      @retry="emit('retry')" 
    />
    
    <!-- 搜索无结果 -->
    <SearchEmpty 
      v-else-if="searchText && searchResultCount === 0" 
      :search-text="searchText"
      @clear-search="emit('clearSearch')"
    />
    
    <!-- 搜索有结果但未选择API -->
    <SearchResult 
      v-else-if="searchText && searchResultCount > 0 && !selectedApi" 
      :search-text="searchText"
      :result-count="searchResultCount"
    />
    
    <!-- API详情 -->
    <ApiDetail
      v-else-if="selectedApi"
      :api="selectedApi"
      :base-url="baseUrl"
      :schemas="schemas"
    />
    
    <!-- 欢迎页面 -->
    <WelcomePage 
      v-else 
      :api-info="apiInfo"
      :swagger-spec="swaggerSpec"
      :base-url="baseUrl"
      :total-apis="totalApis"
      :total-tags="totalTags"
    />
    
    <!-- 返回顶部按钮 - 所有页面都显示 -->
    <BackToTop
      ref="backToTopRef"
      scroll-container=".content"
    />
  </a-layout-content>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MenuOutlined } from '@ant-design/icons-vue'
import ApiDetail from '../ApiDetail.vue'
import ErrorState from '../states/ErrorState.vue'
import SearchEmpty from '../states/SearchEmpty.vue'
import SearchResult from '../states/SearchResult.vue'
import WelcomePage from '../states/WelcomePage.vue'
import BackToTop from '../BackToTop.vue'

// 定义Props
interface Props {
  loading: boolean
  error: string
  sidebarCollapsed: boolean
  searchText: string
  searchResultCount: number
  selectedApi: any
  apiInfo: any
  swaggerSpec: any
  baseUrl: string
  schemas: any
  totalApis: number
  totalTags: number
}

// 定义Emits
interface Emits {
  (e: 'toggleSidebar'): void
  (e: 'retry'): void
  (e: 'clearSearch'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 返回顶部按钮引用
const backToTopRef = ref<InstanceType<typeof BackToTop> | null>(null)

// 监听选中的API变化，切换页面时重置滚动位置
watch(() => props.selectedApi, () => {
  // 页面切换时，滚动到顶部
  const contentElement = document.querySelector('.content')
  if (contentElement) {
    contentElement.scrollTop = 0
  }
})
</script>

<style scoped>
.content {
  padding: 16px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg);
  height: 100%;
}

.sidebar-toggle-btn {
  position: fixed;
  top: 80px;
  left: 16px;
  z-index: var(--z-dropdown);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.sidebar-toggle-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--color-bg);
}
</style>