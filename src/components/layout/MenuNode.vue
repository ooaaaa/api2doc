<template>
  <a-sub-menu :key="node.key">
    <template #title>
      <a-tooltip :title="node.name" placement="right">
        <span class="menu-group-title">
          <span v-if="node.index" class="group-index">{{ node.index }}.</span>
          <span class="group-name">{{ node.name }}</span>
          <span v-if="totalCount > 0" class="group-count">{{ totalCount }}</span>
        </span>
      </a-tooltip>
    </template>
    
    <!-- 渲染当前节点的 API -->
    <a-menu-item
      v-for="api in node.apis"
      :key="api.key"
      class="ant-menu-item"
    >
      <a-tooltip :title="api.summary || api.path" placement="right">
        <div class="api-item-content">
          <div class="api-item-main">
            <span class="api-index">{{ api.index }}.</span>
            <span class="api-summary">{{ api.summary || api.path }}</span>
            <a-tooltip 
              v-if="api.method === 'MULTI'" 
              :title="`该接口支持多个请求方式：${api.methodList.join('、')}`"
              placement="top"
            >
              <a-tag :color="getMethodColor(api.method)" class="method-tag">
                ⋯
              </a-tag>
            </a-tooltip>
            <a-tag v-else :color="getMethodColor(api.method)" class="method-tag">
              {{ api.method }}
            </a-tag>
          </div>
          <div class="api-path">{{ api.path }}</div>
        </div>
      </a-tooltip>
    </a-menu-item>
    
    <!-- 递归渲染子节点 -->
    <MenuNode
      v-for="child in node.children"
      :key="child.key"
      :node="child"
      :get-method-color="getMethodColor"
    />
  </a-sub-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义 Props
interface Props {
  node: any
  getMethodColor: (method: string) => string
}

const props = defineProps<Props>()

// 递归计算节点及其所有子节点的 API 总数
const getTotalApiCount = (node: any): number => {
  let count = node.apis?.length || 0
  if (node.children && node.children.length > 0) {
    count += node.children.reduce((sum: number, child: any) => sum + getTotalApiCount(child), 0)
  }
  return count
}

// 计算当前节点的总 API 数量
const totalCount = computed(() => getTotalApiCount(props.node))
</script>

<style>
/* 样式由父组件 AppSidebar.vue 通过 :deep() 统一管理 */
</style>
