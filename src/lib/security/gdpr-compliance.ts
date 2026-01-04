/**
 * GDPR Compliance utilities
 * Implements data protection and privacy rights under GDPR
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { createAuditLog, SENSITIVE_ACTIONS } from './audit-logger';

export interface DataExportRequest {
  userId: string;
  requestId: string;
  requestedAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
}

export interface DataDeletionRequest {
  userId: string;
  requestId: string;
  requestedAt: string;
  scheduledFor: string;
  completedAt?: string;
  status: 'pending' | 'scheduled' | 'processing' | 'completed' | 'cancelled';
  reason?: string;
}

export interface ConsentRecord {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'functional' | 'performance';
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PersonalDataSummary {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  clients: Array<{
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    createdAt: string;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
    createdAt: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
  auditLogs: Array<{
    action: string;
    resource: string;
    createdAt: string;
    ipAddress: string;
  }>;
}

/**
 * Generate a comprehensive data export for a user
 */
export async function generateDataExport(userId: string): Promise<PersonalDataSummary> {
  try {
    const supabase = await createClient();

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    // Get clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name, contact_name, email, phone, created_at')
      .eq('user_id', userId);

    // Get deals
    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, value, stage, created_at')
      .eq('user_id', userId);

    // Get activities
    const { data: activities } = await supabase
      .from('activities')
      .select('id, type, title, description, created_at')
      .eq('user_id', userId);

    // Get audit logs (last 90 days for privacy)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('action, resource, created_at, ip_address')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    const dataExport: PersonalDataSummary = {
      profile: {
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        email: profile?.email || '',
        createdAt: profile?.created_at || '',
        updatedAt: profile?.updated_at || '',
      },
      clients: clients || [],
      deals: deals || [],
      activities: activities || [],
      auditLogs: (auditLogs || []).map(log => ({
        action: log.action,
        resource: log.resource,
        createdAt: log.created_at,
        ipAddress: log.ip_address ? maskIpAddress(log.ip_address) : '',
      })),
    };

    logger.info('Data export generated', {
      action: 'gdpr_data_export_generated',
      userId,
      metadata: {
        clientsCount: dataExport.clients.length,
        dealsCount: dataExport.deals.length,
        activitiesCount: dataExport.activities.length,
        auditLogsCount: dataExport.auditLogs.length,
      },
    });

    return dataExport;
  } catch (error) {
    logger.error('Failed to generate data export', {
      action: 'gdpr_data_export_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Request data export (GDPR Article 20 - Right to data portability)
 */
export async function requestDataExport(userId: string, ipAddress?: string): Promise<string> {
  try {
    const supabase = await createClient();
    const requestId = crypto.randomUUID();

    // Check for existing pending requests
    const { data: existingRequests } = await supabase
      .from('data_export_requests')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      throw new Error('A data export request is already in progress');
    }

    // Create export request
    const { error } = await supabase
      .from('data_export_requests')
      .insert({
        id: requestId,
        user_id: userId,
        status: 'pending',
        requested_at: new Date().toISOString(),
        ip_address: ipAddress,
      });

    if (error) {
      throw error;
    }

    // Log the request
    await createAuditLog({
      userId,
      action: SENSITIVE_ACTIONS.EXPORT_DATA,
      resource: 'user_data',
      resourceId: requestId,
      outcome: 'success',
      details: { type: 'gdpr_data_export' },
    });

    logger.info('Data export requested', {
      action: 'gdpr_data_export_requested',
      userId,
      requestId,
      metadata: { ipAddress },
    });

    return requestId;
  } catch (error) {
    logger.error('Failed to request data export', {
      action: 'gdpr_data_export_request_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Request account deletion (GDPR Article 17 - Right to erasure)
 */
export async function requestAccountDeletion(
  userId: string,
  reason: string,
  ipAddress?: string
): Promise<string> {
  try {
    const supabase = await createClient();
    const requestId = crypto.randomUUID();

    // Check for existing pending requests
    const { data: existingRequests } = await supabase
      .from('data_deletion_requests')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['pending', 'scheduled', 'processing'])
      .limit(1);

    if (existingRequests && existingRequests.length > 0) {
      throw new Error('A deletion request is already pending');
    }

    // Schedule deletion for 30 days from now (grace period)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    // Create deletion request
    const { error } = await supabase
      .from('data_deletion_requests')
      .insert({
        id: requestId,
        user_id: userId,
        status: 'scheduled',
        reason,
        requested_at: new Date().toISOString(),
        scheduled_for: scheduledDate.toISOString(),
        ip_address: ipAddress,
      });

    if (error) {
      throw error;
    }

    // Log the request
    await createAuditLog({
      userId,
      action: SENSITIVE_ACTIONS.PROFILE_DELETE,
      resource: 'user_account',
      resourceId: requestId,
      outcome: 'success',
      details: { 
        type: 'gdpr_deletion_request',
        reason,
        scheduledFor: scheduledDate.toISOString(),
      },
    });

    logger.info('Account deletion requested', {
      action: 'gdpr_deletion_requested',
      userId,
      requestId,
      metadata: { 
        reason, 
        scheduledFor: scheduledDate.toISOString(),
        ipAddress,
      },
    });

    return requestId;
  } catch (error) {
    logger.error('Failed to request account deletion', {
      action: 'gdpr_deletion_request_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Cancel account deletion request
 */
export async function cancelAccountDeletion(userId: string, requestId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Update deletion request status
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('user_id', userId)
      .in('status', ['pending', 'scheduled']);

    if (error) {
      throw error;
    }

    // Log the cancellation
    await createAuditLog({
      userId,
      action: 'gdpr.deletion_cancelled',
      resource: 'user_account',
      resourceId: requestId,
      outcome: 'success',
    });

    logger.info('Account deletion cancelled', {
      action: 'gdpr_deletion_cancelled',
      userId,
      requestId,
    });
  } catch (error) {
    logger.error('Failed to cancel account deletion', {
      action: 'gdpr_deletion_cancel_failed',
      userId,
      requestId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Update user consent preferences
 */
export async function updateConsent(
  userId: string,
  consentType: ConsentRecord['consentType'],
  granted: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    const consentRecord: Partial<ConsentRecord> = {
      userId,
      consentType,
      granted,
      ipAddress,
      userAgent,
    };

    if (granted) {
      consentRecord.grantedAt = new Date().toISOString();
      consentRecord.revokedAt = undefined;
    } else {
      consentRecord.revokedAt = new Date().toISOString();
    }

    // Upsert consent record
    const { error } = await supabase
      .from('user_consent')
      .upsert({
        user_id: userId,
        consent_type: consentType,
        granted,
        granted_at: granted ? new Date().toISOString() : null,
        revoked_at: !granted ? new Date().toISOString() : null,
        ip_address: ipAddress,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,consent_type',
      });

    if (error) {
      throw error;
    }

    // Log consent change
    await createAuditLog({
      userId,
      action: `gdpr.consent_${granted ? 'granted' : 'revoked'}`,
      resource: 'user_consent',
      outcome: 'success',
      details: { consentType, granted },
    });

    logger.info('User consent updated', {
      action: 'gdpr_consent_updated',
      userId,
      metadata: { consentType, granted },
    });
  } catch (error) {
    logger.error('Failed to update consent', {
      action: 'gdpr_consent_update_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Get user consent preferences
 */
export async function getUserConsent(userId: string): Promise<Record<string, boolean>> {
  try {
    const supabase = await createClient();

    const { data: consents } = await supabase
      .from('user_consent')
      .select('consent_type, granted')
      .eq('user_id', userId);

    const consentMap: Record<string, boolean> = {
      marketing: false,
      analytics: false,
      functional: true, // Required for basic functionality
      performance: false,
    };

    if (consents) {
      consents.forEach(consent => {
        consentMap[consent.consent_type] = consent.granted;
      });
    }

    return consentMap;
  } catch (error) {
    logger.error('Failed to get user consent', {
      action: 'gdpr_consent_fetch_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Process scheduled account deletions
 */
export async function processScheduledDeletions(): Promise<number> {
  try {
    const supabase = await createClient();
    
    // Get deletions scheduled for today or earlier
    const { data: scheduledDeletions } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    let processedCount = 0;

    for (const deletion of scheduledDeletions || []) {
      try {
        await executeAccountDeletion(deletion.user_id, deletion.id);
        processedCount++;
      } catch (error) {
        logger.error('Failed to process scheduled deletion', {
          action: 'gdpr_scheduled_deletion_failed',
          userId: deletion.user_id,
          requestId: deletion.id,
          error: error as Error,
        });
      }
    }

    return processedCount;
  } catch (error) {
    logger.error('Failed to process scheduled deletions', {
      action: 'gdpr_scheduled_deletion_process_failed',
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Execute account deletion (actual data removal)
 */
async function executeAccountDeletion(userId: string, requestId: string): Promise<void> {
  const supabase = await createClient();

  // Start transaction-like operations
  try {
    // Update deletion request status
    await supabase
      .from('data_deletion_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    // Delete user data in order (respecting foreign key constraints)
    await supabase.from('activities').delete().eq('user_id', userId);
    await supabase.from('deals').delete().eq('user_id', userId);
    await supabase.from('clients').delete().eq('user_id', userId);
    await supabase.from('user_consent').delete().eq('user_id', userId);
    await supabase.from('user_profiles').delete().eq('user_id', userId);

    // Note: audit_logs are retained for compliance (anonymized)
    await supabase
      .from('audit_logs')
      .update({ user_id: null })
      .eq('user_id', userId);

    // Delete from auth.users (this will cascade to related tables)
    await supabase.auth.admin.deleteUser(userId);

    // Mark deletion as completed
    await supabase
      .from('data_deletion_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    logger.info('Account deletion completed', {
      action: 'gdpr_deletion_completed',
      userId,
      requestId,
    });
  } catch (error) {
    // Mark deletion as failed
    await supabase
      .from('data_deletion_requests')
      .update({ status: 'failed' })
      .eq('id', requestId);
    
    throw error;
  }
}

/**
 * Mask IP address for privacy (keep first 3 octets)
 */
function maskIpAddress(ipAddress: string): string {
  const parts = ipAddress.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  // For IPv6 or other formats, mask the last part
  const lastColonIndex = ipAddress.lastIndexOf(':');
  if (lastColonIndex !== -1) {
    return ipAddress.substring(0, lastColonIndex) + ':xxxx';
  }
  return 'masked';
}

/**
 * Generate privacy policy acceptance record
 */
export async function recordPrivacyPolicyAcceptance(
  userId: string,
  version: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('privacy_policy_acceptance')
      .insert({
        user_id: userId,
        policy_version: version,
        accepted_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      throw error;
    }

    logger.info('Privacy policy acceptance recorded', {
      action: 'gdpr_privacy_policy_accepted',
      userId,
      metadata: { version, ipAddress },
    });
  } catch (error) {
    logger.error('Failed to record privacy policy acceptance', {
      action: 'gdpr_privacy_policy_acceptance_failed',
      userId,
      error: error as Error,
    });
    throw error;
  }
}

/**
 * Data retention and cleanup utilities
 */
export const dataRetention = {
  /**
   * Clean up expired data export files
   */
  cleanupExpiredExports: async (): Promise<number> => {
    try {
      const supabase = await createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count } = await supabase
        .from('data_export_requests')
        .delete()
        .lt('completed_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed');

      return count || 0;
    } catch (error) {
      logger.error('Failed to cleanup expired exports', {
        action: 'gdpr_export_cleanup_failed',
        error: error as Error,
      });
      return 0;
    }
  },

  /**
   * Archive old consent records
   */
  archiveOldConsent: async (retentionDays: number = 1095): Promise<number> => {
    try {
      const supabase = await createClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Archive rather than delete for compliance
      const { count } = await supabase
        .from('user_consent')
        .update({ archived: true })
        .lt('updated_at', cutoffDate.toISOString())
        .eq('archived', false);

      return count || 0;
    } catch (error) {
      logger.error('Failed to archive old consent records', {
        action: 'gdpr_consent_archive_failed',
        error: error as Error,
      });
      return 0;
    }
  },
};