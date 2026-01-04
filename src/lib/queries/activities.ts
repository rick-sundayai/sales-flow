import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Tables } from '@/lib/types/database.types'

type Activity = Tables<'activities'>
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

const supabase = createClient()

// Query keys
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters: string) => [...activityKeys.lists(), { filters }] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
  byClient: (clientId: string) => [...activityKeys.all, 'client', clientId] as const,
  byDeal: (dealId: string) => [...activityKeys.all, 'deal', dealId] as const,
}

// Get all activities
export function useActivities() {
  return useQuery({
    queryKey: activityKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          client:clients(*),
          deal:deals(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

// Helper function to format timestamp as "2 hours ago"
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get recent activities (for dashboard)
export function useRecentActivities(limit = 10) {
  return useQuery({
    queryKey: [...activityKeys.lists(), 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          client:clients(*),
          deal:deals(*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Transform data to match Activity interface expected by components
      return data?.map((activity: any) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        timestamp: formatTimeAgo(activity.created_at),
        user: undefined, // Will default to "You" in the component
      })) || []
    },
  })
}

// Get activities by client
export function useActivitiesByClient(clientId: string) {
  return useQuery({
    queryKey: activityKeys.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Activity[]
    },
    enabled: !!clientId,
  })
}

// Get activities by deal
export function useActivitiesByDeal(dealId: string) {
  return useQuery({
    queryKey: activityKeys.byDeal(dealId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Activity[]
    },
    enabled: !!dealId,
  })
}

// Create activity
export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newActivity: ActivityInsert) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(newActivity)
        .select()
        .single()

      if (error) throw error
      return data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() })
    },
  })
}

// Update activity
export function useUpdateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ActivityUpdate }) => {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Activity
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() })
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(data.id) })
    },
  })
}

// Toggle activity completion
export function useToggleActivityComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('activities')
        .update({ completed })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() })
    },
  })
}

// Delete activity
export function useDeleteActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activities').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.lists() })
    },
  })
}
