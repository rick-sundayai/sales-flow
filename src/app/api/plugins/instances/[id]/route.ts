import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { pluginRegistry } from '@/lib/services/plugin-registry'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instance = pluginRegistry.getInstance(params.id)
    if (!instance || instance.createdBy !== user.id) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    return NextResponse.json({ instance })
  } catch (error) {
    console.error('Failed to fetch plugin instance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin instance' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()
    
    await pluginRegistry.updateInstance(params.id, updates, user.id)

    await auditLogger.log({
      action: 'plugin_instance_updated',
      resource: 'plugin_instance',
      resourceId: params.id,
      userId: user.id,
      details: { updates }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update plugin instance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plugin instance' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await pluginRegistry.deleteInstance(params.id, user.id)

    await auditLogger.log({
      action: 'plugin_instance_deleted',
      resource: 'plugin_instance', 
      resourceId: params.id,
      userId: user.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete plugin instance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete plugin instance' }, 
      { status: 500 }
    )
  }
}