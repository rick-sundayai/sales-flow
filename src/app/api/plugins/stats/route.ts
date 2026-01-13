import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get plugin usage statistics
    const { data: usageStats, error: usageError } = await supabase
      .from('plugin_usage_stats')
      .select('plugin_id, action, created_at, execution_time_ms')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (usageError) {
      throw usageError
    }

    // Get execution history
    const { data: executionHistory, error: executionError } = await supabase
      .from('plugin_executions')
      .select(`
        id,
        execution_time,
        status,
        execution_duration_ms,
        row_count,
        plugin_instances!inner(
          name,
          plugin_id
        )
      `)
      .eq('executed_by', user.id)
      .order('execution_time', { ascending: false })
      .limit(50)

    if (executionError) {
      throw executionError
    }

    // Get instance counts
    const { count: totalInstances, error: instanceCountError } = await supabase
      .from('plugin_instances')
      .select('id', { count: 'exact' })
      .eq('created_by', user.id)

    if (instanceCountError) {
      throw instanceCountError
    }

    // Get active instances count
    const { count: activeInstances, error: activeCountError } = await supabase
      .from('plugin_instances')
      .select('id', { count: 'exact' })
      .eq('created_by', user.id)
      .eq('enabled', true)

    if (activeCountError) {
      throw activeCountError
    }

    // Calculate some basic analytics
    const totalExecutions = executionHistory?.length || 0
    const successfulExecutions = executionHistory?.filter(e => e.status === 'success').length || 0
    const averageExecutionTime = executionHistory?.length > 0 
      ? executionHistory.reduce((sum, e) => sum + (e.execution_duration_ms || 0), 0) / executionHistory.length
      : 0

    // Group usage by plugin
    const pluginUsage = (usageStats || []).reduce((acc, stat) => {
      if (!acc[stat.plugin_id]) {
        acc[stat.plugin_id] = {
          pluginId: stat.plugin_id,
          totalActions: 0,
          executions: 0,
          totalExecutionTime: 0,
          lastUsed: stat.created_at
        }
      }
      
      acc[stat.plugin_id].totalActions++
      if (stat.action === 'executed') {
        acc[stat.plugin_id].executions++
        acc[stat.plugin_id].totalExecutionTime += stat.execution_time_ms || 0
      }
      
      if (stat.created_at > acc[stat.plugin_id].lastUsed) {
        acc[stat.plugin_id].lastUsed = stat.created_at
      }
      
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      summary: {
        totalInstances: totalInstances || 0,
        activeInstances: activeInstances || 0,
        totalExecutions,
        successfulExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        averageExecutionTime: Math.round(averageExecutionTime)
      },
      pluginUsage: Object.values(pluginUsage),
      recentExecutions: executionHistory?.slice(0, 10) || []
    })
  } catch (error) {
    console.error('Failed to fetch plugin statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin statistics' }, 
      { status: 500 }
    )
  }
}