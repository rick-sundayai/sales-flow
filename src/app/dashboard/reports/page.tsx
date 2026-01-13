'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Settings, 
  Play, 
  Trash2, 
  Edit,
  BarChart3,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'
import { PluginConfigModal } from '@/components/crm/PluginConfigModal'
import { ReportViewer } from '@/components/crm/ReportViewer'
import { 
  ReportPlugin, 
  PluginInstance, 
  ReportData,
  ReportContext 
} from '@/lib/types/plugins'
import { pluginRegistry } from '@/lib/services/plugin-registry'
import { SalesPerformancePlugin } from '@/lib/plugins/sales-performance-plugin'
import { ClientActivityPlugin } from '@/lib/plugins/client-activity-plugin'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'

export default function ReportsPage() {
  const [availablePlugins, setAvailablePlugins] = useState<ReportPlugin[]>([])
  const [pluginInstances, setPluginInstances] = useState<PluginInstance[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<ReportPlugin | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [currentReportTitle, setCurrentReportTitle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Register built-in plugins
    try {
      pluginRegistry.register(new SalesPerformancePlugin())
      pluginRegistry.register(new ClientActivityPlugin())
    } catch (error) {
      // Plugins might already be registered
    }

    // Load available plugins and instances
    loadPluginsAndInstances()
  }, [])

  const loadPluginsAndInstances = async () => {
    try {
      const plugins = pluginRegistry.listPlugins('reports')
      setAvailablePlugins(plugins)
      
      if (user?.id) {
        await pluginRegistry.loadInstances(user.id)
        const instances = pluginRegistry.listInstances(user.id)
        setPluginInstances(instances)
      }
    } catch (error) {
      console.error('Failed to load plugins:', error)
      toast({
        title: 'Error',
        description: 'Failed to load report plugins',
        variant: 'destructive'
      })
    }
  }

  const handleConfigurePlugin = (plugin: ReportPlugin) => {
    setSelectedPlugin(plugin)
    setConfigModalOpen(true)
  }

  const handleSaveConfiguration = async (config: any, instanceName: string) => {
    if (!selectedPlugin || !user?.id) return

    try {
      await pluginRegistry.createInstance(
        selectedPlugin.metadata.id,
        instanceName,
        config,
        user.id
      )
      
      toast({
        title: 'Success',
        description: 'Report configuration saved successfully'
      })
      
      await loadPluginsAndInstances()
    } catch (error) {
      throw error // Let the modal handle the error
    }
  }

  const handleRunReport = async (instance: PluginInstance) => {
    if (!user?.id) return

    setIsGenerating(true)
    setReportData(null)
    
    try {
      const context: ReportContext = {
        userId: user.id,
        permissions: ['read'], // This would come from user permissions
        dateRange: instance.configuration.startDate && instance.configuration.endDate ? {
          start: new Date(instance.configuration.startDate),
          end: new Date(instance.configuration.endDate)
        } : undefined
      }

      const data = await pluginRegistry.generateReport(instance.id, context)
      setReportData(data)
      setCurrentReportTitle(instance.name)
      
      toast({
        title: 'Success',
        description: 'Report generated successfully'
      })
    } catch (error) {
      console.error('Failed to generate report:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteInstance = async (instanceId: string) => {
    if (!user?.id) return

    try {
      await pluginRegistry.deleteInstance(instanceId, user.id)
      toast({
        title: 'Success',
        description: 'Report configuration deleted'
      })
      await loadPluginsAndInstances()
    } catch (error) {
      console.error('Failed to delete instance:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete report configuration',
        variant: 'destructive'
      })
    }
  }

  const handleExportReport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!reportData) return

    // Simple CSV export implementation
    if (format === 'csv') {
      const headers = reportData.fields.map(field => field.label).join(',')
      const rows = reportData.rows.map(row => 
        reportData.fields.map(field => 
          JSON.stringify(row[field.key] || '')
        ).join(',')
      ).join('\n')
      
      const csvContent = `${headers}\n${rows}`
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentReportTitle.replace(/\s+/g, '_')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }

    toast({
      title: 'Export Started',
      description: `Exporting report as ${format.toUpperCase()}`
    })
  }

  const getPluginIcon = (category: string) => {
    switch (category) {
      case 'reports': return <BarChart3 className="h-5 w-5" />
      case 'integrations': return <Settings className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <p className="text-gray-600">Generate and manage custom reports using plugins</p>
        </div>
      </div>

      <Tabs defaultValue="instances" className="space-y-6">
        <TabsList>
          <TabsTrigger value="instances">My Reports</TabsTrigger>
          <TabsTrigger value="plugins">Available Plugins</TabsTrigger>
          {reportData && <TabsTrigger value="viewer">Report Viewer</TabsTrigger>}
        </TabsList>

        <TabsContent value="instances" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Configured Reports</h2>
            {pluginInstances.length === 0 && (
              <p className="text-gray-500">No report configurations yet. Create one from the Available Plugins tab.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pluginInstances.map(instance => {
              const plugin = pluginRegistry.getPlugin(instance.pluginId)
              return (
                <Card key={instance.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plugin && getPluginIcon(plugin.metadata.category)}
                        {instance.name}
                      </div>
                      <Badge variant={instance.enabled ? 'default' : 'secondary'}>
                        {instance.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {plugin?.metadata.name} • Created {instance.createdAt.toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRunReport(instance)}
                        disabled={isGenerating || !instance.enabled}
                        className="flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        {isGenerating ? 'Generating...' : 'Run Report'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const plugin = pluginRegistry.getPlugin(instance.pluginId)
                          if (plugin) {
                            setSelectedPlugin(plugin)
                            setConfigModalOpen(true)
                          }
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteInstance(instance.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="plugins" className="space-y-4">
          <h2 className="text-xl font-semibold">Available Report Plugins</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePlugins.map(plugin => (
              <Card key={plugin.metadata.id}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {plugin.metadata.icon} {plugin.metadata.name}
                    <Badge variant="outline">{plugin.metadata.version}</Badge>
                  </CardTitle>
                  <p className="text-xs text-gray-600">{plugin.metadata.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {plugin.metadata.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Required Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.metadata.permissions.map((perm, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {perm.resource}: {perm.actions.join(', ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleConfigurePlugin(plugin)}
                    className="w-full flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Configure Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {reportData && (
          <TabsContent value="viewer">
            <ReportViewer
              reportData={reportData}
              title={currentReportTitle}
              onExport={handleExportReport}
            />
          </TabsContent>
        )}
      </Tabs>

      <PluginConfigModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        plugin={selectedPlugin}
        onSave={handleSaveConfiguration}
      />
    </div>
  )
}