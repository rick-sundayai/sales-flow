import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, Tables } from '@/lib/types/database.types'

type Meeting = Tables<'meetings'>
type MeetingInsert = Database['public']['Tables']['meetings']['Insert']
type MeetingUpdate = Database['public']['Tables']['meetings']['Update']

const supabase = createClient()

// Query keys
export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters: string) => [...meetingKeys.lists(), { filters }] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
  upcoming: () => [...meetingKeys.all, 'upcoming'] as const,
}

// Get all meetings
export function useMeetings() {
  return useQuery({
    queryKey: meetingKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:clients(*)
        `)
        .order('start_time', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

// Get upcoming meetings
export function useUpcomingMeetings(limit = 5) {
  return useQuery({
    queryKey: [...meetingKeys.upcoming(), limit],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:clients(*)
        `)
        .gte('start_time', now)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(limit)

      if (error) throw error

      // Transform data to match Meeting interface expected by components
      return data?.map((meeting: any) => {
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(meeting.end_time);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMins = Math.floor(durationMs / (1000 * 60));

        return {
          id: meeting.id,
          title: meeting.title,
          attendee: meeting.client?.contact_name,
          company: meeting.client?.company_name,
          date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          duration: `${durationMins} min`,
          type: meeting.meeting_type === 'video' ? 'video' : 'in-person',
        };
      }) || []
    },
  })
}

// Get single meeting
export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

// Create meeting
export function useCreateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newMeeting: MeetingInsert) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert(newMeeting)
        .select()
        .single()

      if (error) throw error
      return data as Meeting
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() })
    },
  })
}

// Update meeting
export function useUpdateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MeetingUpdate }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Meeting
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() })
    },
  })
}

// Delete meeting
export function useDeleteMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: meetingKeys.upcoming() })
    },
  })
}
