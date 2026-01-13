'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/database.types'

type JobPosting = Tables<'job_postings'>

// Query keys
export const leadsKeys = {
  all: ['job_postings'] as const,
  new: () => [...leadsKeys.all, 'new'] as const,
  byId: (id: string) => [...leadsKeys.all, id] as const,
}

// Fetch new job postings (leads)
export function useNewLeads() {
  return useQuery({
    queryKey: leadsKeys.new(),
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as JobPosting[]
    },
  })
}

// Get count of new job postings
export function useNewLeadCount() {
  return useQuery({
    queryKey: [...leadsKeys.new(), 'count'],
    queryFn: async () => {
      const supabase = createClient()

      const { count, error } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')

      if (error) throw error
      return count || 0
    },
  })
}

// Update job posting status to 'disqualified' (skip)
export function useSkipLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('job_postings')
        .update({
          status: 'disqualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.new() })
    },
  })
}

// Update job posting status to 'disqualified' (reject)
export function useRejectLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('job_postings')
        .update({
          status: 'disqualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.new() })
    },
  })
}

// Convert job posting to deal (add to pipeline)
export function useConvertLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leadId, clientId }: { leadId: string; clientId: string }) => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get the job posting data
      const { data: jobPosting, error: jobError } = await supabase
        .from('job_postings')
        .select('*, companies(name)')
        .eq('id', leadId)
        .single()

      if (jobError) throw jobError

      // Extract salary value from salary_range if available
      let dealValue = 0
      if (jobPosting.salary_range) {
        // Try to extract numbers from salary range (e.g., "$100,000 - $150,000")
        const matches = jobPosting.salary_range.match(/\d+/g)
        if (matches && matches.length > 0) {
          // Use the first number found
          dealValue = parseInt(matches[0].replace(/,/g, ''))
        }
      }

      // Get company name
      const companyName = (jobPosting.companies as any)?.name || 'Unknown Company'

      // Create a new deal from the job posting
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          client_id: clientId,
          title: jobPosting.title,
          value: dealValue,
          stage: 'lead',
          probability: 30,
          priority: jobPosting.priority_score && jobPosting.priority_score >= 80 ? 'high' : 'medium',
          notes: `Converted from job posting.\n\nCompany: ${companyName}\nLocation: ${jobPosting.location || 'N/A'}\nSalary Range: ${jobPosting.salary_range || 'N/A'}\n\n${jobPosting.description || ''}`,
        })
        .select()
        .single()

      if (dealError) throw dealError

      // Update job posting status to 'contacted'
      const { error: updateError } = await supabase
        .from('job_postings')
        .update({
          status: 'contacted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      return { jobPosting, deal }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.new() })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },
  })
}

// Request enrichment for a job posting (calls n8n webhook)
export function useEnrichLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadId: string) => {
      // Call Next.js API route that triggers n8n webhook
      const response = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      })

      if (!response.ok) {
        throw new Error('Failed to trigger enrichment')
      }

      return response.json()
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.byId(leadId) })
    },
  })
}
