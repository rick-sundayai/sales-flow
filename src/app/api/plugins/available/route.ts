import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pluginRegistry } from '@/lib/services/plugin-registry'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const plugins = pluginRegistry.listPlugins(category || undefined)
    
    // Return plugin metadata only (not the actual implementation)
    const pluginInfo = plugins.map(plugin => ({
      metadata: plugin.metadata,
      configSchema: plugin.getConfigSchema()
    }))

    return NextResponse.json({ plugins: pluginInfo })
  } catch (error) {
    console.error('Failed to fetch available plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available plugins' }, 
      { status: 500 }
    )
  }
}