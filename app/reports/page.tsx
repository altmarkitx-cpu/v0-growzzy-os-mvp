"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2, LogOut, Download, FileText, TrendingUp, BookOpen, BarChart3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

        // Fetch reports
        const reportsRes = await fetch(`/api/reports?userId=${data.user.id}`)
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json()
          setReports(reportsData.reports || [])
        }
      } catch (error) {
        console.error("[v0] Error:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleGenerateReport = async () => {
    setGenerating(true)
    setError("")

    try {
      const response = await fetch(`/api/reports/generate?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const blob = await response.blob()
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh reports
        const reportsRes = await fetch(`/api/reports?userId=${user.id}`)
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json()
          setReports(reportsData.reports || [])
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate report')
      }
    } catch (error: any) {
      console.error("[v0] Generate report error:", error)
      setError(error.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth")
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    setDeletingId(reportId)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId))
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">GROWZZY OS</h1>
          <div className="flex gap-4 items-center">
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link>
              <Link href="/connections" className="text-muted-foreground hover:text-primary">Connections</Link>
              <Link href="/leads" className="text-muted-foreground hover:text-primary">Leads</Link>
              <Link href="/campaigns" className="text-muted-foreground hover:text-primary">Campaigns</Link>
              <Link href="/reports" className="text-foreground hover:text-primary font-medium">Reports</Link>
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Analytics Reports</h2>
          <p className="text-muted-foreground">Generate and download AI-powered marketing analytics reports with detailed insights and recommendations.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Report Templates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-2 border-primary/50 hover:border-primary transition-colors">
            <BarChart3 className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">Performance Report</h3>
            <p className="text-sm text-muted-foreground mb-4">Comprehensive analysis of all campaigns across platforms with AI insights.</p>
            <Button onClick={handleGenerateReport} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 opacity-50 cursor-not-allowed">
            <TrendingUp className="w-8 h-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">Trend Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">Historical trends and forecasting (Coming Soon)</p>
            <Button disabled variant="outline" className="w-full bg-transparent">
              Coming Soon
            </Button>
          </Card>

          <Card className="p-6 opacity-50 cursor-not-allowed">
            <BookOpen className="w-8 h-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">Custom Report</h3>
            <p className="text-sm text-muted-foreground mb-4">Build custom reports with selected metrics (Coming Soon)</p>
            <Button disabled variant="outline" className="w-full bg-transparent">
              Coming Soon
            </Button>
          </Card>
        </div>

        {/* Reports List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Generated Reports ({reports.length})</h3>
            <div className="flex gap-2">
              <select className="px-3 py-2 rounded border bg-background text-sm">
                <option>All Reports</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            {reports.length > 0 ? (
              reports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/reports/${report.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{report.title || 'Report'}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{new Date(report.generated_at || report.created_at).toLocaleDateString()}</span>
                        <span>{report.type || 'performance'}</span>
                        <span className="capitalize bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{report.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {report.metrics && (
                      <div className="text-right text-xs mr-2">
                        <p className="font-semibold">${report.metrics.totalRevenue?.toFixed(0) || 0}</p>
                        <p className="text-muted-foreground">Revenue</p>
                      </div>
                    )}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => router.push(`/reports/${report.id}`)}
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={deletingId === report.id}
                        className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        {deletingId === report.id ? '...' : '×'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No reports generated yet.</p>
                <p className="text-sm text-muted-foreground">Generate your first report above to get started!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
