/**
 * Session refresh API endpoint
 * Updates session activity timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshSession } from '@/lib/security/session-manager';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('session-id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No session found',
        },
        { status: 401 }
      );
    }

    const success = await refreshSession(sessionId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session activity refreshed',
    });
  } catch (error) {
    logger.error('Failed to refresh session', {
      action: 'session_refresh_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh session',
      },
      { status: 500 }
    );
  }
}