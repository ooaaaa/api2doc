import { ref, computed, onUnmounted } from 'vue'

/**
 * 侧边栏管理组合式函数
 * 负责侧边栏的展开/收起、拖拽调整宽度等功能
 */
export function useSidebar() {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  const sidebarWidth = ref(260)
  const isResizing = ref(false)

  // 拖拽相关变量
  let rafId: number | null = null

  /**
   * 切换侧边栏展开/收起
   */
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  /**
   * 开始拖拽调整宽度
   */
  const startResize = (e: MouseEvent) => {
    isResizing.value = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    e.preventDefault()
  }

  /**
   * 处理拖拽调整（性能优化版）
   */
  const handleResize = (e: MouseEvent) => {
    if (!isResizing.value) return
    
    // 使用 requestAnimationFrame 优化性能
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    
    rafId = requestAnimationFrame(() => {
      const newWidth = e.clientX
      if (newWidth >= 200 && newWidth <= 380) {
        sidebarWidth.value = newWidth
      }
    })
  }

  /**
   * 停止拖拽调整
   */
  const stopResize = () => {
    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // 组件卸载时清理事件监听
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
  })

  return {
    // 状态
    sidebarCollapsed,
    sidebarWidth,
    isResizing,
    
    // 方法
    toggleSidebar,
    startResize
  }
}