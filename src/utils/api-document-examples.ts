import type { ApiDocument } from './document-download'
import type { MediaType, SwaggerSpec } from '../types'
import { getExampleValue } from './example-utils'
import { buildCurlCommand } from './curl-generator'

type SchemaMap = NonNullable<SwaggerSpec['components']>['schemas']

interface OpenApiSchema {
  $ref?: string
  type?: string
  format?: string
  example?: JsonValue
  default?: JsonValue
  enum?: JsonValue[]
  properties?: Record<string, OpenApiSchema>
  items?: OpenApiSchema
  allOf?: OpenApiSchema[]
  oneOf?: OpenApiSchema[]
  anyOf?: OpenApiSchema[]
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export interface ContentExample {
  contentType: string
  value: JsonValue
}

export interface ResponseExample extends ContentExample {
  status: string
}

export function getRequestExamples(api: ApiDocument, schemas?: SchemaMap): ContentExample[] {
  return Object.entries(api.requestBody?.content || {}).map(([contentType, media]) => ({
    contentType,
    value: getMediaExample(media, schemas),
  }))
}

export function getResponseExamples(api: ApiDocument, schemas?: SchemaMap): ResponseExample[] {
  return Object.entries(api.responses || {}).flatMap(([status, response]) =>
    Object.entries(response.content || {}).map(([contentType, media]) => ({
      status,
      contentType,
      value: getMediaExample(media, schemas),
    })),
  )
}

export function getParameterExample(parameter: NonNullable<ApiDocument['parameters']>[number], schemas?: SchemaMap): JsonValue {
  const parameterWithExample = parameter as typeof parameter & { example?: JsonValue; default?: JsonValue }
  return parameterWithExample.example
    ?? parameterWithExample.default
    ?? generateSchemaExample(parameter.schema, schemas)
}

export function buildApiCurl(api: ApiDocument, baseUrl: string, schemas?: SchemaMap): string {
  const method = api.method === 'MULTI' ? api.methodList?.[0] || 'GET' : api.method || 'GET'
  const requestExample = getRequestExamples(api, schemas)[0]
  const headerParams = (api.parameters || []).filter(parameter => parameter.in === 'header')

  return buildCurlCommand({
    url: buildExampleUrl(api, baseUrl, schemas),
    method,
    summary: api.summary,
    headerParams,
    hasBody: !!requestExample,
    contentType: requestExample?.contentType || 'application/json',
    bodyExample: JSON.stringify(requestExample?.value || {}, null, 2),
  })
}
function getMediaExample(media: MediaType, schemas?: SchemaMap): JsonValue {
  if (media.example !== undefined) return media.example as JsonValue
  return generateSchemaExample(media.schema, schemas)
}

function generateSchemaExample(schemaValue: OpenApiSchema | undefined, schemas?: SchemaMap, visited = new Set<string>()): JsonValue {
  if (!schemaValue) return {}
  const schema = resolveSchema(schemaValue, schemas, visited)

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]

  if (schema.allOf?.length) {
    return schema.allOf.reduce<{ [key: string]: JsonValue }>((result, item) => {
      const value = generateSchemaExample(item, schemas, new Set(visited))
      return isJsonObject(value) ? { ...result, ...value } : result
    }, {})
  }

  const alternative = schema.oneOf?.[0] || schema.anyOf?.[0]
  if (alternative) return generateSchemaExample(alternative, schemas, new Set(visited))

  if (schema.type === 'array' || schema.items) {
    return [generateSchemaExample(schema.items, schemas, new Set(visited))]
  }

  if (schema.type === 'object' || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties || {}).map(([name, property]) => [
        name,
        generateSchemaExample(property, schemas, new Set(visited)),
      ]),
    )
  }

  return getExampleValue(schema) as JsonValue
}

function resolveSchema(schema: OpenApiSchema, schemas?: SchemaMap, visited = new Set<string>()): OpenApiSchema {
  if (!schema.$ref) return schema
  const refName = schema.$ref.split('/').pop()
  if (!refName || visited.has(refName)) return schema
  const referencedSchema = schemas?.[refName] as OpenApiSchema | undefined
  if (!referencedSchema) return schema
  visited.add(refName)
  return resolveSchema(referencedSchema, schemas, visited)
}

function buildExampleUrl(api: ApiDocument, baseUrl: string, schemas?: SchemaMap): string {
  let url = `${baseUrl}${api.path}`
  const parameters = api.parameters || []

  parameters.filter(parameter => parameter.in === 'path').forEach(parameter => {
    url = url.replace(`{${parameter.name}}`, encodeURIComponent(String(getParameterExample(parameter, schemas))))
  })

  const query = parameters
    .filter(parameter => parameter.in === 'query')
    .map(parameter => `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(getParameterExample(parameter, schemas)))}`)
    .join('&')

  return query ? `${url}?${query}` : url
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
