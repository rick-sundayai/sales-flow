/**
 * GDPR Data Export API endpoint
 * Handles data export requests (GDPR Article 20 - Right to data portability)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDataExport, requestDataExport } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
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

    // Get client IP for audit trail
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    // ✅ Correct: Rely on standard headers
const ipAddress = forwarded?.split(',')[0] || realIp || undefined;;

    const requestId = await requestDataExport(user.id, ipAddress);

    // Generate the export data immediately for small datasets
    // In production, this might be queued for background processing
    try {
      const exportData = await generateDataExport(user.id);
      
      // Update the request with completion
      const { error: updateError } = await supabase
        .from('data_export_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          file_size: JSON.stringify(exportData).length,
        })
        .eq('id', requestId);

      if (updateError) {
        logger.error('Failed to update export request', {
          action: 'gdpr_export_update_failed',
          userId: user.id,
          error: updateError,
        });
      }

      return NextResponse.json({
        success: true,
        requestId,
        data: exportData,
        message: 'Data export completed successfully',
      });
    } catch (exportError) {
      // Update request status to failed
      await supabase
        .from('data_export_requests')
        .update({ status: 'failed' })
        .eq('id', requestId);

      throw exportError;
    }
  } catch (error) {
    logger.error('Failed to process data export request', {
      action: 'gdpr_export_request_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process data export request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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

    // Get user's export requests
    const { data: exportRequests, error: requestsError } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      throw requestsError;
    }

    return NextResponse.json({
      success: true,
      requests: exportRequests || [],
    });
  } catch (error) {
    logger.error('Failed to fetch export requests', {
      action: 'gdpr_export_requests_fetch_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch export requests',
      },
      { status: 500 }
    );
  }
}