import type { Operation, PathItem, SwaggerSpec } from '../types'
import {
  buildApiCurl,
  getParameterExample,
  getRequestExamples,
  getResponseExamples,
  type JsonValue,
} from './api-document-examples'

export type DocumentFormat = 'pdf' | 'word' | 'markdown' | 'json'
export interface DocumentExportProgress {
  current: number
  total: number
}
export type DocumentExportProgressHandler = (progress: DocumentExportProgress) => void

type SchemaMap = NonNullable<SwaggerSpec['components']>['schemas']

export interface ApiDocument extends Operation {
  key: string
  method: string
  methodList?: string[]
  path: string
}

export interface ApiDocumentGroup {
  key: string
  name: string
  fullPath: string
  level: number
  children: ApiDocumentGroup[]
  apis: ApiDocument[]
}

interface DocumentInfo {
  title: string
  version?: string
  description?: string
}

interface PdfPosition {
  y: number
  hasContent: boolean
}

const DOCUMENT_STYLES = `
  .pdf-document { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: #1f2937; font-size: 13px; line-height: 1.6; }
  .pdf-document h1 { color: #111827; font-size: 24px; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
  .pdf-document h2 { color: #111827; font-size: 19px; margin-top: 26px; }
  .pdf-document h3 { color: #1f2937; font-size: 16px; margin-top: 22px; }
  .pdf-document h4, .pdf-document h5, .pdf-document h6 { color: #374151; font-size: 14px; margin-top: 18px; }
  .pdf-document .document-cover, .pdf-document .group-heading, .pdf-document .api-section { box-sizing: border-box; width: 100%; background: #fff; }
  .pdf-document .document-cover { padding-bottom: 20px; }
  .pdf-document .group-heading { padding: 10px 0 4px; border-bottom: 1px solid #d1fae5; }
  .pdf-document .api-section { padding: 8px 0 14px; }
  .pdf-document .document-meta, .pdf-document .api-meta { color: #6b7280; margin-bottom: 14px; }
  .pdf-document .description { padding: 8px 12px; background: #f9fafb; border-left: 3px solid #10b981; }
  .pdf-document code { font-family: Menlo, Consolas, monospace; background: #f3f4f6; padding: 2px 5px; border-radius: 3px; }
  .pdf-document pre { padding: 10px; background: #f8fafc; border: 1px solid #e5e7eb; white-space: pre-wrap; word-break: break-word; }
  .pdf-document table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
  .pdf-document th, .pdf-document td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
  .pdf-document th { background: #f3f4f6; font-weight: 600; }
`

export async function downloadAllDocuments(
  format: DocumentFormat,
  groups: ApiDocumentGroup[],
  info: DocumentInfo,
  baseUrl: string,
  swaggerSpec: SwaggerSpec,
  onProgress?: DocumentExportProgressHandler,
): Promise<void> {
  const filename = sanitizeFilename(info.title || 'API文档')
  if (format === 'json') {
    downloadText(JSON.stringify(swaggerSpec, null, 2), `${filename}.json`, 'application/json;charset=utf-8')
    return
  }

  const schemas = swaggerSpec.components?.schemas
  if (format === 'markdown') {
    downloadText(generateMarkdown(groups, info, baseUrl, schemas), `${filename}.md`, 'text/markdown;charset=utf-8')
    return
  }

  const html = generateHtml(groups, info, baseUrl, schemas)
  if (format === 'word') {
    downloadText(`\ufeff${html}`, `${filename}.doc`, 'application/msword;charset=utf-8')
    return
  }

  await downloadHtmlAsPdf(html, `${filename}.pdf`, onProgress)
}
export async function downloadApiDocument(
  format: DocumentFormat,
  api: ApiDocument,
  info: DocumentInfo,
  baseUrl: string,
  schemas?: SchemaMap,
  onProgress?: DocumentExportProgressHandler,
): Promise<void> {
  const swaggerSpec = createSingleApiSpec(api, info, baseUrl, schemas)
  const singleGroup: ApiDocumentGroup = {
    key: 'single-api',
    name: '',
    fullPath: '',
    level: 0,
    children: [],
    apis: [api],
  }
  await downloadAllDocuments(format, [singleGroup], info, baseUrl, swaggerSpec, onProgress)
}

