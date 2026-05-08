import { ref } from 'vue'
import type { Ref } from 'vue'

export interface WebSocketState {
  instance: Ref<WebSocket | null>
  connected: Ref<boolean>
  messageCount: Ref<number>
  silentClose: Ref<boolean>
}

export function useWebSocket() {
  const instance = ref<WebSocket | null>(null)
  const connected = ref(false)
  const messageCount = ref(0)
  const silentClose = ref(false)

  const connect = (url: string, callbacks: {
    onOpen?: () => void
    onMessage?: (event: MessageEvent) => void
    onError?: () => void
    onClose?: (event: CloseEvent) => void
  }) => {
    instance.value = new WebSocket(url)

    instance.value.onopen = () => {
      connected.value = true
      messageCount.value = 0
      callbacks.onOpen?.()
    }

    instance.value.onmessage = (event: MessageEvent) => {
      callbacks.onMessage?.(event)
    }

    instance.value.onerror = () => {
      callbacks.onError?.()
    }

    instance.value.onclose = (event: CloseEvent) => {
      connected.value = false
      if (!silentClose.value) {
        callbacks.onClose?.(event)
      }
      silentClose.value = false
    }
  }

  const send = (message: string) => {
    if (instance.value && connected.value) {
      instance.value.send(message)
      messageCount.value++
      return true
    }
    return false
  }

  const close = (silent = false) => {
    if (instance.value) {
      silentClose.value = silent
      instance.value.close()
      instance.value = null
      connected.value = false
    }
  }

  return {
    instance,
    connected,
    messageCount,
    silentClose,
    connect,
    send,
    close
  }
}
