import { createClient } from '../supabase/client'
import type { LoginForm, RegisterForm, ResetPasswordForm, UserProfile } from '../types/auth'
import type { User } from '@supabase/supabase-js'

export class AuthService {
  private supabase = createClient()

  async signIn({ email, password }: LoginForm) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { success: true, user: data.user, error: null }
    } catch (error) {
      return { 
        success: false, 
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async signUp({ email, password, firstName, lastName }: RegisterForm) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (error) throw error

      return { success: true, user: data.user, error: null }
    } catch (error) {
      return { 
        success: false, 
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async resetPassword({ email }: ResetPasswordForm) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      return { success: true, error: null }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  async getCurrentUser() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session?.user) {
        return null
      }

      // Get user profile
      const profile = await this.getUserProfile(session.user.id)
      
      return { 
        user: session.user, 
        profile, 
        error: null 
      }
    } catch {
      return null
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      
      return data
    } catch {
      return null
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  }
}

// Singleton instance
export const authService = new AuthService()