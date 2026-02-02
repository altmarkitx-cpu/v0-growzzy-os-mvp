GROWZZY OS - SYSTEM ARCHITECTURE

═══════════════════════════════════════════════════════════════════════════════
COMPLETE APPLICATION FLOW
═══════════════════════════════════════════════════════════════════════════════

USER ENTRY POINT:
┌─────────────────────────────────────────────────────────────────────┐
│                         Landing Page (/)                            │
│  • Marketing copy                                                   │
│  • Feature highlights                                               │
│  • Sign up / Sign in buttons                                        │
│  • Pricing & FAQ                                                    │
│  • Call-to-action: "Get Started"                                    │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
                    Click "Get Started" or Login
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Authentication Page (/auth)                       │
│                                                                     │
│  NEW USER:                   RETURNING USER:                        │
│  • Create Account tab        • Sign In tab                          │
│  • Name field                • Email field                          │
│  • Email field               • Password field                       │
│  • Password field            • "Sign in" button                     │
│  • "Create account" button   • "Forgot password?" link              │
│  • "Sign in" link            • "Create Account" option              │
│                                                                     │
│  ✓ Form validation           ✓ Session created (HTTP-only cookie)  │
│  ✓ Password hashing          ✓ Auto-redirect to /dashboard         │
│  ✓ User created in DB        ✓ Session persists                    │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
                     AUTO-REDIRECT TO DASHBOARD
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Main Dashboard (/dashboard)                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Navigation Bar: Dashboard | Connections | Creative | Reports│   │
│  │                                        [Sign Out]           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Welcome Section:                                                   │
│  "Welcome back, [User Name]!"                                       │
│  "Here's your marketing performance overview"                       │
│  [Refresh Data]                                                     │
│                                                                     │
│  KPI Cards (Row 1):                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Spend   │ │ Revenue  │ │   ROAS   │ │Conversions│             │
│  │ $24,580  │ │ $86,420  │ │  3.52x   │ │  1,842   │             │
│  │ +12% ↑   │ │ +24% ↑   │ │ +18% ↑   │ │ +8% ↑    │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  Last Sync Status:                                                  │
│  "Auto-Synced from Connected Platforms"                             │
│  "Last synced: 5 minutes ago"                                       │
│                                                                     │
│  Performance Chart (Row 2, Left):                                   │
│  ┌──────────────────────────────┐                                   │
│  │ Performance Trend Chart      │                                   │
│  │ (30-day line chart)          │                                   │
│  │ Spend vs Revenue             │                                   │
│  └──────────────────────────────┘                                   │
│                                                                     │
│  Platform Breakdown (Row 2, Right):                                 │
│  ┌──────────────────────────────┐                                   │
│  │ Spend by Platform (Pie)      │                                   │
│  │ Meta: 60%                    │                                   │
│  │ Google: 30%                  │                                   │
│  │ LinkedIn: 10%                │                                   │
│  └──────────────────────────────┘                                   │
│                                                                     │
│  Top 10 Campaigns Table (Row 3):                                    │
│  ┌──────────┬────────┬────────┬────────┬──────┬────────┐            │
│  │Campaign  │Platform│ Spend  │Revenue │ ROAS │ Status │            │
│  ├──────────┼────────┼────────┼────────┼──────┼────────┤            │
│  │ Holiday  │  Meta  │$3,200  │$13,440│ 4.2x │ 🟢Active│            │
│  │ Black Fri│  Meta  │$4,100  │$15,990│ 3.9x │ 🟢Active│            │
│  │ Acq+     │ Google │$2,800  │$7,840 │ 2.8x │ 🟡Paused│            │
│  └──────────┴────────┴────────┴────────┴──────┴────────┘            │
│                                                                     │
│  [View all campaigns →]                                             │
└─────────────────────────────────────────────────────────────────────┘


