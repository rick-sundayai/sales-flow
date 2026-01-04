/**
 * Destroy all user sessions API endpoint
 * Destroys all sessions for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { destroyAllUserSessions } from '@/lib/security/session-manager';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
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

    await destroyAllUserSessions(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'All sessions destroyed',
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
    logger.error('Failed to destroy all user sessions', {
      action: 'session_destroy_all_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to destroy all sessions',
      },
      { status: 500 }
    );
  }
}