/**
 * GDPR Account Deletion API endpoint
 * Handles account deletion requests (GDPR Article 17 - Right to erasure)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requestAccountDeletion, cancelAccountDeletion } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const deletionRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters'),
});

const cancelDeletionSchema = z.object({
  requestId: z.string().uuid(),
});

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

    const body = await req.json();
    const validation = deletionRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Get client IP for audit trail
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';

    const requestId = await requestAccountDeletion(user.id, reason, ipAddress);

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Account deletion has been scheduled for 30 days from now. You will receive a confirmation email with cancellation instructions.',
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    logger.error('Failed to process account deletion request', {
      action: 'gdpr_deletion_request_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process account deletion request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const body = await req.json();
    const validation = cancelDeletionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { requestId } = validation.data;

    await cancelAccountDeletion(user.id, requestId);

    return NextResponse.json({
      success: true,
      message: 'Account deletion request has been cancelled successfully.',
    });
  } catch (error) {
    logger.error('Failed to cancel account deletion request', {
      action: 'gdpr_deletion_cancel_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel deletion request',
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

    // Get user's deletion requests
    const { data: deletionRequests, error: requestsError } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (requestsError) {
      throw requestsError;
    }

    return NextResponse.json({
      success: true,
      requests: deletionRequests || [],
    });
  } catch (error) {
    logger.error('Failed to fetch deletion requests', {
      action: 'gdpr_deletion_requests_fetch_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deletion requests',
      },
      { status: 500 }
    );
  }
}