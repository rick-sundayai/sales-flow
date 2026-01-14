// Generated database types for Supabase
// Based on crm-schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          contact_name: string
          email: string | null
          phone: string | null
          company_name: string | null
          status: 'prospect' | 'active' | 'inactive' | 'churned'
          last_contact_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_name: string
          email?: string | null
          phone?: string | null
          company_name?: string | null
          status?: 'prospect' | 'active' | 'inactive' | 'churned'
          last_contact_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_name?: string
          email?: string | null
          phone?: string | null
          company_name?: string | null
          status?: 'prospect' | 'active' | 'inactive' | 'churned'
          last_contact_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          user_id: string
          client_id: string
          title: string
          value: number
          stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability: number
          priority: 'low' | 'medium' | 'high'
          expected_close_date: string | null
          actual_close_date: string | null
          stage_changed_at: string | null
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          title: string
          value: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          priority?: 'low' | 'medium' | 'high'
          expected_close_date?: string | null
          actual_close_date?: string | null
          stage_changed_at?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          title?: string
          value?: number
          stage?: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          probability?: number
          priority?: 'low' | 'medium' | 'high'
          expected_close_date?: string | null
          actual_close_date?: string | null
          stage_changed_at?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          deal_id: string | null
          type: 'email' | 'call' | 'meeting' | 'task' | 'note'
          title: string
          description: string | null
          completed: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          deal_id?: string | null
          type: 'email' | 'call' | 'meeting' | 'task' | 'note'
          title: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          deal_id?: string | null
          type?: 'email' | 'call' | 'meeting' | 'task' | 'note'
          title?: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          deal_id: string | null
          title: string
          description: string | null
          attendees: string[]
          start_time: string
          end_time: string
          meeting_type: 'video' | 'in-person' | 'phone'
          location: string | null
          meeting_url: string | null
          google_calendar_id: string | null
          google_meet_url: string | null
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          deal_id?: string | null
          title: string
          description?: string | null
          attendees?: string[]
          start_time: string
          end_time: string
          meeting_type?: 'video' | 'in-person' | 'phone'
          location?: string | null
          meeting_url?: string | null
          google_calendar_id?: string | null
          google_meet_url?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          deal_id?: string | null
          title?: string
          description?: string | null
          attendees?: string[]
          start_time?: string
          end_time?: string
          meeting_type?: 'video' | 'in-person' | 'phone'
          location?: string | null
          meeting_url?: string | null
          google_calendar_id?: string | null
          google_meet_url?: string | null
          status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      automations: {
        Row: {
          id: string
          user_id: string
          name: string
          trigger_type: 'deal_stage_changed' | 'client_created' | 'activity_due' | 'meeting_scheduled'
          action_type: 'send_email' | 'create_task' | 'update_deal' | 'webhook'
          n8n_webhook_url: string | null
          is_active: boolean
          total_runs: number
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          trigger_type: 'deal_stage_changed' | 'client_created' | 'activity_due' | 'meeting_scheduled'
          action_type: 'send_email' | 'create_task' | 'update_deal' | 'webhook'
          n8n_webhook_url?: string | null
          is_active?: boolean
          total_runs?: number
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          trigger_type?: 'deal_stage_changed' | 'client_created' | 'activity_due' | 'meeting_scheduled'
          action_type?: 'send_email' | 'create_task' | 'update_deal' | 'webhook'
          n8n_webhook_url?: string | null
          is_active?: boolean
          total_runs?: number
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      emails: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          gmail_message_id: string | null
          gmail_thread_id: string | null
          subject: string | null
          from_email: string
          to_email: string[]
          cc_email: string[]
          bcc_email: string[]
          body_text: string | null
          body_html: string | null
          sent_at: string | null
          received_at: string | null
          is_read: boolean
          labels: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          subject?: string | null
          from_email: string
          to_email?: string[]
          cc_email?: string[]
          bcc_email?: string[]
          body_text?: string | null
          body_html?: string | null
          sent_at?: string | null
          received_at?: string | null
          is_read?: boolean
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          gmail_message_id?: string | null
          gmail_thread_id?: string | null
          subject?: string | null
          from_email?: string
          to_email?: string[]
          cc_email?: string[]
          bcc_email?: string[]
          body_text?: string | null
          body_html?: string | null
          sent_at?: string | null
          received_at?: string | null
          is_read?: boolean
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          description: string | null
          linkedin_url: string
          website_url: string | null
          logo_url: string | null
          employee_count: number | null
          address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          linkedin_url: string
          website_url?: string | null
          logo_url?: string | null
          employee_count?: number | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          linkedin_url?: string
          website_url?: string | null
          logo_url?: string | null
          employee_count?: number | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      job_postings: {
        Row: {
          id: string
          created_at: string | null
          updated_at: string | null
          company_id: string | null
          company_name: string | null
          title: string
          job_link: string
          location: string | null
          salary_range: string | null
          posted_date: string | null
          description: string | null
          priority_score: number | null
          priority_reasoning: string | null
          status: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'interviewing' | 'placed' | 'closed' | null
          source: string | null
          raw_data: Json | null
          outreach_status: 'pending' | 'draft_created' | 'sent' | 'replied' | 'bounced' | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          company_id?: string | null
          company_name?: string | null
          title: string
          job_link: string
          location?: string | null
          salary_range?: string | null
          posted_date?: string | null
          description?: string | null
          priority_score?: number | null
          priority_reasoning?: string | null
          status?: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'interviewing' | 'placed' | 'closed' | null
          source?: string | null
          raw_data?: Json | null
          outreach_status?: 'pending' | 'draft_created' | 'sent' | 'replied' | 'bounced' | null
        }
        Update: {
          id?: string
          created_at?: string | null
          updated_at?: string | null
          company_id?: string | null
          company_name?: string | null
          title?: string
          job_link?: string
          location?: string | null
          salary_range?: string | null
          posted_date?: string | null
          description?: string | null
          priority_score?: number | null
          priority_reasoning?: string | null
          status?: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'interviewing' | 'placed' | 'closed' | null
          source?: string | null
          raw_data?: Json | null
          outreach_status?: 'pending' | 'draft_created' | 'sent' | 'replied' | 'bounced' | null
        }
      }
      leads: {
        Row: {
          id: string
          assigned_to: string
          job_title: string
          company_name: string
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          location: string | null
          remote_type: 'remote' | 'hybrid' | 'onsite' | null
          summary: string | null
          description: string | null
          requirements: string[]
          benefits: string[]
          source: string | null
          source_url: string | null
          is_enriched: boolean
          enrichment_data: Json | null
          status: 'new' | 'skipped' | 'rejected' | 'converted'
          skipped_at: string | null
          rejected_at: string | null
          converted_at: string | null
          converted_to_deal_id: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assigned_to: string
          job_title: string
          company_name: string
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          location?: string | null
          remote_type?: 'remote' | 'hybrid' | 'onsite' | null
          summary?: string | null
          description?: string | null
          requirements?: string[]
          benefits?: string[]
          source?: string | null
          source_url?: string | null
          is_enriched?: boolean
          enrichment_data?: Json | null
          status?: 'new' | 'skipped' | 'rejected' | 'converted'
          skipped_at?: string | null
          rejected_at?: string | null
          converted_at?: string | null
          converted_to_deal_id?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assigned_to?: string
          job_title?: string
          company_name?: string
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          location?: string | null
          remote_type?: 'remote' | 'hybrid' | 'onsite' | null
          summary?: string | null
          description?: string | null
          requirements?: string[]
          benefits?: string[]
          source?: string | null
          source_url?: string | null
          is_enriched?: boolean
          enrichment_data?: Json | null
          status?: 'new' | 'skipped' | 'rejected' | 'converted'
          skipped_at?: string | null
          rejected_at?: string | null
          converted_at?: string | null
          converted_to_deal_id?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      client_summary: {
        Row: {
          id: string
          user_id: string
          contact_name: string
          email: string | null
          phone: string | null
          company_name: string | null
          status: 'prospect' | 'active' | 'inactive' | 'churned'
          last_contact_at: string | null
          active_deals_count: number
          total_deals_count: number
          active_deals_value: number
          total_deals_value: number
          total_activities_count: number
        }
      }
      pipeline_summary: {
        Row: {
          user_id: string
          stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
          deal_count: number
          total_value: number
          avg_value: number
          avg_probability: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_status: 'prospect' | 'active' | 'inactive' | 'churned'
      deal_stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
      deal_priority: 'low' | 'medium' | 'high'
      activity_type: 'email' | 'call' | 'meeting' | 'task' | 'note'
      meeting_type: 'in_person' | 'video' | 'phone'
      meeting_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
      automation_trigger_type: 'deal_stage_changed' | 'client_created' | 'activity_due' | 'meeting_scheduled'
      automation_action_type: 'send_email' | 'create_task' | 'update_deal' | 'webhook'
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
