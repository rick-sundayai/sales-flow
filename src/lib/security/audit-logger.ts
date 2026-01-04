/**
 * Audit logging system for sensitive operations
 * Tracks user actions for compliance and security monitoring
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogEntry extends AuditEvent {
  id: string;
  timestamp: string;
}

// Sensitive actions that require audit logging
export const SENSITIVE_ACTIONS = {
  // Authentication
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGE: 'auth.password_change',
  PASSWORD_RESET: 'auth.password_reset',
  EMAIL_CHANGE: 'auth.email_change',
  ACCOUNT_LOCKOUT: 'auth.account_lockout',
  
  // Two-Factor Authentication
  TWO_FA_ENABLE: '2fa.enable',
  TWO_FA_DISABLE: '2fa.disable',
  TWO_FA_CODE_USE: '2fa.code_use',
  TWO_FA_BACKUP_CODE_USE: '2fa.backup_code_use',
  
  // Profile Management
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  AVATAR_CHANGE: 'profile.avatar_change',
  
  // Data Operations
  CLIENT_CREATE: 'client.create',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  CLIENT_EXPORT: 'client.export',
  
  DEAL_CREATE: 'deal.create',
  DEAL_UPDATE: 'deal.update',
  DEAL_DELETE: 'deal.delete',
  DEAL_STAGE_CHANGE: 'deal.stage_change',
  
  ACTIVITY_CREATE: 'activity.create',
  ACTIVITY_UPDATE: 'activity.update',
  ACTIVITY_DELETE: 'activity.delete',
  
  // Email Operations
  EMAIL_SEND: 'email.send',
  EMAIL_BULK_SEND: 'email.bulk_send',
  EMAIL_TEMPLATE_CREATE: 'email.template_create',
  EMAIL_TEMPLATE_DELETE: 'email.template_delete',
  
  // System Operations
  SETTINGS_CHANGE: 'system.settings_change',
  EXPORT_DATA: 'system.export_data',
  IMPORT_DATA: 'system.import_data',
  API_KEY_CREATE: 'system.api_key_create',
  API_KEY_DELETE: 'system.api_key_delete',
  
  // Admin Operations
  USER_IMPERSONATE: 'admin.user_impersonate',
  AUDIT_LOG_VIEW: 'admin.audit_log_view',
  SYSTEM_CONFIG_CHANGE: 'admin.system_config_change',
} as const;

// Risk levels for different actions
export const ACTION_RISK_LEVELS: Record<string, AuditEvent['riskLevel']> = {
  [SENSITIVE_ACTIONS.LOGIN]: 'low',
  [SENSITIVE_ACTIONS.LOGOUT]: 'low',
  [SENSITIVE_ACTIONS.PASSWORD_CHANGE]: 'high',
  [SENSITIVE_ACTIONS.PASSWORD_RESET]: 'high',
  [SENSITIVE_ACTIONS.EMAIL_CHANGE]: 'high',
  [SENSITIVE_ACTIONS.ACCOUNT_LOCKOUT]: 'critical',
  
  [SENSITIVE_ACTIONS.TWO_FA_ENABLE]: 'medium',
  [SENSITIVE_ACTIONS.TWO_FA_DISABLE]: 'high',
  [SENSITIVE_ACTIONS.TWO_FA_CODE_USE]: 'low',
  [SENSITIVE_ACTIONS.TWO_FA_BACKUP_CODE_USE]: 'medium',
  
  [SENSITIVE_ACTIONS.PROFILE_UPDATE]: 'low',
  [SENSITIVE_ACTIONS.PROFILE_DELETE]: 'critical',
  [SENSITIVE_ACTIONS.AVATAR_CHANGE]: 'low',
  
  [SENSITIVE_ACTIONS.CLIENT_CREATE]: 'low',
  [SENSITIVE_ACTIONS.CLIENT_UPDATE]: 'low',
  [SENSITIVE_ACTIONS.CLIENT_DELETE]: 'medium',
  [SENSITIVE_ACTIONS.CLIENT_EXPORT]: 'medium',
  
  [SENSITIVE_ACTIONS.DEAL_CREATE]: 'low',
  [SENSITIVE_ACTIONS.DEAL_UPDATE]: 'low',
  [SENSITIVE_ACTIONS.DEAL_DELETE]: 'medium',
  [SENSITIVE_ACTIONS.DEAL_STAGE_CHANGE]: 'low',
  
  [SENSITIVE_ACTIONS.EMAIL_SEND]: 'low',
  [SENSITIVE_ACTIONS.EMAIL_BULK_SEND]: 'medium',
  
  [SENSITIVE_ACTIONS.EXPORT_DATA]: 'high',
  [SENSITIVE_ACTIONS.IMPORT_DATA]: 'high',
  
  [SENSITIVE_ACTIONS.USER_IMPERSONATE]: 'critical',
  [SENSITIVE_ACTIONS.AUDIT_LOG_VIEW]: 'medium',
  [SENSITIVE_ACTIONS.SYSTEM_CONFIG_CHANGE]: 'critical',
};

/**
 * Extract client information from request
 */
