import { 
  PluginMetadata, 
  PluginConfiguration, 
  ReportData, 
  ReportContext, 
  ConfigSchema 
} from '@/lib/types/plugins'
import { BaseReportPlugin, createDateRangeConfig, createUserFilterConfig } from './base-report-plugin'

export class SalesPerformancePlugin extends BaseReportPlugin {
  metadata: PluginMetadata = {
    id: 'sales-performance-report',
    name: 'Sales Performance Report',
    version: '1.0.0',
    description: 'Comprehensive sales performance analysis including deal velocity, conversion rates, and revenue metrics',
    author: 'SalesFlow Team',
    icon: '📊',
    category: 'reports',
    tags: ['sales', 'performance', 'deals', 'revenue'],
    permissions: [
      { resource: 'deals', actions: ['read'] },
      { resource: 'clients', actions: ['read'] },
      { resource: 'activities', actions: ['read'] }
    ]
  }

  validate(config: PluginConfiguration): { valid: boolean; errors?: string[] } {
    const errors: string[] = []
    
    // Validate date range
    const dateValidation = this.validateDateRange(config)
    if (!dateValidation.valid && dateValidation.errors) {
      errors.push(...dateValidation.errors)
    }

    // Validate metric selection
    if (config.metrics && Array.isArray(config.metrics)) {
      const validMetrics = ['revenue', 'deal_count', 'conversion_rate', 'avg_deal_size', 'velocity']
      const invalidMetrics = config.metrics.filter((m: string) => !validMetrics.includes(m))
      if (invalidMetrics.length > 0) {
        errors.push(`Invalid metrics: ${invalidMetrics.join(', ')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  async generate(config: PluginConfiguration, context: ReportContext): Promise<ReportData> {
    const selectedMetrics = config.metrics || ['revenue', 'deal_count', 'conversion_rate']
    
    // Build the query based on selected metrics
    let query = `
      SELECT 
        up.first_name || ' ' || up.last_name as sales_person,
        COUNT(d.id) as total_deals,
        COUNT(CASE WHEN d.stage = 'closed_won' THEN 1 END) as won_deals,
        COUNT(CASE WHEN d.stage = 'closed_lost' THEN 1 END) as lost_deals,
        COALESCE(SUM(CASE WHEN d.stage = 'closed_won' THEN d.value END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN d.stage = 'closed_won' THEN d.value END), 0) as avg_deal_size,
        COALESCE(AVG(CASE WHEN d.stage IN ('closed_won', 'closed_lost') 
                     THEN EXTRACT(EPOCH FROM (d.updated_at - d.created_at))/86400 END), 0) as avg_deal_cycle_days
      FROM user_profiles up
      LEFT JOIN deals d ON d.assigned_to = up.id
      WHERE 1=1 {{DATE_FILTER}}
    `

    // Add user filter if specified
    if (config.userId) {
      query += ` AND up.id = '${config.userId}'`
    }

    query += ` GROUP BY up.id, up.first_name, up.last_name ORDER BY total_revenue DESC`

    // Apply date filter
    query = this.applyDateFilter(query, context)

    const rawData = await this.executeQuery(query, [], context)

    // Transform data based on selected metrics
    const fields = [
      { key: 'sales_person', label: 'Sales Person', type: 'string' as const, sortable: true }
    ]

    if (selectedMetrics.includes('deal_count')) {
      fields.push(
        { key: 'total_deals', label: 'Total Deals', type: 'number' as const, sortable: true },
        { key: 'won_deals', label: 'Won Deals', type: 'number' as const, sortable: true },
        { key: 'lost_deals', label: 'Lost Deals', type: 'number' as const, sortable: true }
      )
    }

    if (selectedMetrics.includes('revenue')) {
      fields.push({ key: 'total_revenue', label: 'Total Revenue', type: 'currency' as const, sortable: true })
    }

    if (selectedMetrics.includes('avg_deal_size')) {
      fields.push({ key: 'avg_deal_size', label: 'Avg Deal Size', type: 'currency' as const, sortable: true })
    }

    if (selectedMetrics.includes('conversion_rate')) {
      fields.push({ key: 'conversion_rate', label: 'Conversion Rate', type: 'string' as const, sortable: true })
    }

    if (selectedMetrics.includes('velocity')) {
      fields.push({ key: 'avg_deal_cycle_days', label: 'Avg Cycle (Days)', type: 'number' as const, sortable: true })
    }

    // Process the data
    const processedRows = rawData.map(row => {
      const processedRow: Record<string, any> = {
        sales_person: row.sales_person || 'Unknown'
      }

      if (selectedMetrics.includes('deal_count')) {
        processedRow.total_deals = row.total_deals
        processedRow.won_deals = row.won_deals  
        processedRow.lost_deals = row.lost_deals
      }

      if (selectedMetrics.includes('revenue')) {
        processedRow.total_revenue = this.formatCurrency(row.total_revenue)
      }

      if (selectedMetrics.includes('avg_deal_size')) {
        processedRow.avg_deal_size = this.formatCurrency(row.avg_deal_size)
      }

      if (selectedMetrics.includes('conversion_rate')) {
        const rate = row.total_deals > 0 ? (row.won_deals / row.total_deals) * 100 : 0
        processedRow.conversion_rate = `${rate.toFixed(1)}%`
      }

      if (selectedMetrics.includes('velocity')) {
        processedRow.avg_deal_cycle_days = Math.round(row.avg_deal_cycle_days)
      }

      return processedRow
    })

    return this.buildReportData(fields, processedRows, config)
  }

  getConfigSchema(): ConfigSchema {
    return {
      fields: [
        ...createDateRangeConfig(false),
        createUserFilterConfig(),
        {
          key: 'metrics',
          label: 'Metrics to Include',
          type: 'multiselect',
          required: true,
          description: 'Select which metrics to include in the report',
          options: [
            { value: 'revenue', label: 'Total Revenue' },
            { value: 'deal_count', label: 'Deal Counts' },
            { value: 'conversion_rate', label: 'Conversion Rate' },
            { value: 'avg_deal_size', label: 'Average Deal Size' },
            { value: 'velocity', label: 'Deal Velocity' }
          ]
        },
        {
          key: 'groupBy',
          label: 'Group Results By',
          type: 'select',
          required: false,
          description: 'How to group the results',
          options: [
            { value: 'user', label: 'By Sales Person' },
            { value: 'month', label: 'By Month' },
            { value: 'quarter', label: 'By Quarter' }
          ]
        }
      ]
    }
  }
}