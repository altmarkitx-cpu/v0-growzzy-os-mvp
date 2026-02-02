import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const DEMO_EMAIL = "demo@growzzy.com"
const DEMO_PASSWORD = "DemoPassword123!"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Try to get demo user first
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", DEMO_EMAIL).single()

    let userId: string

    if (!existingUser) {
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { is_demo: true },
      })

      if (createError) {
        console.error("[v0] Failed to create demo user:", createError)
        return NextResponse.json({ error: createError.message }, { status: 400 })
      }

      userId = authData.user!.id

      // Create user profile
      await supabase.from("users").insert({
        id: userId,
        email: DEMO_EMAIL,
        full_name: "Demo Account",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      // Insert dummy campaigns
      const campaigns = [
        {
          user_id: userId,
          name: "Summer Sale Campaign",
          platform: "meta",
          status: "active",
          budget: 5000,
          spend: 3245.5,
          impressions: 125000,
          clicks: 3500,
          conversions: 85,
          revenue: 12750,
          ctr: 2.8,
          roas: 3.93,
          created_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          name: "Black Friday Promo",
          platform: "google",
          status: "active",
          budget: 3000,
          spend: 2100,
          impressions: 95000,
          clicks: 2800,
          conversions: 125,
          revenue: 8750,
          ctr: 2.95,
          roas: 4.17,
          created_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          name: "Brand Awareness",
          platform: "tiktok",
          status: "active",
          budget: 2000,
          spend: 1850,
          impressions: 320000,
          clicks: 4200,
          conversions: 42,
          revenue: 1680,
          ctr: 1.31,
          roas: 0.91,
          created_at: new Date().toISOString(),
        },
      ]

      await supabase.from("campaigns").insert(campaigns)

      // Insert dummy leads
      const leads = [
        {
          user_id: userId,
          name: "John Smith",
          email: "john@example.com",
          phone: "+1234567890",
          company: "Tech Corp",
          source: "meta_lead_ads",
          status: "new",
          value: 500,
          created_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          name: "Sarah Johnson",
          email: "sarah@example.com",
          phone: "+1234567891",
          company: "Marketing Inc",
          source: "email_import",
          status: "contacted",
          value: 750,
          created_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          name: "Mike Chen",
          email: "mike@example.com",
          phone: "+1234567892",
          company: "Growth Labs",
          source: "csv_upload",
          status: "qualified",
          value: 1200,
          created_at: new Date().toISOString(),
        },
      ]

      await supabase.from("leads").insert(leads)

      // Insert dummy automations
      const automations = [
        {
          user_id: userId,
          name: "Daily Performance Report",
          description: "Send daily report of campaign performance",
          trigger_type: "schedule",
          action_type: "send_report",
          trigger_config: { frequency: "daily", time: "09:00" },
          action_config: { email: DEMO_EMAIL, report_type: "daily" },
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          user_id: userId,
          name: "High ROAS Alert",
          description: "Alert when ROAS exceeds 5x",
          trigger_type: "metric",
          action_type: "send_notification",
          trigger_config: { metric: "roas", operator: "greater_than", value: 5 },
          action_config: { notification_type: "email" },
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]

      await supabase.from("automations").insert(automations)

      console.log("[v0] Demo user created with ID:", userId)
    } else {
      userId = existingUser.id
      console.log("[v0] Demo user already exists with ID:", userId)
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    })

    if (signInError) {
      console.error("[v0] Failed to sign in demo user:", signInError)
      return NextResponse.json({ error: signInError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Demo account ready",
      user: signInData.user,
      session: signInData.session,
    })
  } catch (error: any) {
    console.error("[v0] Demo login error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
