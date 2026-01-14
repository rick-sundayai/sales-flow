/**
 * Zod validation schemas for SalesFlow CRM
 * Provides type-safe data validation for forms and API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format').optional().or(z.literal(''));
export const phoneSchema = z.string().optional().or(z.literal(''));
export const urlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));

// ============================================================================
// Client Schemas
// ============================================================================

export const clientStatusSchema = z.enum(['prospect', 'active', 'inactive', 'churned']);

export const createClientSchema = z.object({
  contact_name: z.string().min(1, 'Contact name is required').max(100, 'Contact name too long'),
  email: emailSchema,
  phone: phoneSchema,
  company_name: z.string().max(100, 'Company name too long').optional(),
  status: clientStatusSchema.default('prospect'),
  industry: z.string().max(50, 'Industry name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: uuidSchema,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================================================
// Company Schemas
// ============================================================================

export const addressSchema = z.object({
  street: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
}).optional();

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  website: urlSchema,
  linkedin_url: urlSchema,
  industry: z.string().max(50, 'Industry too long').optional(),
  employee_count: z.number().int().min(1).max(1000000).optional(),
  address: addressSchema,
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: uuidSchema,
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// ============================================================================
// Deal Schemas
// ============================================================================

export const dealStageSchema = z.enum([
  'lead', 
  'qualified', 
  'proposal', 
  'negotiation', 
  'closed_won', 
  'closed_lost'
]);

export const dealPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createDealSchema = z.object({
  title: z.string().min(1, 'Deal title is required').max(100, 'Deal title too long'),
  value: z.number().min(0, 'Value must be positive').max(10000000, 'Value too large'),
  stage: dealStageSchema.default('lead'),
  priority: dealPrioritySchema.default('medium'),
  probability: z.number().int().min(0, 'Probability must be 0-100').max(100, 'Probability must be 0-100'),
  expected_close_date: z.string().datetime('Invalid date format'),
  client_id: uuidSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: uuidSchema,
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;

// ============================================================================
// Activity Schemas
// ============================================================================

export const activityTypeSchema = z.enum(['email', 'call', 'meeting', 'task', 'note']);

export const createActivitySchema = z.object({
  type: activityTypeSchema,
  title: z.string().min(1, 'Activity title is required').max(100, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  client_id: uuidSchema.optional(),
  deal_id: uuidSchema.optional(),
  completed: z.boolean().default(false),
  due_date: z.string().datetime('Invalid date format').optional(),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: uuidSchema,
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

// ============================================================================
// User Profile Schemas
// ============================================================================

export const updateUserProfileSchema = z.object({
  id: uuidSchema,
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  avatar_url: urlSchema,
  phone: phoneSchema,
  company: z.string().max(100, 'Company name too long').optional(),
  job_title: z.string().max(100, 'Job title too long').optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

// ============================================================================
// Email Schemas
// ============================================================================

export const composeEmailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  body: z.string().min(1, 'Email body is required').max(10000, 'Email body too long'),
  attachments: z.array(z.string()).optional(),
});

export type ComposeEmailInput = z.infer<typeof composeEmailSchema>;

// ============================================================================
// Search and Filter Schemas
// ============================================================================

export const searchQuerySchema = z.object({
  query: z.string().max(100, 'Search query too long').optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export const clientFilterSchema = searchQuerySchema.extend({
  status: clientStatusSchema.optional(),
  company: z.string().max(100).optional(),
});

export const dealFilterSchema = searchQuerySchema.extend({
  stage: dealStageSchema.optional(),
  priority: dealPrioritySchema.optional(),
  client_id: uuidSchema.optional(),
  min_value: z.number().min(0).optional(),
  max_value: z.number().min(0).optional(),
});

export const activityFilterSchema = searchQuerySchema.extend({
  type: activityTypeSchema.optional(),
  completed: z.boolean().optional(),
  client_id: uuidSchema.optional(),
  deal_id: uuidSchema.optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type ClientFilterInput = z.infer<typeof clientFilterSchema>;
export type DealFilterInput = z.infer<typeof dealFilterSchema>;
export type ActivityFilterInput = z.infer<typeof activityFilterSchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.any().optional(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

export const apiResponseSchema = z.union([successResponseSchema, errorResponseSchema]);

export type ApiResponse<T = any> = {
  success: true;
  message: string;
  data?: T;
} | {
  success: false;
  error: string;
  details?: any;
};

// ============================================================================
// Environment Validation Schema
// ============================================================================

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // GEMINI_API_KEY is server-side only (no NEXT_PUBLIC_ prefix) for security
  // It is NOT validated here since it's not exposed to the client
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
});

export type EnvConfig = z.infer<typeof envSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodError;
} {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Safely parses data and returns undefined on validation failure
 */
export function safeParseData<T>(schema: z.ZodSchema<T>, data: unknown): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Formats Zod validation errors for user display
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  for (const error of errors.errors) {
    const path = error.path.join('.');
    formatted[path] = error.message;
  }
  
  return formatted;
}