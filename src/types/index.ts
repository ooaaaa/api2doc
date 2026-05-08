export interface Api2DocOptions {
  swaggerUrl: string | string[] // 支持单个URL或多个URL数组
  path?: string
  title?: string
  theme?: 'light' | 'dark'
  primaryColor?: string
  showRequestExample?: boolean
  supportedLanguages?: string[]
}

export interface SwaggerSpec {
  openapi?: string
  swagger?: string
  info: {
    title: string
    version: string
    description?: string
    contact?: {
      name?: string
      email?: string
      url?: string
    }
    license?: {
      name?: string
      url?: string
    }
  }
  servers?: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  tags?: Array<{
    name: string
    description?: string
  }>
}

export interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  delete?: Operation
  patch?: Operation
  options?: Operation
  head?: Operation
}

export interface Operation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  security?: Array<Record<string, string[]>>
}

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema?: any
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, MediaType>
}

export interface MediaType {
  schema?: any
  example?: any
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
}
