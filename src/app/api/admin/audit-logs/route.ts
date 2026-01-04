/**
 * Audit Logs API endpoint
 * Provides access to audit trail for administrators
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogs, createAuditLog, SENSITIVE_ACTIONS } from '@/lib/security/audit-logger';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const querySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  outcome: z.enum(['success', 'failure', 'blocked']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
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
      // Log unauthorized access attempt
      await createAuditLog(
        {
          userId: user.id,
          action: SENSITIVE_ACTIONS.AUDIT_LOG_VIEW,
          resource: 'audit_logs',
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
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const params = validation.data;

    // Convert date strings to Date objects
    const auditParams = {
      ...params,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };

    const { logs, total } = await getAuditLogs(auditParams);

    // Log the audit log access
    await createAuditLog(
      {
        userId: user.id,
        action: SENSITIVE_ACTIONS.AUDIT_LOG_VIEW,
        resource: 'audit_logs',
        outcome: 'success',
        details: {
          filters: auditParams,
          resultCount: logs.length,
        },
      },
      req
    );

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        limit: auditParams.limit,
        offset: auditParams.offset,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      action: 'audit_logs_fetch_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audit logs',
      },
      { status: 500 }
    );
  }
}