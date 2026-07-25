import { readonly, ref } from 'vue'

const STORAGE_KEY = 'api2doc:global-variables'

export interface GlobalVariable {
  key: string
  value: string
  enabled: boolean
}

interface NamedValue {
  name: string
  value: string
}

function loadVariables(): GlobalVariable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GlobalVariable[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(item => item && typeof item.key === 'string' && typeof item.value === 'string')
      .map(item => ({ key: item.key, value: item.value, enabled: item.enabled !== false }))
  } catch {
    return []
  }
}

const variables = ref<GlobalVariable[]>(loadVariables())

function findVariable(name: string, source: GlobalVariable[]): GlobalVariable | undefined {
  return source.find(item => item.enabled && item.key === name)
}

function findHeaderVariable(name: string, source: GlobalVariable[]): GlobalVariable | undefined {
  const expectedName = name.toLowerCase()
  return source.find(item => item.enabled && item.key.toLowerCase() === expectedName)
}

function applyVariables<T extends NamedValue>(
  parameters: T[],
  source: GlobalVariable[],
  finder: (name: string, variables: GlobalVariable[]) => GlobalVariable | undefined
): T[] {
  return parameters.map(parameter => {
    if (!parameter.name) return parameter
    const variable = finder(parameter.name, source)
    return variable ? { ...parameter, value: variable.value } : parameter
  })
}

export function applyGlobalVariables<T extends NamedValue>(parameters: T[], source: GlobalVariable[]): T[] {
  return applyVariables(parameters, source, findVariable)
}

export function applyGlobalHeaderVariables<T extends NamedValue>(parameters: T[], source: GlobalVariable[]): T[] {
  return applyVariables(parameters, source, findHeaderVariable)
}

export function useGlobalVariables() {
  const saveVariables = (nextVariables: GlobalVariable[]) => {
    variables.value = nextVariables.map(item => ({ ...item, key: item.key.trim() }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(variables.value))
  }

  return {
    variables: readonly(variables),
    saveVariables
  }
}
