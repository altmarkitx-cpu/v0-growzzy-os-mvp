# GROWZZY OS - Production Deployment Checklist

Complete this checklist before deploying to production. Total time: 60-90 minutes.

## Phase 1: Pre-Deployment Setup (Local)

### Local Testing
- [ ] Run `pnpm install` - all dependencies install
- [ ] Run `pnpm prisma:generate` - Prisma client generates
- [ ] Run `pnpm prisma:push` - database syncs
- [ ] Run `pnpm dev` - dev server starts on :3000
- [ ] Open http://localhost:3000 - landing page loads
- [ ] Sign up form works - creates new account
- [ ] Sign in form works - logs in successfully
- [ ] Dashboard loads after login - shows real data
- [ ] Logout works - redirects to /auth
- [ ] Cannot access /dashboard without login - auto redirects
- [ ] Creative Studio page loads
- [ ] Creative generation works with Claude
- [ ] Connections page displays
- [ ] No TypeScript errors: `pnpm tsc --noEmit`
- [ ] No console errors or warnings in browser

### Environment Variables Verification
- [ ] `.env.local` file exists
- [ ] All 10+ required variables present:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ENCRYPTION_KEY` (32-char hex)
  - `CRON_SECRET` (random string)
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY` (optional)
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- [ ] No variables missing
- [ ] `.env.local` in `.gitignore`

## Phase 2: Service & API Credential Setup

### Supabase Database
- [ ] Supabase account created at supabase.com
- [ ] Project created
- [ ] Project URL copied to `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Anon Key copied to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Service Role Key copied to `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database tables created (Prisma handles this)
- [ ] Authentication enabled

### OpenAI API
- [ ] OpenAI account created at platform.openai.com
- [ ] API key generated
- [ ] API key copied to `OPENAI_API_KEY`
- [ ] Account has available credits/quota
- [ ] GPT-4 or GPT-3.5 access confirmed

### Anthropic API (Optional but Recommended)
- [ ] Anthropic account created at console.anthropic.com
- [ ] API key generated
- [ ] API key copied to `ANTHROPIC_API_KEY`
- [ ] Account has available credits

### Meta OAuth App
- [ ] Facebook Developer account created
- [ ] New app created at developers.facebook.com
- [ ] "Facebook Login" product added
- [ ] App ID copied to `META_APP_ID`
- [ ] App Secret copied to `META_APP_SECRET`
- [ ] App status: In Development (will change to Live later)

### Google OAuth App
- [ ] Google Cloud Console account created
- [ ] New project created
- [ ] OAuth 2.0 credentials created (Web Application)
- [ ] Client ID copied to `GOOGLE_CLIENT_ID`
- [ ] Client Secret copied to `GOOGLE_CLIENT_SECRET`
- [ ] Google Ads API enabled in project

### LinkedIn OAuth App
- [ ] LinkedIn developer account created
- [ ] New app created at linkedin.com/developers/apps
- [ ] App ID and Client ID noted
- [ ] Client Secret created
- [ ] Add to `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` if implementing

## Phase 3: Code Preparation

### Code Quality
- [ ] No `console.log` statements in production code
- [ ] No hardcoded API keys in code
- [ ] All sensitive data in environment variables
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] No `any` types (TypeScript strict mode)

### Git Repository
- [ ] GitHub account created/verified
- [ ] Repository created on GitHub
- [ ] `.gitignore` includes:
  - `.env.local`
  - `node_modules/`
  - `.next/`
  - `.vercel/`
- [ ] Code committed and pushed to main branch
- [ ] No secrets in git history
- [ ] README.md present and complete

### Build Verification
- [ ] `pnpm run build` completes without errors
- [ ] No warnings during build (address them)
- [ ] Build output size reasonable
- [ ] All imports resolve correctly

## Phase 4: Vercel Deployment

### Vercel Project Creation
- [ ] Vercel account created at vercel.com
- [ ] GitHub account connected to Vercel
- [ ] New project imported from GitHub repository
- [ ] Project name set to "growzzy-os"
- [ ] Framework detected as Next.js
- [ ] Build command: `pnpm run build`
- [ ] Install command: `pnpm install`

### Environment Variables in Vercel
- [ ] Production environment selected
- [ ] All 11 environment variables added:
  1. `NEXT_PUBLIC_SUPABASE_URL` ✓
  2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✓
  3. `SUPABASE_SERVICE_ROLE_KEY` ✓
  4. `ENCRYPTION_KEY` ✓
  5. `CRON_SECRET` ✓
  6. `OPENAI_API_KEY` ✓
  7. `ANTHROPIC_API_KEY` ✓
  8. `META_APP_ID` ✓
  9. `META_APP_SECRET` ✓
  10. `GOOGLE_CLIENT_ID` ✓
  11. `GOOGLE_CLIENT_SECRET` ✓
- [ ] Each variable verified (copy-paste from local)
- [ ] No typos in variable names
- [ ] Save environment variables

### Initial Deploy
- [ ] Click "Deploy" button
- [ ] Build progresses through stages
- [ ] Build completes successfully
- [ ] No build errors in logs
- [ ] Deployment URL generated (e.g., `growzzy-os.vercel.app`)
- [ ] Write down the Vercel URL
- [ ] Wait for Vercel analytics to show status

## Phase 5: Post-Deploy OAuth Configuration

### Update Meta OAuth Redirect URL
- [ ] Go to Meta App Settings
- [ ] Set "App Domain": `your-vercel-url.vercel.app`
- [ ] Set "Valid OAuth Redirect URIs": 
  - `https://your-vercel-url.vercel.app/api/oauth/meta/callback`