export async function downloadHtmlAsPdf(
  html: string,
  filename: string,
  onProgress?: DocumentExportProgressHandler,
): Promise<void> {
  onProgress?.({ current: 0, total: 0 })
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  const parsedDocument = new DOMParser().parseFromString(html, 'text/html')
  const host = document.createElement('div')
  host.className = 'pdf-document'
  host.style.cssText = 'position:fixed;top:0;left:0;z-index:-2147483647;width:794px;padding:32px;background:#fff;pointer-events:none;'
  host.innerHTML = `<style>${DOCUMENT_STYLES}</style>${parsedDocument.body.innerHTML}`
  document.body.appendChild(host)

  try {
    await document.fonts?.ready
    await nextFrame()
    await nextFrame()

    const blocks = Array.from(host.querySelectorAll<HTMLElement>('.pdf-block'))
    if (blocks.length === 0) throw new Error('PDF 文档没有可渲染内容')

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const position: PdfPosition = { y: 10, hasContent: false }
    onProgress?.({ current: 0, total: blocks.length })

    for (const [index, block] of blocks.entries()) {
      const canvas = await html2canvas(block, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      })
      if (canvas.width === 0 || canvas.height === 0) throw new Error('PDF 内容渲染失败')
      appendCanvasToPdf(pdf, canvas, position)
      onProgress?.({ current: index + 1, total: blocks.length })
    }

    if (!position.hasContent) throw new Error('PDF 文档内容为空')
    pdf.save(sanitizeFilename(filename))
  } finally {
    host.remove()
  }
}

function appendCanvasToPdf(pdf: InstanceType<typeof import('jspdf').jsPDF>, canvas: HTMLCanvasElement, position: PdfPosition): void {
  const margin = 10
  const pageWidth = 210
  const pageHeight = 297
  const contentWidth = pageWidth - margin * 2
  const contentBottom = pageHeight - margin
  const mmPerPixel = contentWidth / canvas.width
  const fullHeight = canvas.height * mmPerPixel

  if (fullHeight <= contentBottom - margin && position.y + fullHeight > contentBottom) {
    pdf.addPage()
    position.y = margin
  }

  let sourceY = 0
  while (sourceY < canvas.height) {
    if (position.y >= contentBottom - 1) {
      pdf.addPage()
      position.y = margin
    }
    const remainingHeightMm = contentBottom - position.y
    const sliceHeight = Math.min(canvas.height - sourceY, Math.floor(remainingHeightMm / mmPerPixel))
    if (sliceHeight <= 0) continue

    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = sliceHeight
    const context = slice.getContext('2d')
    if (!context) throw new Error('无法创建 PDF 画布')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, slice.width, slice.height)
    context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

    const renderedHeight = sliceHeight * mmPerPixel
    pdf.addImage(slice.toDataURL('image/jpeg', 0.94), 'JPEG', margin, position.y, contentWidth, renderedHeight)
    position.y += renderedHeight + 2
    position.hasContent = true
    sourceY += sliceHeight
  }
}

function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}
function generateMarkdown(groups: ApiDocumentGroup[], info: DocumentInfo, baseUrl: string, schemas?: SchemaMap): string {
  const header = [
    `# ${info.title || 'API 文档'}`,
    info.version ? `- **版本**: ${info.version}` : '',
    info.description ? `\n${info.description}` : '',
  ].filter(Boolean).join('\n\n')

  const content = groups.map((group, index) =>
    generateGroupMarkdown(group, `${index + 1}`, 2, baseUrl, schemas),
  ).join('\n')
  return `${header}\n\n${content}`
}

function generateGroupMarkdown(
  group: ApiDocumentGroup,
  code: string,
  headingLevel: number,
  baseUrl: string,
  schemas?: SchemaMap,
): string {
  if (!group.name) return group.apis.map((api, index) => generateApiMarkdown(api, `${index + 1}`, 2, baseUrl, schemas)).join('\n---\n\n')

  let markdown = `${markdownHeading(headingLevel)} ${code}. ${group.name}\n\n`
  markdown += group.apis.map((api, index) =>
    generateApiMarkdown(api, `${code}.${index + 1}`, headingLevel + 1, baseUrl, schemas),
  ).join('\n')

  markdown += group.children.map((child, index) =>
    generateGroupMarkdown(child, `${code}.${group.apis.length + index + 1}`, headingLevel + 1, baseUrl, schemas),
  ).join('\n')
  return markdown
}

