/**
 * 2FA Setup API endpoint
 * Generates TOTP secret and QR code for 2FA setup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generate2FASecret } from '@/lib/security/two-factor-auth';
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

    // Check if 2FA is already enabled
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('two_factor_secret')
      .eq('id', user.id)
      .single();

    if (profile?.two_factor_secret) {
      return NextResponse.json(
        {
          success: false,
          error: '2FA is already enabled for this account',
        },
        { status: 400 }
      );
    }

    const twoFactorData = generate2FASecret(user.email!);

    // Store the temporary secret (not yet activated)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_secret_temp: twoFactorData.secret,
        two_factor_backup_codes: twoFactorData.backupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to store temporary 2FA secret', {
        action: '2fa_setup_storage_failed',
        userId: user.id,
        error: updateError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to setup 2FA',
        },
        { status: 500 }
      );
    }

    logger.info('2FA setup initiated', {
      action: '2fa_setup_initiated',
      userId: user.id,
      metadata: {
        email: user.email,
        backupCodesCount: twoFactorData.backupCodes.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: twoFactorData.secret,
        qrCodeUrl: twoFactorData.qrCode,
        backupCodes: twoFactorData.backupCodes,
      },
    });
  } catch (error) {
    logger.error('2FA setup failed', {
      action: '2fa_setup_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup 2FA',
      },
      { status: 500 }
    );
  }
}