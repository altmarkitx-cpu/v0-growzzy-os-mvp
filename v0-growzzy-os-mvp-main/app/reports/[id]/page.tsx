"use client"

import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2, LogOut, Download, FileText, ArrowLeft, Trash2, Share2, X, Loader } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState("")

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

        // Fetch report
        const reportRes = await fetch(`/api/reports/${reportId}`)
        if (reportRes.ok) {
          const reportData = await reportRes.json()
          setReport(reportData)
        } else {
          router.push("/reports")
        }
      } catch (error) {
        console.error("[v0] Error:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, reportId])

  const handleDownload = async () => {
    try {
      // For now, regenerate and download
      const response = await fetch(`/api/reports/generate?userId=${user.id}`, {
        method: 'POST',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.title || 'report'}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("[v0] Download error:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report?')) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push("/reports")
      }
    } catch (error) {
      console.error("[v0] Delete error:", error)
    } finally {
      setDeleting(false)
    }
  }

  const handleShare = async () => {
    if (!shareEmail || !shareEmail.includes('@')) {
      setShareMessage('Please enter a valid email address')
      return
    }

    setSharing(true)
    setShareMessage('')

    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: shareEmail }),
      })

      if (response.ok) {
        setShareMessage(`Report shared with ${shareEmail}`)
        setShareEmail('')
        setTimeout(() => setShowShareModal(false), 2000)
      } else {
        const data = await response.json()
        setShareMessage(data.error || 'Failed to share report')
      }
    } catch (error: any) {
      console.error("[v0] Share error:", error)
      setShareMessage(error.message || 'Failed to share report')
    } finally {
      setSharing(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!user || !report) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">GROWZZY OS</h1>
          <div className="flex gap-4 items-center">
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link>
              <Link href="/connections" className="text-muted-foreground hover:text-primary">Connections</Link>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        {/* Report Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
              <p className="text-muted-foreground">
                Generated {new Date(report.generated_at || report.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Report Metrics */}
        {report.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Spend</p>
              <p className="text-2xl font-bold">${report.metrics.totalSpend?.toFixed(0) || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Revenue</p>
              <p className="text-2xl font-bold">${report.metrics.totalRevenue?.toFixed(0) || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">ROAS</p>
              <p className="text-2xl font-bold">{report.metrics.roas?.toFixed(2) || 0}x</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Conversions</p>
              <p className="text-2xl font-bold">{report.metrics.conversions || 0}</p>
            </Card>
          </div>
        )}

        {/* Insights */}
        {report.insights && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {report.insights}
            </div>
          </Card>
        )}

        {/* Recommendations */}
        {report.recommendations && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {report.recommendations}
            </div>
          </Card>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Share Report</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter recipient email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    disabled={sharing}
                    className="w-full px-3 py-2 border rounded bg-background text-foreground"
                  />
                </div>

                {shareMessage && (
                  <div className={`p-3 rounded text-sm ${
                    shareMessage.includes('shared') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {shareMessage}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleShare}
                    disabled={sharing || !shareEmail}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {sharing && <Loader className="w-4 h-4 animate-spin" />}
                    {sharing ? 'Sharing...' : 'Send Report'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                    disabled={sharing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