function extractClientInfo(req?: NextRequest) {
  if (!req) return {};

  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0] || realIp || req.ip;
  const userAgent = req.headers.get('user-agent');

  return { ipAddress, userAgent };
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  event: Omit<AuditEvent, 'riskLevel'>,
  req?: NextRequest
): Promise<void> {
  try {
    const clientInfo = extractClientInfo(req);
    const riskLevel = ACTION_RISK_LEVELS[event.action] || 'medium';

    const auditEvent: AuditEvent = {
      ...event,
      ...clientInfo,
      riskLevel,
    };

    // Log to structured logger first
    logger.info('Audit event recorded', {
      action: 'audit_log_created',
      auditEvent,
      metadata: {
        action: event.action,
        resource: event.resource,
        outcome: event.outcome,
        riskLevel,
      },
    });

    // Store in database
    const supabase = await createClient();
    const { error } = await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId,
      details: event.details || {},
      ip_address: auditEvent.ipAddress,
      user_agent: auditEvent.userAgent,
      session_id: event.sessionId,
      outcome: event.outcome,
      risk_level: riskLevel,
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Failed to store audit log in database', {
        action: 'audit_log_storage_failed',
        error,
        auditEvent,
      });
    }

    // Send alerts for critical events
    if (riskLevel === 'critical') {
      await sendCriticalEventAlert(auditEvent);
    }
  } catch (error) {
    logger.error('Failed to create audit log', {
      action: 'audit_log_creation_failed',
      error: error as Error,
      event,
    });
  }
}

/**
 * Send alert for critical security events
 */
