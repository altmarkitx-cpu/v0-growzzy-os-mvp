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
  Edit,
  Mail,
  Phone,
  Calendar
} from "lucide-react"

export const dynamic = "force-dynamic"

export default function LeadsPipelinePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
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
      fetchLeads()
    }
  }, [user])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/leads")
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const pipelineStages = [
    { name: "New", count: leads.filter(l => l.status === "new").length },
    { name: "Contacted", count: leads.filter(l => l.status === "contacted").length },
    { name: "Qualified", count: leads.filter(l => l.status === "qualified").length },
    { name: "Meeting", count: leads.filter(l => l.status === "meeting").length },
    { name: "Closed", count: leads.filter(l => l.status === "closed").length }
  ]

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads Pipeline</h1>
              <p className="text-gray-600 mt-2">Track and manage your lead progression through the sales funnel</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>

          {/* Pipeline Overview */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {pipelineStages.map((stage, index) => (
              <div key={stage.name} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{stage.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{stage.count}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {leads.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No leads found</h3>
                  <p className="text-gray-600 mb-6">Start by adding your first lead or importing from a spreadsheet</p>
                  <Button>Add Lead</Button>
                </div>
              ) : (
                leads.map((lead) => (
                  <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                          <Badge variant={lead.status === "new" ? "default" : "secondary"}>
                            {lead.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.company && (
                            <span>{lead.company}</span>
                          )}
                        </div>
                        <p className="text-gray-700">{lead.notes || "No notes available"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
