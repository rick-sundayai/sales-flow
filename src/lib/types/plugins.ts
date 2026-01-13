export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  category: 'reports' | 'integrations' | 'widgets' | 'automation'
  tags: string[]
  permissions: PluginPermission[]
}

export interface PluginPermission {
  resource: 'clients' | 'deals' | 'activities' | 'companies' | 'users'
  actions: ('read' | 'write' | 'delete')[]
}

export interface PluginConfiguration {
  [key: string]: any
}

export interface ReportField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency'
  required?: boolean
  sortable?: boolean
  filterable?: boolean
}

export interface ReportData {
  fields: ReportField[]
  rows: Record<string, any>[]
  metadata: {
    totalRows: number
    generatedAt: Date
    filters?: Record<string, any>
  }
}

export interface ReportPlugin {
  metadata: PluginMetadata
  configure: (config: PluginConfiguration) => void
  validate: (config: PluginConfiguration) => { valid: boolean; errors?: string[] }
  generate: (
    config: PluginConfiguration,
    context: ReportContext
  ) => Promise<ReportData>
  getConfigSchema: () => ConfigSchema
}

export interface ConfigSchema {
  fields: ConfigField[]
}

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date'
  required?: boolean
  options?: { value: string; label: string }[]
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ReportContext {
  userId: string
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: Record<string, any>
  permissions: string[]
}

export interface PluginInstance {
  id: string
  pluginId: string
  name: string
  enabled: boolean
  configuration: PluginConfiguration
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface PluginRegistry {
  plugins: Map<string, ReportPlugin>
  instances: Map<string, PluginInstance>
  register: (plugin: ReportPlugin) => void
  unregister: (pluginId: string) => void
  getInstance: (instanceId: string) => PluginInstance | undefined
  getPlugin: (pluginId: string) => ReportPlugin | undefined
  listPlugins: (category?: string) => ReportPlugin[]
  listInstances: (userId?: string) => PluginInstance[]
}