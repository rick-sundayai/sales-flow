/**
 * 2FA Status API endpoint
 * Returns current 2FA status for the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { TwoFactorStatus } from '@/lib/security/two-factor-auth';

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

    // Get 2FA status from user profile
    // First check if the profile exists and has 2FA columns
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      // If no profile found, return 2FA as disabled (user needs to complete setup)
      if (profileError.code === 'PGRST116') {
        const status: TwoFactorStatus = {
          isEnabled: false,
          isConfigured: false,
          backupCodesRemaining: undefined,
          lastUsed: undefined,
        };
        return NextResponse.json({ success: true, status });
      }

      logger.error('Failed to fetch 2FA status', {
        action: '2fa_status_fetch_failed',
        userId: user.id,
        error: profileError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch 2FA status',
        },
        { status: 500 }
      );
    }

    // Check if 2FA columns exist (they may not if migration wasn't run)
    const isEnabled = profile?.two_factor_enabled ?? false;
    const isConfigured = !!(profile?.two_factor_secret || profile?.two_factor_secret_temp);
    const backupCodesRemaining = profile?.two_factor_backup_codes?.length ?? 0;

    const status: TwoFactorStatus = {
      isEnabled,
      isConfigured,
      backupCodesRemaining: isEnabled ? backupCodesRemaining : undefined,
      lastUsed: profile?.two_factor_last_used || undefined,
    };

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error('2FA status check failed', {
      action: '2fa_status_error',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check 2FA status',
      },
      { status: 500 }
    );
  }
}