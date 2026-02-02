"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowUpRight, ArrowDownRight, BarChart2, Zap, MessageSquare } from "lucide-react"
import type React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, ChartTooltip, Legend)

export function Overview() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDateRange, setSelectedDateRange] = useState("Last 30 Days")
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roas: 0,
    conversions: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    loading: true,
  })

  const [insights, setInsights] = useState<any[]>([])
  const [loadingInsights, setLoadingInsights] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchInsights()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/analytics/aggregate")
      const data = await response.json()

      console.log("[v0] Stats fetched:", data)

      setStats({
        totalSpend: Number(data.totalSpend || 0),
        totalRevenue: Number(data.totalRevenue || 0),
        roas: Number(data.roas || 0),
        conversions: Number(data.totalConversions || 0),
        ctr: Number(data.ctr || 0),
        cpm: Number(data.cpm || 0),
        cpc: Number(data.cpc || 0),
        loading: false,
      })
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
      setStats((prev) => ({ ...prev, loading: false }))
    }
  }
  // </CHANGE>

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true)
      const response = await fetch("/api/insights")
      if (response.ok) {
        const data = await response.json()
        setInsights(data.slice(0, 3)) // Show only first 3 insights
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error)
    } finally {
      setLoadingInsights(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    toast({
      title: `Searching for: ${e.target.value}`,
      description: "Your search query is being processed.",
      variant: "default",
    })
  }

  const handleApplySuggestion = async (insightId: string, suggestion: string) => {
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "apply",
          insightId,
          note: suggestion,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: `Successfully applied suggestion for ${result.insight.campaign}`,
          description: "Your suggestion has been applied.",
          variant: "default",
        })

        // Update insights list
        setInsights(insights.map((i) => (i.id === insightId ? { ...i, status: "applied" } : i)))

        // Show detailed result
        console.log("Applied suggestion result:", result.result)
      } else {
        toast({
          title: "Failed to apply suggestion",
          description: "There was an error applying your suggestion.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to apply suggestion",
        description: "There was an error applying your suggestion.",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = (insightId: string, campaign: string) => {
    toast({
      title: `Opening detailed analytics for ${campaign}...`,
      description: "Your request is being processed.",
      variant: "default",
    })
    // In a real app, this would navigate to campaign details
    window.open(`/dashboard/analytics?campaign=${encodeURIComponent(campaign)}`, "_blank")
  }

  const handleDismissInsight = async (insightId: string) => {
    try {
      const response = await fetch("/api/insights", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insightId,
          status: "dismissed",
        }),
      })

      if (response.ok) {
        setInsights(insights.filter((i) => i.id !== insightId))
        toast({
          title: "Insight dismissed",
          description: "Your insight has been dismissed.",
          variant: "default",
        })
      } else {
        toast({
          title: "Failed to dismiss insight",
          description: "There was an error dismissing your insight.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to dismiss insight",
        description: "There was an error dismissing your insight.",
        variant: "destructive",
      })
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "report":
        toast({
          title: "Creating report...",
          description: "Your report is being generated.",
          variant: "default",
        })
        break
      case "campaign":
        window.location.href = "/dashboard/campaigns"
        break
      case "ai":
        window.location.href = "/dashboard/copilot"
        break
      case "analytics":
        window.location.href = "/dashboard/analytics"
        break
      default:
        toast({
          title: `Action: ${action}`,
          description: "Your action is being processed.",
          variant: "default",
        })
    }
  }

  const StatCard = ({
    label,
    value,
    change,
    positive,
  }: {
    label: string
    value: string | number
    change?: string
    positive?: boolean
  }) => (
    <Card className="border-[#37322f]/10">
      <CardContent className="p-6">
        <p className="text-sm text-[#37322f]/60 mb-2">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-medium text-[#37322f]">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-xs ${positive ? "text-green-600" : "text-red-600"}`}>
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zm0 1a3 3 0 000 6 3 3 0 000-6zm0 1a2 2 0 000 4 2 2 0 000-4z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="search"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button variant="outline" className="h-9 bg-transparent" onClick={() => setShowFilters(!showFilters)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-2 h-4 w-4">
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 9.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            Filters
          </Button>
          <Button
            variant="outline"
            className="h-9 bg-transparent"
            onClick={() =>
              toast({
                title: `Date range: ${selectedDateRange}`,
                description: "Your selected date range is being applied.",
                variant: "default",
              })
            }
          >
            <span className="mr-2">{selectedDateRange}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spend" value={`$${stats.totalSpend.toLocaleString()}`} change="+12%" positive={true} />
        <StatCard
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change="+24%"
          positive={true}
        />
        <StatCard label="ROAS" value={`${stats.roas}x`} change="+18%" positive={true} />
        <StatCard label="Conversions" value={stats.conversions.toLocaleString()} change="+8%" positive={true} />
        <StatCard label="CTR" value={`${stats.ctr}%`} />
        <StatCard label="CPM" value={`$${stats.cpm.toLocaleString()}`} />
        <StatCard label="CPC" value={`$${stats.cpc.toLocaleString()}`} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#37322f]/10 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              Unified Analytics
            </CardTitle>
            <CardDescription>Real-time data from all your marketing channels</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#37322f]/60">
              Connect your platforms and see all metrics in one place. Start by adding your first campaign or platform
              connection in the Settings.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#37322f]/10 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-purple-600" />
              Automations
            </CardTitle>
            <CardDescription>Set up intelligent workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#37322f]/60">
              Create automations to manage your campaigns automatically. Pause underperformers, adjust budgets, and
              more.
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#37322f]/10 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              AI Insights
            </CardTitle>
            <CardDescription>Get smart recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#37322f]/60">
              Use the AI Co-Pilot to get actionable insights and recommendations based on your campaign performance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      {stats.conversions === 0 && (
        <Card className="border-[#f97316]/30 bg-[#f97316]/5">
          <CardHeader>
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>Set up your marketing workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[#37322f]/70">
              To see real data here, you need to connect your marketing platforms and create campaigns.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => (window.location.href = "/dashboard/settings")}
                className="bg-[#37322f] hover:bg-[#37322f]/90 text-white"
              >
                Connect Platforms
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard/campaigns")}
                className="border-[#37322f]/20"
              >
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Smart recommendations to improve performance</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = "/dashboard/reports")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingInsights ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading insights...</p>
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No insights available at the moment</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg ${
                    insight.type === "opportunity"
                      ? "bg-blue-50"
                      : insight.type === "warning"
                        ? "bg-yellow-50"
                        : "bg-green-50"
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 h-5 w-5 ${
                        insight.type === "opportunity"
                          ? "text-blue-600"
                          : insight.type === "warning"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {insight.type === "opportunity" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {insight.type === "warning" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {insight.type === "recommendation" && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3
                        className={`text-sm font-medium ${
                          insight.type === "opportunity"
                            ? "text-blue-800"
                            : insight.type === "warning"
                              ? "text-yellow-800"
                              : "text-green-800"
                        }`}
                      >
                        {insight.title}
                      </h3>
                      <div
                        className={`mt-1 text-sm ${
                          insight.type === "opportunity"
                            ? "text-blue-700"
                            : insight.type === "warning"
                              ? "text-yellow-700"
                              : "text-green-700"
                        }`}
                      >
                        <p>{insight.description}</p>
                        {insight.metrics && (
                          <div className="mt-2 text-xs">
                            {insight.metrics.ctr && <span>CTR: {insight.metrics.ctr}% • </span>}
                            {insight.metrics.roas && <span>ROAS: {insight.metrics.roas}x • </span>}
                            {insight.metrics.adAge && <span>Ad Age: {insight.metrics.adAge} days</span>}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        {insight.status !== "applied" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`${
                              insight.type === "opportunity"
                                ? "text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                : insight.type === "warning"
                                  ? "text-yellow-700 border-yellow-200 bg-yellow-50 hover:bg-yellow-100"
                                  : "text-green-700 border-green-200 bg-green-50 hover:bg-green-100"
                            }`}
                            onClick={() => handleApplySuggestion(insight.id, insight.description)}
                          >
                            Apply Suggestion
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(insight.id, insight.campaign)}
                        >
                          View Details
                        </Button>
                        {insight.status !== "applied" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissInsight(insight.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Overview
