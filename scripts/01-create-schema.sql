-- GROWZZY OS - Comprehensive Database Schema
-- This migration creates all tables for the 5-module architecture

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MODULE 1: ACCOUNT CONNECTION & DATA INGESTION
-- ============================================================================

-- Connected ad accounts (Meta, Google, TikTok)
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'meta', 'google', 'tiktok'
  account_id VARCHAR(255) NOT NULL, -- External platform account ID
  account_name VARCHAR(255),
  access_token TEXT NOT NULL, -- Encrypted token
  refresh_token TEXT, -- Optional refresh token
  token_expires_at TIMESTAMP,
  permissions JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'disconnected'
  last_sync_at TIMESTAMP,
  sync_error TEXT,
  connected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, platform, account_id),
  INDEX idx_user_platform (user_id, platform),
  INDEX idx_sync_at (last_sync_at)
);

-- Data sync logs for tracking ingestion
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- 'full', 'incremental'
  status VARCHAR(50), -- 'running', 'success', 'failed'
  records_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_account_status (ad_account_id, status),
  INDEX idx_started_at (started_at)
);

-- ============================================================================
-- MODULE 2: CAMPAIGN & PERFORMANCE DATA
-- ============================================================================

-- Campaigns (Meta, Google, TikTok)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL, -- Platform campaign ID
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50),
  objective VARCHAR(100), -- 'conversions', 'traffic', 'awareness', etc
  status VARCHAR(50), -- 'active', 'paused', 'archived'
  budget_type VARCHAR(50), -- 'daily', 'lifetime'
  budget_amount DECIMAL(12, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ad_account_id, external_id),
  INDEX idx_user_account (user_id, ad_account_id),
  INDEX idx_status (status)
);

-- Ad sets (Meta) / Ad groups (Google)
CREATE TABLE IF NOT EXISTS ad_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  platform VARCHAR(50),
  status VARCHAR(50),
  audience_type VARCHAR(100), -- 'lookalike', 'saved', 'custom'
  targeting_config JSONB, -- Stores targeting logic
  budget DECIMAL(12, 2),
  bid_strategy VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(campaign_id, external_id),
  INDEX idx_campaign (campaign_id)
);

-- Individual ads
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_set_id UUID NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  creative_text TEXT,
  creative_url VARCHAR(255),
  creative_format VARCHAR(50), -- 'image', 'video', 'carousel'
  cta_text VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ad_set_id, external_id),
  INDEX idx_ad_set (ad_set_id)
);

-- ============================================================================
-- MODULE 3: PERFORMANCE METRICS & ANALYTICS
-- ============================================================================

-- Daily performance metrics (aggregated from platforms)
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  entity_type VARCHAR(50), -- 'campaign', 'ad_set', 'ad'
  entity_id VARCHAR(255), -- Reference to campaign/ad_set/ad external ID
  metric_date DATE NOT NULL,
  
  -- Core metrics
  spend DECIMAL(12, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions DECIMAL(10, 2) DEFAULT 0,
  cost_per_acquisition DECIMAL(10, 2),
  click_through_rate DECIMAL(5, 3),
  return_on_ad_spend DECIMAL(8, 2),
  frequency DECIMAL(6, 2),
  
  -- Additional metrics
  reach BIGINT DEFAULT 0,
  cost_per_click DECIMAL(10, 2),
  conversion_rate DECIMAL(5, 3),
  cost_per_impression DECIMAL(10, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ad_account_id, entity_type, entity_id, metric_date),
  INDEX idx_account_date (ad_account_id, metric_date),
  INDEX idx_entity_date (entity_type, entity_id, metric_date)
);

-- ============================================================================
-- MODULE 4: AI INSIGHTS ENGINE
-- ============================================================================

-- AI-generated insights and recommendations
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Reference
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE SET NULL,
  
  -- Insight details
  insight_type VARCHAR(100), -- 'scaling_opportunity', 'cost_control', 'creative_fatigue', 'budget_reallocation'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  
  -- Analysis data
  confidence_score DECIMAL(3, 2), -- 0-1
  affected_metrics JSONB, -- e.g., {"roas": 2.8, "cpa": 15.5}
  analysis_data JSONB, -- Raw analysis data
  
  -- Actions
  suggested_action VARCHAR(100), -- 'increase_budget', 'pause', 'pause_ad_set'
  action_params JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'applied', 'dismissed', 'expired'
  applied_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  INDEX idx_user_status (user_id, status),
  INDEX idx_account_created (ad_account_id, created_at),
  INDEX idx_expires (expires_at)
);

