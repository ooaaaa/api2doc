import { ref } from 'vue'
import type { Ref } from 'vue'
import { generateRequestHeaders } from '../../../utils/request-headers'

export interface HttpRequestState {
  testing: Ref<boolean>
  abortController: Ref<AbortController | null>
}

export interface SendRequestOptions {
  url: string
  method: string
  headers: Record<string, string>
  body?: any
  interfaceType?: 'http' | 'websocket' | 'sse' | 'streamable'
  contentType?: string
}

export function useHttpRequest() {
  const testing = ref(false)
  const abortController = ref<AbortController | null>(null)

  const sendRequest = async (
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    interfaceType: 'http' | 'websocket' | 'sse' | 'streamable' = 'http',
    contentType?: string
  ) => {
    testing.value = true
    abortController.value = new AbortController()

    // 记录请求开始时间
    const startTime = Date.now()
    const startDate = new Date()

    // 生成完整的请求头（包含协议必备字段）
    const completeHeaders = generateRequestHeaders({
      method,
      url,
      interfaceType,
      contentType,
      customHeaders: headers
    })

    try {
      const response = await fetch(url, {
        method,
        headers: completeHeaders,
        body,
        signal: abortController.value.signal,
        credentials: 'include'
      })

      // 记录请求结束时间
      const endTime = Date.now()
      const endDate = new Date()
      const duration = endTime - startTime

      return {
        ok: response.ok,
        status: response.status,
        headers: response.headers,
        response,
        timing: {
          startTime: startDate,
          endTime: endDate,
          duration
        },
        requestHeaders: completeHeaders
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('REQUEST_ABORTED')
      }
      throw error
    } finally {
      testing.value = false
      abortController.value = null
    }
  }

  const abort = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      testing.value = false
    }
  }

  return {
    testing,
    abortController,
    sendRequest,
    abort
  }
}