function generateApiMarkdown(
  api: ApiDocument,
  code: string,
  headingLevel: number,
  baseUrl: string,
  schemas?: SchemaMap,
): string {
  const heading = markdownHeading(headingLevel)
  const subheading = markdownHeading(headingLevel + 1)
  let markdown = `${heading} ${code}. ${api.summary || api.path}\n\n`
  markdown += `- **请求方式**: \`${getMethod(api)}\`\n`
  markdown += `- **请求地址**: \`${baseUrl}${api.path}\`\n\n`
  if (api.description) markdown += `${subheading} 接口描述\n\n${api.description}\n\n`

  if (api.parameters?.length) {
    markdown += `${subheading} 请求参数\n\n| 名称 | 位置 | 类型 | 必填 | 示例 | 描述 |\n| --- | --- | --- | --- | --- | --- |\n`
    markdown += api.parameters.map(parameter =>
      `| ${escapeMarkdown(parameter.name)} | ${parameter.in} | ${escapeMarkdown(getSchemaType(parameter.schema))} | ${parameter.required ? '是' : '否'} | ${escapeMarkdown(formatInlineValue(getParameterExample(parameter, schemas)))} | ${escapeMarkdown(parameter.description || '-')} |`,
    ).join('\n')
    markdown += '\n\n'
  }

  const requestExamples = getRequestExamples(api, schemas)
  if (requestExamples.length) {
    markdown += `${subheading} 请求示例\n\n`
    requestExamples.forEach(example => {
      markdown += `**${example.contentType}**\n\n\`\`\`json\n${formatJson(example.value)}\n\`\`\`\n\n`
    })
  }

  markdown += `${subheading} 响应\n\n| 状态码 | 描述 |\n| --- | --- |\n`
  markdown += Object.entries(api.responses || {}).map(([status, response]) =>
    `| ${status} | ${escapeMarkdown(response.description || '-')} |`,
  ).join('\n')
  markdown += '\n\n'
  const responseExamples = getResponseExamples(api, schemas)
  if (responseExamples.length) {
    markdown += `${subheading} 响应示例\n\n`
    responseExamples.forEach(example => {
      markdown += `**${example.status} · ${example.contentType}**\n\n\`\`\`json\n${formatJson(example.value)}\n\`\`\`\n\n`
    })
  }

  markdown += `${subheading} cURL 示例\n\n\`\`\`bash\n${buildApiCurl(api, baseUrl, schemas)}\n\`\`\`\n\n`
  return markdown
}

function generateHtml(groups: ApiDocumentGroup[], info: DocumentInfo, baseUrl: string, schemas?: SchemaMap): string {
  const sections = groups.map((group, index) =>
    generateGroupHtml(group, `${index + 1}`, 2, baseUrl, schemas),
  ).join('')
  return `<html><head><meta charset="utf-8"><style>${DOCUMENT_STYLES}</style></head><body class="pdf-document">
    <section class="document-cover pdf-block">
      <h1>${escapeHtml(info.title || 'API 文档')}</h1>
      <div class="document-meta">${info.version ? `版本：${escapeHtml(info.version)}` : ''}</div>
      ${info.description ? `<p class="description">${escapeHtml(info.description)}</p>` : ''}
    </section>
    ${sections}
  </body></html>`
}

function generateGroupHtml(
  group: ApiDocumentGroup,
  code: string,
  headingLevel: number,
  baseUrl: string,
  schemas?: SchemaMap,
): string {
  if (!group.name) return group.apis.map((api, index) => generateApiHtml(api, `${index + 1}`, 2, baseUrl, schemas)).join('')

  const groupHeading = htmlHeading(headingLevel, `${code}. ${group.name}`)
  const apis = group.apis.map((api, index) =>
    generateApiHtml(api, `${code}.${index + 1}`, headingLevel + 1, baseUrl, schemas),
  ).join('')
  const children = group.children.map((child, index) =>
    generateGroupHtml(child, `${code}.${group.apis.length + index + 1}`, headingLevel + 1, baseUrl, schemas),
  ).join('')
  return `<section class="group-heading pdf-block">${groupHeading}</section>${apis}${children}`
}

