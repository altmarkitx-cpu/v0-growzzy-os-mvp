"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const PLATFORMS = [
  { id: "meta", name: "Meta Ads", icon: "📘", color: "hover:bg-blue-50 border-blue-200" },
  { id: "google", name: "Google Ads", icon: "🔴", color: "hover:bg-red-50 border-red-200" },
  { id: "shopify", name: "Shopify", icon: "🛍️", color: "hover:bg-green-50 border-green-200" },
  { id: "linkedin", name: "LinkedIn Ads", icon: "💼", color: "hover:bg-blue-50 border-blue-200" },
]

export function OneClickConnect() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check connection status on mount
  useEffect(() => {
    checkConnections()

    // Listen for OAuth completion from popup
    const handleStorageChange = () => {
      checkConnections()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const checkConnections = async () => {
    try {
      const response = await fetch("/api/platforms/status")
      const data = await response.json()
      if (data.connected) {
        setConnectedPlatforms(data.connected.map((p: any) => p.platform))
      }
    } catch (err) {
      console.error("Failed to check connections:", err)
    }
  }

  const connectPlatform = async (platform: string) => {
    setConnecting(platform)
    setError(null)

    try {
      const response = await fetch("/api/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })

      if (!response.ok) {
        throw new Error("Failed to start OAuth flow")
      }

      const { authUrl, sessionId } = await response.json()

      const width = 600
      const height = 700
      const left = (window.screen.width - width) / 2
      const top = (window.screen.height - height) / 2

      const popup = window.open(
        authUrl,
        "oauth",
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
      )

      if (!popup) {
        throw new Error("Popup blocked. Please enable popups for this site.")
      }

      const checkInterval = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkInterval)

          try {
            // Check if OAuth succeeded
            const statusResponse = await fetch(`/api/oauth/status/${sessionId}`)
            const status = await statusResponse.json()

            if (status.connected) {
              setConnectedPlatforms((prev) => [...new Set([...prev, platform])])
              console.log(`[v0] Successfully connected ${platform}`)
            } else if (status.error) {
              setError(`Connection failed: ${status.error}`)
            }
          } catch (err) {
            console.error("[v0] Error checking OAuth status:", err)
          } finally {
            setConnecting(null)
          }
        }
      }, 500)

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!popup.closed) popup.close()
        setConnecting(null)
      }, 600000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      setConnecting(null)
    }
  }

  const disconnectPlatform = async (platform: string) => {
    try {
      await fetch("/api/platforms/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })

      setConnectedPlatforms((prev) => prev.filter((p) => p !== platform))
    } catch (err) {
      console.error("Failed to disconnect:", err)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Connected Platforms Summary */}
      {connectedPlatforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" />
              Connected Platforms
            </CardTitle>
            <CardDescription>{connectedPlatforms.length} platform(s) connected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {PLATFORMS.filter((p) => connectedPlatforms.includes(p.id)).map((platform) => (
                <div
                  key={platform.id}
                  className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2"
                >
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-medium text-green-900">{platform.name}</span>
                  <span className="text-green-600 text-sm">✓</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id)

          return (
            <Card
              key={platform.id}
              className={`border-2 transition-colors ${platform.color} ${isConnected ? "bg-green-50 border-green-300" : ""}`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="text-5xl">{platform.icon}</div>
                  <h3 className="font-semibold text-lg">{platform.name}</h3>

                  {isConnected ? (
                    <div className="space-y-2">
                      <div className="text-green-600 font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} />
                        Connected
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => disconnectPlatform(platform.id)}
                        disabled={connecting === platform.id}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => connectPlatform(platform.id)}
                      disabled={connecting !== null}
                    >
                      {connecting === platform.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
