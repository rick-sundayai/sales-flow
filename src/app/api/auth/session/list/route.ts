/**
 * List user sessions API endpoint
 * Returns active sessions for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions } from '@/lib/security/session-manager';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    const sessions = await getUserSessions(user.id);

    // Remove sensitive data before sending to client
    const safeSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress ? 
        // Mask IP for privacy (show only first 3 octets)
        session.ipAddress.split('.').slice(0, 3).join('.') + '.xxx' : 
        undefined,
    }));

    return NextResponse.json({
      success: true,
      sessions: safeSessions,
    });
  } catch (error) {
    logger.error('Failed to list user sessions', {
      action: 'session_list_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list sessions',
      },
      { status: 500 }
    );
  }
}