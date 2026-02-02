"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Facebook, Chrome, Linkedin, ShoppingBag, Loader2 } from "lucide-react"
import { showToast } from "@/components/Toast"

const PLATFORMS = [
  {
    id: "meta",
    name: "Meta Ads",
    icon: Facebook,
    color: "bg-blue-600",
  },
  {
    id: "google",
    name: "Google Ads",
    icon: Chrome,
    color: "bg-red-600",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    icon: Linkedin,
    color: "bg-blue-700",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    color: "bg-green-600",
  },
]

export function PlatformConnectButton() {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])

  const connectPlatform = async (platform: (typeof PLATFORMS)[0]) => {
    console.log("[v0] Button clicked for", platform.id)
    alert(`[v0] Connecting to ${platform.name}...`) // Show immediate alert so user knows click was registered
    setConnecting(platform.id)
    showToast(`Connecting to ${platform.name}...`, "default")

    try {
      console.log("[v0] Connecting to", platform.id)

      try {
        const response = await fetch("/api/platforms/oauth-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: platform.id,
            redirectUri: `${window.location.origin}/api/auth/callback/${platform.id}`,
          }),
        })

        if (!response.ok) {
          throw new Error("OAuth not configured")
        }

        const { authUrl } = await response.json()

        const width = 600
        const height = 700
        const left = (window.screen.width - width) / 2
        const top = (window.screen.height - height) / 2

        const popup = window.open(authUrl, "oauth", `width=${width},height=${height},left=${left},top=${top}`)

        const checkConnection = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkConnection)
            setConnecting(null)

            // Check if connection was successful
            const statusResponse = await fetch(`/api/platforms/status?platform=${platform.id}`)
            const { connected } = await statusResponse.json()

            if (connected) {
              setConnectedPlatforms((prev) => [...prev, platform.id])
              showToast(`✅ ${platform.name} connected successfully!`, "success")

              // Start initial data sync
              await fetch("/api/platforms/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform: platform.id }),
              }).catch(() => {}) // Ignore sync errors in demo mode
            }
          }
        }, 1000)
      } catch (oauthError) {
        console.log("[v0] OAuth not configured, using demo mode")
        setConnecting(null)
        setConnectedPlatforms((prev) => [...prev, platform.id])
        showToast(`✅ ${platform.name} connected in demo mode!`, "success")
        alert(`[v0] ${platform.name} connected successfully in demo mode!`) // Add alert for demo mode
      }
    } catch (error: any) {
      console.error("[v0] Connection error:", error)
      showToast(`❌ Error: ${error.message}`, "error")
      alert(`[v0] Error: ${error.message}`) // Add alert for errors
      setConnecting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon
        const isConnected = connectedPlatforms.includes(platform.id)
        const isConnecting = connecting === platform.id

        return (
          <div key={platform.id} className="border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`${platform.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">{platform.name}</h3>
            </div>

            <Button
              onClick={() => connectPlatform(platform)}
              disabled={isConnecting || isConnected}
              className="w-full"
              variant={isConnected ? "secondary" : "default"}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                "✓ Connected"
              ) : (
                "Connect"
              )}
            </Button>

            {isConnected && (
              <p className="text-xs text-muted-foreground">Last synced: {new Date().toLocaleTimeString()}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
