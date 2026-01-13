'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Settings, Save, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ConfigSchema, 
  ConfigField, 
  PluginConfiguration, 
  ReportPlugin 
} from '@/lib/types/plugins'

interface PluginConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plugin: ReportPlugin | null
  existingConfig?: PluginConfiguration
  onSave: (config: PluginConfiguration, instanceName: string) => Promise<void>
}

const createValidationSchema = (configSchema: ConfigSchema) => {
  const schemaShape: Record<string, any> = {
    instanceName: z.string().min(1, 'Instance name is required')
  }

  configSchema.fields.forEach(field => {
    let fieldSchema: any

    switch (field.type) {
      case 'text':
        fieldSchema = z.string()
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern))
        }
        break
      case 'number':
        fieldSchema = z.number()
        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validation.min)
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validation.max)
        }
        break
      case 'boolean':
        fieldSchema = z.boolean()
        break
      case 'date':
        fieldSchema = z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date')
        break
      case 'select':
      case 'multiselect':
        fieldSchema = field.type === 'multiselect' ? z.array(z.string()) : z.string()
        break
      default:
        fieldSchema = z.any()
    }

    if (field.required) {
      schemaShape[field.key] = fieldSchema
    } else {
      schemaShape[field.key] = fieldSchema.optional()
    }
  })

  return z.object(schemaShape)
}

export function PluginConfigModal({
  open,
  onOpenChange,
  plugin,
  existingConfig,
  onSave
}: PluginConfigModalProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const configSchema = plugin?.getConfigSchema()
  const validationSchema = configSchema ? createValidationSchema(configSchema) : z.object({})

  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      instanceName: '',
      ...existingConfig
    }
  })

  const handleMultiselectChange = (fieldKey: string, value: string, checked: boolean) => {
    setSelectedValues(prev => {
      const current = prev[fieldKey] || []
      if (checked) {
        return { ...prev, [fieldKey]: [...current, value] }
      } else {
        return { ...prev, [fieldKey]: current.filter(v => v !== value) }
      }
    })
    
    form.setValue(fieldKey, selectedValues[fieldKey] || [])
  }

  const onSubmit = async (data: any) => {
    if (!plugin) return

    setIsLoading(true)
    setValidationErrors([])

    try {
      // Include multiselect values
      const config = { ...data }
      Object.keys(selectedValues).forEach(key => {
        config[key] = selectedValues[key]
      })

      // Validate with plugin
      const validation = plugin.validate(config)
      if (!validation.valid && validation.errors) {
        setValidationErrors(validation.errors)
        return
      }

      const { instanceName, ...pluginConfig } = config
      await onSave(pluginConfig, instanceName)
      onOpenChange(false)
      form.reset()
      setSelectedValues({})
    } catch (error) {
      console.error('Failed to save plugin configuration:', error)
      setValidationErrors([error instanceof Error ? error.message : 'Failed to save configuration'])
    } finally {
      setIsLoading(false)
    }
  }

  const renderConfigField = (field: ConfigField) => {
    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              {...form.register(field.key)}
              placeholder={field.description}
            />
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              {...form.register(field.key, { valueAsNumber: true })}
              min={field.validation?.min}
              max={field.validation?.max}
              placeholder={field.description}
            />
          </div>
        )

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              {...form.register(field.key)}
            />
          </div>
        )

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              {...form.register(field.key)}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-gray-500 ml-2">{field.description}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => form.setValue(field.key, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        )

      case 'multiselect':
        const currentValues = selectedValues[field.key] || []
        return (
          <div key={field.key} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="border rounded-lg p-3 space-y-2">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${option.value}`}
                    checked={currentValues.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleMultiselectChange(field.key, option.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`${field.key}-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {currentValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentValues.map(value => {
                  const option = field.options?.find(o => o.value === value)
                  return (
                    <Badge key={value} variant="secondary" className="text-xs">
                      {option?.label || value}
                    </Badge>
                  )
                })}
              </div>
            )}
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (!plugin || !configSchema) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure {plugin.metadata.name}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {plugin.metadata.icon} {plugin.metadata.name}
              <Badge variant="outline">{plugin.metadata.version}</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">{plugin.metadata.description}</p>
          </CardHeader>
        </Card>

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="instanceName">
              Instance Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="instanceName"
              {...form.register('instanceName')}
              placeholder="Give this report configuration a name"
            />
            <p className="text-sm text-gray-500">
              A descriptive name for this report configuration
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Configuration</h4>
            {configSchema.fields.map(renderConfigField)}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}