function generateApiHtml(
  api: ApiDocument,
  code: string,
  headingLevel: number,
  baseUrl: string,
  schemas?: SchemaMap,
): string {
  const parameters = api.parameters?.length
    ? `<h4>请求参数</h4><table><thead><tr><th>名称</th><th>位置</th><th>类型</th><th>必填</th><th>示例</th><th>描述</th></tr></thead><tbody>${api.parameters.map(parameter =>
      `<tr><td>${escapeHtml(parameter.name)}</td><td>${parameter.in}</td><td>${escapeHtml(getSchemaType(parameter.schema))}</td><td>${parameter.required ? '是' : '否'}</td><td>${escapeHtml(formatInlineValue(getParameterExample(parameter, schemas)))}</td><td>${escapeHtml(parameter.description || '-')}</td></tr>`,
    ).join('')}</tbody></table>`
    : ''

  const requestExamples = getRequestExamples(api, schemas).map(example =>
    `<h4>请求示例 · ${escapeHtml(example.contentType)}</h4><pre>${escapeHtml(formatJson(example.value))}</pre>`,
  ).join('')
  const responseRows = Object.entries(api.responses || {}).map(([status, response]) =>
    `<tr><td>${escapeHtml(status)}</td><td>${escapeHtml(response.description || '-')}</td></tr>`,
  ).join('')
  const responseExamples = getResponseExamples(api, schemas).map(example =>
    `<h4>响应示例 · ${escapeHtml(example.status)} · ${escapeHtml(example.contentType)}</h4><pre>${escapeHtml(formatJson(example.value))}</pre>`,
  ).join('')

  return `<section class="api-section pdf-block">
    ${htmlHeading(headingLevel, `${code}. ${api.summary || api.path}`)}
    <div class="api-meta"><strong>${escapeHtml(getMethod(api))}</strong> <code>${escapeHtml(`${baseUrl}${api.path}`)}</code></div>
    ${api.description ? `<p class="description">${escapeHtml(api.description)}</p>` : ''}
    ${parameters}
    ${requestExamples}
    <h4>响应</h4>
    <table><thead><tr><th>状态码</th><th>描述</th></tr></thead><tbody>${responseRows}</tbody></table>
    ${responseExamples}
    <h4>cURL 示例</h4><pre>${escapeHtml(buildApiCurl(api, baseUrl, schemas))}</pre>
  </section>`
}
function createSingleApiSpec(
  api: ApiDocument,
  info: DocumentInfo,
  baseUrl: string,
  schemas?: SchemaMap,
): SwaggerSpec {
  const { key: _key, method: _method, methodList: _methodList, path: _path, ...operation } = api
  const pathItem: PathItem = {}
  const methods = api.method === 'MULTI' ? api.methodList || [] : [api.method]
  methods.forEach(method => assignOperation(pathItem, method, operation))

  return {
    openapi: '3.0.0',
    info: {
      title: info.title,
      version: info.version || '1.0.0',
      description: info.description,
    },
    servers: baseUrl ? [{ url: baseUrl }] : undefined,
    paths: { [api.path]: pathItem },
    components: schemas ? { schemas } : undefined,
  }
}

function assignOperation(pathItem: PathItem, method: string, operation: Operation): void {
  switch (method.toLowerCase()) {
    case 'get': pathItem.get = operation; break
    case 'post': pathItem.post = operation; break
    case 'put': pathItem.put = operation; break
    case 'delete': pathItem.delete = operation; break
    case 'patch': pathItem.patch = operation; break
    case 'options': pathItem.options = operation; break
    case 'head': pathItem.head = operation; break
  }
}

function getMethod(api: ApiDocument): string {
  return api.method === 'MULTI' ? api.methodList?.join('/') || 'MULTI' : api.method || 'GET'
}

function getSchemaType(schema: { type?: string; format?: string; $ref?: string; items?: { type?: string } } | undefined): string {
  if (!schema) return '-'
  if (schema.$ref) return schema.$ref.split('/').pop() || 'object'
  if (schema.type === 'array') return `array<${schema.items?.type || 'object'}>`
  return [schema.type, schema.format].filter(Boolean).join(' / ') || 'object'
}

function markdownHeading(level: number): string {
  return '#'.repeat(Math.min(Math.max(level, 1), 6))
}

function htmlHeading(level: number, text: string): string {
  const safeLevel = Math.min(Math.max(level, 1), 6)
  return `<h${safeLevel}>${escapeHtml(text)}</h${safeLevel}>`
}

function formatJson(value: JsonValue): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function formatInlineValue(value: JsonValue): string {
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return String(value)
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '_').trim() || 'API文档'
}

function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
