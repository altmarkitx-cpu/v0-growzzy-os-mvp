'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogOut, TrendingUp, DollarSign, Target, Zap, AlertCircle, Plus } from 'lucide-react'

interface UserData {
  id: string
  email: string
  name?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/auth/login')
      return
    }
    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('user')
      router.push('/auth/login')
    } catch (err) {
      console.error('[v0] Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">GROWZZY OS</h1>
            <p className="text-sm text-muted-foreground">Marketing Operations Platform</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-foreground mb-8">
          Welcome back, {user?.name || user?.email}!
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/analytics">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">View real-time campaign metrics and performance data</p>
            </Card>
          </Link>

          <Link href="/dashboard/creative-generator">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">AI Creative Studio</h3>
              </div>
              <p className="text-sm text-muted-foreground">Generate high-converting ad creatives with OpenAI</p>
            </Card>
          </Link>

          <Link href="/dashboard/reports">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Reports</h3>
              </div>
              <p className="text-sm text-muted-foreground">Generate comprehensive performance reports with AI insights</p>
            </Card>
          </Link>

          <Link href="/dashboard/campaigns">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Campaigns</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage and optimize your advertising campaigns</p>
            </Card>
          </Link>

          <Link href="/dashboard/automations">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Automations</h3>
              </div>
              <p className="text-sm text-muted-foreground">Set up smart workflows and automated actions</p>
            </Card>
          </Link>

          <Link href="/dashboard/crm">
            <Card className="p-6 border border-border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Plus className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">CRM & Leads</h3>
              </div>
              <p className="text-sm text-muted-foreground">Manage leads and personalized outreach campaigns</p>
            </Card>
          </Link>
        </div>

        <Card className="mt-12 p-8 border border-border bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-2xl font-bold text-foreground mb-4">Getting Started with GROWZZY OS</h3>
          <ul className="space-y-3 text-foreground">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">1.</span>
              <div>
                <p className="font-semibold">Connect Your Platforms</p>
                <p className="text-sm text-muted-foreground">OAuth integration with Meta, Google, LinkedIn, TikTok, and Shopify</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">2.</span>
              <div>
                <p className="font-semibold">View Real-Time Analytics</p>
                <p className="text-sm text-muted-foreground">Unified dashboard showing all your marketing metrics in real-time</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">3.</span>
              <div>
                <p className="font-semibold">Generate AI Creatives</p>
                <p className="text-sm text-muted-foreground">Use OpenAI to generate 20+ high-converting ad variations instantly</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">4.</span>
              <div>
                <p className="font-semibold">Set Up Automations</p>
                <p className="text-sm text-muted-foreground">Create smart rules to pause, scale, and optimize campaigns automatically</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold">5.</span>
              <div>
                <p className="font-semibold">Generate Reports</p>
                <p className="text-sm text-muted-foreground">Get AI-powered insights and recommendations delivered to your inbox</p>
              </div>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  )
}
