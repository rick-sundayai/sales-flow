/**
 * 2FA Verification API endpoint
 * Verifies TOTP code and activates 2FA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTOTP, validate2FASetup } from '@/lib/security/two-factor-auth';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
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
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid verification code format',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;

    // Get the temporary secret
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('two_factor_secret_temp, two_factor_backup_codes')
      .eq('id', user.id)
      .single();

    if (!profile?.two_factor_secret_temp) {
      return NextResponse.json(
        {
          success: false,
          error: '2FA setup not initiated. Please start the setup process first.',
        },
        { status: 400 }
      );
    }

    // Validate the setup
    const setupValidation = validate2FASetup(profile.two_factor_secret_temp, code);

    if (!setupValidation.isValid) {
      logger.warn('2FA verification failed during setup', {
        action: '2fa_verification_failed',
        userId: user.id,
        metadata: {
          error: setupValidation.error,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: setupValidation.error || 'Invalid verification code',
        },
        { status: 400 }
      );
    }

    // Activate 2FA by moving temp secret to active secret
    const { error: activateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_secret: profile.two_factor_secret_temp,
        two_factor_secret_temp: null,
        two_factor_enabled: true,
        two_factor_enabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (activateError) {
      logger.error('Failed to activate 2FA', {
        action: '2fa_activation_failed',
        userId: user.id,
        error: activateError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to activate 2FA',
        },
        { status: 500 }
      );
    }

    logger.info('2FA enabled successfully', {
      action: '2fa_enabled',
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully enabled',
      data: {
        backupCodes: profile.two_factor_backup_codes,
      },
    });
  } catch (error) {
    logger.error('2FA verification failed', {
      action: '2fa_verification_error',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify 2FA code',
      },
      { status: 500 }
    );
  }
}