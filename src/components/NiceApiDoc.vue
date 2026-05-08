<template>
  <a-config-provider :theme="themeConfig">
    <div class="nice-apidoc">
      <a-layout>
        <!-- 头部组件 -->
        <AppHeader 
          :api-info="apiInfo"
          :search-text="searchText"
          :services="services"
          :active-service-id="activeServiceId"
          :is-proxy-mode="isProxyMode"
          @update:search-text="searchText = $event"
          @go-home="goToHome"
          @switch-service="$emit('switchService', $event)"
          @add-service="$emit('addService', $event)"
          @edit-service="(id, data) => $emit('editService', id, data)"
          @remove-service="$emit('removeService', $event)"
          @import-config="$emit('importConfig', $event)"
          @export-config="$emit('exportConfig')"
        />
        
        <a-layout class="main-layout">
          <!-- 侧边栏组件 -->
          <AppSidebar
            :collapsed="sidebarCollapsed"
            :selected-keys="selectedKeys"
            :open-keys="openKeys"
            :sidebar-width="sidebarWidth"
            :is-resizing="isResizing"
            :loading="loading"
            :filtered-tags="filteredTags"
            :total-api-count="allApis.length"
            :get-apis-by-tag="getFilteredApisByTag"
            :get-method-color="getMethodColor"
            @update:collapsed="sidebarCollapsed = $event"
            @update:selected-keys="selectedKeys = $event"
            @update:open-keys="openKeys = $event"
            @start-resize="startResize"
            @toggle-sidebar="toggleSidebar"
            @menu-click="handleMenuClickWrapper"
          />
          
          <!-- 主内容区域组件 -->
          <AppContent
            :loading="loading"
            :error="error"
            :sidebar-collapsed="sidebarCollapsed"
            :search-text="searchText"
            :search-result-count="searchResultCount"
            :selected-api="selectedApi"
            :api-info="apiInfo"
            :swagger-spec="swaggerSpec"
            :base-url="baseUrl"
            :schemas="swaggerSpec?.components?.schemas"
            :total-apis="allApis.length"
            :total-tags="filteredTags.length"
            @toggle-sidebar="toggleSidebar"
            @retry="loadSwaggerSpec"
            @clear-search="searchText = ''"
          />
        </a-layout>
      </a-layout>
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { theme } from 'ant-design-vue'
import { 
  useSwaggerData, 
  useApiParser, 
  useApiSearch, 
  useApiNavigation, 
  useSidebar 
} from '../composables'
import { DEFAULT_THEME } from '../constants'
import type { ServiceConfig } from '../config'
import AppHeader from './layout/AppHeader.vue'
import AppSidebar from './layout/AppSidebar.vue'
import AppContent from './layout/AppContent.vue'

// 组件Props
const props = defineProps<{
  swaggerUrl: string
  title?: string
  primaryColor?: string
  services?: ServiceConfig[]
  activeServiceId?: string | null
  isProxyMode?: boolean
}>()

// 组件事件
defineEmits<{
  switchService: [id: string]
  addService: [data: { name: string; url: string }]
  editService: [id: string, data: { name?: string; url?: string }]
  removeService: [id: string]
  importConfig: [json: string]
  exportConfig: []
}>()

// 使用组合式函数
const { 
  loading, 
  error, 
  swaggerSpec, 
  apiInfo, 
  baseUrl, 
  loadSwaggerSpec 
} = useSwaggerData(props.swaggerUrl)

const { 
  allApis, 
  apiTags, 
  getApisByTag, 
  getMethodColor 
} = useApiParser(swaggerSpec)

const { 
  searchText, 
  getFilteredTags, 
  getFilteredApis, 
  getSearchResultCount 
} = useApiSearch()

const { 
  selectedApi, 
  selectedKeys, 
  openKeys, 
  handleMenuClick, 
  goToHome, 
  restoreFromUrl, 
  handleHashChange 
} = useApiNavigation()

const { 
  sidebarCollapsed, 
  sidebarWidth, 
  isResizing, 
  toggleSidebar, 
  startResize
} = useSidebar()

