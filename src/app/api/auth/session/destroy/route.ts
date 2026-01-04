/**
 * Session destruction API endpoint
 * Destroys current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/security/session-manager';
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

    await destroySession(sessionId);

    const response = NextResponse.json({
      success: true,
      message: 'Session destroyed',
    });

    // Clear session cookie
    response.cookies.set({
      name: 'session-id',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    logger.error('Failed to destroy session', {
      action: 'session_destroy_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to destroy session',
      },
      { status: 500 }
    );
  }
}