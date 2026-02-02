import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { AutomationEngine } from "@/lib/automation-engine"

export async function POST(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[v0] Starting automation check...")

    // Get all active automations
    const { data: automations, error: fetchError } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("is_active", true)

    if (fetchError) {
      throw fetchError
    }

    if (!automations || automations.length === 0) {
      return NextResponse.json({ checked: 0, executed: 0, results: [] })
    }

    const results = []

    for (const automation of automations) {
      try {
        // Check if automation should trigger
        const shouldTrigger = await AutomationEngine.evaluateTrigger(automation)

        if (shouldTrigger) {
          // Execute automation actions
          const result = await AutomationEngine.executeActions(automation)

          // Update last_executed_at
          await supabaseAdmin
            .from("automations")
            .update({ last_executed_at: new Date().toISOString() })
            .eq("id", automation.id)

          results.push({
            automation_id: automation.id,
            name: automation.name,
            executed: result.success,
            message: result.message,
          })

          console.log(`[v0] Automation ${automation.name} executed`)
        }
      } catch (error: any) {
        console.error(`[v0] Error executing automation ${automation.id}:`, error)
        results.push({
          automation_id: automation.id,
          name: automation.name,
          executed: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked: automations.length,
      executed: results.filter((r) => r.executed).length,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Automation check error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function evaluateTrigger(automation: any): Promise<boolean> {
  const { trigger_type, trigger_config, user_id } = automation

  switch (trigger_type) {
    case "threshold_based": {
      const { metric, operator, value, campaign_id } = trigger_config

      // Get campaign metrics
      const { data: campaign } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("id", campaign_id)
        .eq("user_id", user_id)
        .single()

      if (!campaign) return false

      const currentValue = campaign[metric]
      return evaluateCondition(currentValue, operator, value)
    }

    case "time_based": {
      const { schedule } = trigger_config
      const now = new Date()
      const currentHour = now.getHours()

      return schedule.some((timeRange: string) => {
        const [start, end] = timeRange.split("-").map(Number)
        if (start <= end) {
          return currentHour >= start && currentHour < end
        } else {
          return currentHour >= start || currentHour < end
        }
      })
    }

    default:
      return false
  }
}

function evaluateCondition(currentValue: any, operator: string, threshold: number): boolean {
  const value = Number(currentValue) || 0
  switch (operator) {
    case ">":
      return value > threshold
    case "<":
      return value < threshold
    case ">=":
      return value >= threshold
    case "<=":
      return value <= threshold
    case "==":
      return value === threshold
    default:
      return false
  }
}

async function executeAutomationActions(automation: any): Promise<{ success: boolean; message: string }> {
  const { action_type, action_config, user_id } = automation

  switch (action_type) {
    case "pause_campaign": {
      const { campaign_id } = action_config
      await supabaseAdmin.from("campaigns").update({ status: "paused" }).eq("id", campaign_id).eq("user_id", user_id)
      return { success: true, message: `Campaign paused` }
    }

    case "update_budget": {
      const { campaign_id, new_budget } = action_config
      await supabaseAdmin.from("campaigns").update({ budget: new_budget }).eq("id", campaign_id).eq("user_id", user_id)
      return { success: true, message: `Budget updated to ${new_budget}` }
    }

    case "send_alert": {
      const { subject, message } = action_config
      // In production, integrate with email service
      return { success: true, message: `Alert sent: ${subject}` }
    }

    case "generate_report": {
      // Trigger report generation
      return { success: true, message: `Report generation triggered` }
    }

    default:
      return { success: false, message: `Unknown action type: ${action_type}` }
  }
}
