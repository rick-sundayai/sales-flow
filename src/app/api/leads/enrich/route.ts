import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }

    // Get the lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('assigned_to', user.id) // Ensure user owns this lead
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get n8n webhook URL from environment or automation settings
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: 'Enrichment service not configured' },
        { status: 503 }
      )
    }

    // Trigger n8n webhook with lead data
    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        leadId: lead.id,
        jobTitle: lead.job_title,
        companyName: lead.company_name,
        location: lead.location,
        userId: user.id,
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error('Failed to trigger enrichment webhook')
    }

    // Mark lead as being enriched
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        is_enriched: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (updateError) {
      logger.error('Failed to update lead enrichment status', {
        action: 'lead_enrichment_update_failed',
        error: updateError as Error,
        metadata: { leadId },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Enrichment triggered successfully',
    })
  } catch (error) {
    logger.error('Lead enrichment failed', {
      action: 'lead_enrichment_failed',
      error: error as Error,
    })
    return NextResponse.json(
      { error: 'Failed to trigger enrichment' },
      { status: 500 }
    )
  }
}
