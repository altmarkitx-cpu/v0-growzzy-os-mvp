"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface OAuthConnectButtonProps {
  platform: "meta" | "google" | "shopify" | "linkedin"
  label?: string
}

export function OAuthConnectButton({
  platform,
  label = `Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
}: OAuthConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      console.log(`[v0] Initiating OAuth for ${platform}`)

      const response = await fetch("/api/oauth/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })

      if (!response.ok) {
        throw new Error("Failed to initiate OAuth")
      }

      const { authUrl, isDemoMode } = await response.json()

      if (isDemoMode) {
        console.log(`[v0] Demo mode for ${platform}`)
        alert(`Demo mode: ${platform} connection would open here`)
        return
      }

      // Open OAuth popup
      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      window.open(authUrl, `${platform}_oauth`, `width=${width},height=${height},left=${left},top=${top}`)
    } catch (error) {
      console.error(`[v0] OAuth error for ${platform}:`, error)
      alert(`Failed to connect ${platform}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleConnect} disabled={isLoading} variant="outline" className="w-full bg-transparent">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        label
      )}
    </Button>
  )
}
