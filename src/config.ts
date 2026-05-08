/**
 * 应用配置
 * 
 * 运行模式：
 * - CLI 模式 (npx api2doc): 通过本地代理获取数据，支持多服务管理
 * - 直连模式 (纯静态部署): 直接 fetch 远端 URL，需要后端配置 CORS
 */

export interface ServiceConfig {
  id: string
  name: string
  url: string
  createdAt: number
  updatedAt: number
}

/**
 * 判断是否运行在 CLI 代理模式下
 * CLI 模式下 /api/services 接口可用
 */
export async function detectProxyMode(): Promise<boolean> {
  try {
    const resp = await fetch('/api/services', { method: 'GET' })
    return resp.ok
  } catch {
    return false
  }
}

/**
 * 通过代理获取 swagger 数据的 URL
 */
export function getProxyUrl(targetUrl: string): string {
  return `/proxy?url=${encodeURIComponent(targetUrl)}`
}

// localStorage keys
const STORAGE_KEYS = {
  SERVICES: 'api2doc:services',
  ACTIVE_SERVICE: 'api2doc:active-service',
} as const

/**
 * 本地存储的服务管理（纯前端模式 fallback）
 */
export const localServiceStore = {
  getAll(): ServiceConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERVICES)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  save(services: ServiceConfig[]) {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services))
  },

  getActiveId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SERVICE)
  },

  setActiveId(id: string | null) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SERVICE, id)
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SERVICE)
    }
  },
}

/**
 * 默认配置
 */
export const defaultConfig = {
  title: 'api2doc',
}
