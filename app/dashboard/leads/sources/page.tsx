"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Plus,
  BarChart3,
  Globe,
  Facebook,
  Search,
  Mail
} from "lucide-react"

export const dynamic = "force-dynamic"

export default function LeadsSourcesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      } catch (error) {
        console.error("[v0] Auth error:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchSources()
    }
  }, [user])

  const fetchSources = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/leads/sources")
      if (response.ok) {
        const data = await response.json()
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching sources:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'facebook':
      case 'instagram':
        return <Facebook className="w-5 h-5" />
      case 'google':
      case 'google ads':
        return <Search className="w-5 h-5" />
      case 'email':
      case 'newsletter':
        return <Mail className="w-5 h-5" />
      default:
        return <Globe className="w-5 h-5" />
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Sources</h1>
              <p className="text-gray-600 mt-2">Analyze where your leads are coming from</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Source
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Total Sources</h3>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{sources.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Best Performing</h3>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {sources.length > 0 ? sources.reduce((best, source) => 
                      source.conversionRate > best.conversionRate ? source : best
                    ).name : 'N/A'}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {sources.reduce((total, source) => total + source.leads, 0)}
                  </p>
                </div>
              </div>

              {sources.length === 0 ? (
                <div className="text-center py-16">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No lead sources found</h3>
                  <p className="text-gray-600 mb-6">Start tracking your lead sources to see performance analytics</p>
                  <Button>Add Source</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source) => (
                    <div key={source.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getSourceIcon(source.name)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                            <p className="text-sm text-gray-600">{source.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{source.leads}</p>
                          <p className="text-sm text-gray-600">leads</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm text-gray-600">Conversion Rate</p>
                          <p className="text-lg font-semibold text-green-600">{source.conversionRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cost per Lead</p>
                          <p className="text-lg font-semibold text-gray-900">${source.costPerLead}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
