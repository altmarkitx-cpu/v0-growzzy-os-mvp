# Google Sign-In Setup Guide

Google OAuth 2.0 authentication has been successfully integrated into GROWZZY OS!

## What's Been Added

✅ **Google OAuth Provider** - Added to NextAuth configuration
✅ **Sign-In Buttons** - Google Sign-In on signin and login pages
✅ **Auth Landing Page** - `/auth` page with sign-in/sign-up options
✅ **User Auto-Creation** - Automatically creates users from Google accounts
✅ **Session Management** - Secure JWT-based sessions

## How It Works

### User Sign-In Flow
1. User clicks "Sign in with Google" button
2. Redirected to Google's OAuth consent screen
3. After approval, redirected to your app with auth code
4. NextAuth exchanges code for access token
5. User data stored in Supabase
6. User redirected to dashboard

### User Auto-Creation
- First-time Google users are automatically created in the database
- Email is used as unique identifier
- User profile info (name) is stored
- Subsequent logins use existing user record

## Environment Variables Required

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

## Authentication Routes

- **Sign In Page:** `/auth/signin` - Email/password signin
- **Login Page:** `/auth/login` - Alternative login interface
- **Sign Up Page:** `/auth/signup` - Create new account
- **Auth Landing:** `/auth` - Choose sign-in method
- **Protected Route:** `/dashboard` - Only for authenticated users

## NextAuth Configuration

Located in `/lib/auth.ts`:
- **Provider:** Google OAuth 2.0 with credentials fallback
- **Strategy:** JWT-based sessions
- **Session Duration:** 30 days
- **Callbacks:** Auto user creation on Google sign-in

## Database Integration

Google users are stored in the `users` table with:
- `email` - User's Google email
- `full_name` - User's name from Google profile
- `provider` - Set to "google"
- `oauth_id` - Google's subject identifier
- `password_hash` - Empty for OAuth users

## Testing

1. Go to `/auth` in your app
2. Click "Sign in with Google"
3. Approve the OAuth consent
4. You should be redirected to `/dashboard`

## Troubleshooting

**"Google credentials not found"**
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in environment variables

**"Redirect URI mismatch"**
- Add your redirect URI to Google Cloud Console: `https://yourdomain.com/api/auth/callback/google`

**"User creation failed"**
- Ensure your Supabase database has proper permissions
- Check that `users` table exists and is accessible

## Next Steps

1. Get Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
2. Add Client ID and Secret to your environment variables
3. Test sign-in at `/auth` page
4. Deploy to Vercel for production use

---

**Need help?** Check NextAuth.js documentation: https://next-auth.js.org
