"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const PLATFORMS = [
  {
    id: "meta",
    name: "Meta Ads",
    icon: "📘",
    description: "Facebook & Instagram Ads",
  },
  {
    id: "google",
    name: "Google Ads",
    icon: "🔴",
    description: "Google Ads & Analytics",
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    icon: "🎵",
    description: "TikTok Shop & Ads",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    icon: "💼",
    description: "LinkedIn Campaign Manager",
  },
]

interface ConnectedPlatform {
  id: string
  name: string
  accountName: string
  connectedAt: Date
}

export function PlatformConnectAutomatic() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load connected platforms from database on mount
    loadConnectedPlatforms()

    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "oauth-success") {
        const { platform, accountName } = event.data
        setConnectedPlatforms((prev) => [
          ...prev,
          {
            id: platform,
            name: PLATFORMS.find((p) => p.id === platform)?.name || platform,
            accountName,
            connectedAt: new Date(),
          },
        ])
        toast({
          title: "Success",
          description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`,
        })
      } else if (event.data.type === "oauth-error") {
        toast({
          title: "Connection Failed",
          description: event.data.error || "Failed to connect platform",
          variant: "destructive",
        })
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const loadConnectedPlatforms = async () => {
    try {
      const response = await fetch("/api/platforms/connections")
      if (response.ok) {
        const data = await response.json()
        setConnectedPlatforms(
          data.connections.map((conn: any) => ({
            id: conn.platform,
            name: PLATFORMS.find((p) => p.id === conn.platform)?.name || conn.platform,
            accountName: conn.account_name || conn.account_id,
            connectedAt: new Date(conn.connected_at),
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to load connected platforms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId)

    try {
      const response = await fetch("/api/oauth/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth")
      }

      const { authUrl, isDemoMode } = await response.json()

      if (isDemoMode) {
        toast({
          title: "Demo Mode",
          description: `${platformId} OAuth is not configured. Add credentials to environment variables.`,
          variant: "destructive",
        })
        setConnecting(null)
        return
      }

      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        authUrl,
        `${platformId}_oauth`,
        `width=${width},height=${height},left=${left},top=${top}`,
      )

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval)
          setConnecting(null)
          // Reload platforms to check if connection was successful
          loadConnectedPlatforms()
        }
      }, 500)
    } catch (error) {
      console.error("[v0] OAuth error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect platform",
        variant: "destructive",
      })
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platformId: string) => {
    try {
      const response = await fetch(`/api/platforms/disconnect/${platformId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setConnectedPlatforms((prev) => prev.filter((p) => p.id !== platformId))
        toast({
          title: "Disconnected",
          description: `${platformId} has been disconnected`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect platform",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading platform connections...</div>
  }

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      {connectedPlatforms.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Connected Platforms</h3>
            </div>
            <div className="space-y-2">
              {connectedPlatforms.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between bg-white rounded p-3">
                  <div>
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({platform.accountName})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(platform.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.some((p) => p.id === platform.id)
          const isConnecting = connecting === platform.id

          return (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6 space-y-4 h-full flex flex-col">
                <div className="text-center flex-1">
                  <div className="text-4xl mb-2">{platform.icon}</div>
                  <h3 className="font-semibold">{platform.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{platform.description}</p>
                </div>

                <Button
                  onClick={() => !isConnected && handleConnect(platform.id)}
                  disabled={isConnected || isConnecting}
                  className={isConnected ? "bg-green-100 text-green-800" : ""}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : isConnected ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Connected
                    </>
                  ) : (
                    "Connect Now"
                  )}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-medium mb-1">How it works:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Click "Connect Now" on any platform</li>
          <li>You'll be redirected to authorize GROWZZY OS</li>
          <li>Once authorized, your connection is automatic</li>
          <li>Data syncing starts immediately</li>
        </ul>
      </div>
    </div>
  )
}
