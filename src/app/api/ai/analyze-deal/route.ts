/**
 * Deal Risk Analysis API endpoint
 * Server-side AI analysis using Google Gemini
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Input validation schema
const analyzeDealSchema = z.object({
  dealId: z.string().uuid('Invalid deal ID'),
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
    const validation = analyzeDealSchema.safeParse(body);

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

    const { dealId } = validation.data;

    // Fetch deal data with related information
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        client:clients (
          id,
          contact_name,
          company_name,
          status
        )
      `)
      .eq('id', dealId)
      .eq('user_id', user.id) // Ensure user owns this deal
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        {
          success: false,
          error: 'Deal not found',
        },
        { status: 404 }
      );
    }

    // Fetch recent activities for this deal
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', dealId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      logger.error('Failed to fetch deal activities', {
        action: 'deal_analysis_activities_failed',
        userId: user.id,
        dealId,
        error: activitiesError,
      });
    }

    // Initialize Gemini AI (server-side only!)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('Gemini API key not configured', {
        action: 'deal_analysis_no_api_key',
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

    // Build prompt for AI analysis
    const prompt = `
As a sales AI analyst, analyze this deal for potential risks and provide actionable insights.

DEAL INFORMATION:
- Title: ${deal.title}
- Value: $${deal.value?.toLocaleString() || 0}
- Stage: ${deal.stage}
- Probability: ${deal.probability}%
- Client: ${deal.client?.contact_name} at ${deal.client?.company_name || 'Unknown Company'}
- Client Status: ${deal.client?.status}

RECENT ACTIVITIES (${activities?.length || 0} activities):
${activities?.slice(0, 10).map((activity, i) => `
${i + 1}. [${activity.type}] ${activity.title}
   ${activity.description ? `Description: ${activity.description}` : ''}
   Status: ${activity.completed ? 'Completed' : 'Pending'}
   Date: ${new Date(activity.created_at).toLocaleDateString()}
`).join('') || 'No recent activities'}

Based on this information, provide a JSON response with the following structure:
{
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": ["factor1", "factor2", ...],
  "nextBestAction": "specific actionable recommendation",
  "confidence": 0.0 to 1.0
}

Focus on:
1. Activity patterns and engagement level
2. Deal stage vs. probability alignment
3. Time in current stage
4. Client status and relationship health
5. Deal value vs. typical close rates

Provide specific, actionable insights that will help close this deal.`;

    // Call Gemini AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error('Failed to parse AI response', {
        action: 'deal_analysis_parse_failed',
        userId: user.id,
        dealId,
        response: text,
        error: parseError,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to analyze deal',
        },
        { status: 500 }
      );
    }

    // Log successful analysis
    logger.info('Deal risk analysis completed', {
      action: 'deal_analysis_success',
      userId: user.id,
      dealId,
      metadata: {
        riskLevel: analysis.riskLevel,
        confidence: analysis.confidence,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        riskLevel: analysis.riskLevel,
        riskFactors: analysis.riskFactors || [],
        nextBestAction: analysis.nextBestAction || 'Follow up with the client',
        confidence: analysis.confidence || 0.7,
      },
    });
  } catch (error) {
    logger.error('Deal risk analysis failed', {
      action: 'deal_analysis_failed',
      error: error as Error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze deal',
      },
      { status: 500 }
    );
  }
}
