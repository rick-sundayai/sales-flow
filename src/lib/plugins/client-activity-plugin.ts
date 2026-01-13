import { 
  PluginMetadata, 
  PluginConfiguration, 
  ReportData, 
  ReportContext, 
  ConfigSchema 
} from '@/lib/types/plugins'
import { BaseReportPlugin, createDateRangeConfig, createStatusFilterConfig } from './base-report-plugin'

export class ClientActivityPlugin extends BaseReportPlugin {
  metadata: PluginMetadata = {
    id: 'client-activity-report',
    name: 'Client Activity Report',
    version: '1.0.0',
    description: 'Track client engagement and activity patterns including emails, calls, meetings, and touchpoint frequency',
    author: 'SalesFlow Team',
    icon: '👥',
    category: 'reports',
    tags: ['clients', 'activity', 'engagement', 'touchpoints'],
    permissions: [
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

    // Validate activity types
    if (config.activityTypes && Array.isArray(config.activityTypes)) {
      const validTypes = ['email', 'call', 'meeting', 'task', 'note']
      const invalidTypes = config.activityTypes.filter((t: string) => !validTypes.includes(t))
      if (invalidTypes.length > 0) {
        errors.push(`Invalid activity types: ${invalidTypes.join(', ')}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  async generate(config: PluginConfiguration, context: ReportContext): Promise<ReportData> {
    const selectedActivityTypes = config.activityTypes || ['email', 'call', 'meeting']
    const activityTypesFilter = selectedActivityTypes.map((t: string) => `'${t}'`).join(',')
    
    let query = `
      SELECT 
        c.company_name,
        c.contact_name,
        c.email,
        c.phone,
        c.status as client_status,
        c.industry,
        COUNT(a.id) as total_activities,
        COUNT(CASE WHEN a.type = 'email' THEN 1 END) as emails,
        COUNT(CASE WHEN a.type = 'call' THEN 1 END) as calls,
        COUNT(CASE WHEN a.type = 'meeting' THEN 1 END) as meetings,
        COUNT(CASE WHEN a.type = 'task' THEN 1 END) as tasks,
        COUNT(CASE WHEN a.type = 'note' THEN 1 END) as notes,
        MAX(a.created_at) as last_activity_date,
        MIN(a.created_at) as first_activity_date,
        COALESCE(SUM(d.value), 0) as total_deal_value,
        COUNT(d.id) as total_deals
      FROM clients c
      LEFT JOIN activities a ON a.client_id = c.id 
        AND a.type IN (${activityTypesFilter})
        {{ACTIVITY_DATE_FILTER}}
      LEFT JOIN deals d ON d.client_id = c.id
      WHERE 1=1 {{DATE_FILTER}}
    `

    // Add client status filter if specified
    if (config.clientStatus && Array.isArray(config.clientStatus) && config.clientStatus.length > 0) {
      const statusFilter = config.clientStatus.map((s: string) => `'${s}'`).join(',')
      query += ` AND c.status IN (${statusFilter})`
    }

    // Add industry filter if specified
    if (config.industry) {
      query += ` AND c.industry = '${config.industry}'`
    }

    query += ` 
      GROUP BY c.id, c.company_name, c.contact_name, c.email, c.phone, c.status, c.industry
      ORDER BY total_activities DESC, last_activity_date DESC
    `

    // Apply date filters
    if (context.dateRange) {
      const startDate = context.dateRange.start.toISOString().split('T')[0]
      const endDate = context.dateRange.end.toISOString().split('T')[0]
      
      query = query.replace('{{ACTIVITY_DATE_FILTER}}', 
        `AND a.created_at >= '${startDate}' AND a.created_at <= '${endDate}'`
      )
      query = query.replace('{{DATE_FILTER}}', 
        `AND c.created_at >= '${startDate}' AND c.created_at <= '${endDate}'`
      )
    } else {
      query = query.replace('{{ACTIVITY_DATE_FILTER}}', '')
      query = query.replace('{{DATE_FILTER}}', '')
    }

    const rawData = await this.executeQuery(query, [], context)

    // Define fields based on configuration
    const fields = [
      { key: 'company_name', label: 'Company', type: 'string' as const, sortable: true },
      { key: 'contact_name', label: 'Contact', type: 'string' as const, sortable: true },
      { key: 'email', label: 'Email', type: 'string' as const, sortable: true },
      { key: 'client_status', label: 'Status', type: 'string' as const, sortable: true, filterable: true },
      { key: 'industry', label: 'Industry', type: 'string' as const, sortable: true, filterable: true },
      { key: 'total_activities', label: 'Total Activities', type: 'number' as const, sortable: true }
    ]

    // Add activity type columns based on selection
    if (selectedActivityTypes.includes('email')) {
      fields.push({ key: 'emails', label: 'Emails', type: 'number' as const, sortable: true })
    }
    if (selectedActivityTypes.includes('call')) {
      fields.push({ key: 'calls', label: 'Calls', type: 'number' as const, sortable: true })
    }
    if (selectedActivityTypes.includes('meeting')) {
      fields.push({ key: 'meetings', label: 'Meetings', type: 'number' as const, sortable: true })
    }
    if (selectedActivityTypes.includes('task')) {
      fields.push({ key: 'tasks', label: 'Tasks', type: 'number' as const, sortable: true })
    }
    if (selectedActivityTypes.includes('note')) {
      fields.push({ key: 'notes', label: 'Notes', type: 'number' as const, sortable: true })
    }

    fields.push(
      { key: 'last_activity_date', label: 'Last Activity', type: 'date' as const, sortable: true },
      { key: 'days_since_last_activity', label: 'Days Since Last Activity', type: 'number' as const, sortable: true },
      { key: 'total_deal_value', label: 'Deal Value', type: 'currency' as const, sortable: true },
      { key: 'total_deals', label: 'Total Deals', type: 'number' as const, sortable: true }
    )

    // Process the data
    const now = new Date()
    const processedRows = rawData.map(row => {
      const lastActivityDate = row.last_activity_date ? new Date(row.last_activity_date) : null
      const daysSinceLastActivity = lastActivityDate 
        ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : null

      const processedRow: Record<string, any> = {
        company_name: row.company_name || 'Unknown Company',
        contact_name: row.contact_name || 'Unknown Contact',
        email: row.email || '',
        client_status: row.client_status || 'unknown',
        industry: row.industry || 'Unknown',
        total_activities: row.total_activities || 0,
        last_activity_date: lastActivityDate ? this.formatDate(lastActivityDate) : 'Never',
        days_since_last_activity: daysSinceLastActivity,
        total_deal_value: this.formatCurrency(row.total_deal_value || 0),
        total_deals: row.total_deals || 0
      }

      // Add activity counts based on selection
      if (selectedActivityTypes.includes('email')) {
        processedRow.emails = row.emails || 0
      }
      if (selectedActivityTypes.includes('call')) {
        processedRow.calls = row.calls || 0
      }
      if (selectedActivityTypes.includes('meeting')) {
        processedRow.meetings = row.meetings || 0
      }
      if (selectedActivityTypes.includes('task')) {
        processedRow.tasks = row.tasks || 0
      }
      if (selectedActivityTypes.includes('note')) {
        processedRow.notes = row.notes || 0
      }

      return processedRow
    })

    return this.buildReportData(fields, processedRows, config)
  }

  getConfigSchema(): ConfigSchema {
    return {
      fields: [
        ...createDateRangeConfig(false),
        {
          key: 'activityTypes',
          label: 'Activity Types',
          type: 'multiselect',
          required: true,
          description: 'Select which activity types to include in the report',
          options: [
            { value: 'email', label: 'Emails' },
            { value: 'call', label: 'Calls' },
            { value: 'meeting', label: 'Meetings' },
            { value: 'task', label: 'Tasks' },
            { value: 'note', label: 'Notes' }
          ]
        },
        createStatusFilterConfig(['prospect', 'qualified', 'proposal', 'negotiation', 'customer', 'inactive']),
        {
          key: 'industry',
          label: 'Industry Filter',
          type: 'select',
          required: false,
          description: 'Filter by specific industry',
          options: [
            { value: 'technology', label: 'Technology' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'finance', label: 'Finance' },
            { value: 'manufacturing', label: 'Manufacturing' },
            { value: 'retail', label: 'Retail' },
            { value: 'other', label: 'Other' }
          ]
        },
        {
          key: 'minActivities',
          label: 'Minimum Activities',
          type: 'number',
          required: false,
          description: 'Only include clients with at least this many activities',
          validation: { min: 0 }
        },
        {
          key: 'maxDaysSinceActivity',
          label: 'Max Days Since Last Activity',
          type: 'number',
          required: false,
          description: 'Only include clients with activity within this many days',
          validation: { min: 0 }
        }
      ]
    }
  }
}