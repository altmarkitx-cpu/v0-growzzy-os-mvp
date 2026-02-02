# GROWZZY OS - Complete Setup & API Keys Guide

## Overview
This guide walks you through getting all API keys and environment variables needed to run GROWZZY OS in production.

**Total Setup Time:** 45-60 minutes

---

## Step 1: Database Setup (PostgreSQL)

### Option A: Supabase (Recommended - Free tier available)
1. Go to https://supabase.com
2. Sign up/login and create a new project
3. In Project Settings → Database:
   - Copy `Project URL` → `DATABASE_URL` in `.env.local`
   - Copy `Service Role Key` → `SUPABASE_SERVICE_ROLE_KEY`
4. Enable `pgvector` extension (Settings → Extensions)
5. Run: `pnpm prisma:push` to create tables

### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb growzzy_os`
3. Set `DATABASE_URL=postgresql://user:password@localhost:5432/growzzy_os`

---

## Step 2: NextAuth Setup

### Generate Secret Key
```bash
openssl rand -hex 32
```

Add to `.env.local`:
```env
NEXTAUTH_SECRET=<generated-hex-above>
NEXTAUTH_URL=http://localhost:3000
```

For production:
```env
NEXTAUTH_URL=https://your-domain.com
```

---

## Step 3: AI API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api/keys
2. Sign up/login
3. Create new API key
4. Copy to `.env.local`:
```env
OPENAI_API_KEY=sk-...
```
**Cost:** ~$0.01 per creative generation (20 variations)

### Anthropic API Key (Optional)
1. Go to https://console.anthropic.com
2. Sign up/login
3. Create API key in Account Settings
4. Copy to `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```
**Cost:** ~$0.008 per report generation

---

## Step 4: OAuth Setup - Meta Ads

### Create Meta App
1. Go to https://developers.facebook.com
2. Create new App
3. Choose "Business" type
4. Add "Facebook Login" product
5. Go to Settings → Basic:
   - Copy `App ID` → `META_APP_ID`
   - Copy `App Secret` → `META_APP_SECRET`

### Add Redirect URIs
In App Settings → Facebook Login → Valid OAuth Redirect URIs:
- Development: `http://localhost:3000/api/oauth/meta/callback`
- Production: `https://your-domain.com/api/oauth/meta/callback`

Add to `.env.local`:
```env
META_APP_ID=<app-id>
META_APP_SECRET=<app-secret>
META_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/meta/callback
```

---

## Step 5: OAuth Setup - Google Ads

### Create Google OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create new project: "GROWZZY OS"
3. Enable APIs:
   - Google Ads API
   - Google Analytics API
4. Create OAuth 2.0 credential (Web Application):
   - Authorized redirect URIs:
     - `http://localhost:3000/api/oauth/google/callback`
     - `https://your-domain.com/api/oauth/google/callback`
5. Download credentials:
   - Copy `Client ID` → `GOOGLE_CLIENT_ID`
   - Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

Add to `.env.local`:
```env
GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

---

## Step 6: OAuth Setup - LinkedIn

### Create LinkedIn App
1. Go to https://www.linkedin.com/developers/apps
2. Create app:
   - App name: "GROWZZY OS"
   - LinkedIn Page: Create one if needed
   - App logo: Upload any image
3. In Auth → Authorized redirect URLs:
   - `http://localhost:3000/api/oauth/linkedin/callback`
   - `https://your-domain.com/api/oauth/linkedin/callback`
4. Copy credentials:
   - `Client ID` → `LINKEDIN_CLIENT_ID`
   - `Client Secret` → `LINKEDIN_CLIENT_SECRET`

Add to `.env.local`:
```env
LINKEDIN_CLIENT_ID=<client-id>
LINKEDIN_CLIENT_SECRET=<client-secret>
LINKEDIN_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/linkedin/callback
```

---

## Step 7: OAuth Setup - Shopify (Optional)

