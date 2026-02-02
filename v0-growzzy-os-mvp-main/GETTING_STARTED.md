# GROWZZY OS - Getting Started (5-Minute Quick Start)

## What You'll Have After This Setup

✅ Complete Authentication (Sign Up, Sign In, Sign Out)  
✅ Protected Dashboard (Auto-redirects after login)  
✅ AI Creative Generator  
✅ Report Generator  
✅ Platform Connections (Meta, Google, LinkedIn, Shopify)  
✅ Production-Ready System  

---

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or Supabase)
- Text editor (VSCode recommended)
- 30 minutes of time

---

## Quick Start Steps

### Step 1: Copy Environment File (2 minutes)

```bash
# Copy example to actual env file
cp .env.example .env.local
```

### Step 2: Get Database URL (5 minutes)

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com → Sign up
2. Create new project
3. Go to Settings → Database → Connection string
4. Copy the full connection string
5. Paste into `.env.local` as `DATABASE_URL`

**Option B: Local PostgreSQL**
```bash
# If PostgreSQL installed locally
DATABASE_URL="postgresql://postgres:password@localhost:5432/growzzy_os"
```

### Step 3: Generate Secret Keys (2 minutes)

```bash
# Generate NEXTAUTH_SECRET (copy output into .env.local)
openssl rand -hex 32

# Generate ENCRYPTION_KEY
openssl rand -hex 16

# Generate CRON_SECRET  
openssl rand -hex 32
```

### Step 4: Add AI API Key (3 minutes)

1. Go to https://platform.openai.com/api/keys
2. Create new API key
3. Copy to `.env.local`: `OPENAI_API_KEY=sk-...`

(Other API keys optional for now - skip for local testing)

### Step 5: Initialize Database (5 minutes)

```bash
# Install packages
pnpm install

# Create database tables
pnpm prisma:push

# (Optional) View database in browser
pnpm prisma:studio
```

### Step 6: Start Development Server (1 minute)

```bash
pnpm dev
```

Open http://localhost:3000

---

## First-Time User Flow

1. **Sign Up**
   - Go to http://localhost:3000/auth/signup
   - Enter: Name, Email, Password (8+ chars)
   - Click "Create Account"
   - ✅ Auto-redirects to Dashboard

2. **Dashboard**
   - See welcome message with your name
   - View KPI cards and charts
   - Try the AI features

3. **Sign Out**
   - Click user menu (top right)
   - Click "Sign Out"
   - ✅ Redirected to sign in page

---

## Minimal .env.local for Local Testing

```env
# Database (change password/host as needed)
DATABASE_URL="postgresql://postgres:password@localhost:5432/growzzy_os"

# NextAuth
NEXTAUTH_SECRET="<paste-generated-hex-above>"
NEXTAUTH_URL="http://localhost:3000"

# AI (get free key from https://platform.openai.com/api/keys)
OPENAI_API_KEY="sk-..."

# Security
ENCRYPTION_KEY="<paste-generated-hex-above>"
CRON_SECRET="<paste-generated-hex-above>"

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Testing Checklist

After starting with `pnpm dev`:

- [ ] Landing page loads (http://localhost:3000)
- [ ] Sign up page works (http://localhost:3000/auth/signup)
- [ ] Can create account with email/password
- [ ] Redirects to dashboard after signup
- [ ] See personalized dashboard
- [ ] Can sign out
- [ ] Sign in with same credentials works
- [ ] Dashboard loads again

---

## Next: Add OAuth (Optional - 15 minutes each)

### Meta Ads
1. https://developers.facebook.com → Create App
2. Add Facebook Login product
3. Copy App ID & Secret to `.env.local`
4. Add redirect URI: `http://localhost:3000/api/oauth/meta/callback`

### Google Ads
1. https://console.cloud.google.com → New Project
2. Enable Google Ads API
3. Create OAuth 2.0 Credentials
4. Copy Client ID & Secret to `.env.local`
5. Add redirect URI

### LinkedIn
1. https://www.linkedin.com/developers/apps → New App
2. Add redirect URI
3. Copy Client ID & Secret

See `/API_KEYS_SETUP_GUIDE.md` for detailed steps.

---

## Common Issues & Fixes

### Error: "DATABASE_URL is not set"
```bash
# Make sure .env.local exists in project root
ls -la .env.local

# Verify DATABASE_URL line is there
grep DATABASE_URL .env.local
```

### Error: "NEXTAUTH_SECRET is missing"
```bash
# Generate new secret
openssl rand -hex 32

# Add to .env.local
echo 'NEXTAUTH_SECRET="<paste-above>"' >> .env.local
```

### Error: "Prisma client not found"
```bash
# Regenerate Prisma client
pnpm prisma:generate

# Push schema
pnpm prisma:push
```

### Sign up works but dashboard is blank
- Wait 5 seconds for page to load
- Check browser console for errors (F12)
- Verify OPENAI_API_KEY is set

### Can't sign in
- Double-check email and password
- Try signing up with new account
- Check `.env.local` has NEXTAUTH_SECRET

---

## File Structure

```
growzzy-os/
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx      ← Sign in page
│   │   ├── signup/page.tsx      ← Sign up page
│   │   └── layout.tsx
│   ├── dashboard/               ← Protected dashboard
│   │   ├── page.tsx
│   │   ├── creative/page.tsx    ← AI generator
│   │   └── reports/page.tsx     ← Report generator
│   ├── api/
│   │   └── auth/
│   │       ├── [..nextauth]/    ← NextAuth routes
│   │       └── register/        ← Sign up API
│   └── page.tsx                 ← Landing page
├── lib/
│   ├── auth.ts                  ← NextAuth config
│   └── prisma.ts
├── prisma/
│   └── schema.prisma            ← Database schema
├── .env.local                   ← Your secrets (gitignored)
├── .env.example                 ← Template
├── API_KEYS_SETUP_GUIDE.md      ← Full setup guide
└── package.json
```

---

## Ready for Production?

See `/DEPLOYMENT_CHECKLIST.md` for production deployment steps.

---

## Need Help?

1. **Quick issues?** Check "Common Issues & Fixes" above
2. **Full setup?** Read `/API_KEYS_SETUP_GUIDE.md`
3. **Deployment?** Read `/DEPLOYMENT_CHECKLIST.md`

---

## What's Next?

- [ ] Test locally with sign up/sign in
- [ ] Add OAuth credentials (optional)
- [ ] Deploy to Vercel
- [ ] Add custom domain
- [ ] Invite team members

**You're all set! Start building!** 🚀
