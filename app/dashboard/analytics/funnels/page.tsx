"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Users, Target, BarChart3 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AnalyticsFunnelsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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
        console.error("[v0] Analytics error:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="p-8 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Funnels</h1>
            <p className="text-lg text-gray-600 mb-8">This section is under active development</p>
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-gray-600 space-y-2">
                <p>🔧 We're building comprehensive funnel analytics to help you understand:</p>
                <p>• Conversion rates at each stage</p>
                <p>• Drop-off points and bottlenecks</p>
                <p>• User journey visualization</p>
                <p>• A/B test results</p>
              </div>
            </div>
            <div className="mt-8 text-sm text-gray-500">
              Coming soon in the next update
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
