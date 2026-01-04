/**
 * CSRF Token API endpoint
 * Provides CSRF tokens for client-side requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFToken, CSRF_TOKEN_NAME } from '@/lib/security/csrf-protection';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const token = generateCSRFToken();
    
    const response = NextResponse.json({
      success: true,
      token,
    });

    // Set CSRF token in httpOnly cookie
    response.cookies.set({
      name: CSRF_TOKEN_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    logger.info('CSRF token generated', {
      action: 'csrf_token_generated',
      metadata: {
        userAgent: req.headers.get('user-agent'),
      },
    });

    return response;
  } catch (error) {
    logger.error('Failed to generate CSRF token', {
      action: 'csrf_token_generation_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}