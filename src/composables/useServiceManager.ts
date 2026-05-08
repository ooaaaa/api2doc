import { ref, computed } from 'vue'
import type { ServiceConfig } from '../config'
import { getProxyUrl, localServiceStore } from '../config'

/**
 * 服务管理组合式函数
 * 纯 localStorage 存储，支持导入导出
 * URL 格式：#/项目名称/分组名/接口名
 */
export function useServiceManager() {
  const services = ref<ServiceConfig[]>([])
  const activeServiceId = ref<string | null>(null)
  const loading = ref(true)
  const isProxyMode = ref(false)

  // 当前选中的服务
  const activeService = computed(() => {
    if (!activeServiceId.value) return null
    return services.value.find(s => s.id === activeServiceId.value) || null
  })

  // 当前应该使用的 swagger URL
  const currentSwaggerUrl = computed(() => {
    if (!activeService.value) return null
    const url = activeService.value.url
    // 本地路径不需要代理
    if (url.startsWith('/')) return url
    if (isProxyMode.value) {
      return getProxyUrl(url)
    }
    return url
  })

  /** 从 URL hash 中提取项目名称 */
  function getServiceNameFromUrl(): string | null {
    const hash = window.location.hash
    if (!hash || hash === '#/' || hash === '#') return null
    // 格式：#/项目名称 或 #/项目名称/分组/接口
    const path = hash.replace(/^#\//, '')
    if (!path) return null
    const firstSegment = path.split('/')[0]
    return firstSegment ? decodeURIComponent(firstSegment) : null
  }

  /** 更新 URL 中的项目名称前缀 */
  function updateUrlWithServiceName(serviceName: string) {
    const hash = window.location.hash
    const encodedName = encodeURIComponent(serviceName)

    // 如果当前 hash 已经有内容，替换项目名称部分
    if (hash && hash !== '#/' && hash !== '#') {
      const path = hash.replace(/^#\//, '')
      const segments = path.split('/')
      // 检查第一段是否是旧的项目名称
      const oldFirstSegment = segments[0]
      const oldService = services.value.find(s => encodeURIComponent(s.name) === oldFirstSegment)
      if (oldService) {
        // 替换项目名称
        segments[0] = encodedName
        window.history.replaceState(null, '', `#/${segments.join('/')}`)
      } else {
        // 没有匹配的旧项目名，直接设置
        window.history.replaceState(null, '', `#/${encodedName}`)
      }
    } else {
      window.history.replaceState(null, '', `#/${encodedName}`)
    }
  }

  /** 检测是否运行在本地代理模式 */
  async function detectProxy(): Promise<boolean> {
    try {
      const resp = await fetch('/api/services', { method: 'GET' })
      return resp.ok
    } catch {
      return false
    }
  }

  /** 初始化 */
  async function init() {
    loading.value = true
    try {
      isProxyMode.value = await detectProxy()
      services.value = localServiceStore.getAll()

      // 无服务时直接返回，由 UI 引导用户添加
      if (services.value.length === 0) {
        return
      }

      // 优先从 URL 恢复项目选择
      const urlServiceName = getServiceNameFromUrl()
      if (urlServiceName) {
        const matched = services.value.find(s => s.name === urlServiceName)
        if (matched) {
          activeServiceId.value = matched.id
          localServiceStore.setActiveId(matched.id)
          return
        }
      }

      // 其次从 localStorage 恢复
      const savedId = localServiceStore.getActiveId()
      if (savedId && services.value.some(s => s.id === savedId)) {
        activeServiceId.value = savedId
      } else if (services.value.length > 0) {
        activeServiceId.value = services.value[0].id
      }

      // 更新 URL
      if (activeService.value) {
        updateUrlWithServiceName(activeService.value.name)
      }
    } finally {
      loading.value = false
    }
  }

  /** 添加服务 */
  function addService(data: { name: string; url: string }) {
    const service: ServiceConfig = {
      id: crypto.randomUUID(),
      name: data.name,
      url: data.url,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    services.value.push(service)
    localServiceStore.save(services.value)
    return service
  }

  /** 更新服务 */
  function updateService(id: string, data: { name?: string; url?: string }) {
    const index = services.value.findIndex(s => s.id === id)
    if (index === -1) return
    if (data.name !== undefined) services.value[index].name = data.name
    if (data.url !== undefined) services.value[index].url = data.url
    services.value[index].updatedAt = Date.now()
    localServiceStore.save(services.value)
    // 如果修改的是当前选中的服务名称，更新 URL
    if (id === activeServiceId.value && data.name) {
      updateUrlWithServiceName(data.name)
    }
  }

  /** 删除服务 */
  function removeService(id: string) {
    services.value = services.value.filter(s => s.id !== id)
    localServiceStore.save(services.value)
    if (activeServiceId.value === id) {
      activeServiceId.value = services.value[0]?.id || null
      localServiceStore.setActiveId(activeServiceId.value)
      if (activeService.value) {
        updateUrlWithServiceName(activeService.value.name)
      }
    }
  }

  /** 切换当前服务 */
  function switchService(id: string) {
    activeServiceId.value = id
    localServiceStore.setActiveId(id)
    const service = services.value.find(s => s.id === id)
    if (service) {
      // 切换项目时重置 URL 为项目名称
      window.history.replaceState(null, '', `#/${encodeURIComponent(service.name)}`)
    }
  }

  /** 生成校验码 */
  function generateChecksum(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /** 导出配置 - 直接导出 localStorage 原始数据并附带校验码 */
  function exportConfig(): string {
    const raw = localStorage.getItem('api2doc:services') || '[]'
    const activeId = localStorage.getItem('api2doc:active-service') || ''
    const payload = JSON.stringify({ services: raw, activeServiceId: activeId })
    const checksum = generateChecksum(payload)
    const data = {
      checksum,
      services: raw,
      activeServiceId: activeId,
    }
    return JSON.stringify(data, null, 2)
  }

  /** 导入配置 - 先校验校验码，通过后直接写入 localStorage */
  function importConfig(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr)
      if (!data.checksum || !data.services) {
        return { success: false, message: '无效的配置格式：缺少校验信息' }
      }

      // 校验码验证
      const payload = JSON.stringify({ services: data.services, activeServiceId: data.activeServiceId || '' })
      const expectedChecksum = generateChecksum(payload)
      if (data.checksum !== expectedChecksum) {
        return { success: false, message: '校验码不匹配，文件可能被篡改' }
      }

      // 校验通过，解析并写入 localStorage
      const parsed = JSON.parse(data.services)
      if (!Array.isArray(parsed)) {
        return { success: false, message: '无效的配置格式：services 不是数组' }
      }

      localStorage.setItem('api2doc:services', data.services)
      if (data.activeServiceId) {
        localStorage.setItem('api2doc:active-service', data.activeServiceId)
      }

      // 同步到内存状态
      services.value = parsed
      if (data.activeServiceId && services.value.some(s => s.id === data.activeServiceId)) {
        activeServiceId.value = data.activeServiceId
      } else if (services.value.length > 0) {
        activeServiceId.value = services.value[0].id
      }
      localServiceStore.setActiveId(activeServiceId.value)

      if (activeService.value) {
        updateUrlWithServiceName(activeService.value.name)
      }

      return { success: true, message: `导入成功，共 ${services.value.length} 个服务` }
    } catch {
      return { success: false, message: '无效的 JSON 格式' }
    }
  }

  return {
    services,
    activeServiceId,
    activeService,
    currentSwaggerUrl,
    isProxyMode,
    loading,
    init,
    addService,
    updateService,
    removeService,
    switchService,
    exportConfig,
    importConfig,
  }
}
