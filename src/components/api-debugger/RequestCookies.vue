<template>
  <div class="cookie-editor">
    <!-- Cookie Jar 自动匹配提示 -->
    <div v-if="matchedCookies.length > 0" class="jar-hint">
      <div class="jar-hint-header">
        <span class="jar-icon">&#x1f36a;</span>
        <span class="jar-label">Cookie Jar 自动匹配 ({{ matchedCookies.length }})</span>
        <a-switch
          v-model:checked="autoInject"
          size="small"
          class="jar-switch"
        />
      </div>
      <div v-if="autoInject" class="jar-cookies">
        <div v-for="c in matchedCookies" :key="`${c.domain}-${c.name}`" class="jar-cookie-item">
          <span class="jar-cookie-name">{{ c.name }}</span>
          <span class="jar-cookie-eq">=</span>
          <span class="jar-cookie-value">{{ c.value }}</span>
          <span class="jar-cookie-domain">{{ c.domain }}</span>
        </div>
      </div>
    </div>

    <!-- 手动 Cookie 编辑 -->
    <div class="manual-cookies">
      <div class="param-list">
        <div v-for="(cookie, index) in cookies" :key="index" class="param-item">
          <a-checkbox
            :checked="cookie.enabled"
            @update:checked="updateCookie(index, 'enabled', $event)"
          />
          <a-input
            :value="cookie.name"
            @update:value="updateCookie(index, 'name', $event)"
            placeholder="Cookie 名"
            size="small"
            class="cookie-name-input"
          />
          <a-input
            :value="cookie.value"
            @update:value="updateCookie(index, 'value', $event)"
            placeholder="Cookie 值"
            size="small"
          />
          <a-button
            size="small"
            danger
            type="text"
            @click="$emit('remove', index)"
            class="delete-btn"
          >
            删除
          </a-button>
        </div>
      </div>
      <a-button
        type="dashed"
        block
        @click="$emit('add')"
        style="margin-top: 8px"
        class="add-btn"
      >
        添加 Cookie
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCookieJar } from '../../composables/useCookieJar'
import type { StoredCookie } from '../../composables/useCookieJar'

interface CookieParam {
  name: string
  value: string
  enabled: boolean
}

interface Props {
  cookies: CookieParam[]
  requestUrl: string
  autoInject: boolean
}

interface Emits {
  (e: 'update:cookies', value: CookieParam[]): void
  (e: 'update:autoInject', value: boolean): void
  (e: 'add'): void
  (e: 'remove', index: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getMatchingCookies } = useCookieJar()

// 从 Cookie Jar 中匹配当前 URL 的 Cookie
const matchedCookies = computed((): StoredCookie[] => {
  if (!props.requestUrl) return []
  return getMatchingCookies(props.requestUrl)
})

const autoInject = computed({
  get: () => props.autoInject,
  set: (v: boolean) => emit('update:autoInject', v)
})

const updateCookie = (index: number, field: string, value: string | boolean) => {
  const newCookies = [...props.cookies]
  newCookies[index] = { ...newCookies[index], [field]: value }
  emit('update:cookies', newCookies)
}
</script>

<style scoped>
.cookie-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Cookie Jar 提示优化 */
.jar-hint {
  background: #f6ffed;
  border: 1px solid #d3f261;
  border-radius: 4px;
  padding: 8px 10px;
}

.jar-hint-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jar-icon {
  font-size: 14px;
}

.jar-label {
  font-size: 12px;
  font-weight: 500;
  color: #389e0d;
  flex: 1;
}

.jar-switch {
  flex-shrink: 0;
}

.jar-cookies {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jar-cookie-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  padding: 3px 8px;
  background: #fff;
  border-radius: 3px;
  line-height: 1.6;
}

.jar-cookie-name {
  color: #389e0d;
  font-weight: 600;
}

.jar-cookie-eq {
  color: #8c8c8c;
}

.jar-cookie-value {
  color: #595959;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jar-cookie-domain {
  color: #bfbfbf;
  font-size: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

/* 手动 Cookies - 与其他表单统一 */
.manual-cookies {
  padding: 0;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.param-item {
  display: grid;
  grid-template-columns: 24px 160px 1fr 36px;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: #fafafa;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.param-item:hover {
  background: #f0f0f0;
}

.cookie-name-input :deep(.ant-input) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 12px;
  background: #fff;
}

:deep(.ant-input) {
  font-size: 12px;
  background: #fff;
}

:deep(.ant-checkbox-wrapper) {
  display: flex;
  align-items: center;
}

.delete-btn {
  font-size: 11px;
  padding: 0;
  height: 24px;
  min-width: 36px;
  opacity: 0.6;
}

.delete-btn:hover {
  opacity: 1;
  background: rgba(255, 77, 79, 0.08);
}

.add-btn {
  margin-top: 8px;
  font-size: 12px;
  height: 28px;
  border-style: dashed;
  border-color: #d9d9d9;
  color: #8c8c8c;
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}
</style>
