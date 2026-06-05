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
   */
  const tryFetchFromUrl = async (url: string): Promise<SwaggerSpec | null> => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const spec = await response.json() as SwaggerSpec
      
      // 验证是否是有效的Swagger/OpenAPI文档
      if (!spec.paths || (!spec.openapi && !spec.swagger)) {
        throw new Error('无效的Swagger/OpenAPI文档格式')
      }
      
      return spec
    } catch {
      return null
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
      
      // 依次尝试每个URL
      for (const url of urls) {
        const spec = await tryFetchFromUrl(url)
        
        if (spec) {
          swaggerSpec.value = spec
          actualUrl.value = url
          return
        }
      }
      
      // 所有URL都失败
      throw new Error(
        urls.length > 1
          ? `无法从以下地址加载文档:\n${urls.join('\n')}`
          : `无法加载文档: ${urls[0]}`
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