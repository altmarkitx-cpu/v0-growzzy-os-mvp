GROWZZY OS - QUICK REFERENCE CARD

═══════════════════════════════════════════════════════════════════════════════
AUTHENTICATION FLOW
═══════════════════════════════════════════════════════════════════════════════

USER SIGNS UP:
┌─────────────────────────────────────────────────┐
│ 1. Visit /auth                                  │
│ 2. Click "Create Account"                       │
│ 3. Enter: Name, Email, Password                 │
│ 4. Click "Create account"                       │
│ 5. ✓ Redirects to /dashboard automatically      │
│ 6. ✓ User session created (HTTP-only cookie)   │
└─────────────────────────────────────────────────┘

USER SIGNS IN:
┌─────────────────────────────────────────────────┐
│ 1. Visit /auth                                  │
│ 2. Enter: Email, Password                       │
│ 3. Click "Sign in"                              │
│ 4. ✓ Redirects to /dashboard automatically      │
│ 5. ✓ Session established                        │
└─────────────────────────────────────────────────┘

PROTECTED ROUTES:
┌─────────────────────────────────────────────────┐
│ /dashboard         → Main analytics dashboard   │
│ /connections       → Platform OAuth setup       │
│ /dashboard/creative → AI ad generator           │
│ /dashboard/reports → Report generation          │
│ /dashboard/automations → Workflow automation    │
│ /dashboard/campaigns → Campaign management      │
│                                                 │
│ NOT logged in? → Redirected to /auth            │
└─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
KEY FEATURES CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

AUTHENTICATION:
  ✓ Email/password signup with validation
  ✓ Email/password login with error handling
  ✓ Secure session management (HTTP-only cookies)
  ✓ Auto-redirect to dashboard after auth
  ✓ Password hashing with bcrypt
  ✓ Logout with session cleanup
  ✓ Protected routes with middleware
  ✓ Current user endpoint (/api/auth/me)

DASHBOARD:
  ✓ Real-time KPI cards (Spend, Revenue, ROAS, Conversions)
  ✓ 30-day performance trends chart
  ✓ Platform spend breakdown pie chart
  ✓ Top 10 campaigns sortable table
  ✓ Sync status indicator
  ✓ Manual refresh data button
  ✓ Welcome with user name
  ✓ Sign out button
  ✓ Mobile responsive design

PLATFORM CONNECTIONS:
  ✓ Meta Ads OAuth (Facebook/Instagram)
  ✓ Google Ads OAuth
  ✓ LinkedIn Ads OAuth
  ✓ Shopify OAuth
  ✓ One-click connect (popup opens automatically)
  ✓ Connection status display
  ✓ Auto-sync every 5 minutes
  ✓ Disconnect functionality

AI CREATIVE GENERATOR:
  ✓ Beautiful form with validation
  ✓ Generate 20 ad variations with one click
  ✓ Powered by Claude/GPT-4 AI
  ✓ Includes performance scores
  ✓ Psychological trigger analysis
  ✓ Copywriting framework breakdown
  ✓ Copy to clipboard
  ✓ Export to CSV
  ✓ Save to database

REPORT GENERATION:
  ✓ AI-powered insights analysis
  ✓ Multi-platform data aggregation
  ✓ Executive summary with KPIs
  ✓ Platform breakdown analysis
  ✓ Top/bottom performer identification
  ✓ Budget reallocation recommendations
  ✓ Creative refresh suggestions
  ✓ PDF download
  ✓ Email delivery

═══════════════════════════════════════════════════════════════════════════════
API ENDPOINTS (POST TO THESE)
═══════════════════════════════════════════════════════════════════════════════

Authentication:
  POST /api/auth/signup
    Body: { email, password, name }
    Returns: { user, success }
    Action: Creates account, logs in, creates session

  POST /api/auth/login
    Body: { email, password }
    Returns: { user, success }
    Action: Authenticates user, creates session

  POST /api/auth/logout
    Returns: { success }
    Action: Clears session, logs out user

  GET /api/auth/me
    Returns: { user } or 401
    Action: Gets current authenticated user

Creative Generation:
  POST /api/creative/generate
    Body: { productName, benefits, audience, painPoints, campaignGoal, tones, platforms }
    Returns: { creatives }
    Action: Generates 20 AI ad variations

Report Generation:
  POST /api/reports/generate-ai
    Body: { dateRange, platforms }
    Returns: { report }
    Action: Generates AI-powered report with insights

Platform Sync:
  POST /api/connections/[id]/sync
    Action: Syncs data from connected platform

