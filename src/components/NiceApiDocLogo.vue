<template>
  <div class="api2doc-logo" :class="{ 'logo-small': small }">
    <svg 
      :width="size" 
      :height="size" 
      viewBox="0 0 32 32" 
      xmlns="http://www.w3.org/2000/svg"
      class="logo-svg"
    >
      <!-- 圆角方形背景 -->
      <rect x="2" y="2" width="28" height="28" rx="6" ry="6" fill="var(--color-primary, #10b981)" />
      <!-- 左尖括号 -->
      <path 
        d="M 12 10 L 8 16 L 12 22" 
        fill="none" 
        stroke="#fff" 
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- 右尖括号 -->
      <path 
        d="M 20 10 L 24 16 L 20 22" 
        fill="none" 
        stroke="#fff" 
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- 中间斜杠 -->
      <line 
        x1="14.5" y1="21" 
        x2="17.5" y2="11" 
        stroke="#fff" 
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.85"
      />
    </svg>
    
    <span v-if="showText" class="logo-text">api2doc</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number
  small?: boolean
  showText?: boolean
}>(), {
  size: 32,
  small: false,
  showText: true
})
</script>

<style scoped>
.api2doc-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  user-select: none;
}

.logo-small {
  gap: 6px;
}

.logo-svg {
  display: block;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #1a1e1b);
  letter-spacing: -0.5px;
  line-height: 1;
}

.logo-small .logo-text {
  font-size: 15px;
}
</style>
