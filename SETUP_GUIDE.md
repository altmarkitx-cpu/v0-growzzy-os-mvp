# GROWZZY OS - Setup Guide

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)
- OpenAI API key

## 1. Clone & Install

\`\`\`bash
git clone https://github.com/your-org/growzzy-os.git
cd growzzy-os
npm install
\`\`\`

## 2. Database Setup

### Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Save your credentials

### Run Migrations
1. Go to SQL Editor in Supabase
2. Execute the migrations from `scripts/migrations/`
3. Enable RLS on all tables

## 3. Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update with your credentials:
- Supabase URL and keys
- OpenAI API key
- Platform OAuth credentials
- Encryption key: `openssl rand -hex 32`
- Cron secret: `openssl rand -hex 32`

## 4. Platform OAuth Setup

### Meta Ads
1. Go to https://developers.facebook.com/
2. Create app → Business
3. Add Facebook Login product
4. Set redirect URI: `https://your-domain.com/auth/meta/callback`
5. Get App ID and Secret

### Google Ads
1. Go to https://console.cloud.google.com
2. Create project
3. Enable Google Ads API
4. Create OAuth 2.0 credentials
5. Set redirect URI: `https://your-domain.com/auth/google/callback`

### LinkedIn
1. Go to https://www.linkedin.com/developers/apps
2. Create app
3. Set redirect URI: `https://your-domain.com/auth/linkedin/callback`

## 5. Local Development

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## 6. Deployment

### Deploy to Vercel
\`\`\`bash
vercel --prod
\`\`\`

### Configure Cron Jobs
The cron jobs are automatically configured via `vercel.json`:
- Platform sync: Every 6 hours
- Automation check: Every 5 minutes

## 7. First Time Setup

1. Go to http://localhost:3000/auth
2. Sign up with email
3. Verify email
4. Go to Settings
5. Connect platforms
6. Start creating campaigns

## Common Issues

### Database Connection Failed
- Check SUPABASE_URL and keys
- Verify firewall rules in Supabase

### OAuth Login Failed
- Verify redirect URIs match exactly
- Check APP_ID and APP_SECRET
- Ensure all required scopes are enabled

### Cron Jobs Not Running
- Check CRON_SECRET is set
- Verify Vercel deployment
- Check cron logs in Vercel dashboard

## Support

Contact: support@growzzy.com
Docs: https://docs.growzzy.com

---
Last Updated: January 2025
