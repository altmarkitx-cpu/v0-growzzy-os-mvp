# GROWZZY OS - Complete Deployment Guide

## Overview
GROWZZY OS is a production-ready AI marketing platform with complete authentication, real data analytics, AI creative generation, and platform integrations.

## Features Included

### 1. Complete Authentication System
- Email/Password Sign Up & Sign In
- Secure password hashing with bcrypt
- Session management with cookies
- Protected routes with middleware
- Automatic redirect to dashboard after login

### 2. Platform Connections (One-Click OAuth)
- Meta Ads (Facebook & Instagram)
- Google Ads
- LinkedIn Ads
- Shopify
- One-click OAuth with automatic popups
- Real-time sync status monitoring
- Auto-refresh every 5 minutes via cron jobs

### 3. AI Creative Generator
- Generate 20 ad variations in seconds
- Uses Claude AI for high-quality output
- Analyzes frameworks (PAS, AIDA, BAB, 4P, FAB)
- Performance scoring (1-10)
- Psychological triggers analysis
- CSV export functionality

### 4. Real-Time Analytics Dashboard
- KPI cards with trends (Spend, Revenue, ROAS, Conversions)
- Performance charts (last 30 days)
- Platform breakdown (pie chart)
- Top 10 campaigns table
- Real data from connected platforms
- Data refresh capabilities

### 5. Automations System
- Schedule-based automation rules
- Metric threshold triggers
- Real API actions on platforms
- Cron job execution

### 6. Report Generation
- AI-powered insights
- Professional PDF reports
- Platform breakdowns
- Top performing campaigns
- Budget recommendations

## Prerequisites

### Required Services
1. **Supabase** - PostgreSQL database with auth
   - Create account at https://supabase.com
   - Get Project URL and API keys

2. **OpenAI / Anthropic** - For AI features
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic (Claude): https://console.anthropic.com

3. **OAuth Credentials**
   - Meta: https://developers.facebook.com
   - Google: https://console.cloud.google.com
   - LinkedIn: https://www.linkedin.com/developers/apps
   - Shopify: https://shopify.dev

4. **Vercel** - For hosting
   - https://vercel.com

## Step-by-Step Deployment

### Step 1: Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Go to Settings → API Keys
3. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL` (Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Anon Key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service Role Key)

4. In SQL Editor, run the schema setup:
   ```sql
   -- Tables will be auto-created by Prisma on first deployment
   ```

### Step 2: Configure OAuth Providers

#### Meta Ads
1. Go to https://developers.facebook.com
2. Create an app or use existing one
3. Add "Facebook Login" product
4. In Settings → Basic, get:
   - `META_APP_ID`
   - `META_APP_SECRET`
5. Set Redirect URL: `https://your-domain.com/api/oauth/meta/callback`

#### Google Ads
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials (Web Application)
3. Add Authorized redirect URI: `https://your-domain.com/api/oauth/google/callback`
4. Get:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### LinkedIn
1. Go to https://www.linkedin.com/developers/apps
2. Create app and get:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
3. Authorized redirect URL: `https://your-domain.com/api/oauth/linkedin/callback`

#### Shopify
1. Create custom app in Shopify Admin
2. Set up API credentials
3. Store app URL and API key

### Step 3: Set Up AI Services

#### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create API key
3. Copy as `OPENAI_API_KEY`

#### Anthropic (Claude)
1. Visit https://console.anthropic.com
2. Create API key
3. Copy as `ANTHROPIC_API_KEY`

### Step 4: Create Encryption Key

Generate a 32-character encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy output as `ENCRYPTION_KEY`

### Step 5: Vercel Deployment

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/growzzy-os.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Import the GitHub repository
4. Configure project:
   - Framework: Next.js
   - Root directory: ./

5. Add all environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=xxx
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ENCRYPTION_KEY=xxx
   META_APP_ID=xxx
   META_APP_SECRET=xxx
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   OPENAI_API_KEY=xxx
   ANTHROPIC_API_KEY=xxx
   CRON_SECRET=<generate-random>
   ```

6. Deploy and get your live URL (e.g., growzzy-os.vercel.app)

### Step 6: Update OAuth Redirect URLs

Update all OAuth providers with your new live domain:

**Meta:**
- Settings → Basic → App Domains: your-domain.com
- Settings → Basic → Redirect URLs: https://your-domain.com/api/oauth/meta/callback

**Google:**
- Credentials → Edit → Authorized redirect URIs: https://your-domain.com/api/oauth/google/callback

**LinkedIn:**
- App settings → Authorized redirect URLs: https://your-domain.com/api/oauth/linkedin/callback

## Running Locally

1. Copy `.env.local.example` to `.env.local`
2. Fill in all environment variables
3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up database:
   ```bash
   pnpm prisma:generate
   pnpm prisma:push
   ```

5. Run development server:
   ```bash
   pnpm dev
   ```

6. Open http://localhost:3000

## Testing the Features

### 1. Sign Up / Sign In
- Visit http://localhost:3000/auth
- Create account or sign in
- Should redirect to /dashboard

### 2. Connect Platform
- Go to Connections page
- Click "Connect" for any platform
- OAuth popup opens
- After login, data syncs automatically

### 3. Generate Ad Creatives
- Go to Creative Studio
- Fill in product details
- Click "Generate 20 Variations"
- View AI-generated creatives

### 4. View Analytics
- Dashboard shows real metrics from connected platforms
- Charts update with live data
- Campaigns table shows top performers

## Background Sync Jobs

The platform includes Vercel Cron jobs that run automatically:

- **Every 5 minutes**: Sync data from all connected platforms
- **Every 5 minutes**: Check and execute automations

These are configured in `vercel.json` and will run automatically after deployment.

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] Database encryption enabled in Supabase
- [ ] HTTPS enabled (Vercel default)
- [ ] OAuth redirect URLs updated
- [ ] Cron secret is strong and random
- [ ] No API keys in code or git
- [ ] Database backups enabled

## Monitoring & Maintenance

### Logs
- View logs in Vercel dashboard
- Check Supabase for database health

### API Health
- GET `/api/health` endpoint available
- Check sync status in Connections page

### Performance
- Monitor analytics in Vercel Performance section
- Check database query performance in Supabase

## Troubleshooting

### OAuth Fails
- Verify redirect URLs match exactly
- Check API keys are correct
- Ensure app is public/approved by platform

### Data Not Syncing
- Check cron jobs in Vercel settings
- Verify API credentials are valid
- Check database connection

### AI Generation Fails
- Verify OpenAI/Anthropic API keys
- Check rate limits on API account
- Monitor Vercel logs for errors

## Cost Estimation

### Monthly Costs
- Supabase: ~$25/month (with generous free tier)
- Vercel: $0-100/month (based on usage)
- OpenAI: ~$10-50/month (based on usage)
- Anthropic: ~$10-50/month (based on usage)

Total: ~$50-250/month depending on usage

## Support & Resources

- Documentation: README.md
- GitHub Issues: Report bugs and feature requests
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

## Next Steps

1. Customize branding (colors, logos, text)
2. Add more OAuth providers
3. Set up analytics tracking
4. Create user onboarding flow
5. Add payment integration
6. Deploy to production domain

---

Deployment complete! Your AI marketing platform is now live.
