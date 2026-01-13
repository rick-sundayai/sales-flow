import { 
  ReportPlugin, 
  PluginMetadata, 
  PluginConfiguration, 
  ReportData, 
  ReportContext, 
  ConfigSchema,
  ReportField
} from '@/lib/types/plugins'
import { createClient } from '@/lib/supabase/client'

export abstract class BaseReportPlugin implements ReportPlugin {
  abstract metadata: PluginMetadata
  protected config: PluginConfiguration = {}

  configure(config: PluginConfiguration): void {
    this.config = config
  }

  abstract validate(config: PluginConfiguration): { valid: boolean; errors?: string[] }
  abstract generate(config: PluginConfiguration, context: ReportContext): Promise<ReportData>
  abstract getConfigSchema(): ConfigSchema

  protected async executeQuery(
    query: string, 
    params: any[] = [],
    context: ReportContext
  ): Promise<any[]> {
    const supabase = createClient()
    
    // Add user context to query if needed
    const { data, error } = await supabase.rpc('execute_report_query', {
      query_text: query,
      query_params: params,
      user_id: context.userId
    })

    if (error) {
      throw new Error(`Query execution failed: ${error.message}`)
    }

    return data || []
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  protected validateDateRange(config: PluginConfiguration): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    if (config.startDate && config.endDate) {
      const start = new Date(config.startDate)
      const end = new Date(config.endDate)
      
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date')
      }
      
      if (isNaN(end.getTime())) {
        errors.push('Invalid end date')
      }
      
      if (start > end) {
        errors.push('Start date must be before end date')
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  protected applyDateFilter(baseQuery: string, context: ReportContext): string {
    if (!context.dateRange) {
      return baseQuery
    }

    const { start, end } = context.dateRange
    const startDate = start.toISOString().split('T')[0]
    const endDate = end.toISOString().split('T')[0]

    return baseQuery.replace('{{DATE_FILTER}}', 
      `AND created_at >= '${startDate}' AND created_at <= '${endDate}'`
    )
  }

  protected buildReportData(
    fields: ReportField[], 
    rows: Record<string, any>[], 
    filters?: Record<string, any>
  ): ReportData {
    return {
      fields,
      rows,
      metadata: {
        totalRows: rows.length,
        generatedAt: new Date(),
        filters
      }
    }
  }
}

// Utility function to create standard date range config
export function createDateRangeConfig(required: boolean = false) {
  return [
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date' as const,
      required,
      description: 'Beginning of date range for the report'
    },
    {
      key: 'endDate',
      label: 'End Date', 
      type: 'date' as const,
      required,
      description: 'End of date range for the report'
    }
  ]
}

// Utility function to create user filter config
export function createUserFilterConfig() {
  return {
    key: 'userId',
    label: 'Filter by User',
    type: 'select' as const,
    required: false,
    description: 'Limit results to specific user',
    options: [] // Will be populated dynamically
  }
}

// Utility function to create status filter config
export function createStatusFilterConfig(statusOptions: string[]) {
  return {
    key: 'status',
    label: 'Status Filter',
    type: 'multiselect' as const,
    required: false,
    description: 'Filter by status',
    options: statusOptions.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }))
  }
}