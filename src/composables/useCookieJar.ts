/**
 * Cookie Jar 管理
 * 按域名存储 Cookie，自动过期清理，支持手动增删
 */

import { ref, computed } from 'vue'

export interface StoredCookie {
  name: string
  value: string
  domain: string
  path: string
  expires?: string  // ISO 时间字符串
  httpOnly: boolean
  secure: boolean
  sameSite?: string
  createdAt: string // ISO 时间字符串
}

const STORAGE_KEY = 'api2doc_cookie_jar'

// 全局单例状态
const cookies = ref<StoredCookie[]>(loadFromStorage())

function loadFromStorage(): StoredCookie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredCookie[]
  } catch {
    return []
  }
}

function saveToStorage(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cookies.value))
}

/**
 * 清理过期 Cookie
 */
function removeExpired(): void {
  const now = Date.now()
  const before = cookies.value.length
  cookies.value = cookies.value.filter(c => {
    if (!c.expires) return true
    return new Date(c.expires).getTime() > now
  })
  if (cookies.value.length !== before) {
    saveToStorage()
  }
}

/**
 * 从 Set-Cookie 响应头解析并存入 Jar
 */
function parseAndStore(setCookieHeader: string, requestUrl: string): StoredCookie[] {
  if (!setCookieHeader) return []

  let defaultDomain = ''
  try {
    defaultDomain = new URL(requestUrl).hostname
  } catch {
    defaultDomain = 'localhost'
  }

  const stored: StoredCookie[] = []
  // 按逗号分割，但要避免 expires 中的逗号
  const parts = setCookieHeader.split(/,(?=\s*\w+=)/)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const segments = trimmed.split(';').map(s => s.trim())
    const [nameValue, ...attrs] = segments
    const eqIndex = nameValue.indexOf('=')
    if (eqIndex === -1) continue

    const cookie: StoredCookie = {
      name: nameValue.substring(0, eqIndex),
      value: nameValue.substring(eqIndex + 1),
      domain: defaultDomain,
      path: '/',
      httpOnly: false,
      secure: false,
      createdAt: new Date().toISOString()
    }

    for (const attr of attrs) {
      const lower = attr.toLowerCase()
      if (lower === 'httponly') cookie.httpOnly = true
      else if (lower === 'secure') cookie.secure = true
      else if (lower.startsWith('domain=')) cookie.domain = attr.substring(7).replace(/^\./, '')
      else if (lower.startsWith('path=')) cookie.path = attr.substring(5)
      else if (lower.startsWith('expires=')) {
        try {
          cookie.expires = new Date(attr.substring(8)).toISOString()
        } catch { /* 忽略无效日期 */ }
      }
      else if (lower.startsWith('samesite=')) cookie.sameSite = attr.substring(9)
    }

    // 更新或新增
    const existIdx = cookies.value.findIndex(
      c => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path
    )
    if (existIdx >= 0) {
      cookies.value[existIdx] = cookie
    } else {
      cookies.value.push(cookie)
    }
    stored.push(cookie)
  }

  saveToStorage()
  return stored
}

/**
 * 获取匹配指定 URL 的 Cookie
 */
function getMatchingCookies(url: string): StoredCookie[] {
  removeExpired()

  let hostname = ''
  let pathname = '/'
  try {
    const urlObj = new URL(url)
    hostname = urlObj.hostname
    pathname = urlObj.pathname
  } catch {
    return []
  }

  return cookies.value.filter(c => {
    // 域名匹配：精确匹配或子域名匹配
    const domainMatch = hostname === c.domain || hostname.endsWith('.' + c.domain)
    // 路径匹配
    const pathMatch = pathname.startsWith(c.path)
    return domainMatch && pathMatch
  })
}

/**
 * 将匹配的 Cookie 拼接为请求头值
 */
function buildCookieHeader(url: string): string {
  const matched = getMatchingCookies(url)
  if (matched.length === 0) return ''
  return matched.map(c => `${c.name}=${c.value}`).join('; ')
}

/**
 * 手动添加 Cookie
 */
function addCookie(cookie: StoredCookie): void {
  const existIdx = cookies.value.findIndex(
    c => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path
  )
  if (existIdx >= 0) {
    cookies.value[existIdx] = cookie
  } else {
    cookies.value.push(cookie)
  }
  saveToStorage()
}

/**
 * 删除指定 Cookie
 */
function removeCookie(name: string, domain: string, path: string): void {
  cookies.value = cookies.value.filter(
    c => !(c.name === name && c.domain === domain && c.path === path)
  )
  saveToStorage()
}

/**
 * 按域名删除所有 Cookie
 */
function removeCookiesByDomain(domain: string): void {
  cookies.value = cookies.value.filter(c => c.domain !== domain)
  saveToStorage()
}

/**
 * 清空所有 Cookie
 */
function clearAll(): void {
  cookies.value = []
  saveToStorage()
}

/**
 * 按域名分组
 */
function groupedByDomain(): Record<string, StoredCookie[]> {
  removeExpired()
  const groups: Record<string, StoredCookie[]> = {}
  for (const c of cookies.value) {
    if (!groups[c.domain]) groups[c.domain] = []
    groups[c.domain].push(c)
  }
  return groups
}

export function useCookieJar() {
  removeExpired()

  const allCookies = computed(() => cookies.value)
  const cookieCount = computed(() => cookies.value.length)
  const domains = computed(() => [...new Set(cookies.value.map(c => c.domain))])

  return {
    allCookies,
    cookieCount,
    domains,
    parseAndStore,
    getMatchingCookies,
    buildCookieHeader,
    addCookie,
    removeCookie,
    removeCookiesByDomain,
    clearAll,
    groupedByDomain
  }
}
