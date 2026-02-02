# Platform OAuth Setup Guide

## Step 1: Create OAuth Apps for Each Platform

### Meta (Facebook)
1. Go to https://developers.facebook.com/
2. Create a new app (type: Business)
3. Add "Facebook Login" product
4. Go to Settings > Basic and copy:
   - App ID → `META_APP_ID`
   - App Secret → `META_APP_SECRET`
5. In Settings > Basic, add your domain to App Domains: `yourdomain.vercel.app`
6. Go to Settings > Redirect URLs and add: `https://yourdomain.vercel.app/api/oauth/callback`

### Google
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "Google Ads API" 
4. Go to Credentials > Create OAuth 2.0 Client ID (Web application)
5. Add Authorized redirect URIs: `https://yourdomain.vercel.app/api/oauth/callback`
6. Copy:
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

### LinkedIn
1. Go to https://www.linkedin.com/developers/apps/
2. Create new app
3. Go to Auth tab and add:
   - Authorized redirect URL: `https://yourdomain.vercel.app/api/oauth/callback`
4. Copy:
   - Client ID → `LINKEDIN_CLIENT_ID`
   - Client Secret → `LINKEDIN_CLIENT_SECRET`

### TikTok
1. Go to https://developer.tiktok.com/
2. Create new app (type: Web)
3. In Platform section, add Platform: `Web`
4. Add Redirect URL: `https://yourdomain.vercel.app/api/oauth/callback`
5. Copy:
   - Client Key → `TIKTOK_CLIENT_ID`
   - Client Secret → `TIKTOK_CLIENT_SECRET`

## Step 2: Add to Vercel

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:

\`\`\`
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
\`\`\`

4. Click "Save"
5. Redeploy your app (Vercel will auto-redeploy)

## Step 3: Test Connection

After adding credentials and redeploying:
1. Go to Settings > Connected Platforms
2. Click "Connect Now" on any platform
3. OAuth popup should open (no more demo mode)
4. Authorize and you're connected!

## Troubleshooting

**Still seeing "Demo Mode" error?**
- Check environment variables are saved in Vercel
- Make sure you redeployed after adding variables
- Wait 2-3 minutes for Vercel to apply changes

**Getting "Invalid redirect URI"?**
- Make sure your production URL matches in both:
  - `NEXT_PUBLIC_APP_URL` environment variable
  - Each platform's OAuth app settings

**Connection fails after authorization?**
- Check that `/api/oauth/callback` route exists
- Check Supabase is connected and has platform_connections table
