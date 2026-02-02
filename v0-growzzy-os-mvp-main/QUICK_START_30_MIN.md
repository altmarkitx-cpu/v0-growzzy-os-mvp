# GROWZZY OS - Launch in 30 Minutes

This guide walks you through launching GROWZZY OS locally and deploying to production in 30 minutes.

## Prerequisites (2 minutes)
- Node.js 18+ installed
- Git installed
- GitHub account (for deployment)
- Vercel account (free tier okay)

## Step 1: Get Your API Keys (5 minutes)

### Supabase
1. Go to https://supabase.com
2. Create new project (free tier)
3. Copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)

### OpenAI
1. Go to https://platform.openai.com
2. Create API key
3. Copy to `OPENAI_API_KEY`

### NextAuth Secret
```bash
# Run this in terminal to generate a secret
openssl rand -base64 32
# Copy output to NEXTAUTH_SECRET
```

## Step 2: Setup Local Environment (3 minutes)

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Edit .env.local with your API keys (from Step 1)
# Use your favorite editor - fill in all the values
nano .env.local  # or code .env.local, vim .env.local, etc.

# 3. Save and close the editor
```

### .env.local should look like:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
NEXTAUTH_SECRET=your-secret-from-above
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Run Locally (10 minutes)

```bash
# 1. Install dependencies
npm install
# Takes about 5 minutes

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:3000
# You should see the login page
```

### Test the App
1. Click "Sign Up"
2. Create test account (any email/password)
3. You'll be redirected to dashboard
4. Explore features:
   - Analytics dashboard
   - Create campaign
   - Try AI copilot
   - Check leads page

## Step 4: Deploy to Vercel (10 minutes)

### 4a. Push to GitHub (3 minutes)

```bash
# 1. Initialize git repository (if not already)
git init
git add .
git commit -m "Initial commit: GROWZZY OS platform"

# 2. Create GitHub repository
# Go to github.com/new and create repository

# 3. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/growzzy-os.git
git branch -M main
git push -u origin main
```

### 4b. Deploy to Vercel (7 minutes)

1. Go to https://vercel.com
2. Click "New Project"
3. Select your GitHub repository
4. Click "Deploy"
5. After import, click "Environment Variables"
6. Add these variables (from .env.local):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL` → Your Vercel URL (e.g., `https://growzzy-os.vercel.app`)
7. Click "Deploy"
8. Wait for deployment (2-3 minutes)
9. Your app is now LIVE! 🎉

## Step 5: Update OAuth Platforms (5 minutes, optional)

To connect Meta, Google, LinkedIn, TikTok:

1. Go to each platform's developer console
2. Update OAuth redirect URL:
   ```
   https://your-vercel-url.vercel.app/api/oauth/[platform]/callback
   ```
3. Get your API credentials
4. Add to Vercel environment variables

## Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails on Vercel
- Check environment variables are set correctly
- Make sure all required keys are added
- Check Vercel build logs for specific errors

### Database errors
- Verify Supabase credentials in .env.local
- Check Supabase project is active
- Ensure tables are created in Supabase

### Login doesn't work
- Check NEXTAUTH_SECRET is set
- Verify NEXT_PUBLIC_APP_URL matches your domain
- Clear browser cookies and try again

## What You Now Have

✅ **Live marketing platform** running at your Vercel URL
✅ **Database** synced with Supabase
✅ **User authentication** working
✅ **AI features** powered by GPT-4
✅ **Campaign management** for 5 platforms
✅ **Analytics dashboard** with real-time data
✅ **Team ready** for production users

## Next Steps

1. **Invite team members** to your Supabase project
2. **Configure platform connections** (Meta, Google, etc.)
3. **Customize branding** (colors, logos)
4. **Set up payment** if monetizing (Stripe integration ready)
5. **Monitor analytics** in Vercel dashboard

## Need Help?

1. Check GETTING_STARTED.md for detailed guides
2. See DEPLOYMENT_CHECKLIST.md for pre-launch verification
3. Read API documentation in DOCUMENTATION_INDEX.md
4. Check logs: `vercel logs --tail`

---

**Congratulations!** You now have a production-ready AI marketing platform deployed and running. 🚀

**Time to celebrate!** ✨