async function sendCriticalEventAlert(event: AuditEvent): Promise<void> {
  try {
    // In production, this would send to monitoring systems like:
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Security monitoring tools
    // - Email notifications
    
    logger.warn('CRITICAL SECURITY EVENT', {
      action: 'critical_security_event',
      auditEvent: event,
      alert: true,
    });

    // Example: Send to webhook (implement based on your monitoring setup)
    if (process.env.SECURITY_WEBHOOK_URL) {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 CRITICAL SECURITY EVENT: ${event.action}`,
          details: {
            user: event.userId,
            action: event.action,
            resource: event.resource,
            outcome: event.outcome,
            timestamp: new Date().toISOString(),
            ipAddress: event.ipAddress,
          },
        }),
      });
    }
  } catch (error) {
    logger.error('Failed to send critical event alert', {
      action: 'critical_alert_failed',
      error: error as Error,
      event,
    });
  }
}

/**
 * Query audit logs with filtering and pagination
 */
export async function getAuditLogs(params: {
  userId?: string;
  action?: string;
  resource?: string;
  outcome?: 'success' | 'failure' | 'blocked';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }
    if (params.action) {
      query = query.eq('action', params.action);
    }
    if (params.resource) {
      query = query.eq('resource', params.resource);
    }
    if (params.outcome) {
      query = query.eq('outcome', params.outcome);
    }
    if (params.riskLevel) {
      query = query.eq('risk_level', params.riskLevel);
    }
    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const logs: AuditLogEntry[] = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id,
      outcome: row.outcome,
      riskLevel: row.risk_level,
      timestamp: row.created_at,
    }));

    return { logs, total: count || 0 };
  } catch (error) {
    logger.error('Failed to query audit logs', {
      action: 'audit_log_query_failed',
      error: error as Error,
      params,
    });
    throw error;
  }
}

/**
 * Audit logging middleware wrapper
 */
export function withAuditLog(
  action: string,
  resource: string,
  handler: (req: NextRequest, audit: (outcome: AuditEvent['outcome'], details?: Record<string, any>, resourceId?: string) => Promise<void>) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    let userId = 'anonymous';
    
    try {
      // Try to get user ID from authentication
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // User not authenticated, keep as anonymous
    }

    const audit = async (
      outcome: AuditEvent['outcome'], 
      details?: Record<string, any>,
      resourceId?: string
    ) => {
      await createAuditLog(
        {
          userId,
          action,
          resource,
          resourceId,
          details,
          outcome,
        },
        req
      );
    };

    try {
      const response = await handler(req, audit);
      
      // Auto-audit successful operations
      if (response.ok) {
        await audit('success');
      } else {
        await audit('failure', { statusCode: response.status });
      }

      return response;
    } catch (error) {
      // Auto-audit failed operations
      await audit('failure', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  };
}

/**
 * Helper functions for common audit scenarios
 */

export const auditAuth = {
  login: async (userId: string, outcome: AuditEvent['outcome'], req?: NextRequest, details?: Record<string, any>) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.LOGIN, resource: 'auth', outcome, details }, req),
    
  logout: async (userId: string, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.LOGOUT, resource: 'auth', outcome: 'success' }, req),
    
  passwordChange: async (userId: string, outcome: AuditEvent['outcome'], req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.PASSWORD_CHANGE, resource: 'auth', outcome }, req),
};

export const auditData = {
  clientCreate: async (userId: string, clientId: string, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.CLIENT_CREATE, resource: 'client', resourceId: clientId, outcome: 'success' }, req),
    
  clientUpdate: async (userId: string, clientId: string, changes: Record<string, any>, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.CLIENT_UPDATE, resource: 'client', resourceId: clientId, outcome: 'success', details: { changes } }, req),
    
  clientDelete: async (userId: string, clientId: string, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.CLIENT_DELETE, resource: 'client', resourceId: clientId, outcome: 'success' }, req),

  dealCreate: async (userId: string, dealId: string, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.DEAL_CREATE, resource: 'deal', resourceId: dealId, outcome: 'success' }, req),
    
  dealUpdate: async (userId: string, dealId: string, changes: Record<string, any>, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.DEAL_UPDATE, resource: 'deal', resourceId: dealId, outcome: 'success', details: { changes } }, req),
    
  dealDelete: async (userId: string, dealId: string, req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.DEAL_DELETE, resource: 'deal', resourceId: dealId, outcome: 'success' }, req),
};

export const audit2FA = {
  enable: async (userId: string, outcome: AuditEvent['outcome'], req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.TWO_FA_ENABLE, resource: '2fa', outcome }, req),
    
  disable: async (userId: string, outcome: AuditEvent['outcome'], req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.TWO_FA_DISABLE, resource: '2fa', outcome }, req),
    
  codeUse: async (userId: string, outcome: AuditEvent['outcome'], req?: NextRequest) =>
    createAuditLog({ userId, action: SENSITIVE_ACTIONS.TWO_FA_CODE_USE, resource: '2fa', outcome }, req),
};

/**
 * Audit log retention and cleanup
 */
export async function cleanupAuditLogs(retentionDays: number = 365): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const supabase = await createClient();
    const { error, count } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw error;
    }

    logger.info('Audit logs cleaned up', {
      action: 'audit_logs_cleaned',
      metadata: { deletedCount: count, retentionDays },
    });

    return count || 0;
  } catch (error) {
    logger.error('Failed to cleanup audit logs', {
      action: 'audit_cleanup_failed',
      error: error as Error,
    });
    throw error;
  }
}