'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'recruiter']),
})

export async function inviteUserAction(formData: FormData) {
  // 1. Verify the Current User is an Admin 
  // TODO: Uncomment this block once you have your first Admin user set up in production.
  /*
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Insufficient permissions' }
  */

  // 2. Initialize Admin Client
  // This client bypasses RLS to create users directly
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 3. Parse Data
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  
  const validated = InviteSchema.safeParse({ email, role })
  if (!validated.success) return { error: 'Invalid input' }

  // 4. Determine the Base URL
  // This ensures the link works on both localhost and your future Vercel deployment
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 5. Send Invite
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    validated.data.email, 
    {
      data: { 
        role: validated.data.role, 
        invited_by: 'admin' // Optional: useful for audit logs
      },
      // 👇 UPDATED: Direct link to the client-side setup page
      // This allows the browser to handle the '#access_token' hash automatically
      redirectTo: `${origin}/auth/setup`
    }
  )

  if (error) {
    console.error('Invite Error:', error)
    return { error: error.message }
  }

  return { success: true, message: `Invite sent to ${validated.data.email}` }
}