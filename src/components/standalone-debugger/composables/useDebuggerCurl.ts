/**
 * 调试器 cURL 导入/导出逻辑
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { parseCurl } from '../../../utils/curl-parser'
import type { DebuggerParameter } from '../../api-debugger/composables/useApiToParams'
import type { UseCookieJarReturn } from '../../../composables/useCookieJar'

interface CurlContext {
  currentMethod: { value: string }
  editableUrl: { value: string }
  requestUrl: { value: string }
  queryParameters: { value: DebuggerParameter[] }
  headerParameters: { value: DebuggerParameter[] }
  bodyContent: { value: string }
  activeBodyTab: { value: 'json' | 'form' | 'xml' | 'text' }
  expandedSections: { value: Record<string, boolean> }
  cookieParameters: { value: { name: string; value: string; enabled: boolean }[] }
  cookieAutoInject: { value: boolean }
  cookieJar: UseCookieJarReturn
  formFields: { value: { name: string; value: string; type: string; enabled: boolean }[] }
  isApiMode: boolean
  getComputedUrl: () => string
  getContentType: () => string | undefined
}

export function useDebuggerCurl(ctx: CurlContext) {
  const curlImportVisible = ref(false)
  const curlImportText = ref('')

  const openCurlImport = () => {
    curlImportText.value = ''
    curlImportVisible.value = true
  }

  const handleCurlImport = () => {
    const text = curlImportText.value.trim()
    if (!text) { message.warning('请粘贴 cURL 命令'); return }

    try {
      const parsed = parseCurl(text)
      ctx.currentMethod.value = parsed.method

      if (ctx.isApiMode) {
        ctx.editableUrl.value = parsed.url
      } else {
        ctx.requestUrl.value = parsed.url
        ctx.editableUrl.value = parsed.url
      }

      if (parsed.queryParams.length > 0) {
        ctx.queryParameters.value = parsed.queryParams.map(p => ({ name: p.name, value: p.value, enabled: true }))
        ctx.expandedSections.value.query = true
      }

      if (parsed.headers.length > 0) {
        ctx.headerParameters.value = parsed.headers.map(h => ({ name: h.name, value: h.value, enabled: true }))
        ctx.expandedSections.value.headers = true
      }

      if (parsed.body) {
        ctx.bodyContent.value = parsed.body
        ctx.activeBodyTab.value = parsed.bodyFormat
        ctx.expandedSections.value.body = true
      }

      curlImportVisible.value = false
      message.success('cURL 导入成功')
    } catch {
      message.error('cURL 解析失败，请检查格式')
    }
  }

  const copyAsCurl = async () => {
    const url = ctx.getComputedUrl().trim()
    if (!url) { message.warning('请先填写请求 URL'); return }

    let cmd = `curl -X ${ctx.currentMethod.value} '${url}'`

    // 请求头
    const enabledHeaders = ctx.headerParameters.value.filter(h => h.enabled && h.name && h.value)
    enabledHeaders.forEach(h => { cmd += ` \\\n  -H '${h.name}: ${h.value}'` })

    // Cookie
    const cookieParts: string[] = []
    if (ctx.cookieAutoInject.value) {
      const jarHeader = ctx.cookieJar.buildCookieHeader(url)
      if (jarHeader) cookieParts.push(jarHeader)
    }
    const manualCookies = ctx.cookieParameters.value
      .filter(c => c.enabled && c.name && c.value)
      .map(c => `${c.name}=${c.value}`)
    cookieParts.push(...manualCookies)
    if (cookieParts.length > 0) cmd += ` \\\n  -b '${cookieParts.join('; ')}'`

    // 请求体
    if (!['GET', 'HEAD', 'OPTIONS'].includes(ctx.currentMethod.value)) {
      const ct = ctx.getContentType()
      if (ct) cmd += ` \\\n  -H 'Content-Type: ${ct}'`

      if (ctx.activeBodyTab.value === 'form') {
        const enabledFields = ctx.formFields.value.filter(f => f.enabled && f.name && f.type === 'text')
        if (enabledFields.length > 0) {
          const formData = enabledFields.map(f => `${encodeURIComponent(f.name)}=${encodeURIComponent(f.value)}`).join('&')
          cmd += ` \\\n  -d '${formData}'`
        }
      } else if (ctx.bodyContent.value) {
        let bodyStr = ctx.bodyContent.value
        if (ctx.activeBodyTab.value === 'json') {
          try { bodyStr = JSON.stringify(JSON.parse(bodyStr)) } catch { /* 保持原样 */ }
        }
        cmd += ` \\\n  -d '${bodyStr}'`
      }
    }

    try {
      await navigator.clipboard.writeText(cmd)
      message.success('cURL 已复制到剪贴板')
    } catch {
      message.error('复制失败')
    }
  }

  return {
    curlImportVisible,
    curlImportText,
    openCurlImport,
    handleCurlImport,
    copyAsCurl
  }
}
