/**
 * API 文档导出工具
 * 基于页面 DOM 直接导出，所见即所得
 */

import { buildCurlCommand } from './curl-generator'

/** Word 文档的 HTML 壳子 */
const WORD_HTML_HEADER = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
    h1 { font-size: 22px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 20px; }
    h3 { font-size: 14px; margin-top: 16px; color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 12px; }
    th { background: #f9fafb; font-weight: 600; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; }
    pre { background: #f8f9fa; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
    pre code { background: none; padding: 0; }
    .section-title { font-size: 13px; font-weight: 600; margin: 16px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .description-text { color: #555; padding: 8px 12px; background: #f9fafb; border-left: 2px solid #10b981; font-size: 13px; }
    .api-path { font-family: Consolas, monospace; font-size: 13px; background: #f9fafb; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 4px; }
    .method-tag-large { font-size: 11px; font-weight: 600; padding: 2px 10px; background: rgba(16,185,129,0.1); color: #10b981; border-radius: 4px; }
  </style>
</head>
<body>`

const WORD_HTML_FOOTER = `</body></html>`

/**
 * 从页面 DOM 中抓取文档 Tab 内容并导出为 Word
 */
export function downloadCurrentApiAsWord(title: string): void {
  const docHtml = captureDocTabHtml()
  if (!docHtml) return

  const html = `${WORD_HTML_HEADER}${docHtml}${WORD_HTML_FOOTER}`
  downloadBlob(html, `${title || '接口文档'}.doc`)
}

/**
 * 从页面 DOM 中抓取文档 Tab 内容并生成 Markdown
 */
export function copyCurrentApiAsMarkdown(api: any, baseUrl: string): string {
  // Markdown 仍然用结构化方式生成（DOM 转 Markdown 太复杂且不精确）
  // 但我们直接从页面可见的表格数据提取
  return generateMarkdownFromDom(api, baseUrl)
}

/**
 * 抓取文档 Tab 的 HTML 内容
 * 克隆 DOM 并清理交互元素
 */
function captureDocTabHtml(): string | null {
  // 找到当前文档 Tab 的内容面板
  const tabPane = document.querySelector('.main-tabs-top .ant-tabs-tabpane-active')
  if (!tabPane) return null

  // 克隆节点
  const clone = tabPane.cloneNode(true) as HTMLElement

  // 移除交互元素：按钮、link 类操作、导出按钮
  clone.querySelectorAll('.section-actions, .copy-path-btn, .copy-btn, .ant-btn, .doc-action-link, .action-divider').forEach(el => el.remove())

  // 展开所有折叠的示例区域（如果有隐藏的）
  clone.querySelectorAll('.example-section').forEach(el => {
    ;(el as HTMLElement).style.display = 'block'
  })

  // 将 .section-title 转换为 h2 标签，让 Word 能识别为目录项
  clone.querySelectorAll('.section-title').forEach(el => {
    const h2 = document.createElement('h2')
    // 只取第一个 span 的文本（标题文字），忽略操作按钮
    const titleSpan = el.querySelector('span')
    h2.textContent = titleSpan?.textContent?.trim() || el.textContent?.trim() || ''
    el.replaceWith(h2)
  })

  // 将 .api-summary (h2) 转为 h1 作为文档主标题
  clone.querySelectorAll('.api-summary').forEach(el => {
    const h1 = document.createElement('h1')
    h1.textContent = el.textContent?.trim() || ''
    el.replaceWith(h1)
  })

  // 移除 CodeMirror 编辑器的多余 DOM，保留纯文本
  clone.querySelectorAll('.cm-editor').forEach(editor => {
    const content = editor.querySelector('.cm-content')
    if (content) {
      // 从每个 .cm-line 中提取文本并用换行连接
      const lines = content.querySelectorAll('.cm-line')
      let text = ''
      if (lines.length > 0) {
        text = Array.from(lines).map(line => line.textContent || '').join('\n')
      } else {
        text = content.textContent || ''
      }
      // 尝试格式化 JSON
      try {
        const parsed = JSON.parse(text)
        text = JSON.stringify(parsed, null, 2)
      } catch { /* 非 JSON 保持原样 */ }

      const pre = document.createElement('pre')
      const code = document.createElement('code')
      code.textContent = text
      pre.appendChild(code)
      editor.replaceWith(pre)
    } else {
      editor.remove()
    }
  })

  // 移除 data-v-xxx scoped 属性（Word 不需要）
  const allElements = clone.querySelectorAll('*')
  allElements.forEach(el => {
    const attrs = Array.from(el.attributes)
    attrs.forEach(attr => {
      if (attr.name.startsWith('data-v-')) {
        el.removeAttribute(attr.name)
      }
    })
  })

  // 内联关键计算样式（处理 CSS 变量）
  inlineComputedStyles(clone)

  return clone.innerHTML
}

/**
 * 内联关键样式，确保 Word 中能正确显示
 */
function inlineComputedStyles(container: HTMLElement): void {
  // 表格样式
  container.querySelectorAll('table').forEach(table => {
    table.setAttribute('border', '1')
    table.setAttribute('cellpadding', '6')
    table.setAttribute('cellspacing', '0')
    table.style.borderCollapse = 'collapse'
    table.style.width = '100%'
    table.style.fontSize = '12px'
  })

  container.querySelectorAll('th').forEach(th => {
    th.style.background = '#f9fafb'
    th.style.fontWeight = '600'
    th.style.padding = '6px 10px'
    th.style.border = '1px solid #d1d5db'
    th.style.textAlign = 'left'
  })

  container.querySelectorAll('td').forEach(td => {
    td.style.padding = '6px 10px'
    td.style.border = '1px solid #d1d5db'
    td.style.textAlign = 'left'
  })
}

/**
 * 触发文件下载
 */
function downloadBlob(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ==================== Markdown 生成 ====================

/**
 * 从 DOM 中的表格提取数据生成 Markdown
 * 直接读取页面上已渲染的表格内容，确保和页面一致
 */
function generateMarkdownFromDom(api: any, baseUrl: string): string {
  let md = ''

  // 标题和基本信息
  md += `# ${api.summary || '接口文档'}\n\n`
  const method = api.method === 'MULTI' ? api.methodList?.join('/') || 'MULTI' : (api.method || 'GET')
  md += `- **请求方式**: \`${method}\`\n`
  md += `- **请求路径**: \`${api.path}\`\n\n`

  if (api.description) {
    md += `## 接口描述\n\n${api.description}\n\n`
  }

  // 从页面 DOM 中提取所有参数表格
  const tabPane = document.querySelector('.main-tabs-top .ant-tabs-tabpane-active')
  if (tabPane) {
    // 找到所有 parameter-table 区块
    const sections = tabPane.querySelectorAll('.parameter-table')
    sections.forEach(section => {
      const titleEl = section.querySelector('.section-title > span')
      const title = titleEl?.textContent?.trim() || ''
      const table = section.querySelector('table')

      if (title && table) {
        md += `## ${title}\n\n`
        md += tableToMarkdown(table)
        md += '\n'
      }

      // 提取示例代码块
      const exampleSection = section.querySelector('.example-section')
      if (exampleSection) {
        const codeContent = exampleSection.querySelector('.cm-content, pre code, code') as HTMLElement | null
        if (codeContent) {
          const rawText = codeContent.innerText?.trim() || codeContent.textContent?.trim() || ''
          if (rawText) {
            md += `### 示例\n\n\`\`\`json\n${formatJson(rawText)}\n\`\`\`\n\n`
          }
        }
      }
    })
  }

  // cURL 示例
  const curlMethod = api.method === 'MULTI' ? (api.methodList?.[0] || 'GET') : (api.method || 'GET')
  const headerParams = (api.parameters || [])
    .filter((p: any) => p.in === 'header')
    .map((p: any) => ({ name: p.name, schema: p.schema }))

  // 判断是否有请求体
  const hasBody = !!api.requestBody?.content
  let contentType = 'application/json'
  let bodyExample = '{}'
  if (hasBody) {
    const content = api.requestBody.content
    contentType = Object.keys(content)[0] || 'application/json'
    // 从页面 DOM 中获取请求体示例
    const bodyExampleEl = document.querySelector('.parameter-table .example-section .cm-content') as HTMLElement | null
    if (bodyExampleEl) {
      const rawText = bodyExampleEl.innerText?.trim() || bodyExampleEl.textContent?.trim() || ''
      if (rawText) {
        bodyExample = formatJson(rawText)
      }
    }
  }

  const curl = buildCurlCommand({
    url: `${baseUrl}${api.path}`,
    method: curlMethod,
    summary: api.summary,
    headerParams,
    hasBody,
    contentType,
    bodyExample,
  })

  md += `## cURL 示例\n\n\`\`\`bash\n${curl}\n\`\`\`\n\n`

  return md
}

/**
 * 将 HTML table 转换为 Markdown 表格
 */
function tableToMarkdown(table: Element): string {
  const rows = table.querySelectorAll('tr')
  if (rows.length === 0) return ''

  let md = ''
  const headerRow = rows[0]
  const headerCells = headerRow.querySelectorAll('th')

  if (headerCells.length > 0) {
    // 表头
    const headers = Array.from(headerCells).map(cell => cell.textContent?.trim() || '')
    md += `| ${headers.join(' | ')} |\n`
    md += `| ${headers.map(() => '---').join(' | ')} |\n`
  }

  // 数据行
  for (let i = headerCells.length > 0 ? 1 : 0; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td')
    if (cells.length > 0) {
      const values = Array.from(cells).map(cell => {
        // 处理展开按钮等内联元素，只取文本
        return cell.textContent?.trim().replace(/\n/g, ' ') || '-'
      })
      md += `| ${values.join(' | ')} |\n`
    }
  }

  return md
}

/**
 * 格式化 JSON 字符串（如果是合法 JSON 则美化，否则原样返回）
 */
function formatJson(text: string): string {
  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return text
  }
}

/**
 * HTML 文本转义
 */
function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
