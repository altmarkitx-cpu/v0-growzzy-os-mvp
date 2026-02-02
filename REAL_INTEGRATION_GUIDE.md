# GrowzzyOS Real Platform Integration Guide

This document outlines the complete real platform integration system for GrowzzyOS.

## Architecture Overview

### 1. Platform Manager (`lib/platforms/platform-manager.ts`)
- **Purpose**: Unified interface for all platform APIs
- **Platforms**: Meta, Google Ads, LinkedIn, Shopify
- **Features**:
  - Fetch campaigns with real metrics
  - Create campaigns
  - Pause/Resume campaigns
  - Adjust budgets

### 2. MCP Loader (`lib/platforms/mcp-loader.ts`)
- **Purpose**: Initialize Model Context Protocol servers for each platform
- **Benefits**:
  - One-click OAuth connection
  - Transparent credential management
  - Production-ready architecture
- **Config**: Environment variables for each platform

### 3. Platform Sync (`lib/platform-sync.ts`)
- **Purpose**: Real-time data synchronization from platforms
- **Flow**:
  1. User connects platform
  2. System fetches real campaigns/leads
  3. Data stored in Supabase
  4. Dashboard displays real data

### 4. Automation Executor (`lib/automation-executor.ts`)
- **Purpose**: Execute automations with real platform API calls
- **Supported Actions**:
  - Pause underperforming campaigns
  - Adjust budgets
  - Send alerts
  - Apply AI recommendations
- **Execution**: Real-time with platform APIs

### 5. AI Recommendation Engine (`lib/ai-recommendation-engine.ts`)
- **Purpose**: Generate and apply AI recommendations based on real data
- **Flow**:
  1. Fetch real campaign metrics
  2. Analyze with OpenAI
  3. Generate specific recommendations
  4. Apply recommendations with one click
  5. Track results

## Implementation Steps

### Step 1: Setup Environment Variables
\`\`\`env
# Meta (Facebook Ads)
NEXT_PUBLIC_META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Google Ads
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# LinkedIn
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
\`\`\`

### Step 2: User Connects Platform
1. User goes to Settings
2. Clicks "Connect" button
3. Redirected to platform OAuth
4. Approves permissions
5. Redirected back with access token
6. Token stored securely

### Step 3: Data Sync
1. POST to `/api/campaigns/sync-real`
2. System fetches real campaigns
3. Data stored in Supabase
4. Dashboard displays real metrics

### Step 4: User Creates Campaign
1. User fills in campaign details
2. Selects target platform
3. System creates campaign on platform
4. Campaign ID stored
5. Real-time updates begin

### Step 5: AI Recommendations
1. Background job analyzes campaigns
2. Calls OpenAI with real metrics
3. Generates specific recommendations
4. User reviews in dashboard
5. Clicks "Apply" or "Do It"
6. Recommendation executes on platform

### Step 6: Automation Execution
1. Automation condition triggers
2. Real campaign data evaluated
3. Action executed on platform
4. Result logged
5. Next run scheduled

## Key Features

### ✅ One-Click Platform Connection
- No manual credential entry
- MCPs handle OAuth transparently
- Automatic data sync on connection

### ✅ Real Campaign Management
- Create campaigns directly in workspace
- Sync to platform immediately
- Edit campaigns and push changes
- Pause/Resume with one click

### ✅ Real AI Recommendations
- Based on actual platform data
- Specific, actionable suggestions
- One-click execution
- Automatic tracking

### ✅ Real Automations
- Trigger on real data changes
- Execute actions on platforms
- Real-time monitoring
- Comprehensive logging

### ✅ Real Reports
- Aggregated data from all platforms
- Real KPIs and metrics
- AI-generated insights
- Exportable reports

## API Endpoints

### Campaign Sync
\`\`\`
POST /api/campaigns/sync-real
Body: { userId, platforms: ["meta", "google", ...] }
Returns: { success, campaigns, message }
\`\`\`

### Generate AI Recommendations
\`\`\`
POST /api/ai/recommendations/generate
Body: { userId }
Returns: { success, recommendations, count }
\`\`\`

### Apply AI Recommendation
\`\`\`
POST /api/ai/recommendations/apply
Body: { recommendationId, userId }
Returns: { success, message }
\`\`\`

### Create Campaign
\`\`\`
POST /api/campaigns/create
Body: { name, platform, budget, ...}
Returns: { success, campaignId, message }
\`\`\`

### Execute Automation
\`\`\`
POST /api/automations/execute
Body: { automationId, triggerData }
Returns: { success, result, message }
\`\`\`

## Database Schema Updates

### campaigns table
- `platform_id`: Platform's campaign ID
- `platform`: Which platform (meta, google, linkedin, shopify)
- `spend`: Real spend from platform
- `revenue`: Real revenue from platform
- `roas`: Real ROAS
- `status`: Real campaign status

### automations table
- `condition`: e.g., "spend > 1000", "roas < 2.0"
- `action`: e.g., "pause_campaign", "adjust_budget"
- `last_run`: Timestamp of last execution
- `next_run`: Scheduled next execution

### ai_recommendations table
- `campaign_id`: Target campaign
- `platform`: Platform name
- `title`: AI recommendation title
- `action`: Action to execute
- `applied`: Boolean if applied
- `applied_at`: When applied

## Testing

### Test Platform Connection
1. Go to Settings
2. Click Connect (Meta/Google/LinkedIn/Shopify)
3. Complete OAuth
4. Check "Connected" status
5. Verify user data displayed

### Test Campaign Sync
1. Connect a platform
2. Create campaign on platform
3. Go to Campaigns page
4. Click "Sync" button
5. Verify campaign appears

### Test AI Recommendations
1. Connected platforms with campaigns
2. Go to Copilot
3. Click "Generate Recommendations"
4. Verify recommendations based on real data
5. Click "Apply" to execute

### Test Automations
1. Create automation with condition
2. Create test campaign meeting condition
3. Wait for automation trigger
4. Verify action executed
5. Check execution log

## Production Deployment

### Deploy MCPs
\`\`\`bash
# Each MCP runs as separate service
docker run -e CLIENT_ID=... meta-mcp-server
docker run -e CLIENT_ID=... google-mcp-server
\`\`\`

### Configure MCPs
- Set all environment variables
- Configure redirect URIs
- Test OAuth flow
- Enable production mode

### Monitor Real Data
- Setup data sync cron job
- Monitor sync performance
- Log all API calls
- Track errors

### Production Checklist
- [ ] All environment variables set
- [ ] MCPs deployed and running
- [ ] OAuth redirect URIs configured
- [ ] Database schemas migrated
- [ ] Real API rate limits understood
- [ ] Error handling for API failures
- [ ] Monitoring and logging setup
- [ ] User education on features