// 主题配置
const themeConfig = computed(() => ({
  algorithm: theme.defaultAlgorithm,
  token: {
    // 主色
    colorPrimary: props.primaryColor || DEFAULT_THEME.primaryColor,
    // 字号体系 - 工具型产品偏小
    fontSize: 13,
    fontSizeHeading1: 20,
    fontSizeHeading2: 16,
    fontSizeHeading3: 14,
    fontSizeHeading4: 13,
    fontSizeHeading5: 12,
    fontSizeSM: 12,
    fontSizeLG: 14,
    // 圆角 - 克制
    borderRadius: 4,
    borderRadiusSM: 3,
    borderRadiusLG: 6,
    // 控件高度 - 紧凑
    controlHeight: 28,
    controlHeightSM: 22,
    controlHeightLG: 34,
    // 间距 - 紧凑
    padding: 12,
    paddingSM: 8,
    paddingXS: 4,
    paddingLG: 16,
    margin: 12,
    marginSM: 8,
    marginXS: 4,
    // 颜色 - 干净
    colorBgContainer: '#ffffff',
    colorBgLayout: '#ffffff',
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#f3f4f6',
    colorText: '#111827',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    // 行高
    lineHeight: 1.5,
  },
  components: {
    Button: {
      controlHeightSM: 22,
      fontSize: 12,
      paddingInlineSM: 8,
      borderRadiusSM: 3,
      defaultBg: '#10b981',
      defaultColor: '#ffffff',
      defaultBorderColor: '#10b981',
      defaultHoverBg: '#059669',
      defaultHoverColor: '#ffffff',
      defaultHoverBorderColor: '#059669',
      defaultActiveBg: '#047857',
      defaultActiveColor: '#ffffff',
      defaultActiveBorderColor: '#047857',
    },
    Tabs: {
      titleFontSize: 13,
      titleFontSizeSM: 12,
      horizontalItemPadding: '8px 12px',
      horizontalItemPaddingSM: '6px 10px',
    },
    Table: {
      fontSize: 12,
      cellPaddingBlock: 6,
      cellPaddingInline: 10,
      headerBg: '#f9fafb',
      headerColor: '#374151',
    },
    Tag: {
      fontSize: 11,
      defaultBg: 'rgba(16, 185, 129, 0.06)',
      defaultColor: '#059669',
    },
    Input: {
      fontSize: 13,
      paddingInline: 10,
    },
    Select: {
      fontSize: 13,
    },
    Menu: {
      fontSize: 13,
      itemHeight: 32,
      subMenuItemBg: 'transparent',
    },
    Modal: {
      titleFontSize: 15,
    },
    Alert: {
      fontSize: 12,
    },
  },
}))

// 过滤后的标签和API
const filteredTags = computed(() => 
  getFilteredTags(apiTags.value, allApis.value)
)

const searchResultCount = computed(() => 
  getSearchResultCount(allApis.value)
)

// 根据搜索条件过滤API（支持树形节点）
const getFilteredApisByTag = (tagPath: string) => {
  const apis = getApisByTag(tagPath)
  return getFilteredApis(apis)
}

// 处理菜单点击
const handleMenuClickWrapper = (event: any) => {
  handleMenuClick(event, allApis.value)
}

// 生命周期钩子
onMounted(async () => {
  // 监听浏览器前进后退
  const hashChangeHandler = () => handleHashChange(allApis.value)
  window.addEventListener('hashchange', hashChangeHandler)
  
  // 先加载数据
  await loadSwaggerSpec()
  
  // 数据加载完成后，立即从 URL 恢复状态
  setTimeout(() => {
    restoreFromUrl(allApis.value)
  }, 200)
})

onUnmounted(() => {
  const hashChangeHandler = () => handleHashChange(allApis.value)
  window.removeEventListener('hashchange', hashChangeHandler)
})
</script>

<style scoped>
.nice-apidoc {
  height: 100%;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Ant Design Layout 高度约束 */
.nice-apidoc :deep(.ant-layout) {
  height: 100%;
}

.main-layout {
  height: calc(100% - 48px);
  overflow: hidden;
}

.main-layout :deep(.ant-layout-content) {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Tooltip */
:deep(.ant-tooltip) {
  max-width: 400px;
}

:deep(.ant-tooltip-inner) {
  background: #1f2328;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: 11px;
  line-height: 1.5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  color: #fff;
  font-weight: 400;
}

:deep(.ant-tooltip-arrow) {
  display: none;
}
</style>
