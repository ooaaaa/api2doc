import { computed } from 'vue'
import type { Ref } from 'vue'
import type { SwaggerSpec } from '../types'

/**
 * 标签节点接口
 * 用于表示多级目录结构
 */
export interface TagNode {
  key: string
  name: string
  fullPath: string
  level: number
  children: TagNode[]
  apis: any[]
  index?: number
}

/**
 * API解析组合式函数
 * 负责解析Swagger规范，生成API列表和分组
 */
export function useApiParser(swaggerSpec: Ref<SwaggerSpec | null>) {
  
  /**
   * 解析所有API接口
   */
  const allApis = computed(() => {
    if (!swaggerSpec.value) return []
    
    const apis: any[] = []
    const pathMethodsMap = new Map<string, Array<{method: string, operation: any}>>()
    
    // 第一步：收集每个路径的所有方法和操作
    Object.entries(swaggerSpec.value.paths).forEach(([path, pathItem]) => {
      const methods: Array<{method: string, operation: any}> = []
      Object.entries(pathItem as Record<string, any>).forEach(([method, operation]: [string, any]) => {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
          methods.push({ method, operation })
        }
      })
      if (methods.length > 0) {
        pathMethodsMap.set(path, methods)
      }
    })
    
    // 第二步：根据路径合并接口
    pathMethodsMap.forEach((methods, path) => {
      if (methods.length === 1) {
        // 单个方法，直接显示
        const { method, operation } = methods[0]
        apis.push({
          key: `${method}-${path}`,
          method: method.toUpperCase(),
          path,
          ...operation
        })
        return
      }
      
      // 多个方法，检查 summary 是否相同
      const summaries = methods.map(m => m.operation.summary)
      const allSameSummary = summaries.every(s => s === summaries[0])
      
      if (!allSameSummary) {
        // summary 不同，说明是不同的接口，分别显示
        methods.forEach(({ method, operation }) => {
          apis.push({
            key: `${method}-${path}`,
            method: method.toUpperCase(),
            path,
            ...operation
          })
        })
        return
      }
      
      // summary 相同，合并为一个接口，显示"多个"标签
      const firstOperation = methods[0].operation
      const methodList = methods.map(m => m.method.toUpperCase())
      
      apis.push({
        key: `multi-${path}`,
        method: 'MULTI',
        methodList, // 保存方法列表用于 tooltip
        path,
        ...firstOperation
      })
    })
    
    return apis
  })

  /**
   * 解析多级目录结构
   * 将 "一级/二级/三级" 格式的 tag 解析为树形结构
   */
  const parseNestedTags = (tags: string[]): TagNode[] => {
    const root: TagNode[] = []
    const nodeMap = new Map<string, TagNode>()

    // 收集所有唯一的 tag 路径，保持原始顺序
    const allPaths: string[] = []
    const pathSet = new Set<string>()
    
    tags.forEach(tag => {
      const parts = tag.split('/')
      let currentPath = ''
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        if (!pathSet.has(currentPath)) {
          pathSet.add(currentPath)
          allPaths.push(currentPath)
        }
      })
    })

    // 按路径深度排序，确保父节点先创建
    // 使用稳定排序，深度相同时保持原始顺序
    const sortedPaths = [...allPaths].sort((a, b) => {
      const aDepth = a.split('/').length
      const bDepth = b.split('/').length
      if (aDepth !== bDepth) {
        return aDepth - bDepth
      }
      // 深度相同时，保持原始顺序
      return allPaths.indexOf(a) - allPaths.indexOf(b)
    })

    // 构建树形结构
    sortedPaths.forEach(path => {
      const parts = path.split('/')
      const name = parts[parts.length - 1]
      const level = parts.length
      const parentPath = parts.slice(0, -1).join('/')

      const node: TagNode = {
        key: `tag-${path}`,
        name,
        fullPath: path,
        level,
        children: [],
        apis: []
      }

      nodeMap.set(path, node)

      if (parentPath && nodeMap.has(parentPath)) {
        // 添加到父节点
        nodeMap.get(parentPath)!.children.push(node)
      } else {
        // 顶级节点
        root.push(node)
      }
    })

    // 为顶级节点添加索引
    root.forEach((node, index) => {
      node.index = index + 1
    })

    return root
  }

  /**
   * 获取API分组标签（树形结构）
   */
  const apiTags = computed(() => {
    if (!swaggerSpec.value) return []
    
    // 优先使用 Swagger 规范中定义的 tags 顺序
    const definedTags = swaggerSpec.value.tags?.map((t: any) => t.name) || []
    
    // 收集所有 API 中实际使用的 tags（完整路径）
    const usedTagsSet = new Set<string>()
    allApis.value.forEach((api: any) => {
      if (api.tags && api.tags.length > 0) {
        api.tags.forEach((tag: string) => usedTagsSet.add(tag))
      }
    })
    
    const usedTags = Array.from(usedTagsSet)
    
    // 按照 Swagger 定义的顺序对实际使用的 tags 进行排序
    // 规则：根据 tag 的顶级路径在 definedTags 中的位置排序
    const orderedTags = usedTags.sort((a, b) => {
      // 获取顶级路径（第一个 / 之前的部分）
      const topA = a.split('/')[0]
      const topB = b.split('/')[0]
      
      // 在 definedTags 中查找位置
      const indexA = definedTags.indexOf(topA)
      const indexB = definedTags.indexOf(topB)
      
      // 如果都在定义中，按定义顺序排序
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      
      // 如果只有一个在定义中，定义的排在前面
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      
      // 都不在定义中，保持原顺序
      return 0
    })

    // 解析为树形结构
    const tagTree = parseNestedTags(orderedTags)

    // 为每个节点分配 API
    const assignApis = (node: TagNode) => {
      // 获取属于当前完整路径的 API
      node.apis = allApis.value.filter((api: any) => 
        api.tags?.some((tag: string) => tag === node.fullPath)
      ).map((api: any, index: number) => ({
        ...api,
        index: index + 1
      }))

      // 递归处理子节点
      node.children.forEach(child => assignApis(child))
    }

    tagTree.forEach(node => assignApis(node))

    return tagTree
  })

  /**
   * 根据标签路径获取API列表
   * @param tagPath 完整的标签路径，如 "一级/二级/三级"
   */
  const getApisByTag = (tagPath: string) => {
    const apis = allApis.value.filter((api: any) => 
      api.tags?.some((tag: string) => tag === tagPath)
    )
    return apis.map((api: any, index: number) => ({
      ...api,
      index: index + 1
    }))
  }

  /**
   * 获取HTTP方法对应的颜色
   */
  const getMethodColor = (_method: string) => {
    return 'green'
  }

  /**
   * 识别API接口类型
   * @param api API对象
   * @returns 接口类型：'websocket' | 'sse' | 'streamable' | 'http'
   */
  const detectApiType = (api: any): 'websocket' | 'sse' | 'streamable' | 'http' => {
    const path = api.path || ''
    const summary = api.summary || ''
    const description = api.description || ''
    const text = `${path} ${summary} ${description}`.toLowerCase()

    // WebSocket 接口检测
    if (path.includes('/ws') || 
        text.includes('websocket') || 
        text.includes('ws://') || 
        text.includes('wss://')) {
      return 'websocket'
    }

    // SSE 接口检测
    if (path.includes('/sse') || 
        text.includes('server-sent events') || 
        text.includes('server sent events') ||
        text.includes('event stream')) {
      return 'sse'
    }

    // HTTP Streamable 接口检测
    if (path.includes('/stream') || 
        path.includes('/streamable') ||
        text.includes('streamable') ||
        text.includes('流式传输') ||
        text.includes('stream')) {
      return 'streamable'
    }

    // 默认为普通 HTTP 接口
    return 'http'
  }

  return {
    allApis,
    apiTags,
    getApisByTag,
    getMethodColor,
    detectApiType
  }
}