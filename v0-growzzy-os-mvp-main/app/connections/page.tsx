'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  LinkIcon,
  Zap,
  Clock,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import Loading from './loading'

const PLATFORMS = [
  {
    id: 'meta',
    name: 'Meta (Facebook/Instagram)',
    description: 'Connect your Meta Ads account to track campaign performance across Facebook and Instagram',
    logo: '🔵',
    connected: false,
    setupGuide: {
      title: 'Connect Your Meta Ads Account',
      steps: [
        'Click "Connect" to open the Meta authorization page',
        'Log in with your Meta Business account',
        'Authorize GROWZZY to access your ad accounts',
        'Select which ad accounts to connect',
        'You\'ll be redirected back automatically',
      ],
      requirements: [
        'Meta Business Account with admin access',
        'Active Ad Account with ad history',
        'Permission to manage ads',
      ],
      dataWeAccess: [
        'Campaign performance metrics (spend, impressions, clicks)',
        'Conversion data and ROAS',
        'Audience insights',
        'Ad creative and copy',
      ],
    },
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Connect your Google Ads account for search, display, and video campaign analytics',
    logo: '🔴',
    connected: false,
    setupGuide: {
      title: 'Connect Your Google Ads Account',
      steps: [
        'Click "Connect" to open Google authorization',
        'Log in with your Google account',
        'Grant GROWZZY access to your Google Ads data',
        'Select which accounts to connect',
        'You\'ll be redirected back automatically',
      ],
      requirements: [
        'Google Account with access to Google Ads',
        'Admin access to at least one Google Ads account',
        '2-step verification recommended',
      ],
      dataWeAccess: [
        'Campaign performance metrics',
        'Search query data',
        'Keyword performance',
        'Conversion tracking data',
      ],
    },
  },
  {
    id: 'shopify',
    name: 'Shopify Store',
    description: 'Connect your Shopify store to sync sales, orders, and product data in real-time',
    logo: '🟠',
    connected: false,
    setupGuide: {
      title: 'Connect Your Shopify Store',
      steps: [
        'Click "Connect" and enter your Shopify store URL (e.g., mystore.myshopify.com)',
        'Click "Install App" to add GROWZZY to your store',
        'Review and authorize the required permissions',
        'Confirm the installation',
        'You\'ll be redirected back automatically',
      ],
      requirements: [
        'Active Shopify store (any plan)',
        'Admin access to your store',
        'At least one product and order',
      ],
      dataWeAccess: [
        'Order data and revenue',
        'Product information',
        'Customer data',
        'Sales analytics',
      ],
    },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    description: 'Connect LinkedIn Campaign Manager for B2B campaign tracking and lead generation',
    logo: '🔷',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Connect TikTok Ads Manager for video campaign analytics and performance metrics',
    logo: '🟣',
    connected: false,
    comingSoon: true,
  },
]

import { useSyncStatus, formatLastSync } from '@/hooks/use-sync-status'

function ConnectionsPageContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [syncing, setSyncing] = useState<string | null>(null)
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
  const { syncStatus, isSyncing, triggerSync } = useSyncStatus(user?.id)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/auth')
          return
        }
        const data = await response.json()
        setUser(data.user)

        // Fetch connections
        const connRes = await fetch(`/api/connections?userId=${data.user.id}`)
        if (connRes.ok) {
          const connData = await connRes.json()
          setConnections(connData.connections || [])
          console.log('[v0] Loaded connections:', connData.connections?.length || 0)
        }
      } catch (err) {
        console.error('[v0] Error:', err)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Check URL params for success/error
    const params = new URLSearchParams(window.location.search)
    const successParam = params.get('success')
    const errorParam = params.get('error')
    const platform = params.get('platform')

    if (successParam) {
      setSuccess(`✅ ${platform?.toUpperCase() || 'Platform'} connected successfully! Data sync will begin in ~30 seconds.`)
      // Clear URL params
      window.history.replaceState({}, '', '/connections')
      
      // Refresh connections after a moment
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
    if (errorParam) {
      setError(`Connection failed: ${decodeURIComponent(errorParam)}`)
    }
  }, [router])

  const handleConnectPlatform = async (platformId: string) => {
    if (!user) return

    try {
      console.log('[v0] Starting OAuth for platform:', platformId)

      // Call the start endpoint to get auth URL
      const response = await fetch('/api/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start OAuth flow')
      }

      const data = await response.json()

      if (data.authUrl) {
        console.log('[v0] Opening OAuth popup for:', platformId)

        // Open OAuth in popup window
        const width = 600
        const height = 700
        const left = Math.max(0, (window.outerWidth - width) / 2) + window.screenX
        const top = Math.max(0, (window.outerHeight - height) / 2) + window.screenY

        const popup = window.open(
          data.authUrl,
          'oauth_popup',
          `width=${width},height=${height},left=${left},top=${top},resizable=no,scrollbars=yes`
        )

        if (!popup || popup.closed) {
          throw new Error('Popup blocked. Please enable popups for this site.')
        }

        // Poll for popup closure
        const pollInterval = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(pollInterval)
              console.log('[v0] OAuth popup closed, refreshing connections')

              // Refresh connections after a delay
              setTimeout(async () => {
                const connRes = await fetch(`/api/connections?userId=${user.id}`)
                if (connRes.ok) {
                  const connData = await connRes.json()
                  setConnections(connData.connections || [])
                }
              }, 1500)
            }
          } catch (e) {
            clearInterval(pollInterval)
          }
        }, 500)
      } else {
        throw new Error(data.message || 'No auth URL provided')
      }
    } catch (err: any) {
      console.error('[v0] Connection error:', err)
      setError(err.message || 'Failed to start connection flow')
    }
  }

  const handleDisconnect = async (connectionId: string, platformName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platformName}?`)) return

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setConnections(connections.filter((c) => c.id !== connectionId))
        setSuccess(`✅ ${platformName} disconnected`)
      }
    } catch (err) {
      console.error('[v0] Disconnect error:', err)
      setError('Failed to disconnect')
    }
  }

  const handleSyncData = async (connectionId: string, platformName: string) => {
    try {
      setSyncing(connectionId)
      console.log('[v0] Starting manual sync for:', connectionId)

      const response = await fetch(`/api/connections/${connectionId}/sync`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`✅ ${platformName} synced: ${data.message}`)
      } else {
        setError(`Failed to sync ${platformName}: ${data.error}`)
      }
    } catch (err) {
      console.error('[v0] Sync error:', err)
      setError('Failed to start sync')
    } finally {
      setSyncing(null)
    }
  }

  const getConnectionForPlatform = (platformId: string) => {
    return connections.find((c) => c.platform === platformId && c.is_active)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading connections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Platform Connections</h1>
              <p className="text-muted-foreground mt-1">
                Connect your marketing platforms for seamless data synchronization and real-time analytics
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive font-medium">Connection Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in dark:bg-green-950/20 dark:border-green-900/30">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Sync Status Card */}
        {connections.length > 0 && (
          <Card className="mb-8 p-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Auto-Sync Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {connections.length} platform(s) connected • Data syncs every 5 minutes automatically
                  </p>
                  {syncStatus?.lastSyncTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last synced: {formatLastSync(syncStatus.lastSyncTime)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={triggerSync}
                disabled={isSyncing}
                className="w-full sm:w-auto"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync All Now'}
              </Button>
            </div>
          </Card>
        )}

        {/* Connected Platforms Summary */}
        {connections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Connected Platforms ({connections.length})</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((conn) => {
                const platform = PLATFORMS.find((p) => p.id === conn.platform)
                return (
                  <Card key={conn.id} className="p-4 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{platform?.logo}</span>
                        <div>
                          <p className="font-semibold text-sm">{platform?.name}</p>
                          <p className="text-xs text-muted-foreground">{conn.account_name || conn.account_id}</p>
                        </div>
                      </div>
                      <div className="relative w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Active & Syncing" />
                    </div>
                    <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                      <p>Connected: {new Date(conn.created_at).toLocaleDateString()}</p>
                      {conn.last_synced_at && (
                        <p>Last synced: {new Date(conn.last_synced_at).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSyncData(conn.id, platform?.name || '')}
                        disabled={syncing === conn.id}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${syncing === conn.id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Button
                        onClick={() => handleDisconnect(conn.id, platform?.name || '')}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Available Platforms with Setup Guides */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Available Platforms</h2>
            {connections.length < PLATFORMS.filter((p) => !p.comingSoon).length && (
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">
                {PLATFORMS.filter((p) => !p.comingSoon && !getConnectionForPlatform(p.id)).length} available
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((platform) => {
              const connection = getConnectionForPlatform(platform.id)
              const isConnected = !!connection
              const isExpanded = expandedGuide === platform.id

              return (
                <Card
                  key={platform.id}
                  className={`transition-all ${
                    isConnected
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/30'
                      : 'border-muted hover:border-primary/20 hover:shadow-sm'
                  } ${platform.comingSoon ? 'opacity-60' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{platform.logo}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{platform.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{platform.description}</p>
                        </div>
                      </div>
                      {isConnected && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full flex-shrink-0 dark:bg-green-900/30">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">Connected</span>
                        </div>
                      )}
                    </div>

                    {/* Connection Info */}
                    {isConnected && (
                      <div className="mb-4 p-3 bg-white/50 dark:bg-black/20 rounded border border-green-100 dark:border-green-900/30 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Connected: {new Date(connection.created_at).toLocaleDateString()}</span>
                        </div>
                        {connection.last_synced_at && (
                          <div>Last synced: {new Date(connection.last_synced_at).toLocaleString()}</div>
                        )}
                      </div>
                    )}

                    {/* Setup Guide */}
                    {!isConnected && !platform.comingSoon && platform.setupGuide && (
                      <div className="mb-4">
                        <button
                          onClick={() => setExpandedGuide(isExpanded ? null : platform.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4" />
                            Setup Guide
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-3 text-sm">
                            <div>
                              <p className="font-semibold mb-2">What you'll need:</p>
                              <ul className="space-y-1 text-xs text-muted-foreground">
                                {platform.setupGuide.requirements.map((req, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span>•</span>
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold mb-2">Connection steps:</p>
                              <ol className="space-y-1 text-xs text-muted-foreground">
                                {platform.setupGuide.steps.map((step, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="font-medium">{i + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>

                            <div>
                              <p className="font-semibold mb-2">Data we access:</p>
                              <ul className="space-y-1 text-xs text-muted-foreground">
                                {platform.setupGuide.dataWeAccess.map((data, i) => (
                                  <li key={i} className="flex gap-2">
                                    <span>•</span>
                                    <span>{data}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!isConnected && !platform.comingSoon ? (
                        <Button
                          onClick={() => handleConnectPlatform(platform.id)}
                          className="w-full"
                          size="sm"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      ) : isConnected ? (
                        <>
                          <Button
                            onClick={() => handleSyncData(connection.id, platform.name)}
                            disabled={syncing === connection.id}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncing === connection.id ? 'animate-spin' : ''}`} />
                            {syncing === connection.id ? 'Syncing...' : 'Sync'}
                          </Button>
                          <Button
                            onClick={() => handleDisconnect(connection.id, platform.name)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button disabled className="w-full" size="sm" variant="secondary">
                          Coming Soon
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Empty State */}
        {connections.length === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <LinkIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No platforms connected yet</h3>
            <p className="text-muted-foreground mt-1">
              Start connecting your marketing platforms to sync data and track performance
            </p>
          </div>
        )}

        {/* Info Box */}
        <Card className="mt-8 p-6 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-3">How Data Sync Works</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-500 space-y-2">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>Connect your platform via OAuth (secure, encrypted)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>First sync begins immediately, pulling last 90 days of data</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>Automatic syncs run every 5 minutes for real-time updates</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>All data is stored securely in our encrypted database</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default function ConnectionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConnectionsPageContent />
    </Suspense>
  )
}
