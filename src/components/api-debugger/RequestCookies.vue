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

.jar-hint {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 10px 12px;
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
  color: #166534;
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
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dcfce7;
}

.jar-cookie-name {
  color: #166534;
  font-weight: 600;
}

.jar-cookie-eq {
  color: #6b7280;
}

.jar-cookie-value {
  color: #374151;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jar-cookie-domain {
  color: #9ca3af;
  font-size: 11px;
  margin-left: auto;
  flex-shrink: 0;
}

.manual-cookies {
  padding: 0;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: grid;
  grid-template-columns: 32px 180px 1fr 40px;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.param-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-primary-bg);
}

.cookie-name-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.cookie-name-input :deep(.ant-input) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
}

.delete-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 40px;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.1);
}

.add-btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-bg);
}
</style>