- [ ] Save and review changes
- [ ] Note: Test locally with localhost first, then update for production

### Update Google OAuth Redirect URL
- [ ] Go to Google Cloud Console > Credentials
- [ ] Edit your OAuth 2.0 Client ID
- [ ] Under "Authorized redirect URIs" add:
  - `https://your-vercel-url.vercel.app/api/oauth/google/callback`
- [ ] Save changes

### Update LinkedIn OAuth Redirect URL
- [ ] Go to LinkedIn App Settings
- [ ] Add Authorized redirect URL:
  - `https://your-vercel-url.vercel.app/api/oauth/linkedin/callback`
- [ ] Save changes

## Phase 6: Cron Jobs Configuration

### Vercel Cron Setup
- [ ] Vercel.json file includes cron configuration
- [ ] Two cron jobs defined:
  - `*/5 * * * *` for platform sync
  - `*/5 * * * *` for automation check
- [ ] `CRON_SECRET` environment variable set
- [ ] Cron secret matches in vercel.json

## Phase 7: Live Testing (First 30 Minutes)

### Access & Loading
- [ ] Visit your Vercel URL in browser
- [ ] Landing page loads (< 3 seconds)
- [ ] No 404 or 500 errors
- [ ] Page is responsive on mobile

### Authentication Flow
- [ ] Sign up form accessible
- [ ] Create new account works
- [ ] Email/password stored securely
- [ ] Sign in with new credentials works
- [ ] Dashboard displays after login
- [ ] Logout button works
- [ ] Cannot access dashboard without login

### Dashboard Functionality
- [ ] Dashboard loads with real data
- [ ] KPI cards display metrics
- [ ] Charts render properly
- [ ] Top campaigns table shows data
- [ ] No console errors
- [ ] Data refresh button works

### Creative Generator
- [ ] Creative Studio page loads
- [ ] Form inputs work
- [ ] Generate button works
- [ ] Results display 20 variations
- [ ] Export CSV works
- [ ] No errors in console

### Platform Connections
- [ ] Connections page loads
- [ ] "Connect Platform" buttons visible
- [ ] Meta OAuth popup opens
- [ ] Google OAuth popup opens
- [ ] Popup closes after auth
- [ ] Connected platforms display

### Mobile Testing
- [ ] Responsive on iPhone screen size
- [ ] Responsive on iPad screen size
- [ ] All buttons clickable on mobile
- [ ] Forms usable on mobile
- [ ] No horizontal scroll

## Phase 8: Performance & Monitoring

### Performance Metrics
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint (FCP) < 3s
- [ ] Largest Contentful Paint (LCP) < 4s
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Browser DevTools
- [ ] No JavaScript errors in console
- [ ] No network errors
- [ ] All API calls succeed (200-299 status)
- [ ] No CORS errors
- [ ] Response times reasonable (< 1s)

### Vercel Dashboard
- [ ] Deployment shows "Ready"
- [ ] No failed builds
- [ ] Edge function deployments successful
- [ ] Analytics shows traffic
- [ ] Cron jobs appear in Functions

## Phase 9: Backup & Recovery

### Database Backups
- [ ] Supabase backups enabled
- [ ] Backup frequency set (daily)
- [ ] Tested restore procedure
- [ ] Backup storage location verified

### Version Control
- [ ] Git tags created for release version
- [ ] Rollback plan documented
- [ ] Previous version accessible on GitHub

## Phase 10: Security Final Check

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] No API keys visible in client code
- [ ] No secrets in Vercel logs
- [ ] Password hashing working (bcrypt)
- [ ] OAuth state tokens generated
- [ ] CSRF protection active
- [ ] Rate limiting on auth endpoints
- [ ] Database credentials encrypted
- [ ] No unencrypted sensitive data

## Phase 11: Documentation

- [ ] README.md updated with live URL
- [ ] QUICK_START.md reviewed
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] IMPLEMENTATION_SUMMARY.md reviewed
- [ ] All documentation links working
- [ ] API documentation complete

## Phase 12: Team & Stakeholders

- [ ] Team notified of live URL
- [ ] Stakeholders can access platform
- [ ] Support process established
- [ ] Monitoring alerts configured
- [ ] On-call rotation established (if applicable)

## Phase 13: Post-Launch (24 Hours)

### Monitoring
- [ ] Check error logs - no critical errors
- [ ] Verify data syncing works (wait 30 min after deploy)
- [ ] Confirm cron jobs executing
- [ ] Check database performance
- [ ] Verify background tasks running

### User Testing
- [ ] Create test user account
- [ ] Connect at least one platform
- [ ] Generate AI creatives
- [ ] Verify all features working
- [ ] No data loss
- [ ] Performance acceptable

### Metrics
- [ ] Track active users
- [ ] Monitor API response times
- [ ] Check error rate
- [ ] Verify conversion funnel

## Final Go-Live Approval

- [ ] All checklist items completed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backups in place
- [ ] Monitoring active
- [ ] Support ready

**DEPLOYMENT APPROVED FOR PRODUCTION** ✅

---

## Rollback Plan (If Issues Arise)

1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Rollback to this Deployment"
4. Wait for redeployment
5. Verify platform works
6. Investigate issue in code
7. Fix and redeploy

## Support

- **Quick Issues?** Check QUICK_START.md
- **Detailed Steps?** See DEPLOYMENT_GUIDE.md
- **Implementation Details?** Read IMPLEMENTATION_SUMMARY.md
- **Getting Started?** Review README.md

---

**Status: READY FOR PRODUCTION LAUNCH**

Follow this checklist carefully. Your GROWZZY OS platform will be live and running in under 2 hours!
