/**
 * 2FA Disable API endpoint
 * Disables 2FA after password confirmation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const disableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
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
    const validation = disableSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { password } = validation.data;

    // Verify password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (passwordError) {
      logger.warn('2FA disable attempt with incorrect password', {
        action: '2fa_disable_wrong_password',
        userId: user.id,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect password',
        },
        { status: 400 }
      );
    }

    // Check if 2FA is currently enabled
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (!profile?.two_factor_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: '2FA is not currently enabled',
        },
        { status: 400 }
      );
    }

    // Disable 2FA
    const { error: disableError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_secret_temp: null,
        two_factor_backup_codes: null,
        two_factor_disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (disableError) {
      logger.error('Failed to disable 2FA', {
        action: '2fa_disable_failed',
        userId: user.id,
        error: disableError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to disable 2FA',
        },
        { status: 500 }
      );
    }

    logger.info('2FA disabled successfully', {
      action: '2fa_disabled',
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully disabled',
    });
  } catch (error) {
    logger.error('2FA disable failed', {
      action: '2fa_disable_error',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to disable 2FA',
      },
      { status: 500 }
    );
  }
}