import type React from "react"
import { FloatingAIChat } from "@/components/floating-ai-chat"
import { ProtectedRoute } from "@/components/protected-route"
import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"

export const metadata = {
  title: "Dashboard | Growzzy OS",
}

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pt-16 pb-4">
            {children}
          </main>
        </div>

        {/* Floating AI Chat */}
        <FloatingAIChat />
      </div>
    </ProtectedRoute>
  )
}
