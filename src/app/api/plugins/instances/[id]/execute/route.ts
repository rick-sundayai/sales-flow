import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { pluginRegistry } from '@/lib/services/plugin-registry'
import { ReportContext } from '@/lib/types/plugins'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()

  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instance = pluginRegistry.getInstance(id)
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
    const reportData = await pluginRegistry.generateReport(id, context)
    const executionTime = Date.now() - startTime

    // Log execution in database
    const { error: logError } = await supabase
      .from('plugin_executions')
      .insert([{
        instance_id: id,
        executed_by: user.id,
        status: 'success',
        execution_duration_ms: executionTime,
        row_count: reportData.rows.length,
        context: context
      }])

    if (logError) {
      logger.error('Failed to log plugin execution', {
        action: 'plugin_execution_log_failed',
        error: logError as Error,
        metadata: { instanceId: id },
      })
    }

    // Audit log
    await auditLogger.log({
      action: 'plugin_executed',
      resource: 'plugin_instance',
      resourceId: id,
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
    const { id } = await params
    const executionTime = Date.now() - startTime
    logger.error('Plugin execution failed', {
      action: 'plugin_execution_failed',
      error: error as Error,
      metadata: { instanceId: id, executionTime },
    })

    // Log failed execution
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('plugin_executions')
          .insert([{
            instance_id: id,
            executed_by: user.id,
            status: 'failed',
            execution_duration_ms: executionTime,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          }])
      }
    } catch (logError) {
      logger.error('Failed to log failed execution', {
        action: 'plugin_execution_log_failed',
        error: logError as Error,
        metadata: { instanceId: id },
      })
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