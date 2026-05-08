<template>
  <ApiDetailNew :api="api" :base-url="baseUrl" :schemas="schemas" />
</template>

<script setup lang="ts">
// 此文件已重构为 api-detail/index.vue
// 为了保持向后兼容，这里作为一个代理组件
import ApiDetailNew from './api-detail/index.vue'

interface Props {
  api: any
  baseUrl: string
  schemas?: Record<string, any>
}

defineProps<Props>()
</script>