ADDITIONAL FEATURES FROM DASHBOARD:
↓
┌─────────────────────────────────────────────────────────────────────┐
│               Platform Connections (/connections)                   │
│                                                                     │
│  Available Platforms:                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Meta Ads        │  │  Google Ads      │  │  LinkedIn Ads    │  │
│  │  Facebook &      │  │  Search &        │  │  B2B Marketing   │  │
│  │  Instagram       │  │  Display         │  │  Lead Gen        │  │
│  │  [Connect]       │  │  [Connect]       │  │  [Connect]       │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │  Shopify         │  │  TikTok Ads      │                         │
│  │  E-commerce      │  │  Video Ads       │                         │
│  │  Analytics       │  │  [Coming Soon]   │                         │
│  │  [Connect]       │  │                  │                         │
│  └──────────────────┘  └──────────────────┘                         │
│                                                                     │
│  Connected Platforms:                                               │
│  ✓ Meta Ads        | Active | Last synced: 2 min ago | [Disconnect]│
│  ✓ Google Ads      | Active | Last synced: 3 min ago | [Disconnect]│
│  ✓ Shopify         | Active | Last synced: 5 min ago | [Disconnect]│
│                                                                     │
│  Setup Guides available for each platform                           │
└─────────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│          AI Creative Generator (/dashboard/creative)               │
│                                                                     │
│  FORM INPUT:                                                        │
│  Product Name: [________________]                                   │
│                                                                     │
│  Benefits (what it does):                                           │
│  [__________________________] [+ Add]                               │
│  [__________________________]                                       │
│                                                                     │
│  Target Audience:                                                   │
│  Age: [18-65 ▼]  Gender: [All ▼]  Interests: [__________]          │
│                                                                     │
│  Pain Points They Face: [_____________________________]             │
│                                                                     │
│  Campaign Goal: ○ Sales ○ Leads ○ Traffic ○ Awareness             │
│                                                                     │
│  Tone & Style: [Professional ▼] [Urgent ▼] [Storytelling ▼]      │
│                                                                     │
│  Platform: ☑ Meta  ☑ Google  ☐ LinkedIn  ☐ TikTok                 │
│                                                                     │
│                    [✨ Generate 20 Variations]                     │
│                                                                     │
│  RESULTS:                                                           │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ ✨ 20 High-Performance Ad Variations Generated            │      │
│  │ Sort by: [Score ▼] [Framework ▼] [Trigger ▼]            │      │
│  │                                                          │      │
│  │ Variation #1 - Urgency + PAS          Score: 9.2/10 🔥 │      │
│  │ Framework: PAS | Trigger: FOMO | Target: 25-34 women    │      │
│  │                                                          │      │
│  │ PRIMARY TEXT: (124 chars)                                │      │
│  │ "Your competitors are already using AI. Don't get left   │      │
│  │  behind. Transform your marketing in 7 days. Limited     │      │
│  │  spots available."                                       │      │
│  │                                                          │      │
│  │ HEADLINE: "AI Marketing in 7 Days"                       │      │
│  │ DESCRIPTION: "Join 10K+ marketers"                       │      │
│  │ CTA: "Get Started"                                       │      │
│  │                                                          │      │
│  │ CREATIVE BRIEF: Show dashboard trending up, person       │      │
│  │ at laptop, modern office, blue & purple gradient         │      │
│  │                                                          │      │
│  │ REASONING: Strong hook with time constraint, competitor  │      │
│  │ angle creates urgency. Similar to top performing ads.    │      │
│  │                                                          │      │
│  │ [📋 Copy] [👁 Preview] [🚀 Use in Ad]                   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  [Repeat for 19 more variations...]                                │
│                                                                     │
│  Actions: [✅ Save All] [📥 Export CSV] [🎯 Create Campaign]       │
└─────────────────────────────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────────────────────────────┐
│          Report Generation (/dashboard/reports)                    │
│                                                                     │
│  [+ Generate New Report]                                            │
│                                                                     │
│  Report Date Range: [Last 30 Days ▼]                               │
│  Platforms: ☑ Meta  ☑ Google  ☑ LinkedIn  ☑ Shopify              │
│  [Generate]                                                         │
│                                                                     │
│  Previous Reports:                                                  │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ Dec 1-31 Performance Report           [👁] [📥] [🗑]  │        │
│  │ Generated: Jan 5, 2025                                 │        │
│  │ Status: ✓ Completed                                    │        │
│  │                                                        │        │
│  │ Executive Summary:                                     │        │
│  │ • Overall Performance: Excellent (🟢)                  │        │
│  │ • Total Spend: $25,450 | Revenue: $76,350              │        │
│  │ • Overall ROAS: 3.0x (+25% vs last month)              │        │
│  │ • Conversions: 1,234 (+18%)                            │        │
│  │                                                        │        │
│  │ Top 3 Wins:                                            │        │
│  │ ✅ Meta Instagram delivered 3.8x ROAS (52% over target)│        │
│  │ ✅ Black Friday Flash Sale: $12K revenue from $3K spend│        │
│  │ ✅ Creative refresh improved CTR 22%                   │        │
│  │                                                        │        │
│  │ Concerns:                                              │        │
│  │ ⚠️ Google Search CPC +30% ($2.40 → $3.12)             │        │
│  │ ⚠️ LinkedIn underperforming at 0.8x ROAS              │        │
│  │ ⚠️ Ad frequency at 4.2 (above 3.0 recommendation)      │        │
│  │                                                        │        │
│  │ AI Recommendations:                                    │        │
│  │ 🤖 Budget Reallocation: Move $2K/month from LinkedIn   │        │
│  │    to Meta Instagram for +$5.6K monthly revenue        │        │
│  │ 🤖 Creative Refresh: 5 ads running 30+ days need       │        │
│  │    refresh (expected +25-35% CTR improvement)          │        │
│  │ 🤖 Audience Expansion: Scale top lookalike audiences   │        │
│  │    for +120K reach at 3.2-3.6x ROAS                    │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  [More Reports...]                                                  │
└─────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
BACKEND ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

