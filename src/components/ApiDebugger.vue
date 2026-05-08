<template>
  <ApiDebuggerNew :api="api" :base-url="baseUrl" :body-example="bodyExample" />
</template>

<script setup lang="ts">
// 此文件已重构为 api-debugger/index.vue
// 为了保持向后兼容，这里作为一个代理组件
import ApiDebuggerNew from './api-debugger/index.vue'

interface Props {
  api: any
  baseUrl: string
  bodyExample?: string
}

defineProps<Props>()
</script>