═══════════════════════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLES NEEDED
═══════════════════════════════════════════════════════════════════════════════

CRITICAL (without these, app won't work):
  ✓ NEXT_PUBLIC_SUPABASE_URL
  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✓ SUPABASE_SERVICE_ROLE_KEY
  ✓ DATABASE_URL

AI (for creative generator & reports):
  ✓ OPENAI_API_KEY or ANTHROPIC_API_KEY

OAuth (for platform connections):
  ✓ META_APP_ID + META_APP_SECRET
  ✓ GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
  ✓ LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET
  ✓ SHOPIFY_API_KEY + SHOPIFY_API_SECRET

Security:
  ✓ ENCRYPTION_KEY (32-character hex)
  ✓ CRON_SECRET

═══════════════════════════════════════════════════════════════════════════════
DEPLOYMENT STEPS (QUICK VERSION)
═══════════════════════════════════════════════════════════════════════════════

Step 1: Prepare Credentials (10 minutes)
  □ Get Supabase URL and keys
  □ Get OpenAI API key
  □ Get OAuth credentials from Meta, Google, LinkedIn, Shopify

Step 2: Push to GitHub (2 minutes)
  git add .
  git commit -m "Production ready"
  git push origin main

Step 3: Deploy to Vercel (3 minutes)
  □ Import GitHub repository
  □ Add environment variables
  □ Click Deploy button

Step 4: Configure OAuth (5 minutes)
  □ Meta: Add redirect URI to app settings
  □ Google: Add redirect URI to credentials
  □ LinkedIn: Add redirect URI to app settings
  □ Shopify: Add redirect URI to app settings

Step 5: Test (5 minutes)
  □ Visit live URL
  □ Sign up with test email
  □ Verify dashboard loads
  □ Test one platform connection
  □ Generate test report

TOTAL TIME: ~30 minutes, then LIVE!

═══════════════════════════════════════════════════════════════════════════════
DATABASE MODELS
═══════════════════════════════════════════════════════════════════════════════

User
  - id: unique identifier
  - email: unique, required
  - password: hashed
  - name: user's full name
  - createdAt, updatedAt

Session
  - id: unique identifier
  - userId: foreign key to User
  - sessionToken: unique
  - expires: expiration time

PlatformConnection
  - id: unique identifier
  - userId: foreign key to User
  - platform: "meta" | "google" | "linkedin" | "shopify"
  - accessToken: encrypted
  - refreshToken: encrypted
  - accountId, accountName
  - lastSyncedAt: last data sync time
  - active: boolean

Campaign
  - id: unique identifier
  - userId: foreign key to User
  - connectionId: foreign key to PlatformConnection
  - platform: which platform (meta, google, etc.)
  - name: campaign name
  - Metrics: spend, revenue, impressions, clicks, conversions, roas, ctr, cpc

Report
  - id: unique identifier
  - userId: foreign key to User
  - title: report title
  - type: "analytics" | "ai_analysis"
  - dateFrom, dateTo: report date range
  - data: JSON with all metrics and insights
  - fileUrl: link to PDF

═══════════════════════════════════════════════════════════════════════════════
EXPECTED USER FLOW
═══════════════════════════════════════════════════════════════════════════════

New User Journey:
  Landing Page → Sign Up Form → Create Account
    → ✓ Redirected to Dashboard
    → Dashboard shows empty state (no data yet)
    → User goes to Connections
    → User connects Meta Ads via OAuth
    → ✓ Meta account syncs
    → User returns to Dashboard
    → ✓ Data populates with campaigns from Meta
    → User generates AI creatives
    → User creates automated reports
    → User gets insights and recommendations

Returning User:
  Auth Page → Sign In → ✓ Dashboard
    → See all data from connected platforms
    → Check dashboard KPIs
    → Generate reports
    → Create ad creatives
    → Setup automations

═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Problem: "Not authenticated" on /dashboard
Solution: Check if user is logged in, cookies enabled, Supabase keys correct

Problem: OAuth popup doesn't open
Solution: Check redirect URI matches exactly, check browser popup settings

Problem: Data not loading on dashboard
Solution: Check platform connected, wait for sync, click refresh button

Problem: Creative generation fails
Solution: Check OpenAI/Anthropic API key, check rate limits

Problem: Reports can't generate
Solution: Ensure platforms connected with data, check AI API key

═══════════════════════════════════════════════════════════════════════════════

For complete details, see: COMPLETE_AUTH_SYSTEM_GUIDE.md

Ready to deploy? Go live now!
