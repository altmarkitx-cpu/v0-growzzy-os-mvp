"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Users, 
  BarChart3,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Facebook,
  Search,
  Linkedin,
  Lightbulb,
  ArrowRight
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [platformData, setPlatformData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          router.push("/auth")
          return
        }
        const data = await response.json()
        setUser(data.user)

        // Fetch dashboard data
        const [metricsRes, historicalRes, platformRes] = await Promise.all([
          fetch(`/api/analytics/summary?userId=${data.user.id}&range=${timeRange}`),
          fetch(`/api/analytics/historical?userId=${data.user.id}&range=${timeRange}`),
          fetch(`/api/analytics/platforms?userId=${data.user.id}`),
        ])

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          setMetrics(metricsData.summary)
        }

        if (historicalRes.ok) {
          const histData = await historicalRes.json()
          setHistoricalData(histData.data || [])
        }

        if (platformRes.ok) {
          const platformData = await platformRes.json()
          setPlatformData(platformData.platforms || [])
        }
      } catch (error) {
        console.error("[v0] Dashboard error:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, timeRange])

  // Metric Card with strong hierarchy
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType,
    icon: Icon
  }: {
    title: string
    value: string
    change: string
    changeType: 'increase' | 'decrease'
    icon: React.ComponentType<{ className?: string }>
  }) => {
    const isPositive = changeType === 'increase'
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {change}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-xs text-gray-400">vs last period</div>
      </div>
    )
  }

  // Performance Chart
  const PerformanceChart = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-20 h-8 text-sm border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7d</SelectItem>
            <SelectItem value="30d">30d</SelectItem>
            <SelectItem value="90d">90d</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historicalData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af" 
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            stroke="#9ca3af" 
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, '']}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
          <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} dot={false} name="Spend" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  // Performance Metrics with strong hierarchy
  const PerformanceMetrics = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">3.2%</div>
        <div className="text-sm text-gray-500 mb-3">Conversion Rate</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.3%</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">$2.45</div>
        <div className="text-sm text-gray-500 mb-3">CPC</div>
        <div className="flex items-center gap-1 text-xs text-red-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.12</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">$76.80</div>
        <div className="text-sm text-gray-500 mb-3">CPA</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowDown className="w-3 h-3" />
          <span>-5.2%</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-3xl font-bold text-gray-900 mb-2">2.8%</div>
        <div className="text-sm text-gray-500 mb-3">CTR</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.4%</span>
          <span className="text-gray-400">vs last period</span>
        </div>
      </div>
    </div>
  )

  // Platform Cards with strong hierarchy
  const PlatformCard = ({ platform, data }: { platform: string; data: any }) => {
    const getIcon = (platform: string) => {
      switch (platform.toLowerCase()) {
        case 'meta': return <Facebook className="w-5 h-5 text-blue-600" />
        case 'google': return <Search className="w-5 h-5 text-red-600" />
        case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />
        default: return <BarChart3 className="w-5 h-5 text-gray-600" />
      }
    }

    const trend = data.change || 0
    const isPositive = trend > 0

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              {getIcon(platform)}
            </div>
            <h3 className="font-semibold text-gray-900">{platform} Ads</h3>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            {isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Spend</span>
            <span className="text-lg font-bold text-gray-900">
              ${(data.spend || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Revenue</span>
            <span className="text-lg font-bold text-green-600">
              ${(data.revenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">ROAS</span>
            <span className="text-lg font-bold text-gray-900">
              {(data.roas || 0).toFixed(2)}x
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className={cn(
                "h-2 rounded-full",
                isPositive ? "bg-green-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(Math.abs(trend) * 10, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  // Leads Snapshot - FIXED with strong hierarchy
  const LeadsSummary = () => {
    const totalLeads = metrics?.totalLeads || 0
    const qualifiedLeads = Math.floor(totalLeads * 0.35)
    const unqualifiedLeads = totalLeads - qualifiedLeads

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-8">Leads Snapshot</h3>
        
        {/* Top: Large bold number */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-gray-900 mb-2">{totalLeads}</div>
          <div className="text-sm text-gray-500">Total Leads Today</div>
        </div>
        
        {/* Middle: Two-column stats */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{qualifiedLeads}</div>
            <div className="text-sm text-gray-500">Qualified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">{unqualifiedLeads}</div>
            <div className="text-sm text-gray-500">Unqualified</div>
          </div>
        </div>
        
        {/* Bottom: Divider and details */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Best Campaign</span>
              <span className="text-sm font-bold text-gray-900">Summer Sale 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Best Platform</span>
              <span className="text-sm font-bold text-gray-900">Meta Ads</span>
            </div>
          </div>
        </div>
        
        {/* CTA: High contrast button */}
        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium py-3">
          View All Leads
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  // AI Insights - FIXED with premium feel
  const AIInsightCard = ({ insight }: { insight: any }) => {
    const getBorderColor = (type: string) => {
      switch (type) {
        case 'opportunity': return "border-l-4 border-l-green-500"
        case 'warning': return "border-l-4 border-l-yellow-500"
        case 'action': return "border-l-4 border-l-blue-500"
        default: return "border-l-4 border-l-gray-500"
      }
    }

    return (
      <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm p-6", getBorderColor(insight.type))}>
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-2">{insight.title}</h4>
            <p className="text-sm text-gray-500 mb-4">{insight.description}</p>
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
              {insight.action}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

  const totalRevenue = metrics?.totalRevenue || 0
  const totalSpend = metrics?.totalSpend || 0
  const totalLeads = metrics?.totalLeads || 0
  const roas = metrics?.roas || 0

  const aiInsights = [
    {
      type: "action",
      title: "Scale Meta Campaign Y",
      description: "ROAS 4.2x — performing above benchmark",
      action: "Scale Campaign"
    },
    {
      type: "warning", 
      title: "Pause Campaign X",
      description: "CPA increased by 23% — underperforming",
      action: "Review Campaign"
    },
    {
      type: "opportunity",
      title: "Optimize Google Ads",
      description: "CTR below industry average — improvement needed",
      action: "Get Suggestions"
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-500">Quick business health check</p>
          </div>
          <Button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* SECTION A: KPI METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            change="+12.5%"
            changeType="increase"
            icon={DollarSign}
          />
          <MetricCard
            title="Ad Spend"
            value={`$${totalSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            change="+8.2%"
            changeType="increase"
            icon={BarChart3}
          />
          <MetricCard
            title="Leads Generated"
            value={totalLeads.toLocaleString()}
            change="+15.3%"
            changeType="increase"
            icon={Users}
          />
          <MetricCard
            title="ROAS"
            value={`${roas.toFixed(2)}x`}
            change="-2.1%"
            changeType="decrease"
            icon={Target}
          />
        </div>

        {/* SECTION B: PERFORMANCE OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <div>
            <PerformanceMetrics />
          </div>
        </div>

        {/* SECTION C: PLATFORM BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {platformData.map((platform: any) => (
            <PlatformCard 
              key={platform.name} 
              platform={platform.name}
              data={platform}
            />
          ))}
        </div>

        {/* SECTION D & E: LEADS SNAPSHOT + AI INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsSummary />
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Insights</h3>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <AIInsightCard key={index} insight={insight} />
              ))}
            </div>
            <Button className="w-full mt-6 bg-blue-600 text-white hover:bg-blue-700 font-medium py-3">
              Open AI Copilot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
