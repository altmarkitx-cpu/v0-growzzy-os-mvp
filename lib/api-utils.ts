/**
 * GROWZZY OS - Platform Utilities
 * Centralized utilities for API calls, formatting, and calculations
 */

// API BASE URL
export const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Fetch wrapper with error handling
 */
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] API Error:', endpoint, error)
    throw error
  }
}

/**
 * Format currency to INR
 */
export function formatCurrency(value: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format ROAS with 2 decimal places
 */
export function formatROAS(value: number): string {
  return `${value.toFixed(2)}x`
}

/**
 * Calculate trending indicator (up/down/neutral)
 */
export function calculateTrend(current: number, previous: number): {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
} {
  if (previous === 0) return { direction: 'neutral', percentage: 0 }
  
  const change = ((current - previous) / previous) * 100
  
  return {
    direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral',
    percentage: Math.abs(change),
  }
}

/**
 * Format large numbers (1M, 1K, etc.)
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toString()
}

/**
 * Get platform color
 */
export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    meta: '#1877F2',
    facebook: '#1877F2',
    instagram: '#E4405F',
    google: '#4285F4',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    snapchat: '#FFFC00',
    pinterest: '#E60023',
    shopify: '#96bf48',
  }
  return colors[platform.toLowerCase()] || '#666'
}

/**
 * Get platform icon name (for Lucide React)
 */
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    meta: 'facebook',
    facebook: 'facebook',
    instagram: 'instagram',
    google: 'search',
    linkedin: 'linkedin',
    tiktok: 'music',
    snapchat: 'ghost',
    pinterest: 'pin',
    shopify: 'shopping-bag',
  }
  return icons[platform.toLowerCase()] || 'zap'
}

/**
 * Parse date range string (e.g., "30d", "90d", "custom")
 */
export function parseDateRange(range: string): {
  startDate: Date
  endDate: Date
} {
  const endDate = new Date()
  const startDate = new Date()

  switch (range) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case '180d':
      startDate.setDate(startDate.getDate() - 180)
      break
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
  }

  return { startDate, endDate }
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return d.toLocaleDateString('en-IN', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Calculate CTR (Click-Through Rate)
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}

/**
 * Calculate CPM (Cost Per Mille)
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0
  return (spend / impressions) * 1000
}

/**
 * Calculate CPC (Cost Per Click)
 */
export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) return 0
  return spend / clicks
}

/**
 * Calculate CPA (Cost Per Action/Conversion)
 */
export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0
  return spend / conversions
}

/**
 * Calculate ROAS (Return on Ad Spend)
 */
export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0
  return revenue / spend
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string): boolean {
  const re = /^(?:\+91|0)?[6-9]\d{9}$/
  return re.test(phone.replace(/\D/g, ''))
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): {
  bg: string
  text: string
  border: string
} {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    scheduled: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  }

  return statusColors[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
