import { ref } from 'vue'

/**
 * API搜索功能组合式函数
 * 负责搜索过滤逻辑
 */
export function useApiSearch() {
  // 搜索关键词
  const searchText = ref('')

  /**
   * 搜索匹配函数 - 支持接口名称、描述、路径、目录搜索
   */
  const matchesSearch = (api: any, searchValue: string) => {
    if (!searchValue) return true
    const lowerSearch = searchValue.toLowerCase()
    return (
      api.path?.toLowerCase().includes(lowerSearch) ||
      api.summary?.toLowerCase().includes(lowerSearch) ||
      api.description?.toLowerCase().includes(lowerSearch) ||
      api.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearch))
    )
  }

  /**
   * 递归过滤树形标签结构
   */
  const filterTagTree = (node: any, allApis: any[]): any | null => {
    // 检查当前节点的 API 是否匹配
    const matchingApis = node.apis?.filter((api: any) => matchesSearch(api, searchText.value)) || []
    
    // 递归过滤子节点
    const filteredChildren = node.children
      ?.map((child: any) => filterTagTree(child, allApis))
      .filter((child: any) => child !== null) || []
    
    // 如果当前节点有匹配的 API 或有匹配的子节点，则保留
    if (matchingApis.length > 0 || filteredChildren.length > 0) {
      return {
        ...node,
        apis: matchingApis,
        children: filteredChildren
      }
    }
    
    return null
  }

  /**
   * 过滤API标签（支持树形结构）
   */
  const getFilteredTags = (tags: any[], allApis: any[]) => {
    if (!searchText.value) return tags
    
    // 递归过滤树形结构
    return tags
      .map(tag => filterTagTree(tag, allApis))
      .filter(tag => tag !== null)
  }

  /**
   * 过滤API列表
   */
  const getFilteredApis = (apis: any[]) => {
    return apis.filter(api => matchesSearch(api, searchText.value))
  }

  /**
   * 搜索结果统计
   */
  const getSearchResultCount = (allApis: any[]) => {
    if (!searchText.value) return 0
    return allApis.filter(api => matchesSearch(api, searchText.value)).length
  }

  return {
    searchText,
    matchesSearch,
    getFilteredTags,
    getFilteredApis,
    getSearchResultCount
  }
}