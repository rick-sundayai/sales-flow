'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupAccountPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SetupForm />
    </Suspense>
  )
}

function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading...</p>
      </div>
    </div>
  )
}

function SetupForm() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [verificationFailed, setVerificationFailed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('user')
  const router = useRouter()
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isMounted = true

    const handleAuth = async () => {
      // 1. Check URL hash for tokens (invite links use hash fragments)
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Parse hash parameters
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        // Check for error in hash
        if (errorParam) {
          if (isMounted) {
            setErrorMessage(errorDescription || errorParam)
            setVerificationFailed(true)
          }
          return
        }

        // Set session from hash tokens
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            if (isMounted) {
              setErrorMessage(error.message)
              setVerificationFailed(true)
            }
            return
          }

          // Extract role from user metadata (set during invite)
          if (data.user?.user_metadata?.role && isMounted) {
            setUserRole(data.user.user_metadata.role)
          }

          // Clear hash from URL after processing
          window.history.replaceState(null, '', window.location.pathname)

          if (isMounted) {
            setSessionChecked(true)
          }
          return
        }
      }

      // 2. Check if we already have a session (e.g., user refreshed the page)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (isMounted) {
          setSessionChecked(true)
        }
        return
      }

      // 3. No hash tokens and no existing session - verification failed
      // Set a short timeout to allow for any async processing
      timeoutId = setTimeout(() => {
        if (isMounted && !sessionChecked) {
          setVerificationFailed(true)
        }
      }, 3000)
    }

    handleAuth()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [supabase, sessionChecked])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Session expired. Please use your invite link again.")
        setLoading(false)
        return
      }

      // Update password for the now-authenticated user
      const { error: passwordError } = await supabase.auth.updateUser({ password })

      if (passwordError) {
        toast.error(passwordError.message)
        setLoading(false)
        return
      }

      // Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Create user profile if it doesn't exist
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email!,
            first_name: firstName.trim() || 'User',
            last_name: lastName.trim() || 'User',
            role: userRole,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't block login if profile creation fails - user can update later
          toast.error("Account created but profile setup failed. Please contact support.")
        }
      }

      toast.success("Account setup complete!")
      router.push('/dashboard')
    } catch (err) {
      console.error('Setup error:', err)
      toast.error("An unexpected error occurred")
      setLoading(false)
    }
  }

  // Show error state if verification timed out
  if (verificationFailed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            {errorMessage ? (
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {errorMessage}
              </p>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  We couldn&apos;t verify your invite link. This can happen if:
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-left list-disc list-inside space-y-1">
                  <li>The invite link has expired</li>
                  <li>The link was already used</li>
                  <li>The link was copied incorrectly</li>
                </ul>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Go to Login
            </Button>
            <p className="text-xs text-muted-foreground">
              Please contact your administrator for a new invite.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying your invite...</p>
          <p className="text-xs text-muted-foreground">
            This should only take a moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to SalesFlow</h1>
          <p className="text-gray-500 dark:text-gray-400">Complete your profile to get started.</p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name</label>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  )
}