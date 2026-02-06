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

  // Exact Metric Card from reference image
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
            <p className="text-sm font-medium text-gray-900">{title}</p>
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
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-1">vs last period</div>
      </div>
    )
  }

  // Performance Chart - exact match to reference
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

  // Performance Metrics - exact match to reference
  const PerformanceMetrics = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-2xl font-bold text-gray-900">3.2%</div>
        <div className="text-sm text-gray-600 mb-1">Conversion Rate</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.3%</span>
          <span className="text-gray-500">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-2xl font-bold text-gray-900">$2.45</div>
        <div className="text-sm text-gray-600 mb-1">CPC</div>
        <div className="flex items-center gap-1 text-xs text-red-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.12</span>
          <span className="text-gray-500">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-2xl font-bold text-gray-900">$76.80</div>
        <div className="text-sm text-gray-600 mb-1">CPA</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowDown className="w-3 h-3" />
          <span>-5.2%</span>
          <span className="text-gray-500">vs last period</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-2xl font-bold text-gray-900">2.8%</div>
        <div className="text-sm text-gray-600 mb-1">CTR</div>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <ArrowUp className="w-3 h-3" />
          <span>+0.4%</span>
          <span className="text-gray-500">vs last period</span>
        </div>
      </div>
    </div>
  )

  // Platform Cards - exact match to reference
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
        <div className="flex items-center justify-between mb-4">
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
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Spend</span>
            <span className="text-sm font-medium text-gray-900">
              ${(data.spend || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Revenue</span>
            <span className="text-sm font-medium text-green-600">
              ${(data.revenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ROAS</span>
            <span className="text-sm font-bold text-gray-900">
              {(data.roas || 0).toFixed(2)}x
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
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

  // Leads Snapshot - exact match to reference
  const LeadsSummary = () => {
    const totalLeads = metrics?.totalLeads || 0
    const qualifiedLeads = Math.floor(totalLeads * 0.35)
    const unqualifiedLeads = totalLeads - qualifiedLeads

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads Snapshot</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalLeads}</div>
            <div className="text-sm text-blue-700">Total Leads Today</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Qualified</span>
              <span className="text-sm font-medium text-green-600">{qualifiedLeads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Unqualified</span>
              <span className="text-sm font-medium text-gray-600">{unqualifiedLeads}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Best Campaign</span>
            <span className="font-medium text-gray-900">Summer Sale 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Best Platform</span>
            <span className="font-medium text-gray-900">Meta Ads</span>
          </div>
        </div>
        <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
          View All Leads
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  // AI Insights - exact match to reference
  const AIInsightCard = ({ insight }: { insight: any }) => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'opportunity': return "bg-green-50 text-green-800 border-green-200"
        case 'warning': return "bg-yellow-50 text-yellow-800 border-yellow-200"
        case 'action': return "bg-blue-50 text-blue-800 border-blue-200"
        default: return "bg-gray-50 text-gray-800 border-gray-200"
      }
    }

    return (
      <div className={cn("rounded-xl border p-4", getTypeColor(insight.type))}>
        <div className="flex items-start gap-3">
          <Lightbulb className="w-4 h-4 mt-1" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">{insight.title}</p>
            <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
            <Button size="sm" variant="outline" className="text-xs border-current">
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
      description: "ROAS 4.2x - strong performance",
      action: "Scale Campaign"
    },
    {
      type: "warning", 
      title: "Pause Campaign X",
      description: "CPA increased by 23%",
      action: "Review Campaign"
    },
    {
      type: "opportunity",
      title: "Optimize Google Ads",
      description: "CTR below industry average",
      action: "Get Suggestions"
    }
  ]

  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Quick business health check</p>
          </div>
          <Button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <AIInsightCard key={index} insight={insight} />
              ))}
            </div>
            <Button className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700">
              Open AI Copilot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
