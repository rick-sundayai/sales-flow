import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    name: string
    status: 'pass' | 'fail'
    message?: string
  }[]
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthResponse['checks'] = []

  // Check environment variables
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  checks.push({
    name: 'environment',
    status: hasSupabaseUrl && hasSupabaseKey ? 'pass' : 'fail',
    message: hasSupabaseUrl && hasSupabaseKey
      ? 'Required environment variables are set'
      : 'Missing required environment variables'
  })

  const allPassed = checks.every(check => check.status === 'pass')

  const response: HealthResponse = {
    status: allPassed ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks
  }

  return NextResponse.json(response, {
    status: allPassed ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  })
}
