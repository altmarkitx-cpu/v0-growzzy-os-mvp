/**
 * GROWZZY OS - Global Configuration
 * Centralized app-wide settings
 */

export const GROWZZY_CONFIG = {
  // App Info
  appName: 'GROWZZY OS',
  appVersion: '1.0.0',
  appDescription: 'AI-Powered Marketing Operations Platform',
  
  // URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Feature Flags
  features: {
    ai_copilot: true,
    creative_generator: true,
    automations: true,
    insights: true,
    alerts: true,
    reports: true,
  },

  // Platform Support
  supportedPlatforms: [
    {
      id: 'meta',
      name: 'Meta Ads',
      icon: 'facebook',
      color: '#1877F2',
      description: 'Facebook & Instagram Ads',
    },
    {
      id: 'google',
      name: 'Google Ads',
      icon: 'search',
      color: '#4285F4',
      description: 'Google Search & Display Ads',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Ads',
      icon: 'linkedin',
      color: '#0A66C2',
      description: 'LinkedIn Campaign Manager',
    },
    {
      id: 'tiktok',
      name: 'TikTok Ads',
      icon: 'music',
      color: '#000000',
      description: 'TikTok Ads Manager',
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: 'shopping-bag',
      color: '#96bf48',
      description: 'Shopify Store',
    },
  ],

  // Metrics
  metrics: {
    spend: { label: 'Spend', unit: '₹', format: 'currency' },
    revenue: { label: 'Revenue', unit: '₹', format: 'currency' },
    roas: { label: 'ROAS', unit: 'x', format: 'roas' },
    impressions: { label: 'Impressions', unit: '', format: 'number' },
    clicks: { label: 'Clicks', unit: '', format: 'number' },
    conversions: { label: 'Conversions', unit: '', format: 'number' },
    ctr: { label: 'CTR', unit: '%', format: 'percentage' },
    cpc: { label: 'CPC', unit: '₹', format: 'currency' },
    cpa: { label: 'CPA', unit: '₹', format: 'currency' },
    aov: { label: 'AOV', unit: '₹', format: 'currency' },
  },

  // Date Ranges
  dateRanges: [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '180d', label: 'Last 180 days' },
    { value: '1y', label: 'Last year' },
  ],

  // Copywriting Frameworks
  copywritingFrameworks: [
    { id: 'aida', name: 'AIDA', description: 'Attention, Interest, Desire, Action' },
    { id: 'pas', name: 'PAS', description: 'Problem, Agitation, Solution' },
    { id: 'bab', name: 'BAB', description: 'Before, After, Bridge' },
    { id: '4p', name: '4P', description: 'Promise, Picture, Proof, Push' },
    { id: 'fab', name: 'FAB', description: 'Features, Advantages, Benefits' },
  ],

  // Campaign Goals
  campaignGoals: [
    'Sales',
    'Leads',
    'Traffic',
    'Brand Awareness',
    'App Installs',
    'Engagement',
    'Video Views',
    'Collection Views',
  ],

  // Tones & Styles
  tones: [
    'Professional',
    'Casual',
    'Humorous',
    'Inspirational',
    'Educational',
    'Urgent',
    'Conversational',
    'Technical',
  ],

  // Pagination
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
  },

  // Timeouts (ms)
  timeouts: {
    api: 30000,
    autoRefresh: 300000, // 5 minutes
    debounce: 500,
    throttle: 1000,
  },

  // Limits
  limits: {
    maxCreativesPerGeneration: 20,
    maxAutomations: 50,
    maxLeads: 10000,
    maxReports: 100,
  },

  // Error Messages
  errors: {
    unauthorized: 'You are not authorized to perform this action',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    validationError: 'Please check your input and try again.',
    notFound: 'Resource not found.',
  },

  // Success Messages
  success: {
    created: 'Successfully created',
    updated: 'Successfully updated',
    deleted: 'Successfully deleted',
    applied: 'Successfully applied',
  },

  // Links
  links: {
    docs: 'https://docs.growzzy.os',
    support: 'https://support.growzzy.os',
    status: 'https://status.growzzy.os',
    github: 'https://github.com/yourusername/growzzy-os',
  },
}

export type GrowzzyConfig = typeof GROWZZY_CONFIG