-- ============================================================================
-- MODULE 5: AUTOMATION & RULE ENGINE
-- ============================================================================

-- Automation rules for campaigns
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Rule details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_type VARCHAR(50), -- 'time_based', 'metric_based', 'event_based'
  trigger_config JSONB, -- Trigger-specific config
  
  -- Conditions (supports AND/OR logic)
  conditions JSONB NOT NULL, -- Array of condition objects
  
  -- Actions
  actions JSONB NOT NULL, -- Array of action objects
  
  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_executed_at TIMESTAMP,
  execution_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_enabled (user_id, enabled),
  INDEX idx_last_executed (last_executed_at)
);

-- Execution logs for automation rules
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Execution details
  status VARCHAR(50), -- 'pending', 'executing', 'success', 'failed'
  conditions_met BOOLEAN,
  actions_executed JSONB, -- Array of executed actions with results
  
  -- Error handling
  error_message TEXT,
  
  -- Timestamps
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_rule_status (rule_id, status),
  INDEX idx_user_triggered (user_id, triggered_at)
);

-- ============================================================================
-- MODULE 6: CREATIVE ANALYSIS
-- ============================================================================

-- Creative performance analysis
CREATE TABLE IF NOT EXISTS creative_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Creative attributes
  format VARCHAR(50), -- 'image', 'video', 'carousel'
  length INT, -- Duration in seconds for video
  colors JSONB, -- Detected colors
  hook_type VARCHAR(100), -- Type of hook used
  cta_type VARCHAR(100), -- Call-to-action type
  
  -- Performance scoring
  fatigue_score DECIMAL(3, 2), -- 0-1, higher = more fatigued
  creative_score VARCHAR(50), -- 'winning', 'stable', 'losing'
  
  -- Trend data
  ctr_trend DECIMAL(5, 3), -- CTR change percentage
  cpa_trend DECIMAL(5, 3), -- CPA change percentage
  frequency_trend DECIMAL(5, 3), -- Frequency change
  
  -- Signals
  fatigue_signals JSONB, -- Array of fatigue signals detected
  
  analyzed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_ad (ad_id),
  INDEX idx_user (user_id),
  INDEX idx_score (creative_score)
);

-- Creative variation suggestions
CREATE TABLE IF NOT EXISTS creative_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_creative_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  
  -- Suggestion details
  suggestion_type VARCHAR(100), -- 'color_variation', 'hook_variation', 'cta_variation'
  description TEXT,
  implementation_notes TEXT,
  
  -- Confidence
  confidence_score DECIMAL(3, 2),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'implemented', 'dismissed'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_status (user_id, status)
);

-- ============================================================================
-- MODULE 7: AI COPILOT & CHAT
-- ============================================================================

-- Chat history with AI copilot
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Conversation details
  title VARCHAR(255),
  context_data JSONB, -- Campaign/account context for the conversation
  
  -- Metadata
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_account (ad_account_id)
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  role VARCHAR(50), -- 'user', 'assistant'
  content TEXT NOT NULL,
  
  -- For AI responses
  analysis_data JSONB, -- Data used for analysis
  suggested_actions JSONB, -- Array of suggested actions
  citations JSONB, -- Data sources cited
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_conversation (conversation_id),
  INDEX idx_user (user_id)
);

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

-- User alerts (performance drops, overspending, etc)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  
  -- Alert details
  alert_type VARCHAR(100), -- 'performance_drop', 'overspending', 'fatigue_warning'
  severity VARCHAR(50), -- 'high', 'medium', 'low'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Affected metrics
  affected_metrics JSONB,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Delivery channels
  channels JSONB DEFAULT '["in_app"]', -- Array: 'in_app', 'email', 'slack'
  
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  
  INDEX idx_user_read (user_id, read),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- REPORTING
-- ============================================================================

-- Generated reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE SET NULL,
  
  -- Report details
  title VARCHAR(255),
  report_type VARCHAR(50), -- 'weekly', 'monthly', 'custom'
  
  -- Content
  kpi_summary JSONB,
  top_campaigns JSONB,
  ai_insights JSONB,
  
  -- Distribution
  generated_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  
  INDEX idx_user_created (user_id, generated_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Key performance indexes already defined in table creation
-- Additional indexes for common queries:

CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_performance_account_date ON performance_metrics(ad_account_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON ai_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own ad accounts" ON ad_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON copilot_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Add similar policies for other tables...
