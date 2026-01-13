import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { pluginRegistry } from '@/lib/services/plugin-registry'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await pluginRegistry.loadInstances(user.id)
    const instances = pluginRegistry.listInstances(user.id)

    return NextResponse.json({ instances })
  } catch (error) {
    console.error('Failed to fetch plugin instances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin instances' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pluginId, name, configuration } = await request.json()

    if (!pluginId || !name || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields: pluginId, name, configuration' }, 
        { status: 400 }
      )
    }

    // Validate plugin exists
    const plugin = pluginRegistry.getPlugin(pluginId)
    if (!plugin) {
      return NextResponse.json(
        { error: `Plugin ${pluginId} not found` }, 
        { status: 404 }
      )
    }

    // Create instance
    const instance = await pluginRegistry.createInstance(
      pluginId,
      name,
      configuration,
      user.id
    )

    // Log usage
    await auditLogger.log({
      action: 'plugin_instance_created',
      resource: 'plugin_instance',
      resourceId: instance.id,
      userId: user.id,
      details: { pluginId, name }
    })

    return NextResponse.json({ instance }, { status: 201 })
  } catch (error) {
    console.error('Failed to create plugin instance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create plugin instance' }, 
      { status: 500 }
    )
  }
}