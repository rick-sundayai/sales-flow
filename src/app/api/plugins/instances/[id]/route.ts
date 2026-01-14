import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditLogger } from '@/lib/security/audit-logger'
import { pluginRegistry } from '@/lib/services/plugin-registry'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instance = pluginRegistry.getInstance(id)
    if (!instance || instance.createdBy !== user.id) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    return NextResponse.json({ instance })
  } catch (error) {
    logger.error('Failed to fetch plugin instance', {
      action: 'plugin_instance_fetch_failed',
      error: error as Error,
    })
    return NextResponse.json(
      { error: 'Failed to fetch plugin instance' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    await pluginRegistry.updateInstance(id, updates, user.id)

    await auditLogger.log({
      action: 'plugin_instance_updated',
      resource: 'plugin_instance',
      resourceId: id,
      userId: user.id,
      details: { updates }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to update plugin instance', {
      action: 'plugin_instance_update_failed',
      error: error as Error,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plugin instance' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await pluginRegistry.deleteInstance(id, user.id)

    await auditLogger.log({
      action: 'plugin_instance_deleted',
      resource: 'plugin_instance',
      resourceId: id,
      userId: user.id
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete plugin instance', {
      action: 'plugin_instance_delete_failed',
      error: error as Error,
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete plugin instance' },
      { status: 500 }
    )
  }
}