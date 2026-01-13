import { 
  PluginRegistry, 
  ReportPlugin, 
  PluginInstance, 
  PluginConfiguration,
  ReportContext,
  ReportData
} from '@/lib/types/plugins'
import { createClient } from '@/lib/supabase/client'
import { auditLogger } from '@/lib/security/audit-logger'

class PluginRegistryImpl implements PluginRegistry {
  plugins = new Map<string, ReportPlugin>()
  instances = new Map<string, PluginInstance>()

  register(plugin: ReportPlugin): void {
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin ${plugin.metadata.id} is already registered`)
    }
    
    this.plugins.set(plugin.metadata.id, plugin)
    auditLogger.log({
      action: 'plugin_registered',
      resource: 'plugin',
      resourceId: plugin.metadata.id,
      details: { 
        name: plugin.metadata.name, 
        version: plugin.metadata.version 
      }
    })
  }

  unregister(pluginId: string): void {
    if (!this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not registered`)
    }
    
    this.plugins.delete(pluginId)
    
    // Remove all instances of this plugin
    for (const [instanceId, instance] of this.instances.entries()) {
      if (instance.pluginId === pluginId) {
        this.instances.delete(instanceId)
      }
    }
    
    auditLogger.log({
      action: 'plugin_unregistered',
      resource: 'plugin',
      resourceId: pluginId
    })
  }

  getInstance(instanceId: string): PluginInstance | undefined {
    return this.instances.get(instanceId)
  }

  getPlugin(pluginId: string): ReportPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  listPlugins(category?: string): ReportPlugin[] {
    const plugins = Array.from(this.plugins.values())
    return category 
      ? plugins.filter(p => p.metadata.category === category)
      : plugins
  }

  listInstances(userId?: string): PluginInstance[] {
    const instances = Array.from(this.instances.values())
    return userId 
      ? instances.filter(i => i.createdBy === userId)
      : instances
  }

  async createInstance(
    pluginId: string, 
    name: string, 
    config: PluginConfiguration,
    userId: string
  ): Promise<PluginInstance> {
    const plugin = this.getPlugin(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // Validate configuration
    const validation = plugin.validate(config)
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors?.join(', ')}`)
    }

    const instance: PluginInstance = {
      id: crypto.randomUUID(),
      pluginId,
      name,
      enabled: true,
      configuration: config,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    }

    // Save to database
    const supabase = createClient()
    const { error } = await supabase
      .from('plugin_instances')
      .insert([{
        id: instance.id,
        plugin_id: instance.pluginId,
        name: instance.name,
        enabled: instance.enabled,
        configuration: instance.configuration,
        created_by: instance.createdBy
      }])

    if (error) {
      throw new Error(`Failed to create plugin instance: ${error.message}`)
    }

    this.instances.set(instance.id, instance)
    
    auditLogger.log({
      action: 'plugin_instance_created',
      resource: 'plugin_instance',
      resourceId: instance.id,
      userId,
      details: { pluginId, name }
    })

    return instance
  }

  async updateInstance(
    instanceId: string, 
    updates: Partial<PluginInstance>,
    userId: string
  ): Promise<void> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Plugin instance ${instanceId} not found`)
    }

    if (instance.createdBy !== userId) {
      throw new Error('Unauthorized to update this plugin instance')
    }

    if (updates.configuration) {
      const plugin = this.getPlugin(instance.pluginId)
      if (plugin) {
        const validation = plugin.validate(updates.configuration)
        if (!validation.valid) {
          throw new Error(`Invalid configuration: ${validation.errors?.join(', ')}`)
        }
      }
    }

    const updatedInstance = { ...instance, ...updates, updatedAt: new Date() }

    // Update in database
    const supabase = createClient()
    const { error } = await supabase
      .from('plugin_instances')
      .update({
        name: updatedInstance.name,
        enabled: updatedInstance.enabled,
        configuration: updatedInstance.configuration,
        updated_at: updatedInstance.updatedAt.toISOString()
      })
      .eq('id', instanceId)

    if (error) {
      throw new Error(`Failed to update plugin instance: ${error.message}`)
    }

    this.instances.set(instanceId, updatedInstance)
    
    auditLogger.log({
      action: 'plugin_instance_updated',
      resource: 'plugin_instance',
      resourceId: instanceId,
      userId,
      details: { updates }
    })
  }

  async deleteInstance(instanceId: string, userId: string): Promise<void> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Plugin instance ${instanceId} not found`)
    }

    if (instance.createdBy !== userId) {
      throw new Error('Unauthorized to delete this plugin instance')
    }

    // Delete from database
    const supabase = createClient()
    const { error } = await supabase
      .from('plugin_instances')
      .delete()
      .eq('id', instanceId)

    if (error) {
      throw new Error(`Failed to delete plugin instance: ${error.message}`)
    }

    this.instances.delete(instanceId)
    
    auditLogger.log({
      action: 'plugin_instance_deleted',
      resource: 'plugin_instance',
      resourceId: instanceId,
      userId
    })
  }

  async generateReport(
    instanceId: string, 
    context: ReportContext
  ): Promise<ReportData> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Plugin instance ${instanceId} not found`)
    }

    if (!instance.enabled) {
      throw new Error(`Plugin instance ${instanceId} is disabled`)
    }

    const plugin = this.getPlugin(instance.pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${instance.pluginId} not found`)
    }

    // Configure the plugin with instance settings
    plugin.configure(instance.configuration)

    // Generate the report
    const reportData = await plugin.generate(instance.configuration, context)
    
    auditLogger.log({
      action: 'report_generated',
      resource: 'plugin_instance',
      resourceId: instanceId,
      userId: context.userId,
      details: { 
        pluginId: instance.pluginId,
        rowCount: reportData.rows.length 
      }
    })

    return reportData
  }

  async loadInstances(userId?: string): Promise<void> {
    const supabase = createClient()
    let query = supabase.from('plugin_instances').select('*')
    
    if (userId) {
      query = query.eq('created_by', userId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to load plugin instances: ${error.message}`)
    }

    this.instances.clear()
    
    if (data) {
      for (const row of data) {
        const instance: PluginInstance = {
          id: row.id,
          pluginId: row.plugin_id,
          name: row.name,
          enabled: row.enabled,
          configuration: row.configuration,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at || row.created_at),
          createdBy: row.created_by
        }
        this.instances.set(instance.id, instance)
      }
    }
  }
}

// Global singleton instance
export const pluginRegistry = new PluginRegistryImpl()