/**
 * GDPR Consent Management API endpoint
 * Handles user consent preferences (GDPR Article 7 - Conditions for consent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateConsent, getUserConsent } from '@/lib/security/gdpr-compliance';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const consentUpdateSchema = z.object({
  consentType: z.enum(['marketing', 'analytics', 'functional', 'performance']),
  granted: z.boolean(),
});

const batchConsentUpdateSchema = z.object({
  consents: z.array(z.object({
    consentType: z.enum(['marketing', 'analytics', 'functional', 'performance']),
    granted: z.boolean(),
  })),
});

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

    const consents = await getUserConsent(user.id);

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error) {
    logger.error('Failed to fetch user consent', {
      action: 'gdpr_consent_fetch_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch consent preferences',
      },
      { status: 500 }
    );
  }
}

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
    
    // Check if this is a batch update or single consent update
    let validationResult;
    let isBatch = false;
    
    if (body.consents && Array.isArray(body.consents)) {
      validationResult = batchConsentUpdateSchema.safeParse(body);
      isBatch = true;
    } else {
      validationResult = consentUpdateSchema.safeParse(body);
    }

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid consent data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    // Get client information for audit trail
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || req.ip;
    const userAgent = req.headers.get('user-agent');

    if (isBatch) {
      const { consents } = validationResult.data as { consents: Array<{ consentType: any; granted: boolean }> };
      
      // Process all consent updates
      for (const consent of consents) {
        await updateConsent(
          user.id,
          consent.consentType,
          consent.granted,
          ipAddress,
          userAgent
        );
      }

      logger.info('Batch consent update completed', {
        action: 'gdpr_batch_consent_updated',
        userId: user.id,
        metadata: {
          consentCount: consents.length,
          ipAddress,
        },
      });

      return NextResponse.json({
        success: true,
        message: `${consents.length} consent preferences updated successfully`,
      });
    } else {
      const { consentType, granted } = validationResult.data as { consentType: any; granted: boolean };

      await updateConsent(
        user.id,
        consentType,
        granted,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        message: `Consent for ${consentType} ${granted ? 'granted' : 'revoked'} successfully`,
      });
    }
  } catch (error) {
    logger.error('Failed to update user consent', {
      action: 'gdpr_consent_update_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update consent preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Alias for POST to support different client preferences
  return POST(req);
}