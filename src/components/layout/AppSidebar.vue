<template>
  <a-layout-sider 
    :collapsed="collapsed"
    :width="sidebarWidth" 
    :collapsed-width="0"
    theme="light" 
    :class="['sidebar', { 'resizing': isResizing }]"
    collapsible
    :trigger="null"
  >
    <!-- 拖拽调整手柄 -->
    <div 
      class="resize-handle"
      @mousedown="$emit('startResize', $event)"
      :class="{ 'resizing': isResizing }"
    ></div>
    
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <span class="sidebar-title">接口列表</span>
      <div class="sidebar-actions">
        <span class="api-count">
          <span class="count-number">{{ filteredTags.length }}</span>
          <span class="count-text">分组</span>
          <span class="count-separator">·</span>
          <span class="count-number">{{ totalApiCount }}</span>
          <span class="count-text">接口</span>
        </span>
        <a-button 
          type="text" 
          size="small"
          @click="$emit('toggleSidebar')"
          class="collapse-btn"
        >
          <span class="collapse-icon">‹</span>
        </a-button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="sidebar-loading">
      <a-spin />
    </div>
    
    <!-- API菜单 -->
    <div v-else class="menu-container">
      <a-menu
        :selectedKeys="selectedKeys"
        :openKeys="openKeys"
        mode="inline"
        class="api-menu"
        @click="$emit('menuClick', $event)"
        @update:selectedKeys="$emit('update:selectedKeys', $event)"
        @update:openKeys="$emit('update:openKeys', $event)"
      >
        <MenuNode
          v-for="tag in filteredTags"
          :key="tag.key"
          :node="tag"
          :get-method-color="getMethodColor"
        />
      </a-menu>
    </div>
  </a-layout-sider>
</template>

<script setup lang="ts">
import MenuNode from './MenuNode.vue'

// 定义Props
interface Props {
  collapsed: boolean
  sidebarWidth: number
  isResizing: boolean
  loading: boolean
  filteredTags: any[]
  selectedKeys: string[]
  openKeys: string[]
  totalApiCount: number
  getApisByTag: (tagName: string) => any[]
  getMethodColor: (method: string) => string
}

// 定义Emits
interface Emits {
  (e: 'update:collapsed', value: boolean): void
  (e: 'update:selectedKeys', value: string[]): void
  (e: 'update:openKeys', value: string[]): void
  (e: 'startResize', event: MouseEvent): void
  (e: 'toggleSidebar'): void
  (e: 'menuClick', event: any): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.sidebar {
  background: var(--color-bg);
  border-right: 1px solid var(--color-border-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  transition: all var(--transition-fast);
}

/* Ant Design sider 内部容器需要 flex 布局 */
.sidebar :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background var(--transition-fast);
  z-index: 10;
}

.resize-handle:hover,
.resize-handle.resizing {
  background: var(--color-primary);
}

.resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  right: -3px;
  height: 100%;
}

.sidebar-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg);
}

.sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-count {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 400;
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.count-number {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.count-text {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.count-separator {
  font-size: 11px;
  color: var(--color-border);
  margin: 0 4px;
}

.sidebar-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.menu-container {
  flex: 1;
  overflow-y: auto !important;
  overflow-x: hidden;
  min-height: 0;
  max-height: 100%;
  position: relative;
}

.api-menu {
  border-right: none;
  height: auto !important;
}

:deep(.api-menu.ant-menu) {
  border-right: none;
  height: auto !important;
}

:deep(.ant-menu-submenu-title) {
  height: auto !important;
  line-height: 1.5 !important;
  padding: 8px !important;
  margin: 2px 4px !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--transition-fast) !important;
}

:deep(.ant-menu-submenu-title:hover) {
  background: var(--color-bg-secondary) !important;
}

/* 多级菜单缩进样式 */
:deep(.ant-menu-sub) {
  background: transparent !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu-title) {
  padding-left: 12px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu-title) {
  padding-left: 24px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-submenu-title) {
  padding-left: 36px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-submenu-title) {
  padding-left: 48px !important;
}

/* API 菜单项的缩进 */
:deep(.ant-menu-submenu .ant-menu-item) {
  padding-left: 24px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-item) {
  padding-left: 36px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-item) {
  padding-left: 48px !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-item) {
  padding-left: 60px !important;
}

:deep(.menu-group-title) {
  display: flex;
  align-items: center;
  font-weight: 600;
  gap: 4px;
  max-width: calc(100% - 24px);
}

:deep(.group-index) {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 500;
  flex-shrink: 0;
  opacity: 0.7;
  margin-right: 2px;
}

:deep(.group-name) {
  flex: 1;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-weight: 500;
  transition: color var(--transition-fast);
}

/* 子菜单标题样式调整 */
:deep(.ant-menu-submenu .ant-menu-submenu .menu-group-title .group-name) {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .menu-group-title .group-name) {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-muted);
}

/* 子菜单索引号隐藏 */
:deep(.ant-menu-submenu .ant-menu-submenu .group-index) {
  display: none;
}

/* 子菜单 hover */
:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu-title:hover) {
  background: var(--color-bg-secondary) !important;
}

:deep(.ant-menu-submenu .ant-menu-submenu .ant-menu-submenu .ant-menu-submenu-title:hover) {
  background: var(--color-bg-secondary) !important;
}

:deep(.group-count) {
  font-size: 11px;
  color: var(--color-text-muted);
  background: transparent;
  padding: 0;
  border-radius: 0;
  flex-shrink: 0;
  font-weight: 400;
  margin-left: 4px;
}

:deep(.ant-menu-item) {
  height: auto !important;
  line-height: 1.4 !important;
  padding: 8px 8px 8px 24px !important;
  margin: 1px 4px !important;
  white-space: normal !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast) !important;
}

:deep(.ant-menu-item:hover) {
  background: var(--color-bg-secondary) !important;
}

:deep(.ant-menu-item.ant-menu-item-selected) {
  background: var(--color-primary-bg) !important;
  border-left: 3px solid var(--color-primary) !important;
  border-right: none !important;
}

/* API 项样式 */
:deep(.api-item-content) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

:deep(.api-item-main) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

:deep(.api-index) {
  font-size: 11px;
  color: #bfbfbf;
  font-weight: 400;
  flex-shrink: 0;
}

:deep(.api-summary) {
  flex: 1;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-weight: 400;
  transition: color var(--transition-fast);
}

:deep(.method-tag) {
  font-size: 10px;
  padding: 1px 5px;
  margin: 0;
  font-weight: 600;
  border-radius: 3px;
  flex-shrink: 0;
  line-height: 1.4;
  min-width: 38px;
  text-align: center;
  display: inline-block;
  letter-spacing: 0.02em;
}

:deep(.api-path) {
  font-size: 11px;
  color: #bfbfbf;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  line-height: 1.4;
  word-break: break-all;
  transition: color var(--transition-fast);
  padding-left: 16px;
}

/* 按钮样式 */
.collapse-btn {
  border-radius: 4px;
  font-weight: 400;
  font-size: 16px;
  transition: all var(--transition-fast);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.collapse-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.collapse-icon {
  display: inline-block;
  font-weight: bold;
  line-height: 1;
  transform: scaleX(1.5);
}
</style>