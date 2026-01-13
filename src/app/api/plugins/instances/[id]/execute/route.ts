import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { pluginRegistry } from '@/lib/services/plugin-registry'
import { ReportContext } from '@/lib/types/plugins'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instance = pluginRegistry.getInstance(params.id)
    if (!instance || instance.createdBy !== user.id) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    if (!instance.enabled) {
      return NextResponse.json({ error: 'Plugin instance is disabled' }, { status: 400 })
    }

    // Parse request context
    const requestBody = await request.json().catch(() => ({}))
    const { dateRange, filters } = requestBody

    // Build execution context
    const context: ReportContext = {
      userId: user.id,
      permissions: ['read'], // This would come from user's actual permissions
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined,
      filters
    }

    // Execute the report
    const reportData = await pluginRegistry.generateReport(params.id, context)
    const executionTime = Date.now() - startTime

    // Log execution in database
    const { error: logError } = await supabase
      .from('plugin_executions')
      .insert([{
        instance_id: params.id,
        executed_by: user.id,
        status: 'success',
        execution_duration_ms: executionTime,
        row_count: reportData.rows.length,
        context: context
      }])

    if (logError) {
      console.error('Failed to log plugin execution:', logError)
    }

    // Audit log
    await auditLogger.log({
      action: 'plugin_executed',
      resource: 'plugin_instance',
      resourceId: params.id,
      userId: user.id,
      details: { 
        executionTime,
        rowCount: reportData.rows.length,
        pluginId: instance.pluginId
      }
    })

    return NextResponse.json({ 
      reportData,
      executionTime,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('Plugin execution failed:', error)

    // Log failed execution
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('plugin_executions')
          .insert([{
            instance_id: params.id,
            executed_by: user.id,
            status: 'failed',
            execution_duration_ms: executionTime,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          }])
      }
    } catch (logError) {
      console.error('Failed to log failed execution:', logError)
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Plugin execution failed',
        executionTime
      }, 
      { status: 500 }
    )
  }
}