/**
 * Email Generation API endpoint
 * Server-side AI email composition using Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Input validation schema
const generateEmailSchema = z.object({
  tone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
  purpose: z.string().min(5, 'Purpose must be at least 5 characters').max(500),
  recipient: z.object({
    name: z.string(),
    company: z.string().optional(),
    email: z.string().email(),
  }),
  context: z.object({
    dealTitle: z.string().optional(),
    dealStage: z.string().optional(),
    dealValue: z.number().optional(),
    recentInteractions: z.string().optional(),
  }).optional(),
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

    // Validate request body
    const body = await req.json();
    const validation = generateEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { tone, purpose, recipient, context } = validation.data;

    // Initialize Gemini AI (server-side only!)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('Gemini API key not configured', {
        action: 'email_generation_no_api_key',
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

    // Build prompt for AI email generation
    const toneDescriptions = {
      professional: 'Professional and business-appropriate',
      friendly: 'Warm and approachable while remaining professional',
      formal: 'Formal and respectful, suitable for executives',
    };

    const prompt = `
Generate a ${toneDescriptions[tone]} business email with the following details:

RECIPIENT:
- Name: ${recipient.name}
- Company: ${recipient.company || 'their organization'}
- Email: ${recipient.email}

PURPOSE:
${purpose}

${context ? `
ADDITIONAL CONTEXT:
${context.dealTitle ? `- Deal: ${context.dealTitle}` : ''}
${context.dealStage ? `- Current Stage: ${context.dealStage}` : ''}
${context.dealValue ? `- Deal Value: $${context.dealValue.toLocaleString()}` : ''}
${context.recentInteractions ? `- Recent Interactions: ${context.recentInteractions}` : ''}
` : ''}

REQUIREMENTS:
1. Tone: ${tone}
2. Include a clear call-to-action
3. Keep it concise (200-300 words)
4. Professional formatting
5. Personalized to the recipient
6. Focus on value proposition

Provide the response as JSON with this structure:
{
  "subject": "Email subject line",
  "body": "Email body with proper formatting (use \\n for line breaks)",
  "callToAction": "Clear next step for recipient"
}

The email should feel natural, not AI-generated. Avoid clichés and generic phrases.`;

    // Call Gemini AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let emailDraft;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      emailDraft = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error('Failed to parse AI response', {
        action: 'email_generation_parse_failed',
        userId: user.id,
        response: text,
        error: parseError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate email',
        },
        { status: 500 }
      );
    }

    // Log successful generation
    logger.info('Email generated successfully', {
      action: 'email_generation_success',
      userId: user.id,
      metadata: {
        tone,
        recipient: recipient.email,
        hasContext: !!context,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subject: emailDraft.subject || 'Follow Up',
        body: emailDraft.body || '',
        callToAction: emailDraft.callToAction || 'Please let me know your thoughts.',
        tone,
      },
    });
  } catch (error) {
    logger.error('Email generation failed', {
      action: 'email_generation_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate email',
      },
      { status: 500 }
    );
  }
}
