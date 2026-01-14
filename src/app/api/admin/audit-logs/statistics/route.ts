/**
 * Audit Log Statistics API endpoint
 * Provides audit statistics and analytics for administrators
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAuditLog, SENSITIVE_ACTIONS } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const statsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeframe: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      await createAuditLog(
        {
          userId: user.id,
          action: SENSITIVE_ACTIONS.AUDIT_LOG_VIEW,
          resource: 'audit_statistics',
          outcome: 'blocked',
          details: { reason: 'insufficient_permissions' },
        },
        req
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = new URL(req.url).searchParams;
    const queryParams = Object.fromEntries(searchParams);
    const validation = statsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const params = validation.data;

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (params.startDate && params.endDate) {
      startDate = new Date(params.startDate);
      endDate = new Date(params.endDate);
    } else {
      // Use timeframe
      const now = new Date();
      endDate = now;
      
      switch (params.timeframe) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // Get audit statistics using the database function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_audit_statistics', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

    if (statsError) {
      throw statsError;
    }

    // Get recent high-risk events
    const { data: highRiskEvents, error: eventsError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('risk_level', ['high', 'critical'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      throw eventsError;
    }

    // Get failure trends
    const { data: failureTrends, error: trendsError } = await supabase
      .from('audit_logs')
      .select('created_at, outcome')
      .in('outcome', ['failure', 'blocked'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (trendsError) {
      throw trendsError;
    }

    // Process failure trends by day
    const failuresByDay = failureTrends?.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Log the statistics access
    await createAuditLog(
      {
        userId: user.id,
        action: SENSITIVE_ACTIONS.AUDIT_LOG_VIEW,
        resource: 'audit_statistics',
        outcome: 'success',
        details: {
          timeframe: params.timeframe,
          dateRange: { startDate, endDate },
        },
      },
      req
    );

    const result = {
      success: true,
      data: {
        timeframe: params.timeframe,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        overview: {
          totalEvents: stats[0]?.total_events || 0,
          uniqueUsers: stats[0]?.unique_users || 0,
          successRate: parseFloat(stats[0]?.success_rate || '0'),
        },
        topActions: stats[0]?.top_actions || [],
        riskDistribution: stats[0]?.risk_distribution || {},
        hourlyActivity: stats[0]?.hourly_activity || [],
        recentHighRiskEvents: highRiskEvents?.map(event => ({
          id: event.id,
          action: event.action,
          resource: event.resource,
          outcome: event.outcome,
          riskLevel: event.risk_level,
          createdAt: event.created_at,
          ipAddress: event.ip_address,
        })) || [],
        failureTrends: failuresByDay || {},
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch audit statistics', {
      action: 'audit_statistics_fetch_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit statistics',
      },
      { status: 500 }
    );
  }
}