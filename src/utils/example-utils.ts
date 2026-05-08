/**
 * 示例值生成工具函数
 */

/**
 * 获取示例值
 * 优先级: example > default > enum > format > type
 */
export function getExampleValue(schema: any): any {
  // 如果传入的是字符串类型（兼容旧代码），转换为schema对象
  if (typeof schema === 'string') {
    schema = { type: schema }
  }
  
  // 优先级1: 使用 example 值（OpenAPI 3.0）
  if (schema?.example !== undefined) {
    return schema.example
  }
  
  // 优先级2: 使用 default 值
  if (schema?.default !== undefined) {
    return schema.default
  }
  
  // 优先级3: 使用 enum 的第一个值
  if (schema?.enum && schema.enum.length > 0) {
    return schema.enum[0]
  }
  
  // 优先级4: 根据 format 返回精确示例值
  const format = schema?.format
  if (format === 'date') return '2024-01-01'
  if (format === 'date-time') return '2024-01-01T12:00:00Z'
  if (format === 'email') return 'example@example.com'
  if (format === 'uri' || format === 'url') return 'https://example.com'
  
  // 优先级5: 根据类型返回固定示例值
  const type = schema?.type || 'string'
  const typeDefaults: Record<string, any> = {
    string: 'string',
    number: 0,
    integer: 0,
    boolean: true,
    array: [],
    object: {}
  }
  
  return typeDefaults[type] ?? 'value'
}

/**
 * 递归生成示例对象（从树形结构）
 * @param schema 树形结构的 schema 数组
 */
export function generateExampleFromTree(schema: any[]): any {
  const obj: any = {}

  schema.forEach(item => {
    let value: any

    if (item.children && item.children.length > 0) {
      // 有子节点，递归生成
      value = generateExampleFromTree(item.children)
    } else {
      // 使用完整的 schema 生成示例值
      if (item.type.startsWith('array')) {
        // 数组类型：获取数组元素的 schema
        const itemSchema = item.schema?.items || { type: item.type.replace(/array<(.+)>/, '$1') }
        value = [getExampleValue(itemSchema)]
      } else {
        // 使用完整的 schema（包含 example、default、enum 等）
        value = getExampleValue(item.schema || { type: item.type })
      }
    }

    obj[item.name] = value
  })

  return obj
}

/**
 * 递归生成示例对象（从原始 schema 对象）
 * @param schemaObj OpenAPI schema 对象
 */
export function generateExampleFromSchema(schemaObj: any): any {
  if (!schemaObj.properties) {
    return {}
  }

  const obj: any = {}
  const properties = schemaObj.properties
  
  Object.keys(properties).forEach(key => {
    const prop = properties[key]
    let value: any

    if (prop.type === 'object' && prop.properties) {
      // 嵌套对象
      value = generateExampleFromSchema(prop)
    } else if (prop.type === 'array' && prop.items) {
      // 数组类型
      if (prop.items.properties) {
        value = [generateExampleFromSchema(prop.items)]
      } else {
        value = [getExampleValue(prop.items)]
      }
    } else {
      // 基本类型
      value = getExampleValue(prop)
    }

    obj[key] = value
  })

  return obj
}
