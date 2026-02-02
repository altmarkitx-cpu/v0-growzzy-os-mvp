"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Summary {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalSpend: string
  totalRevenue: string
  ctr: number
  cpc: number
  roas: number
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics/summary")
      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  const metrics = [
    { label: "Impressions", value: summary?.totalImpressions || 0 },
    { label: "Clicks", value: summary?.totalClicks || 0 },
    { label: "Conversions", value: summary?.totalConversions || 0 },
    { label: "CTR", value: `${summary?.ctr.toFixed(2) || 0}%` },
    { label: "CPC", value: `$${summary?.cpc.toFixed(2) || 0}` },
    { label: "ROAS", value: `${summary?.roas.toFixed(2) || 0}x` },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: "This Period", value: summary?.totalRevenue }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
