import { ref, computed } from 'vue'
import type { SwaggerSpec } from '../types'

/**
 * Swagger数据管理组合式函数
 * 负责加载、缓存和管理Swagger规范数据
 * 支持单个URL或多个URL自动探测
 */
export function useSwaggerData(swaggerUrl: string | string[]) {
  // 响应式状态
  const loading = ref(true)
  const error = ref('')
  const swaggerSpec = ref<SwaggerSpec | null>(null)
  const actualUrl = ref('') // 记录实际成功的URL

  /**
   * 从代理 URL 中提取实际的文档地址
   * 例如：/proxy?url=http%3A%2F%2Flocalhost%3A3010%2Fapi-docs -> http://localhost:3010/api-docs
   */
  const extractRealUrl = (url: string): string => {
    try {
      // 检查是否是代理 URL 格式
      if (url.includes('/proxy?url=')) {
        const urlObj = new URL(url, window.location.origin)
        const realUrl = urlObj.searchParams.get('url')
        if (realUrl) {
          return decodeURIComponent(realUrl)
        }
      }
      return url
    } catch {
      return url
    }
  }

  // 计算属性 - API基本信息
  const apiInfo = computed(() => ({
    title: swaggerSpec.value?.info.title || 'API 文档',
    version: swaggerSpec.value?.info.version || '',
    description: swaggerSpec.value?.info.description || ''
  }))

  // 计算属性 - 服务器基础URL
  const baseUrl = computed(() => {
    return swaggerSpec.value?.servers?.[0]?.url || ''
  })

  // 计算属性 - 检查是否有项目详细信息
  const hasProjectDetails = computed(() => {
    if (!swaggerSpec.value?.info) return false
    const info = swaggerSpec.value.info
    return !!(
      info.contact?.name ||
      info.contact?.email ||
      info.contact?.url ||
      info.license?.name ||
      baseUrl.value
    )
  })

  /**
   * 尝试从单个URL加载数据
   * 返回成功的 spec 或失败的错误信息
   */
  const tryFetchFromUrl = async (url: string): Promise<{ spec: SwaggerSpec } | { error: string }> => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      const spec = await response.json() as SwaggerSpec
      
      // 验证是否是有效的Swagger/OpenAPI文档
      if (!spec.paths || (!spec.openapi && !spec.swagger)) {
        return { error: '无效的Swagger/OpenAPI文档格式' }
      }
      
      return { spec }
    } catch (e: any) {
      return { error: e.message || '网络请求失败' }
    }
  }

  /**
   * 加载Swagger规范数据
   * 支持单个URL或多个URL自动探测
   */
  const loadSwaggerSpec = async () => {
    loading.value = true
    error.value = ''
    actualUrl.value = ''
    
    try {
      const urls = Array.isArray(swaggerUrl) ? swaggerUrl : [swaggerUrl]
      const errors: string[] = []
      
      // 依次尝试每个URL
      for (const url of urls) {
        const result = await tryFetchFromUrl(url)
        
        if ('spec' in result) {
          swaggerSpec.value = result.spec
          actualUrl.value = url
          return
        }
        
        // 提取实际的文档地址用于错误提示
        const displayUrl = extractRealUrl(url)
        errors.push(`${displayUrl} — ${result.error}`)
      }
      
      // 所有URL都失败，附带原始错误信息
      throw new Error(
        urls.length > 1
          ? `无法从以下地址加载文档:\n${errors.join('\n')}`
          : `无法加载文档: ${extractRealUrl(urls[0])}\n${errors[0]?.split(' — ')[1] || ''}`
      )
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    loading,
    error,
    swaggerSpec,
    actualUrl, // 实际成功的URL
    
    // 计算属性
    apiInfo,
    baseUrl,
    hasProjectDetails,
    
    // 方法
    loadSwaggerSpec
  }
}