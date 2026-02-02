"use client"

import React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Loader2, LogOut, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn']

export default function CampaignsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', platform: '', budget: '' })

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

        // Fetch campaigns
        const campaignsRes = await fetch(`/api/campaigns?userId=${data.user.id}`)
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json()
          setCampaigns(campaignsData.campaigns || [])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/campaigns?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          platform: formData.platform,
          budget: parseFloat(formData.budget) || 0
        })
      })

      if (response.ok) {
        const newCampaign = await response.json()
        setCampaigns([newCampaign, ...campaigns])
        setFormData({ name: '', platform: '', budget: '' })
      }
    } catch (error) {
      console.error("[v0] Submit error:", error)
    } finally {
      setSubmitting(false)
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

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">GROWZZY OS</h1>
          <div className="flex gap-4 items-center">
            <nav className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link>
              <Link href="/leads" className="text-muted-foreground hover:text-primary">Leads</Link>
              <Link href="/campaigns" className="text-foreground hover:text-primary font-medium">Campaigns</Link>
              <Link href="/reports" className="text-muted-foreground hover:text-primary">Reports</Link>
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
          <h2 className="text-3xl font-bold mb-2">Campaign Management</h2>
          <p className="text-muted-foreground">Create and manage your marketing campaigns across all platforms.</p>
        </div>

        {/* Add Campaign Form */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Campaign
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Campaign Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="px-3 py-2 border border-input rounded bg-background"
              required
            >
              <option value="">Select Platform</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Budget ($)"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              step="0.01"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="md:col-span-2"
            >
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </form>
        </Card>

        {/* Campaigns Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Campaigns ({campaigns.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Campaign Name</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Platform</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Budget</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Spend</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign: any) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm font-medium">{campaign.name}</td>
                      <td className="py-3 px-4 text-sm">{campaign.platform}</td>
                      <td className="py-3 px-4 text-sm">${campaign.budget}</td>
                      <td className="py-3 px-4 text-sm">${campaign.spend}</td>
                      <td className="py-3 px-4 text-sm">${campaign.revenue}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-muted-foreground">
                      No campaigns yet. Create your first campaign above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