REQUEST FLOW:

1. User Action (Frontend)
   ↓
2. API Route Handler (/app/api/*)
   ↓
3. Authentication Check (Middleware or Route)
   ↓
4. Business Logic
   ↓
5. Database Query (Prisma)
   ↓
6. PostgreSQL Database (Supabase)
   ↓
7. Response JSON
   ↓
8. Frontend Renders Data

AUTHENTICATION FLOW:

Sign Up:
  form → /api/auth/signup → Supabase.auth.admin.createUser()
  → bcrypt password hashing → User stored in DB
  → Session created → HTTP-only cookie set
  → React redirects to /dashboard

Sign In:
  form → /api/auth/login → Supabase.auth.signInWithPassword()
  → Password verified → Session token created
  → HTTP-only cookie set → React redirects to /dashboard

Protected Routes:
  User visits /dashboard → Middleware checks auth
  → Session validation → If no session → redirect to /auth
  → If valid → Allow access → Dashboard loads

OAuth Flow:
  User clicks "Connect Meta" → OAuth.startFlow()
  → Popup opens to Meta login → User authorizes
  → Callback received at /api/oauth/meta/callback
  → Access token stored (encrypted) in PlatformConnection
  → Background job syncs data → Dashboard updates


═══════════════════════════════════════════════════════════════════════════════
DATABASE RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════════

User (1) ─── (Many) PlatformConnection
  ├─ id
  ├─ email
  ├─ password
  └─ Relations:
      ├─ platformConnections
      ├─ campaigns
      ├─ reports
      └─ sessions

User (1) ─── (Many) Campaign
  └─ Linked through:
      PlatformConnection (1) ─── (Many) Campaign

User (1) ─── (Many) Session
  └─ For session management

User (1) ─── (Many) Report
  └─ For report history


═══════════════════════════════════════════════════════════════════════════════
DATA SYNC FLOW
═══════════════════════════════════════════════════════════════════════════════

Every 5 minutes (Vercel Cron):
  1. Fetch all users with active connections
  2. For each connection:
     → Call platform API (Meta, Google, LinkedIn, Shopify)
     → Retrieve campaign data
     → Calculate metrics (spend, revenue, conversions, etc.)
     → Upsert into Campaign table
  3. Dashboard queries Campaign table
  4. Real-time charts update
  5. KPI metrics recalculate


═══════════════════════════════════════════════════════════════════════════════
SECURITY LAYERS
═══════════════════════════════════════════════════════════════════════════════

Layer 1: Authentication
  ✓ Supabase Auth with bcrypt hashing
  ✓ Session tokens in HTTP-only cookies
  ✓ CSRF protection

Layer 2: Authorization
  ✓ Middleware protects routes
  ✓ API routes verify user ownership
  ✓ Database filters by userId

Layer 3: Data Protection
  ✓ Token encryption at rest
  ✓ HTTPS in transit
  ✓ Environment variables for secrets
  ✓ No hardcoded credentials

Layer 4: API Security
  ✓ Input validation on all endpoints
  ✓ Rate limiting (coming soon)
  ✓ Error messages don't leak info
  ✓ Parameterized queries (Prisma)


═══════════════════════════════════════════════════════════════════════════════
DEPLOYMENT PIPELINE
═══════════════════════════════════════════════════════════════════════════════

Local Development:
  Code → Git Commit → Push to GitHub

GitHub:
  Webhook triggered on push

Vercel:
  Receives webhook → Builds project
  → Runs pnpm install → Runs pnpm build
  → Deploys to edge network
  → SSL certificate (HTTPS) auto-enabled
  → Cron jobs activated

Live:
  Users access your-domain.com
  → Vercel CDN serves static content
  → API routes processed in serverless functions
  → Database queries to Supabase (PostgreSQL)
  → Background sync jobs run every 5 minutes


═══════════════════════════════════════════════════════════════════════════════

This is your complete, production-ready system!

Ready to deploy and go live! 🚀
