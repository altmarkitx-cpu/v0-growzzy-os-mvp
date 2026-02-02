'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Alert {
  id: string
  title: string
  severity: string
  read: boolean
}

export default function Header() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAlerts, setShowAlerts] = useState(false)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts?unreadOnly=true')
        if (response.ok) {
          const data = await response.json()
          setAlerts(data.alerts || [])
          setUnreadCount(data.alerts?.filter((a: Alert) => !a.read).length || 0)
        }
      } catch (error) {
        console.error('[v0] Error fetching alerts:', error)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 md:ml-64">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="bg-transparent text-sm placeholder-muted-foreground outline-none flex-1"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Alerts */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showAlerts && (
              <div className="absolute top-12 right-0 w-80 bg-card border border-border rounded-lg shadow-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No new alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border ${
                        alert.severity === 'high'
                          ? 'border-red-200 bg-red-50'
                          : alert.severity === 'medium'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
