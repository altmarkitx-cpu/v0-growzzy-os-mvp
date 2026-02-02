/**
 * Storage utility for client-side caching
 */

const CACHE_KEYS = {
  USER_DATA: 'growzzy_user',
  CAMPAIGN_DATA: 'growzzy_campaigns',
  INSIGHTS_DATA: 'growzzy_insights',
  THEME_PREFERENCE: 'growzzy_theme',
} as const

/**
 * Set item in localStorage with expiry
 */
export function setStorageItem(key: string, value: any, expiryMinutes?: number): void {
  try {
    const item = {
      value,
      timestamp: Date.now(),
      expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error('[v0] Storage error:', error)
  }
}

/**
 * Get item from localStorage with expiry check
 */
export function getStorageItem<T = any>(key: string): T | null {
  try {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed = JSON.parse(item)

    // Check if expired
    if (parsed.expiry && parsed.expiry < Date.now()) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.value as T
  } catch (error) {
    console.error('[v0] Storage error:', error)
    return null
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('[v0] Storage error:', error)
  }
}

/**
 * Clear all GROWZZY data from localStorage
 */
export function clearGrowzzyStorage(): void {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('[v0] Storage clear error:', error)
  }
}

/**
 * Cache user data
 */
export function cacheUserData(userData: any): void {
  setStorageItem(CACHE_KEYS.USER_DATA, userData, 60) // 1 hour
}

/**
 * Get cached user data
 */
export function getCachedUserData(): any | null {
  return getStorageItem(CACHE_KEYS.USER_DATA)
}

/**
 * Cache campaign data
 */
export function cacheCampaignData(campaigns: any[]): void {
  setStorageItem(CACHE_KEYS.CAMPAIGN_DATA, campaigns, 30) // 30 minutes
}

/**
 * Get cached campaign data
 */
export function getCachedCampaignData(): any[] | null {
  return getStorageItem(CACHE_KEYS.CAMPAIGN_DATA)
}
