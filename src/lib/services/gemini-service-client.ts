/**
 * Gemini AI Service - Client-side wrapper
 *
 * SECURITY NOTE: This is a client-side wrapper that calls secure server-side API routes.
 * The actual AI operations are performed server-side to protect API keys.
 *
 * Previous implementation (gemini-service.ts) exposed API keys to the client.
 * This has been replaced with secure API routes.
 */

export interface DealRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  nextBestAction: string;
  confidence: number;
}

export interface EmailDraft {
  subject: string;
  body: string;
  callToAction?: string;
  tone: 'professional' | 'friendly' | 'formal';
}

/**
 * Analyze deal risks using server-side AI
 */
export async function analyzeDealRisks(dealId: string): Promise<DealRiskAnalysis> {
  const response = await fetch('/api/ai/analyze-deal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dealId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze deal');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Generate email draft using server-side AI
 */
export async function generateEmailDraft(params: {
  tone: 'professional' | 'friendly' | 'formal';
  purpose: string;
  recipient: {
    name: string;
    company?: string;
    email: string;
  };
  context?: {
    dealTitle?: string;
    dealStage?: string;
    dealValue?: number;
    recentInteractions?: string;
  };
}): Promise<EmailDraft> {
  const response = await fetch('/api/ai/generate-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate email');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Client-side service wrapper for backward compatibility
 */
export class GeminiServiceClient {
  /**
   * @deprecated Use analyzeDealRisks() function instead
   */
  async analyzeDealRisks(dealData: {
    title: string;
    value: number;
    stage: string;
    probability: number;
    client: {
      contact_name: string;
      company_name?: string;
      status: string;
    };
    activities: Array<{
      type: string;
      title: string;
      description?: string;
      completed: boolean;
      created_at: string;
    }>;
  }): Promise<DealRiskAnalysis> {
    console.warn('GeminiServiceClient.analyzeDealRisks() is deprecated. This method is not secure and should not be used.');
    throw new Error('This method has been deprecated for security reasons. Please update your code to use the secure API routes.');
  }

  /**
   * @deprecated Use generateEmailDraft() function instead
   */
  async generateEmailDraft(context: {
    dealTitle: string;
    dealStage: string;
    clientName: string;
    clientRole?: string;
    companyName?: string;
    purpose: 'follow-up' | 'proposal' | 'closing' | 'check-in' | 'introduction';
    customInstructions?: string;
  }): Promise<EmailDraft> {
    console.warn('GeminiServiceClient.generateEmailDraft() is deprecated. This method is not secure and should not be used.');
    throw new Error('This method has been deprecated for security reasons. Please update your code to use the secure API routes.');
  }
}

// Export singleton instance for backward compatibility
// Components should migrate to using the standalone functions above
export const geminiService = new GeminiServiceClient();
