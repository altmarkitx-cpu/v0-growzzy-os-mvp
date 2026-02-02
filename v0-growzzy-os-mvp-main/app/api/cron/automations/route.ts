import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Helper function to evaluate triggers
async function evaluateTrigger(automation: any, supabase: any) {
  try {
    const { triggerType, triggerConfig } = automation

    if (triggerType === 'metric_threshold') {
      // Fetch current campaign metrics
      const { data: analytics, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('campaign_id', triggerConfig.campaignId)
        .order('metric_date', { ascending: false })
        .limit(1)
        .single()

      if (error || !analytics) {
        return false
      }

      const metric = analytics[triggerConfig.metric] || 0
      const { operator, value } = triggerConfig

      switch (operator) {
        case 'below':
          return metric < value
        case 'above':
          return metric > value
        case 'equals':
          return Math.abs(metric - value) < 0.01
        default:
          return false
      }
    }

    if (triggerType === 'time_based') {
      // Check if last execution was more than X minutes ago
      const lastExecuted = automation.last_executed ? new Date(automation.last_executed) : null
      const now = new Date()
      const minutesAgo = triggerConfig.intervalMinutes || 60

      if (!lastExecuted) {
        return true // First time running
      }

      const timeSinceLastExecution = (now.getTime() - lastExecuted.getTime()) / (1000 * 60)
      return timeSinceLastExecution >= minutesAgo
    }

    return false
  } catch (error) {
    console.error('[v0] Error evaluating trigger:', error)
    return false
  }
}

// Helper function to execute actions
async function executeAction(automation: any, supabase: any) {
  try {
    const { actionType, actionConfig } = automation

    if (actionType === 'send_alert') {
      // Send email alert
      const user = automation.user
      const message = actionConfig.message || 'Automation triggered'

      console.log('[v0] Sending alert to', user.email, ':', message)

      // In production, integrate with Resend or similar
      // For now, just log
      return { success: true, action: 'send_alert' }
    }

    if (actionType === 'pause_campaign') {
      // Pause campaign on platform
      console.log('[v0] Pausing campaign', actionConfig.campaignId)
      // Integration with platform APIs would go here
      return { success: true, action: 'pause_campaign' }
    }

    if (actionType === 'adjust_budget') {
      // Adjust budget
      const newBudget = actionConfig.newBudget || 0
      console.log('[v0] Adjusting budget to', newBudget)
      return { success: true, action: 'adjust_budget', newBudget }
    }

    if (actionType === 'generate_report') {
      // Generate and send report
      console.log('[v0] Generating report for campaign', actionConfig.campaignId)
      return { success: true, action: 'generate_report' }
    }

    return { success: false }
  } catch (error) {
    console.error('[v0] Error executing action:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'test-secret'

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[v0] Invalid cron secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[v0] Running automations check at', new Date().toISOString())

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get all active automations
    const { data: automations, error } = await supabase
      .from('automations')
      .select(`
        *,
        user:user_id(id, email, name)
      `)
      .eq('active', true)

    if (error) {
      console.error('[v0] Error fetching automations:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('[v0] Found', automations?.length || 0, 'active automations')

    const results = []

    for (const automation of automations || []) {
      try {
        // Evaluate trigger
        const shouldTrigger = await evaluateTrigger(automation, supabase)

        if (shouldTrigger) {
          console.log('[v0] Automation', automation.id, 'triggered')

          // Execute action
          const actionResult = await executeAction(automation, supabase)

          // Log execution
          const { error: logError } = await supabase.from('automation_logs').insert({
            automation_id: automation.id,
            triggered: true,
            action: automation.actionType,
            result: actionResult,
            executed_at: new Date().toISOString(),
          })

          if (logError) {
            console.error('[v0] Error logging automation execution:', logError)
          }

          // Update last executed
          const { error: updateError } = await supabase
            .from('automations')
            .update({
              last_executed: new Date().toISOString(),
              execution_count: (automation.execution_count || 0) + 1,
            })
            .eq('id', automation.id)

          if (updateError) {
            console.error('[v0] Error updating automation:', updateError)
          }

          results.push({
            automationId: automation.id,
            triggered: true,
            action: automation.actionType,
            ...actionResult,
          })
        }
      } catch (error) {
        console.error('[v0] Error processing automation', automation.id, ':', error)

        // Log failure
        await supabase.from('automation_logs').insert({
          automation_id: automation.id,
          triggered: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executed_at: new Date().toISOString(),
        })

        results.push({
          automationId: automation.id,
          triggered: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('[v0] Automations check complete. Results:', results.length)

    return NextResponse.json({
      success: true,
      processed: automations?.length || 0,
      triggered: results.filter((r: any) => r.triggered).length,
      results,
    })
  } catch (error) {
    console.error('[v0] Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
