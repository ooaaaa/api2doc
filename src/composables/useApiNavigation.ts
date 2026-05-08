import { ref } from 'vue'

/**
 * API导航管理组合式函数
 * 负责路由导航、选中状态管理
 */
export function useApiNavigation() {
  // 选中的API和菜单状态
  const selectedApi = ref<any>(null)
  const selectedKeys = ref<string[]>([])
  const openKeys = ref<string[]>([])

  /**
   * 生成友好的 URL 路径
   * 格式：分组名/接口名
   * 例如：用户管理/获取用户信息
   */
  const generateFriendlyUrl = (api: any): string => {
    // 获取分组名（使用第一个tag）
    const tagName = api.tags && api.tags.length > 0 ? api.tags[0] : 'default'
    
    // 生成接口名：优先使用summary，否则使用operationId，最后使用路径
    let apiName = api.summary || api.operationId || api.path
    
    // 如果接口名太长，进行智能截取
    if (apiName.length > 50) {
      apiName = apiName.substring(0, 50)
    }
    
    // URL编码，支持中文
    const encodedTag = encodeURIComponent(tagName)
    const encodedName = encodeURIComponent(apiName)
    
    // 格式：分组名/接口名
    return `${encodedTag}/${encodedName}`
  }

  /**
   * 从友好的 URL 解析出 API
   * 格式：分组名/接口名
   */
  const parseFriendlyUrl = (url: string, allApis: any[]): any | null => {
    // URL解码
    const decodedUrl = decodeURIComponent(url)
    const parts = decodedUrl.split('/')
    
    if (parts.length < 2) return null
    
    const tagName = parts[0]
    const apiName = parts.slice(1).join('/') // 支持多级路径
    
    // 在所有API中查找匹配的接口
    // 优先匹配：tag + summary
    let matchedApi = allApis.find(api => {
      const apiTag = api.tags && api.tags.length > 0 ? api.tags[0] : 'default'
      const apiSummary = api.summary || api.operationId || api.path
      return apiTag === tagName && apiSummary === apiName
    })
    
    // 如果没找到，尝试模糊匹配（处理截断的情况）
    if (!matchedApi) {
      matchedApi = allApis.find(api => {
        const apiTag = api.tags && api.tags.length > 0 ? api.tags[0] : 'default'
        const apiSummary = api.summary || api.operationId || api.path
        return apiTag === tagName && apiSummary.startsWith(apiName)
      })
    }
    
    return matchedApi || null
  }

  /**
   * 处理菜单点击
   */
  const handleMenuClick = ({ key }: { key: string }, allApis: any[]) => {
    selectedApi.value = allApis.find(api => api.key === key)
    if (selectedApi.value) {
      const friendlyUrl = generateFriendlyUrl(selectedApi.value)
      // 保留 URL 中的项目名称前缀（第一段）
      const hash = window.location.hash
      const path = hash.replace(/^#\//, '')
      const firstSegment = path.split('/')[0] || ''
      // 保留现有的 query 参数
      const queryIndex = hash.indexOf('?')
      const queryParams = queryIndex !== -1 ? hash.substring(queryIndex) : ''
      window.location.hash = `#/${firstSegment}/${friendlyUrl}${queryParams}`
    }
  }

  /**
   * 回到首页
   */
  const goToHome = () => {
    selectedApi.value = null
    selectedKeys.value = []
    // 保留 URL 中的项目名称前缀
    const hash = window.location.hash
    const path = hash.replace(/^#\//, '')
    const firstSegment = path.split('/')[0] || ''
    window.location.hash = firstSegment ? `#/${firstSegment}` : '#/'
  }

  /**
   * 从 URL hash 恢复选中的接口
   * URL 格式：#/项目名称/分组名/接口名
   */
  const restoreFromUrl = (allApis: any[]) => {
    const hash = window.location.hash
    if (!hash || hash === '#/' || hash === '#') {
      return
    }
    
    if (!allApis || allApis.length === 0) {
      return
    }
    
    // 移除开头的 #/ 和 query 参数
    let path = hash.replace(/^#\//, '')
    const queryIndex = path.indexOf('?')
    if (queryIndex !== -1) {
      path = path.substring(0, queryIndex)
    }

    // 跳过第一段（项目名称），剩余部分是 分组名/接口名
    const segments = path.split('/')
    if (segments.length < 2) {
      // 只有项目名称，没有接口路径
      return
    }
    const apiPath = segments.slice(1).join('/')
    
    // 尝试解析友好 URL 格式：分组名/接口名
    const api = parseFriendlyUrl(apiPath, allApis)
    if (api) {
      selectedApi.value = api
      selectedKeys.value = [api.key]
      if (api.tags && api.tags.length > 0) {
        openKeys.value = [`tag-${api.tags[0]}`]
      }
      return
    }
    
    // 兼容旧格式：method/path
    if (apiPath.includes('/') && !apiPath.includes('%')) {
      const parts = apiPath.split('/')
      if (parts.length >= 2) {
        const method = parts[0].toUpperCase()
        const oldApiPath = '/' + parts.slice(1).join('/').replace(/:([^/]+)/g, '{$1}')
        const key = method === 'MULTI' ? `multi-${oldApiPath}` : `${method.toLowerCase()}-${oldApiPath}`
        const oldApi = allApis.find(a => a.key === key)
        if (oldApi) {
          selectedApi.value = oldApi
          selectedKeys.value = [key]
          if (oldApi.tags && oldApi.tags.length > 0) {
            openKeys.value = [`tag-${oldApi.tags[0]}`]
          }
          return
        }
      }
    }
  }

  /**
   * 监听 URL hash 变化
   */
  const handleHashChange = (allApis: any[]) => {
    restoreFromUrl(allApis)
  }

  return {
    selectedApi,
    selectedKeys,
    openKeys,
    generateFriendlyUrl,
    parseFriendlyUrl,
    handleMenuClick,
    goToHome,
    restoreFromUrl,
    handleHashChange
  }
}