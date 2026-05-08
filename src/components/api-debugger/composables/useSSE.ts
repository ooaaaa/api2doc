import { ref } from 'vue'
import type { Ref } from 'vue'

export interface SSEState {
  instance: Ref<EventSource | null>
  connected: Ref<boolean>
}

export function useSSE() {
  const instance = ref<EventSource | null>(null)
  const connected = ref(false)

  const connect = (url: string, callbacks: {
    onMessage?: (event: MessageEvent) => void
    onError?: () => void
  }) => {
    // 如果已经有连接，先关闭
    if (instance.value) {
      close()
    }

    try {
      instance.value = new EventSource(url)
      
      instance.value.onopen = () => {
        connected.value = true
      }

      instance.value.onmessage = (event: MessageEvent) => {
        callbacks.onMessage?.(event)
      }

      instance.value.onerror = (event) => {
        console.log('SSE错误事件:', event)
        console.log('SSE连接状态:', instance.value?.readyState)
        
        // 处理所有错误状态
        if (instance.value) {
          const readyState = instance.value.readyState
          
          // EventSource.CLOSED = 2, EventSource.CONNECTING = 0, EventSource.OPEN = 1
          if (readyState === EventSource.CLOSED) {
            // 连接已关闭
            connected.value = false
            callbacks.onError?.()
          } else if (readyState === EventSource.CONNECTING) {
            // 连接中断，正在重连
            console.log('SSE正在重连...')
          }
        }
      }
    } catch (error) {
      console.error('创建SSE连接失败:', error)
      connected.value = false
      callbacks.onError?.()
    }
  }

  const close = (silent = false) => {
    console.log('关闭SSE连接, silent:', silent)
    
    if (instance.value) {
      try {
        // 先设置状态为false，避免状态不同步
        connected.value = false
        
        // 移除所有事件监听器，防止关闭后还触发事件
        instance.value.onopen = null
        instance.value.onmessage = null
        instance.value.onerror = null
        
        // 关闭连接
        instance.value.close()
        
        console.log('SSE连接已关闭，状态:', instance.value.readyState)
      } catch (error) {
        console.error('关闭SSE连接时出错:', error)
      } finally {
        // 确保清理引用
        instance.value = null
        connected.value = false
      }
    }
  }

  return {
    instance,
    connected,
    connect,
    close
  }
}
