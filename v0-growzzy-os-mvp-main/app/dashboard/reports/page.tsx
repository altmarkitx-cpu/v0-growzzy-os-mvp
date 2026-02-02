'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Download, Sparkles, AlertCircle, FileText } from 'lucide-react'

interface Report {
  id: string
  title: string
  generatedAt: string
  summary: string
  keyInsights: string[]
  recommendations: Array<{
    title: string
    reasoning: string
    projectedImpact: string
  }>
  metricsAnalysis: {
    spendTrend: string
    revenueTrend: string
    roasAnalysis: string
    performanceRating: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    // Load any previously generated reports from localStorage
    const savedReports = localStorage.getItem('reports')
    if (savedReports) {
      setReports(JSON.parse(savedReports))
    }
  }, [])

  const handleGenerateReport = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange }),
      })

      if (!response.ok) throw new Error('Failed to generate report')

      const report = await response.json()
      const updatedReports = [report, ...reports]
      setReports(updatedReports)
      localStorage.setItem('reports', JSON.stringify(updatedReports))
      setSelectedReport(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
      console.error('[v0] Report generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Performance Reports</h1>
          <p className="text-muted-foreground">Generate comprehensive AI-powered analytics reports with actionable insights</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Generation Panel */}
          <Card className="p-6 border border-border lg:col-span-1 sticky top-4 h-fit">
            <h2 className="text-lg font-semibold text-foreground mb-6">Generate Report</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full mb-4"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate New Report
                </>
              )}
            </Button>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Reports include AI insights, platform analysis, performance metrics, and actionable recommendations based on your actual campaign data.
            </div>
          </Card>

          {/* Reports List */}
          <div className="lg:col-span-2">
            {reports.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-border">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No reports generated yet</h3>
                <p className="text-muted-foreground mb-6">Click "Generate New Report" to create your first AI-powered performance report</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className={`p-6 border cursor-pointer transition-all ${
                      selectedReport?.id === report.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Generated {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{report.summary}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Details */}
        {selectedReport && (
          <Card className="border border-border p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{selectedReport.title}</h2>
                <p className="text-muted-foreground">Generated {new Date(selectedReport.generatedAt).toLocaleDateString()}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>

            {/* Summary */}
            <div className="mb-8 pb-8 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground mb-3">Executive Summary</h3>
              <p className="text-foreground leading-relaxed">{selectedReport.summary}</p>
            </div>

            {/* Metrics Analysis */}
            <div className="mb-8 pb-8 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Spend Trend</p>
                  <p className="text-lg text-foreground font-medium">{selectedReport.metricsAnalysis.spendTrend}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Revenue Trend</p>
                  <p className="text-lg text-foreground font-medium">{selectedReport.metricsAnalysis.revenueTrend}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-semibold mb-1">ROAS Analysis</p>
                  <p className="text-lg text-foreground font-medium">{selectedReport.metricsAnalysis.roasAnalysis}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-semibold mb-1">Performance Rating</p>
                  <p className="text-lg text-foreground font-medium">{selectedReport.metricsAnalysis.performanceRating}</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="mb-8 pb-8 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Key Insights</h3>
              <div className="space-y-3">
                {selectedReport.keyInsights.map((insight, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-blue-600 font-bold flex-shrink-0">→</span>
                    <p className="text-sm text-blue-900">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                {selectedReport.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-1">Action #{i + 1}: {rec.title}</h4>
                    <p className="text-sm text-green-800 mb-2">{rec.reasoning}</p>
                    <p className="text-sm text-green-700 font-medium">Impact: {rec.projectedImpact}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
