/**
 * DEPRECATED: This file has been deprecated for security reasons.
 *
 * SECURITY ISSUE: This implementation exposed the Gemini API key to the client-side
 * by using process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY.
 *
 * MIGRATION GUIDE:
 * =================
 *
 * For SERVER-SIDE usage:
 * - Use /api/ai/analyze-deal API route for deal risk analysis
 * - Use /api/ai/generate-email API route for email generation
 *
 * For CLIENT-SIDE usage:
 * - Import from '@/lib/services/gemini-service-client'
 * - Use analyzeDealRisks(dealId) function
 * - Use generateEmailDraft(params) function
 *
 * Example migration:
 *
 * OLD (INSECURE):
 * ```typescript
 * import { geminiService } from '@/lib/services/gemini-service'
 * const analysis = await geminiService.analyzeDealRisks(dealData)
 * ```
 *
 * NEW (SECURE):
 * ```typescript
 * import { analyzeDealRisks } from '@/lib/services/gemini-service-client'
 * const analysis = await analyzeDealRisks(dealId)
 * ```
 *
 * This file is kept for reference only.
 * All imports should be updated to use the new client wrapper.
 */

// Original insecure implementation moved to this file for reference
// DO NOT USE THIS IN PRODUCTION

export {};
