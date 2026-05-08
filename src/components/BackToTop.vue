<template>
  <transition name="fade">
    <div 
      v-if="visible" 
      class="back-to-top"
      @click="scrollToTop"
      :title="`回到顶部 (${scrollPercentage}%)`"
    >
      <div class="percentage">{{ scrollPercentage }}%</div>
      <div class="arrow">↑</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  scrollContainer?: string
  visibilityHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  visibilityHeight: 200
})

const visible = ref(false)
const scrollPercentage = ref(0)
let targetElement: HTMLElement | null = null

// 计算滚动百分比
const calculateScrollPercentage = () => {
  if (!targetElement) return

  const scrollTop = targetElement.scrollTop
  const scrollHeight = targetElement.scrollHeight
  const clientHeight = targetElement.clientHeight

  const maxScroll = scrollHeight - clientHeight
  if (maxScroll <= 0) {
    scrollPercentage.value = 0
    visible.value = false
    return
  }

  const percentage = Math.round((scrollTop / maxScroll) * 100)
  scrollPercentage.value = Math.min(100, Math.max(0, percentage))
  visible.value = scrollTop > props.visibilityHeight
}

// 滚动到顶部
const scrollToTop = () => {
  if (!targetElement) return
  
  targetElement.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 处理滚动事件
const handleScroll = () => {
  calculateScrollPercentage()
}

// 查找滚动容器
const findScrollContainer = () => {
  if (!props.scrollContainer) {
    return Promise.resolve(window)
  }
  
  // 尝试多次查找，因为组件可能还没渲染完成
  let attempts = 0
  const maxAttempts = 30
  
  const tryFind = (): Promise<HTMLElement | Window> => {
    return new Promise((resolve) => {
      const check = () => {
        const el = document.querySelector(props.scrollContainer!)
        if (el) {
          console.log('BackToTop: 找到滚动容器', props.scrollContainer)
          resolve(el as HTMLElement)
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(check, 50)
        } else {
          console.warn('BackToTop: 未找到滚动容器，使用window', props.scrollContainer)
          resolve(window)
        }
      }
      check()
    })
  }
  
  return tryFind()
}

onMounted(async () => {
  // 查找目标元素
  const container = await findScrollContainer()
  
  if (container instanceof Window) {
    // 使用window滚动
    targetElement = document.documentElement
    window.addEventListener('scroll', handleScroll)
  } else {
    // 使用指定容器滚动
    targetElement = container
    targetElement.addEventListener('scroll', handleScroll)
  }
  
  // 初始计算
  calculateScrollPercentage()
})

onUnmounted(() => {
  if (targetElement) {
    targetElement.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 50px;
  height: 50px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
  transition: all 0.3s ease;
  z-index: 1000;
  color: #fff;
}

.back-to-top:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(66, 184, 131, 0.5);
}

.back-to-top:active {
  transform: translateY(-2px);
}

.percentage {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 2px;
}

.arrow {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
