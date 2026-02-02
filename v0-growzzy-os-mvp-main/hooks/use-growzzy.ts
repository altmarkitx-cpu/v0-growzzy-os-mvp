/**
 * Custom hooks for GROWZZY OS
 */

import { useCallback, useEffect, useState } from 'react'
import useSWR from 'swr'
import { apiCall } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

/**
 * Hook for fetching campaigns
 */
export function useCampaigns() {
  const { data, error, isLoading, mutate } = useSWR('/api/campaigns', async (url) => {
    return await apiCall(url)
  })

  return {
    campaigns: data?.campaigns || [],
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for fetching single campaign
 */
export function useCampaign(campaignId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}` : null,
    async (url) => await apiCall(url)
  )

  return {
    campaign: data,
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for fetching dashboard metrics
 */
export function useDashboardMetrics(dateRange = '30d') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/metrics?range=${dateRange}`,
    async (url) => await apiCall(url)
  )

  return {
    metrics: data,
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for AI insights
 */
export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR('/api/insights', async (url) => {
    return await apiCall(url)
  })

  return {
    insights: data?.insights || [],
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for automations
 */
export function useAutomations() {
  const { data, error, isLoading, mutate } = useSWR('/api/automations', async (url) => {
    return await apiCall(url)
  })

  return {
    automations: data?.automations || [],
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for alerts
 */
export function useAlerts() {
  const { data, error, isLoading, mutate } = useSWR('/api/alerts', async (url) => {
    return await apiCall(url)
  })

  const unreadCount = data?.alerts?.filter((a: any) => !a.read).length || 0

  return {
    alerts: data?.alerts || [],
    unreadCount,
    loading: isLoading,
    error,
    refetch: mutate,
  }
}

/**
 * Hook for AI Copilot chat
 */
export function useAICopilot() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = useCallback(
    async (message: string) => {
      try {
        setLoading(true)
        setError(null)

        setMessages((prev) => [...prev, { role: 'user', content: message }])

        const response = await apiCall('/api/copilot/chat', {
          method: 'POST',
          body: JSON.stringify({
            message,
            conversationContext: messages,
          }),
        })

        setMessages((prev) => [...prev, { role: 'assistant', content: response.message }])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get response'))
        logger.error('Copilot error:', err)
      } finally {
        setLoading(false)
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  }
}

/**
 * Hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(handler)
  }, [value, delayMs])

  return debouncedValue
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Hook for local storage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logger.error('useLocalStorage error:', error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        logger.error('useLocalStorage set error:', error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}

/**
 * Hook for async data
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null })

    try {
      const response = await asyncFunction()
      setState({ data: response, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      })
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, refetch: execute }
}

/**
 * Hook for mouse position
 */
export function useMousePosition(): { x: number; y: number } {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return mousePosition
}

// Re-export React for component use
import React from 'react'
