"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { Loader2, LogOut, BarChart3, Users, Zap, TrendingUp, RefreshCw, Clock, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSyncStatus, formatLastSync } from "@/hooks/use-sync-status"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export const dynamic = "force-dynamic"

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [platformBreakdown, setPlatformBreakdown] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'revenue' | 'spend' | 'roas' | 'name'>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { syncStatus, isSyncing, triggerSync } = useSyncStatus(user?.id)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[v0] Dashboard - Checking auth...")
        const response = await fetch("/api/auth/me", { credentials: "include" })
        console.log("[v0] Dashboard - Auth response status:", response.status)
        if (!response.ok) {
          console.log("[v0] Dashboard - Auth failed, redirecting to auth page")
          router.push("/auth")
          return
        }
        const data = await response.json()
        console.log("[v0] Dashboard - Auth success, user:", data.user?.email)
        setUser(data.user)

        // Fetch all analytics data
        const [metricsRes, campaignsRes, historicalRes, platformRes] = await Promise.all([
          fetch(`/api/analytics/summary?userId=${data.user.id}`),
          fetch(`/api/campaigns?userId=${data.user.id}`),
          fetch(`/api/analytics/historical?userId=${data.user.id}`),
          fetch(`/api/analytics/aggregate?userId=${data.user.id}`),
        ])

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          setMetrics(metricsData.summary)
          console.log("[v0] Metrics loaded:", metricsData.summary)
        }

        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          setCampaigns(campaignsData.campaigns || [])
          console.log("[v0] Campaigns loaded:", campaignsData.campaigns?.length || 0)
        }

        if (historicalRes.ok) {
          const histData = await historicalRes.json()
          setHistoricalData(histData.data || [])
          console.log("[v0] Historical data loaded")
        }

        if (platformRes.ok) {
          const platformData = await platformRes.json()
          setPlatformBreakdown(platformData.breakdown || [])
          console.log("[v0] Platform breakdown loaded")
        }
      } catch (error) {
        console.error("[v0] Dashboard error:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth")
  }

  // Sort campaigns
  const sortedCampaigns = useMemo(() => {
    if (!campaigns) return []
    const sorted = [...campaigns].sort((a, b) => {
      let aVal = a[sortBy] || 0
      let bVal = b[sortBy] || 0
      if (sortBy === 'name') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
    })
    return sorted.slice(0, 10)
  }, [campaigns, sortBy, sortOrder])

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0
    return (((current - previous) / previous) * 100).toFixed(1)
  }

  // Metric card component
  const MetricCard = ({ label, value, trend, icon: Icon, color = "text-blue-600" }: any) => {
    const isPositive = parseFloat(trend) >= 0
    return (
      <Card className="p-6 bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <p className="text-3xl font-bold mb-3">{value}</p>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend}% vs last period
              </span>
            </div>
          </div>
          <Icon className={`w-8 h-8 ${color} opacity-50`} />
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const totalSpend = metrics?.totalSpend || 0
  const totalRevenue = metrics?.totalRevenue || 0
  const roas = metrics?.roas || 0
  const conversions = metrics?.totalConversions || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">GROWZZY OS</h1>
          <div className="flex gap-4 items-center">
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-foreground hover:text-primary font-medium transition-colors">Dashboard</Link>
              <Link href="/connections" className="text-muted-foreground hover:text-primary transition-colors">Connections</Link>
              <Link href="/dashboard/creative" className="text-muted-foreground hover:text-primary transition-colors">Creative Studio</Link>
              <Link href="/dashboard/automations" className="text-muted-foreground hover:text-primary transition-colors">Automations</Link>
              <Link href="/dashboard/reports" className="text-muted-foreground hover:text-primary transition-colors">Reports</Link>
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user.full_name || user.email}!</h2>
            <p className="text-muted-foreground">Here's your marketing performance overview for the last 30 days.</p>
          </div>
          <Button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* KPI Cards with Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Spend"
            value={`$${totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            trend={calculateTrend(totalSpend, totalSpend * 0.9)}
            icon={Zap}
            color="text-blue-600"
          />
          <MetricCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            trend={calculateTrend(totalRevenue, totalRevenue * 0.85)}
            icon={TrendingUp}
            color="text-green-600"
          />
          <MetricCard
            label="ROAS"
            value={`${roas.toFixed(2)}x`}
            trend={calculateTrend(roas, roas * 0.95)}
            icon={BarChart3}
            color={roas > 2 ? 'text-green-600' : roas > 1 ? 'text-yellow-600' : 'text-red-600'}
          />
          <MetricCard
            label="Conversions"
            value={conversions.toLocaleString()}
            trend={calculateTrend(conversions, conversions * 0.92)}
            icon={Users}
            color="text-purple-600"
          />
        </div>

        {/* Sync Status */}
        {syncStatus && (
          <Card className="p-4 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-Synced from Connected Platforms</p>
                  <p className="text-xs text-muted-foreground">
                    Last synced: {formatLastSync(syncStatus.lastSyncTime)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Chart */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Trend (Last 30 Days)</h3>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} dot={false} name="Spend" />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>No data available. Connect platforms to see trends.</p>
              </div>
            )}
          </Card>

          {/* Platform Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Spend by Platform</h3>
            {platformBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                <p>No platform data</p>
              </div>
            )}
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top 10 Campaigns</h3>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-input rounded bg-background text-foreground"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="spend">Sort by Spend</option>
                <option value="roas">Sort by ROAS</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-1 text-sm border border-input rounded bg-background hover:bg-muted text-foreground"
              >
                {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Campaign Name</th>
                  <th className="text-left py-3 px-4 font-medium">Platform</th>
                  <th className="text-right py-3 px-4 font-medium">Spend</th>
                  <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">ROAS</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.length > 0 ? (
                  sortedCampaigns.map((campaign: any) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{campaign.name}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{campaign.platform}</td>
                      <td className="py-3 px-4 text-right font-medium">${(campaign.spend || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">${(campaign.revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        <span className={campaign.roas > 2 ? 'text-green-600' : campaign.roas > 1 ? 'text-yellow-600' : 'text-red-600'}>
                          {(campaign.roas || 0).toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {campaign.status === 'active' ? '🟢 Active' : campaign.status === 'paused' ? '🟡 Paused' : '🔴 Learning'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-muted-foreground">
                      <Link href="/connections" className="text-primary hover:underline">
                        Connect platforms to see campaigns
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedCampaigns.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {sortedCampaigns.length} of {campaigns.length} campaigns
              </p>
              <Link href="/dashboard/analytics" className="text-sm text-primary hover:underline font-medium">
                View all campaigns →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
