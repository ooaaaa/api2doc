<template>
  <div class="parameter-table">
    <div class="section-title">
      <span>{{ title }}</span>
      <div class="section-actions">
        <a-button 
          v-if="hasChildren" 
          size="small" 
          type="link" 
          @click="$emit('toggleExpand')"
        >
          {{ isAllExpanded ? '全部收起' : '全部展开' }}
        </a-button>
        <a-button 
          v-if="showExample"
          size="small" 
          type="link" 
          @click="handleToggleExample"
        >
          {{ exampleVisible ? '隐藏示例' : '查看示例' }}
        </a-button>
      </div>
    </div>
    <a-table 
      :columns="columns" 
      :data-source="dataSource" 
      :pagination="false" 
      size="middle"
      :show-header="true" 
      :default-expand-all-rows="true" 
      :expanded-row-keys="expandedKeys"
      @expand="$emit('expand', $event)"
      row-key="key" 
    />
    <div v-if="exampleVisible && (exampleContent || $slots.example)" ref="exampleSectionRef" class="example-section">
      <div class="example-header">
        <span class="example-title">示例</span>
        <a-button size="small" @click="$emit('copyExample')" class="copy-btn">
          复制
        </a-button>
      </div>
      <slot name="example">
        <pre class="example-code"><code>{{ exampleContent }}</code></pre>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Props {
  title: string
  columns: any[]
  dataSource: any[]
  expandedKeys: string[]
  hasChildren: boolean
  isAllExpanded: boolean
  showExample?: boolean
  exampleVisible?: boolean
  exampleContent?: string
}

interface Emits {
  (e: 'toggleExpand'): void
  (e: 'toggleExample'): void
  (e: 'expand', payload: any): void
  (e: 'copyExample'): void
}

const props = withDefaults(defineProps<Props>(), {
  showExample: false,
  exampleVisible: false,
  exampleContent: ''
})

const emit = defineEmits<Emits>()

const exampleSectionRef = ref<HTMLElement | null>(null)

const handleToggleExample = async () => {
  emit('toggleExample')
  
  // 如果是显示示例，等待 DOM 更新后滚动到示例位置
  if (!props.exampleVisible) {
    await nextTick()
    setTimeout(() => {
      const exampleSection = document.querySelector('.example-section')
      if (exampleSection) {
        exampleSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        })
      }
    }, 100)
  }
}
</script>

<style scoped>
.parameter-table {
  margin: 16px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.example-section {
  margin-top: 10px;
  background: #fafafa;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e8e8e8;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.example-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.example-code {
  background: #f5f7fa;
  padding: 14px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid #e0e4e8;
}

.example-code code {
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: #2c3e50;
  line-height: 1.7;
  display: block;
}

/* 按钮样式优化 - 小巧绿色系 */
.copy-btn {
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  height: 24px;
  line-height: 1;
  color: var(--color-primary);
  border-color: var(--color-primary);
  transition: all 0.2s ease;
}

.copy-btn:hover {
  color: #fff;
  border-color: var(--color-primary);
  background: var(--color-primary);
}

/* section-actions 中的 link 按钮 */
:deep(.section-actions .ant-btn-link) {
  font-size: 12px;
  padding: 2px 6px;
  height: 24px;
  color: var(--color-primary);
}

:deep(.section-actions .ant-btn-link:hover) {
  color: var(--color-primary-hover);
}

:deep(.ant-table) {
  font-size: 13px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  color: #0a0a0a;
  padding: 8px 12px;
  letter-spacing: -0.2px;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 8px 12px;
  color: #595959;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #fafafa;
}

:deep(.ant-table-row-expand-icon) {
  color: var(--color-primary);
}

:deep(.field-name-cell) {
  color: #777;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 500;
}

:deep(.example-cell) {
  color: #52c41a;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 500;
  font-style: italic;
}

:deep(.required-yes) {
  color: #ff4d4f;
  font-weight: 600;
}

:deep(.required-no) {
  color: #888;
}
</style>
