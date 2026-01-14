/**
 * Gemini AI Service - Server-side only
 *
 * SECURITY WARNING: This service should ONLY be imported by server-side code
 * (API routes, Server Components). Never import this in client components.
 *
 * For client-side AI functionality, use the secure client wrapper:
 * import { generateContent, analyzeDealRisks, generateEmailDraft } from '@/lib/services/gemini-service-client';
 *
 * The client wrapper calls secure API routes that handle API key protection
 * and rate limiting.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with server-side only API key
// SECURITY: Using GEMINI_API_KEY (without NEXT_PUBLIC_ prefix) ensures the key
// is never exposed to the client-side JavaScript bundle
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface DealRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  nextBestAction: string;
  confidence: number;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'formal';
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Analyze deal risks based on deal data and activity history
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
    const prompt = `
As a sales AI analyst, analyze this deal for potential risks and provide actionable insights.

DEAL INFORMATION:
- Title: ${dealData.title}
- Value: $${dealData.value.toLocaleString()}
- Stage: ${dealData.stage}
- Probability: ${dealData.probability}%
- Client: ${dealData.client.contact_name} at ${dealData.client.company_name || 'Unknown Company'}
- Client Status: ${dealData.client.status}

RECENT ACTIVITIES (${dealData.activities.length} activities):
${dealData.activities.slice(0, 10).map((activity, i) => `
${i + 1}. [${activity.type}] ${activity.title}
   ${activity.description ? `Description: ${activity.description}` : ''}
   Status: ${activity.completed ? 'Completed' : 'Pending'}
   Date: ${new Date(activity.created_at).toLocaleDateString()}
`).join('')}

ANALYSIS REQUIREMENTS:
1. Assess risk level (low/medium/high) based on:
   - Deal stage vs probability alignment
   - Activity frequency and quality
   - Client engagement patterns
   - Timeline concerns

2. Identify 2-4 specific risk factors

3. Recommend ONE specific next best action

4. Provide confidence score (0-100)

RESPONSE FORMAT (JSON only):
{
  "riskLevel": "low|medium|high",
  "riskFactors": ["factor 1", "factor 2", "factor 3"],
  "nextBestAction": "specific actionable recommendation",
  "confidence": 85
}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]) as DealRiskAnalysis;
      
      // Validate response structure
      if (!analysis.riskLevel || !analysis.riskFactors || !analysis.nextBestAction) {
        throw new Error('Invalid analysis structure');
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing deal risks:', error);
      // Fallback analysis
      return {
        riskLevel: 'medium',
        riskFactors: ['Unable to analyze due to API error'],
        nextBestAction: 'Schedule a follow-up call to assess deal status',
        confidence: 50
      };
    }
  }

  /**
   * Generate contextual email draft for a deal/client
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
    const prompt = `
As a professional sales communication expert, generate an email draft with the following context:

CONTEXT:
- Deal: ${context.dealTitle}
- Deal Stage: ${context.dealStage}
- Recipient: ${context.clientName}${context.clientRole ? ` (${context.clientRole})` : ''}
- Company: ${context.companyName || 'Unknown'}
- Email Purpose: ${context.purpose}
${context.customInstructions ? `- Special Instructions: ${context.customInstructions}` : ''}

REQUIREMENTS:
1. Professional but personable tone
2. Clear subject line (under 60 characters)
3. Concise body (2-4 paragraphs max)
4. Specific to the deal stage and purpose
5. Include a clear call-to-action
6. Use proper business email etiquette

RESPONSE FORMAT (JSON only):
{
  "subject": "Clear, specific subject line",
  "body": "Professional email body with proper formatting",
  "tone": "professional|friendly|formal"
}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const emailDraft = JSON.parse(jsonMatch[0]) as EmailDraft;
      
      // Validate response structure
      if (!emailDraft.subject || !emailDraft.body || !emailDraft.tone) {
        throw new Error('Invalid email draft structure');
      }

      return emailDraft;
    } catch (error) {
      console.error('Error generating email draft:', error);
      // Fallback email
      return {
        subject: `Following up on ${context.dealTitle}`,
        body: `Hi ${context.clientName},\n\nI wanted to follow up on our discussion regarding ${context.dealTitle}. I'd love to schedule a brief call to discuss next steps.\n\nPlease let me know your availability this week.\n\nBest regards`,
        tone: 'professional'
      };
    }
  }

  /**
   * Generate smart suggestions for deal next actions
   */
  async getSuggestions(dealData: {
    stage: string;
    lastActivity?: string;
    daysSinceLastContact?: number;
    probability: number;
  }): Promise<string[]> {
    const prompt = `
As a sales process expert, suggest 3-5 specific next actions for this deal:

DEAL STATUS:
- Current Stage: ${dealData.stage}
- Last Activity: ${dealData.lastActivity || 'None'}
- Days Since Last Contact: ${dealData.daysSinceLastContact || 'Unknown'}
- Win Probability: ${dealData.probability}%

Provide actionable, specific suggestions as a JSON array of strings:
["action 1", "action 2", "action 3"]
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found');
      }

      return JSON.parse(jsonMatch[0]) as string[];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [
        'Schedule follow-up call',
        'Send proposal or quote',
        'Address objections or concerns'
      ];
    }
  }

  /**
   * Generate content using the Gemini model
   */
  async generateContent(prompt: string) {
    return await this.model.generateContent(prompt);
  }
}

export const geminiService = new GeminiService();