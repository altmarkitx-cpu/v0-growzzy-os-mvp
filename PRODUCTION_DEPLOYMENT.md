# GROWZZY OS - Production Deployment Guide

## Overview
GROWZZY OS is a complete AI-powered marketing operations platform with real platform integrations, automations, and intelligent reporting.

## System Architecture

### Core Components
1. **Authentication** - Supabase Auth with email verification
2. **Platform Integrations** - Meta Ads, Google Ads, Shopify, LinkedIn
3. **Data Sync** - Real-time campaign and lead synchronization
4. **Automations** - Trigger-based workflows with cron jobs
5. **Reports** - AI-powered insights and recommendations
6. **Database** - Supabase PostgreSQL with RLS policies

### Database Schema
- `users` - User profiles with email verification
- `platform_connections` - OAuth tokens (encrypted) for each platform
- `campaigns` - Campaign data synced from platforms
- `leads` - Lead information with campaign attribution
- `automations` - Automation rules and triggers
- `automation_logs` - Automation execution history
- `reports` - Generated reports with AI insights
- `analytics` - Historical metrics tracking

## Environment Variables

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Platform OAuth
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DEVELOPER_TOKEN=your_google_developer_token

# Security & Cron
ENCRYPTION_KEY=your_256_bit_hex_key
CRON_SECRET=your_cron_secret

# AI
OPENAI_API_KEY=your_openai_api_key

# URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## Deployment Steps

### 1. Database Setup
- Create Supabase project
- Run migrations via the Supabase dashboard
- Enable RLS on all tables
- Set up service role for cron jobs

### 2. OAuth Configuration
- **Meta**: Create Facebook App, add OAuth redirect URIs
- **Google**: Create Google Cloud project, configure OAuth consent screen
- **LinkedIn**: Create LinkedIn app, configure redirect URLs

### 3. Encryption Setup
\`\`\`bash
# Generate encryption key
openssl rand -hex 32
# Set as ENCRYPTION_KEY environment variable
\`\`\`

### 4. Deployment
\`\`\`bash
# Install dependencies
npm install

# Build
npm run build

# Deploy to Vercel
vercel deploy --prod
\`\`\`

### 5. Cron Jobs Setup
Configure Vercel Cron Jobs in `vercel.json`:
- `/api/cron/sync-all-platforms` - Every 6 hours
- `/api/cron/check-automations` - Every 5 minutes

## Security Best Practices

- All OAuth tokens are encrypted with AES-256-CBC
- RLS policies enforce user data isolation
- CSRF tokens prevent cross-site attacks
- Rate limiting prevents abuse
- Input sanitization prevents injection attacks
- All API routes require authentication
- Cron endpoints require secret token

## Monitoring

### Key Metrics
- Platform sync success rate
- Automation execution success rate
- Report generation time
- API response times
- Database query performance

### Error Tracking
- Use Sentry for error monitoring
- Set up Slack alerts for critical failures
- Monitor cron job execution

## Scaling Considerations

- Database connections pool sizing
- Cron job concurrency limits
- API rate limiting per user
- Cache expensive API calls
- Archive old reports and logs

## Support

For issues or questions, contact support@growzzy.com

---
Last Updated: January 2025
