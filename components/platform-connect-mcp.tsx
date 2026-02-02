"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Facebook, CookieIcon as GoogleIcon, Linkedin, ShoppingBag } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const platforms = [
  {
    id: "meta",
    name: "Meta Ads",
    icon: Facebook,
    description: "Connect your Meta Business account",
    color: "bg-blue-50 hover:bg-blue-100",
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: GoogleIcon,
    description: "Connect your Google Ads account",
    color: "bg-red-50 hover:bg-red-100",
  },
  {
    id: "linkedin",
    name: "LinkedIn Ads",
    icon: Linkedin,
    description: "Connect your LinkedIn Campaign Manager",
    color: "bg-blue-50 hover:bg-blue-100",
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    description: "Connect your Shopify store",
    color: "bg-green-50 hover:bg-green-100",
  },
]

export function PlatformConnectMCP() {
  const [connecting, setConnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId)

    try {
      // Redirect to OAuth flow (MCP handles it)
      const response = await fetch(`/api/auth/${platformId}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.authUrl) {
        // Redirect to OAuth provider
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || "Connection failed")
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      })
      setConnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Connect Platforms</h3>
        <p className="text-sm text-gray-600 mb-4">Click to connect your marketing platforms with one click</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map(({ id, name, icon: Icon, description, color }) => (
          <Card key={id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-gray-600">{description}</p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleConnect(id)}
                disabled={connecting === id}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
              >
                {connecting === id ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
