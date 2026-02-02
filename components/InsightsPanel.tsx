'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, TrendingUp, Zap, Lightbulb } from 'lucide-react'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation'
  title: string
  description: string
  campaign?: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'applied' | 'dismissed'
  metrics?: Record<string, any>
}

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'opportunity' | 'warning' | 'recommendation'>('all')

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/insights')
        if (response.ok) {
          const data = await response.json()
          setInsights(data.insights || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  const handleApply = async (insight: Insight) => {
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          insightId: insight.id,
          campaignId: insight.campaign,
        }),
      })

      if (response.ok) {
        setInsights(insights.map(i => i.id === insight.id ? { ...i, status: 'applied' } : i))
      }
    } catch (error) {
      console.error('[v0] Error applying insight:', error)
    }
  }

  const handleDismiss = async (insight: Insight) => {
    try {
      await fetch('/api/insights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightId: insight.id,
          status: 'dismissed',
        }),
      })

      setInsights(insights.filter(i => i.id !== insight.id))
    } catch (error) {
      console.error('[v0] Error dismissing insight:', error)
    }
  }

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.type === filter)

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-blue-600" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
        <div className="flex gap-2">
          {['all', 'opportunity', 'warning', 'recommendation'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f as any)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading insights...</p>
        </Card>
      ) : filteredInsights.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2 opacity-50" />
          <p className="text-foreground font-medium">All caught up!</p>
          <p className="text-sm text-muted-foreground">No new insights at this time</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map(insight => (
            <Card
              key={insight.id}
              className={`p-4 border-l-4 ${
                insight.type === 'opportunity'
                  ? 'border-l-green-600'
                  : insight.type === 'warning'
                  ? 'border-l-yellow-600'
                  : 'border-l-blue-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {getIcon(insight.type)}
                  <div>
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    {insight.campaign && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Campaign: <span className="font-medium">{insight.campaign}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  insight.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : insight.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {insight.priority}
                </span>
              </div>

              {insight.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApply(insight)}
                    className="text-xs"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(insight)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {insight.status === 'applied' && (
                <p className="text-xs text-green-600 font-medium mt-2">✓ Applied</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
