import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Tables, Enums } from '@/lib/types/database.types'
import { getDealStageProbability } from '@/lib/utils'

type Deal = Tables<'deals'>
type DealInsert = Database['public']['Tables']['deals']['Insert']
type DealUpdate = Database['public']['Tables']['deals']['Update']
type DealStage = Enums<'deal_stage'>

const supabase = createClient()

// Query keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: string) => [...dealKeys.lists(), { filters }] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
  byStage: (stage: DealStage) => [...dealKeys.all, 'stage', stage] as const,
}

// Get all deals
export function useDeals() {
  return useQuery({
    queryKey: dealKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

// Get deals by stage (for pipeline view)
export function useDealsByStage(stage: DealStage) {
  return useQuery({
    queryKey: dealKeys.byStage(stage),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('stage', stage)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

// Get pipeline summary
export function usePipelineSummary() {
  return useQuery({
    queryKey: ['pipeline_summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_summary')
        .select('*')
        .order('stage')

      if (error) throw error
      return data
    },
  })
}

// Get single deal
export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*),
          activities(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Create deal
export function useCreateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newDeal: DealInsert) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(newDeal)
        .select()
        .single()

      if (error) throw error
      return data as Deal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['pipeline_summary'] })
    },
  })
}

// Update deal
export function useUpdateDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DealUpdate }) => {
      const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Deal
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: ['pipeline_summary'] })
    },
  })
}

// Update deal stage (triggers database trigger for stage_changed_at)
export function useUpdateDealStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const newProbability = getDealStageProbability(stage);
      const { data, error } = await supabase
        .from('deals')
        .update({ 
          stage,
          probability: newProbability
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Deal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['pipeline_summary'] })
    },
  })
}

// Delete deal
export function useDeleteDeal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['pipeline_summary'] })
    },
  })
}
