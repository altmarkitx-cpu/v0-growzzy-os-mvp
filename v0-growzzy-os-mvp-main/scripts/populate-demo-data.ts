import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_EMAIL = "demo@growzzy.com"
const DEMO_PASSWORD = "DemoPassword123!"

async function populateDemoData() {
  console.log("[Demo Data] Starting population...")

  try {
    // Create demo user via auth
    console.log("[Demo Data] Creating demo user...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })

    let demoUser
    if (authError) {
      if (authError.message.includes("already exists")) {
        console.log("[Demo Data] Demo user already exists, fetching...")
        const { data: users } = await supabase.auth.admin.listUsers()
        demoUser = users?.users.find((u) => u.email === DEMO_EMAIL)
        if (!demoUser) throw new Error("Could not find demo user")
      } else {
        throw authError
      }
    } else {
      demoUser = authData.user
    }

    const userId = demoUser!.id
    console.log(`[Demo Data] Demo user ID: ${userId}`)

    // Create user profile
    console.log("[Demo Data] Creating user profile...")
    await supabase.from("users").upsert({
      id: userId,
      email: DEMO_EMAIL,
      full_name: "Demo Account",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Create demo campaigns
    console.log("[Demo Data] Creating demo campaigns...")
    const campaigns = [
      {
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
      },
      {
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
      },
      {
        name: "Brand Awareness Campaign",
        platform: "tiktok",
        status: "paused",
        budget: 2000,
        spend: 1850,
        impressions: 320000,
        clicks: 4200,
        conversions: 42,
        revenue: 1680,
        ctr: 1.31,
        roas: 0.91,
      },
      {
        name: "LinkedIn B2B Campaign",
        platform: "linkedin",
        status: "active",
        budget: 4000,
        spend: 2500,
        impressions: 45000,
        clicks: 850,
        conversions: 28,
        revenue: 4200,
        ctr: 1.89,
        roas: 1.68,
      },
    ]

    const campaignIds: string[] = []
    for (const campaign of campaigns) {
      const { data } = await supabase
        .from("campaigns")
        .insert({
          ...campaign,
          user_id: userId,
          platform_connection_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (data?.[0]) {
        campaignIds.push(data[0].id)
        console.log(`[Demo Data] Created campaign: ${campaign.name}`)
      }
    }

    // Create analytics data for each campaign
    console.log("[Demo Data] Creating analytics data...")
    for (let i = 0; i < campaignIds.length; i++) {
      const campaignId = campaignIds[i]
      const baseDate = new Date()
      baseDate.setDate(baseDate.getDate() - 30)

      for (let day = 0; day < 30; day++) {
        const currentDate = new Date(baseDate)
        currentDate.setDate(currentDate.getDate() + day)

        await supabase.from("analytics").insert({
          campaign_id: campaignId,
          user_id: userId,
          metric_date: currentDate.toISOString().split("T")[0],
          impressions: Math.floor(Math.random() * 5000) + 1000,
          clicks: Math.floor(Math.random() * 200) + 50,
          conversions: Math.floor(Math.random() * 10) + 2,
          spend: Math.random() * 150 + 50,
          revenue: Math.random() * 400 + 100,
          created_at: new Date().toISOString(),
        })
      }
      console.log(`[Demo Data] Added analytics for campaign ${i + 1}/4`)
    }

    // Create leads
    console.log("[Demo Data] Creating leads...")
    const leads = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        company: "Tech Corp",
        source: "meta",
        status: "qualified",
        value: 5000,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        company: "StartUp Inc",
        source: "google",
        status: "contacted",
        value: 8000,
      },
      {
        name: "Mike Chen",
        email: "mike.chen@example.com",
        company: "Digital Agency",
        source: "linkedin",
        status: "proposal",
        value: 12000,
      },
      {
        name: "Emma Davis",
        email: "emma.d@example.com",
        company: "E-commerce Store",
        source: "tiktok",
        status: "qualified",
        value: 3500,
      },
      {
        name: "Alex Wilson",
        email: "alex.w@example.com",
        company: "Marketing Co",
        source: "meta",
        status: "negotiating",
        value: 15000,
      },
    ]

    for (const lead of leads) {
      await supabase.from("leads").insert({
        ...lead,
        campaign_id: campaignIds[Math.floor(Math.random() * campaignIds.length)],
        user_id: userId,
        phone: "+1" + Math.floor(Math.random() * 9000000000 + 1000000000),
        notes: "Demo lead for testing",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    console.log(`[Demo Data] Created ${leads.length} leads`)

    // Create automations
    console.log("[Demo Data] Creating automations...")
    const automations = [
      {
        name: "Daily Report at 9 AM",
        description: "Send daily performance report every morning",
        trigger_type: "schedule",
        action_type: "send_report",
        trigger_config: { frequency: "daily", time: "09:00" },
        action_config: { email: DEMO_EMAIL, format: "pdf" },
        is_active: true,
      },
      {
        name: "High Spend Alert",
        description: "Alert when daily spend exceeds $500",
        trigger_type: "threshold",
        action_type: "send_alert",
        trigger_config: { metric: "spend", threshold: 500 },
        action_config: { email: DEMO_EMAIL, severity: "high" },
        is_active: true,
      },
      {
        name: "Low ROAS Trigger",
        description: "Pause campaign if ROAS drops below 2",
        trigger_type: "metric",
        action_type: "pause_campaign",
        trigger_config: { metric: "roas", threshold: 2 },
        action_config: { action: "pause" },
        is_active: false,
      },
    ]

    for (const automation of automations) {
      await supabase.from("automations").insert({
        ...automation,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    console.log(`[Demo Data] Created ${automations.length} automations`)

    // Create sample reports
    console.log("[Demo Data] Creating sample reports...")
    const reports = [
      {
        title: "Weekly Performance Summary",
        type: "weekly",
        platform: "all",
        status: "completed",
        period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        period_end: new Date().toISOString().split("T")[0],
        metrics: {
          total_spend: 9695.5,
          total_revenue: 27380,
          total_impressions: 585000,
          total_clicks: 11350,
          total_conversions: 280,
          avg_roas: 2.82,
          top_campaign: "Summer Sale Campaign",
        },
        insights: "Strong performance across all channels with Meta leading in ROAS",
        recommendations: "Increase budget for Meta campaigns and optimize TikTok for better conversion",
      },
      {
        title: "Platform Comparison Report",
        type: "comparison",
        platform: "all",
        status: "completed",
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        period_end: new Date().toISOString().split("T")[0],
        metrics: {
          meta_roas: 3.93,
          google_roas: 4.17,
          linkedin_roas: 1.68,
          tiktok_roas: 0.91,
        },
        insights: "Google Ads and Meta leading in ROI performance",
        recommendations: "Scale Google and Meta budgets, review TikTok strategy",
      },
    ]

    for (const report of reports) {
      await supabase.from("reports").insert({
        ...report,
        user_id: userId,
        generated_at: new Date().toISOString(),
      })
    }
    console.log(`[Demo Data] Created ${reports.length} reports`)

    // Create AI conversation history
    console.log("[Demo Data] Creating AI conversations...")
    const { data: conversationData } = await supabase
      .from("ai_conversations")
      .insert({
        title: "Campaign Performance Analysis",
        user_id: userId,
        context: {
          campaigns: campaigns.map((c) => c.name),
          total_spend: 9695.5,
          total_revenue: 27380,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (conversationData?.[0]) {
      const conversationId = conversationData[0].id

      // Add sample messages
      await supabase.from("ai_messages").insert([
        {
          conversation_id: conversationId,
          role: "user",
          content: "What are my top performing campaigns?",
          created_at: new Date().toISOString(),
        },
        {
          conversation_id: conversationId,
          role: "assistant",
          content:
            "Based on your data, your top performers are:\n1. Summer Sale Campaign (ROAS: 3.93)\n2. Black Friday Promo (ROAS: 4.17)\n3. LinkedIn B2B Campaign (ROAS: 1.68)",
          created_at: new Date(Date.now() + 1000).toISOString(),
        },
        {
          conversation_id: conversationId,
          role: "user",
          content: "How can I improve the TikTok campaign?",
          created_at: new Date(Date.now() + 2000).toISOString(),
        },
        {
          conversation_id: conversationId,
          role: "assistant",
          content:
            "Your TikTok campaign has lower ROAS (0.91). Consider: 1) Testing different creative formats, 2) Refining audience targeting, 3) Adjusting bid strategy, 4) A/B testing headlines",
          created_at: new Date(Date.now() + 3000).toISOString(),
        },
      ])
      console.log("[Demo Data] Created AI conversations and messages")
    }

    console.log("\n✅ Demo data population complete!")
    console.log(`\n📝 Demo Account Credentials:`)
    console.log(`   Email: ${DEMO_EMAIL}`)
    console.log(`   Password: ${DEMO_PASSWORD}`)
    console.log(`\n📊 Data Created:`)
    console.log(`   - ${campaigns.length} Campaigns`)
    console.log(`   - 30 days of analytics data per campaign`)
    console.log(`   - ${leads.length} Leads`)
    console.log(`   - ${automations.length} Automations`)
    console.log(`   - ${reports.length} Reports`)
    console.log(`   - AI Conversations with sample messages`)

    process.exit(0)
  } catch (error) {
    console.error("[Demo Data] Error:", error)
    process.exit(1)
  }
}

populateDemoData()
