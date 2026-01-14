/**
 * Generic AI Content Generation API endpoint
 * Server-side AI content generation using Google Gemini
 * Used for meeting prep, client insights, and other dynamic AI features
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { aiRateLimit } from '@/lib/security/rate-limiter';

// Input validation schema
const generateContentSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(10000, 'Prompt too long'),
  type: z.enum(['meeting-prep', 'client-insights', 'scheduling-suggestion', 'general']).default('general'),
  responseFormat: z.enum(['json', 'text']).default('json'),
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

    // Apply rate limiting (5 requests per minute per user)
    const rateLimitResult = await aiRateLimit(user.id);
    if (!rateLimitResult.success) {
      logger.warn('AI rate limit exceeded', {
        action: 'ai_content_rate_limited',
        userId: user.id,
        metadata: {
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset.toISOString(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.message,
          retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = generateContentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { prompt, type, responseFormat } = validation.data;

    // Initialize Gemini AI (server-side only!)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('Gemini API key not configured', {
        action: 'ai_content_no_api_key',
        userId: user.id,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'AI service not configured',
        },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Call Gemini AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse response based on expected format
    let data: unknown;
    if (responseFormat === 'json') {
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON found in AI response');
        }
        data = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON', {
          action: 'ai_content_parse_failed',
          userId: user.id,
          metadata: { type, responseFormat },
          error: parseError as Error,
        });

        // Return raw text as fallback
        data = { rawText: text };
      }
    } else {
      data = { text };
    }

    // Log successful generation
    logger.info('AI content generated successfully', {
      action: 'ai_content_success',
      userId: user.id,
      metadata: {
        type,
        responseFormat,
        promptLength: prompt.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        },
      }
    );
  } catch (error) {
    logger.error('AI content generation failed', {
      action: 'ai_content_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
      },
      { status: 500 }
    );
  }
}
