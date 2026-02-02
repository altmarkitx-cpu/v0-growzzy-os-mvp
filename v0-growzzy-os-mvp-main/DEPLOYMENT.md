# GROWZZY OS - Deployment Guide

## Production Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set:

\`\`\`bash
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
\`\`\`

### 2. Database Setup
- All migrations have been applied
- RLS policies are enabled on all tables
- Indexes are created for performance

### 3. OAuth Configuration (Optional)
For platform integrations:
- META_APP_ID, META_APP_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- SHOPIFY_APP_ID, SHOPIFY_APP_SECRET
- LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET

### 4. Health Check
Verify deployment:
\`\`\`bash
curl https://your-domain.com/api/health
\`\`\`

### 5. Key Features Enabled
- OAuth one-click platform connections
- AI-powered insights and recommendations
- Real-time campaign analytics
- Automated lead management
- Workflow automation system
- Multi-user support with RLS

### 6. Security Measures
- Row Level Security enabled on all tables
- API authentication required for all endpoints
- Environment variables secured in Vercel
- No sensitive data in client code
- CORS configured

## Troubleshooting

### Database Connection Issues
Check Supabase URL and anon key in environment variables.

### AI Features Not Working
Verify OPENAI_API_KEY is set and has sufficient credits.

### OAuth Failures
Ensure OAuth credentials are configured for desired platforms.

## Support
For issues, check the GitHub repository or contact support.
