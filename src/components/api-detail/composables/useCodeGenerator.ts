import { getExampleValue } from '../../../utils/example-utils'
import { buildCurlCommand } from '../../../utils/curl-generator'

// 代码生成器 composable
export function useCodeGenerator(
  api: any,
  baseUrl: string,
  buildExampleUrl: () => string,
  generateBodyExample: () => string,
  requestBodySchema: any,
  requestBodyContentType: string
) {
  // cURL 代码生成
  const generateCurl = () => {
    const url = buildExampleUrl()
    const headerParams = (api.parameters || []).filter((p: any) => p.in === 'header')

    return buildCurlCommand({
      url,
      method: api.method,
      summary: api.summary,
      headerParams,
      hasBody: !!requestBodySchema,
      contentType: requestBodyContentType,
      bodyExample: generateBodyExample(),
    })
  }

  // wget 代码生成
  const generateWget = () => {
    const url = buildExampleUrl()
    const method = api.method

    let cmd = `wget --method=${method}`

    const headerParams = (api.parameters || []).filter((p: any) => p.in === 'header')
    if (headerParams.length > 0) {
      headerParams.forEach((param: any) => {
        const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
        cmd += ` \\\n  --header='${param.name}: ${exampleValue}'`
      })
    }

    if (method !== 'GET' && requestBodySchema) {
      const contentType = requestBodyContentType
      const bodyExample = generateBodyExample()
      
      if (contentType === 'application/x-www-form-urlencoded') {
        try {
          const jsonData = JSON.parse(bodyExample)
          const formData = Object.entries(jsonData)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&')
          cmd += ` \\\n  --header='Content-Type: application/x-www-form-urlencoded' \\\n  --body-data='${formData}'`
        } catch (e) {
          cmd += ` \\\n  --header='Content-Type: application/x-www-form-urlencoded' \\\n  --body-data='${bodyExample}'`
        }
      } else if (contentType === 'application/json') {
        cmd += ` \\\n  --header='Content-Type: application/json' \\\n  --body-data='${bodyExample}'`
      } else {
        cmd += ` \\\n  --header='Content-Type: ${contentType}' \\\n  --body-data='${bodyExample}'`
      }
    }

    cmd += ` \\\n  -O- '${url}'`

    return cmd
  }

  // node-fetch 代码生成
  const generateNodeFetch = () => {
    const url = buildExampleUrl()
    const method = api.method

    let code = `// 安装: pnpm add node-fetch\nimport fetch from 'node-fetch';\n\n`
    code += `const url = '${url}';\n`

    const options: string[] = [`  method: '${method}'`]

    const headers: string[] = []
    const headerParams = (api.parameters || []).filter((p: any) => p.in === 'header')
    if (headerParams.length > 0) {
      headerParams.forEach((param: any) => {
        const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
        headers.push(`    '${param.name}': '${exampleValue}'`)
      })
    }

    if (method !== 'GET' && requestBodySchema) {
      const contentType = requestBodyContentType
      headers.push(`    'Content-Type': '${contentType}'`)
    }

    if (headers.length > 0) {
      options.push(`  headers: {\n${headers.join(',\n')}\n  }`)
    }

    if (method !== 'GET' && requestBodySchema) {
      const contentType = requestBodyContentType
      const bodyExample = generateBodyExample()
      
      if (contentType === 'application/x-www-form-urlencoded') {
        options.push(`  body: new URLSearchParams(${bodyExample}).toString()`)
      } else if (contentType === 'application/json') {
        options.push(`  body: JSON.stringify(${bodyExample})`)
      } else {
        options.push(`  body: ${bodyExample}`)
      }
    }

    code += `const options = {\n${options.join(',\n')}\n};\n\n`
    code += `fetch(url, options)\n`
    code += `  .then(res => res.json())\n`
    code += `  .then(data => console.log(data))\n`
    code += `  .catch(err => console.error('Error:', err));`

    return code
  }

  // Axios 代码生成
  const generateAxios = () => {
    const url = buildExampleUrl()
    const method = api.method.toLowerCase()

    let code = `// 安装: pnpm add axios\nimport axios from 'axios';\n\n`

    const config: string[] = [`  url: '${url}'`, `  method: '${method}'`]

    const headers: string[] = []
    const headerParams = (api.parameters || []).filter((p: any) => p.in === 'header')
    if (headerParams.length > 0) {
      headerParams.forEach((param: any) => {
        const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
        headers.push(`    '${param.name}': '${exampleValue}'`)
      })
    }

    if (headers.length > 0) {
      config.push(`  headers: {\n${headers.join(',\n')}\n  }`)
    }

    if (method !== 'get' && requestBodySchema) {
      const contentType = requestBodyContentType
      const bodyExample = generateBodyExample()
      
      if (contentType === 'application/x-www-form-urlencoded') {
        config.push(`  data: new URLSearchParams(${bodyExample})`)
      } else if (contentType === 'application/json') {
        config.push(`  data: ${bodyExample}`)
      } else {
        config.push(`  data: ${bodyExample}`)
      }
    }

    code += `axios({\n${config.join(',\n')}\n})\n`
    code += `  .then(response => console.log(response.data))\n`
    code += `  .catch(error => console.error('Error:', error));`

    return code
  }

  // jQuery 代码生成
  const generateJQuery = () => {
    const url = buildExampleUrl()
    const method = api.method

    let code = `// 确保已引入 jQuery\n$.ajax({\n`
    code += `  url: '${url}',\n`
    code += `  type: '${method}',\n`

    const headers: string[] = []
    const headerParams = (api.parameters || []).filter((p: any) => p.in === 'header')
    if (headerParams.length > 0) {
      headerParams.forEach((param: any) => {
        const exampleValue = String(getExampleValue(param.schema || { type: 'string' }))
        headers.push(`    '${param.name}': '${exampleValue}'`)
      })
    }

    if (headers.length > 0) {
      code += `  headers: {\n${headers.join(',\n')}\n  },\n`
    }

    if (method !== 'GET' && requestBodySchema) {
      const contentType = requestBodyContentType
      const bodyExample = generateBodyExample()
      
      code += `  contentType: '${contentType}',\n`
      
      if (contentType === 'application/x-www-form-urlencoded') {
        code += `  data: ${bodyExample},\n`
      } else if (contentType === 'application/json') {
        code += `  data: JSON.stringify(${bodyExample}),\n`
      } else {
        code += `  data: ${bodyExample},\n`
      }
    }

    code += `  success: function(data) {\n`
    code += `    console.log(data);\n`
    code += `  },\n`
    code += `  error: function(xhr, status, error) {\n`
    code += `    console.error('Error:', error);\n`
    code += `  }\n`
    code += `});`

    return code
  }

  return {
    generateCurl,
    generateWget,
    generateNodeFetch,
    generateAxios,
    generateJQuery
  }
}