### Create Shopify App
1. Go to https://shopify.com/login (create account if needed)
2. Create new store or use existing
3. In App & Sales Channel settings:
   - Create new private app
   - Name: "GROWZZY OS"
4. Copy:
   - `API Key` → `SHOPIFY_API_KEY`
   - `API Secret` → `SHOPIFY_API_SECRET`

Add to `.env.local`:
```env
SHOPIFY_API_KEY=<api-key>
SHOPIFY_API_SECRET=<api-secret>
SHOPIFY_OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/shopify/callback
```

---

## Step 8: Security Keys

### Generate Encryption Key
```bash
openssl rand -hex 16
```

### Generate Cron Secret
```bash
openssl rand -hex 32
```

Add to `.env.local`:
```env
ENCRYPTION_KEY=<encryption-key-above>
CRON_SECRET=<cron-secret-above>
```

---

## Complete .env.local Example

```env
# DATABASE
DATABASE_URL="postgresql://user:password@localhost:5432/growzzy_os"

# NEXTAUTH
NEXTAUTH_SECRET="your-generated-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI APIs
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-key"

# META OAUTH
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_OAUTH_REDIRECT_URI="http://localhost:3000/api/oauth/meta/callback"

# GOOGLE OAUTH
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/api/oauth/google/callback"

# LINKEDIN OAUTH
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
LINKEDIN_OAUTH_REDIRECT_URI="http://localhost:3000/api/oauth/linkedin/callback"

# SHOPIFY OAUTH
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"
SHOPIFY_OAUTH_REDIRECT_URI="http://localhost:3000/api/oauth/shopify/callback"

# SECURITY
ENCRYPTION_KEY="your-generated-encryption-key"
CRON_SECRET="your-generated-cron-secret"

# APP CONFIG
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Step 9: Initialize Database

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Push schema to database
pnpm prisma:push

# (Optional) Open Prisma Studio to view data
pnpm prisma:studio
```

---

## Step 10: Run Development Server

```bash
pnpm dev
```

Visit:
- Sign Up: http://localhost:3000/auth/signup
- Sign In: http://localhost:3000/auth/signin
- Dashboard: http://localhost:3000/dashboard (after login)

---

## Production Deployment (Vercel)

### 1. Push to GitHub
```bash
git add .
git commit -m "Production ready"
git push origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com
2. Import GitHub repository
3. Add environment variables (copy from `.env.local`)
4. Deploy

### 3. Update OAuth Redirect URLs

For each OAuth provider (Meta, Google, LinkedIn, Shopify):
- Update redirect URIs to production domain:
  - `https://your-vercel-domain.vercel.app/api/oauth/<platform>/callback`
  - `https://your-custom-domain.com/api/oauth/<platform>/callback` (if using custom domain)

### 4. Set Production Secrets
In Vercel Settings → Environment Variables, add:
```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<use-different-secret-than-dev>"
```

---

## Testing Checklist

- [ ] Sign up page works
- [ ] Sign in page works
- [ ] Auto-redirect to dashboard after signup
- [ ] Dashboard loads with user data
- [ ] Creative generator works
- [ ] Report generator works
- [ ] Platform connections work
- [ ] OAuth flows complete successfully

---

## Troubleshooting

### "DATABASE_URL not set"
- Add `DATABASE_URL` to `.env.local`
- Run `pnpm prisma:push`

### "NextAuth error"
- Regenerate `NEXTAUTH_SECRET`: `openssl rand -hex 32`
- Ensure `NEXTAUTH_URL` matches your domain

### "OAuth Redirect URI mismatch"
- Verify redirect URI in your `.env.local` matches OAuth provider settings
- Include full URL with protocol and path

### "AI API errors"
- Check API key validity at OpenAI/Anthropic dashboards
- Verify account has available credits

---

## Support & Next Steps

1. Local testing complete? ✓
2. All API keys added? ✓
3. Database initialized? ✓
4. Ready to deploy to Vercel? ✓

**You're ready to go live!**
