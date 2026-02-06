"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Home, 
  Users, 
  Target, 
  BarChart3, 
  Palette, 
  Bot, 
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Users,
    children: [
      { title: "All Leads", href: "/dashboard/leads", icon: Users },
      { title: "Pipeline", href: "/dashboard/leads/pipeline", icon: Target },
      { title: "Sources", href: "/dashboard/leads/sources", icon: BarChart3 },
    ]
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Target,
    children: [
      { title: "Meta Ads", href: "/dashboard/campaigns/meta", icon: Target },
      { title: "Google Ads", href: "/dashboard/campaigns/google", icon: Target },
      { title: "LinkedIn Ads", href: "/dashboard/campaigns/linkedin", icon: Target },
    ]
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    children: [
      { title: "Overview", href: "/dashboard/analytics", icon: BarChart3 },
      { title: "Funnels", href: "/dashboard/analytics/funnels", icon: Target },
      { title: "Attribution", href: "/dashboard/analytics/attribution", icon: BarChart3 },
      { title: "Platforms", href: "/dashboard/analytics/platforms", icon: BarChart3 },
    ]
  },
  {
    title: "Ad Creatives",
    href: "/dashboard/creatives",
    icon: Palette,
    children: [
      { title: "Generate", href: "/dashboard/creatives/generate", icon: Palette },
      { title: "Library", href: "/dashboard/creatives/library", icon: Palette },
      { title: "Performance", href: "/dashboard/creatives/performance", icon: BarChart3 },
    ]
  },
  {
    title: "AI Copilot",
    href: "/dashboard/ai",
    icon: Bot,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Analytics"])
  const router = useRouter()
  const pathname = usePathname()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.href} className="w-full">
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-10",
            level > 0 && "ml-4",
            active && "bg-gray-100 text-gray-900"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title)
            } else {
              router.push(item.href)
            }
          }}
        >
          <item.icon className="w-4 h-4" />
          <span className="flex-1 text-left">{item.title}</span>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </Button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg">GROWZZY OS</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => renderSidebarItem(item))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => router.push("/auth")}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {sidebarItems.find(item => isActive(item.href))?.title || "Dashboard"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Add notifications, user profile etc here */}
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
