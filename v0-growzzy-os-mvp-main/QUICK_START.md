# GROWZZY OS - Quick Start Guide

## What You Have

Your AI marketing platform is complete and production-ready with:

### Features Ready to Ship
✅ **Complete Authentication** - Email/Password sign up & login with secure session management
✅ **OAuth Integrations** - Meta, Google, LinkedIn, Shopify (one-click connect)
✅ **AI Creative Generator** - Generate 20 ad variations with Claude AI
✅ **Real Analytics Dashboard** - Live metrics from connected platforms
✅ **Automations System** - Schedule tasks and set metric-based rules
✅ **Report Generation** - AI insights and PDF reports
✅ **Background Sync Jobs** - Auto-sync every 5 minutes via Vercel Cron

## Deployment in 5 Steps

### 1. Get Your API Keys (15 minutes)

**Supabase** (Database)
- Go to https://supabase.com → Sign up
- Create a project
- Copy: Project URL, Anon Key, Service Role Key

**OpenAI** (AI)
- Visit https://platform.openai.com/api-keys
- Create new API key

**Meta App** (OAuth)
- Go to https://developers.facebook.com
- Create app → Get App ID & Secret

**Google App** (OAuth)
- Visit https://console.cloud.google.com
- Create OAuth 2.0 credentials
- Get Client ID & Secret

### 2. Push Code to GitHub (5 minutes)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/growzzy-os.git
git push -u origin main
```

### 3. Deploy to Vercel (10 minutes)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Click "Deploy"
4. Once deployed, go to Settings → Environment Variables
5. Add all your API keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `META_APP_ID` & `META_APP_SECRET`
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `ENCRYPTION_KEY` (generate: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`)
   - `CRON_SECRET` (any random string)

6. Redeploy from Settings → Deployments

### 4. Update OAuth Redirect URLs (5 minutes)

Get your Vercel URL (e.g., `growzzy-os.vercel.app`)

**For Meta:**
- Settings → Basic → Redirect URLs: `https://growzzy-os.vercel.app/api/oauth/meta/callback`

**For Google:**
- Credentials → Edit → Add redirect URI: `https://growzzy-os.vercel.app/api/oauth/google/callback`

### 5. Test Live (5 minutes)

1. Visit your live URL: `https://growzzy-os.vercel.app`
2. Sign up for an account
3. Go to Connections → Connect a platform
4. Try the Creative Generator
5. View Analytics Dashboard

**Total Time: ~40 minutes**

## Your Live App Includes

### Landing Page
- Beautiful marketing homepage
- Features showcase
- Pricing section
- FAQs
- Sign up CTA

### Authentication
- Email/Password registration
- Secure login
- Session persistence
- Auto-redirect to dashboard

### Dashboard
- Real-time KPI metrics
- 30-day performance trends
- Platform breakdown charts
- Top 10 campaigns table
- Data refresh button

### Platform Connections
- One-click OAuth for 4+ platforms
- Auto-sync every 5 minutes
- Manual sync button
- Connection status & health
- Setup guides for each platform

### Creative Studio
- AI-powered ad generator
- Generates 20 variations
- Performance scoring
- CSV export
- Copy-to-clipboard buttons

### Automations
- Time-based scheduling
- Metric threshold triggers
- Real API execution
- Automation history

## Environment Variables Summary

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# OAuth Credentials
META_APP_ID=your_meta_id
META_APP_SECRET=your_meta_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Security
ENCRYPTION_KEY=your_32_char_key
CRON_SECRET=your_cron_secret
```

## Common Issues & Fixes

### OAuth Popup Blocked
- Check popup blocker settings
- Verify redirect URLs match exactly

### Data Not Showing in Dashboard
- Go to Connections and click "Sync All Now"
- Wait 30 seconds for background job
- Check if platforms are connected

### Creative Generator Returns Error
- Verify OpenAI API key has credits
- Check API rate limits
- Review Vercel logs for details

### Can't Log In
- Verify email/password is correct
- Check Supabase database connectivity
- Clear browser cache and retry

## File Structure

```
/
├── app/
│   ├── page.tsx              # Landing page
│   ├── auth/page.tsx         # Login/signup
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── dashboard/creative/   # AI creative generator
│   ├── connections/page.tsx  # Platform connections
│   └── api/
│       ├── auth/             # Authentication endpoints
│       ├── oauth/            # OAuth flows
│       ├── analytics/        # Data endpoints
│       └── cron/             # Background jobs
├── components/               # Reusable UI components
├── lib/                      # Utilities and helpers
├── prisma/                   # Database schema
└── public/                   # Static assets
```

## Next Steps

1. **Customize Branding**
   - Update logo and colors
   - Modify copy and messaging
   - Add your company name

2. **Add Payment** (Optional)
   - Integrate Stripe
   - Set up subscription plans
   - Add billing management

3. **Email Notifications** (Optional)
   - Set up Resend or SendGrid
   - Send sync status emails
   - User onboarding emails

4. **Analytics Tracking** (Optional)
   - Add Posthog or Mixpanel
   - Track user behavior
   - Monitor conversions

5. **Custom Domain**
   - Buy domain (GoDaddy, Namecheap)
   - Update DNS to Vercel
   - Set in project settings

## Support

- See full deployment guide: `/DEPLOYMENT_GUIDE.md`
- Check environment variables: `/.env.local.example`
- Review cron configuration: `/vercel.json`
- Database schema: `/prisma/schema.prisma`

## You're Ready!

Your GROWZZY OS platform is production-ready. Deploy it and start helping marketers optimize their ad campaigns with AI!

Questions? Check the detailed deployment guide or review the inline code comments for specific features.

Good luck!
