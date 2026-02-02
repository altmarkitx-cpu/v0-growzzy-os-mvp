"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { PlatformConnectAutomatic } from "@/components/platform-connect-automatic"

interface LinkedInUser {
  firstName: string
  lastName: string
  email: string
  id: string
}

interface MetaUser {
  id: string
  name: string
  email: string
}

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
}

interface ShopifyShop {
  id: string
  name: string
  domain: string
  email: string
}

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState({
    meta: {
      connected: false,
      clientId: "",
      clientSecret: "",
      user: null as MetaUser | null,
      connectedAt: null as string | null,
      adAccounts: [] as string[],
    },
    google: {
      connected: false,
      clientId: "",
      clientSecret: "",
      user: null as GoogleUser | null,
      connectedAt: null as string | null,
      adsAccounts: [] as string[],
    },
    linkedin: {
      connected: false,
      clientId: "",
      clientSecret: "",
      user: null as LinkedInUser | null,
      connectedAt: null as string | null,
    },
    shopify: {
      connected: false,
      apiKey: "",
      user: null as ShopifyShop | null,
      connectedAt: null as string | null,
      shop: null as string | null,
      productsCount: 0,
    },
  })

  const [permissionDialog, setPermissionDialog] = useState<string | null>(null)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    reports: true,
    alerts: true,
  })

  const [apiKeys, setApiKeys] = useState({
    openai: "",
    meta: "",
    google: "",
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Load saved settings from localStorage or API
    const savedSettings = localStorage.getItem("growzzy-settings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setIntegrations(parsed.integrations || integrations)
      setNotifications(parsed.notifications || notifications)
      setApiKeys(parsed.apiKeys || apiKeys)
    }

    // Handle OAuth callbacks
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get("success")
    const error = urlParams.get("error")
    const data = urlParams.get("data")

    if (success && data) {
      try {
        const connectionData = JSON.parse(decodeURIComponent(data))
        const platform = connectionData.platform

        if (platform) {
          setIntegrations((prev) => ({
            ...prev,
            [platform]: {
              ...prev[platform as keyof typeof prev],
              connected: true,
              user: connectionData.user,
              connectedAt: connectionData.connectedAt,
              ...(connectionData.accessToken && { accessToken: connectionData.accessToken }),
              ...(connectionData.refreshToken && { refreshToken: connectionData.refreshToken }),
              ...(connectionData.adAccounts && { adAccounts: connectionData.adAccounts }),
              ...(connectionData.shop && { shop: connectionData.shop }),
              ...(connectionData.shopData && { user: connectionData.shopData }),
              ...(connectionData.productsCount !== undefined && { productsCount: connectionData.productsCount }),
            },
          }))

          // Save to localStorage
          const updatedSettings = {
            integrations: {
              ...integrations,
              [platform as keyof typeof integrations]: {
                ...integrations[platform as keyof typeof integrations],
                connected: true,
                user: connectionData.user,
                connectedAt: connectionData.connectedAt,
                ...(connectionData.accessToken && { accessToken: connectionData.accessToken }),
                ...(connectionData.refreshToken && { refreshToken: connectionData.refreshToken }),
                ...(connectionData.adAccounts && { adAccounts: connectionData.adAccounts }),
                ...(connectionData.shop && { shop: connectionData.shop }),
                ...(connectionData.shopData && { user: connectionData.shopData }),
                ...(connectionData.productsCount !== undefined && { productsCount: connectionData.productsCount }),
              },
            },
            notifications,
            apiKeys,
          }
          if (typeof window !== "undefined") {
            localStorage.setItem("growzzy-settings", JSON.stringify(updatedSettings))
          }

          toast({
            title: `Success`,
            description: `Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`,
          })

          // Clean URL
          if (typeof window !== "undefined") {
            window.history.replaceState({}, document.title, "/dashboard/settings")
          }
        }
      } catch (parseError) {
        console.error("Failed to parse connection data:", parseError)
        toast({
          title: "Error",
          description: "Failed to process connection data",
        })
      }
    }

    if (error) {
      const message = urlParams.get("message") || "Authentication failed"
      toast({
        title: "Error",
        description: `Connection failed: ${message}`,
      })

      // Clean URL
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, "/dashboard/settings")
      }
    }
  }, [])

  const handleIntegrationConnect = (platform: keyof typeof integrations) => {
    if (typeof window === "undefined") return

    const clientId =
      process.env[`NEXT_PUBLIC_${platform.toUpperCase()}_CLIENT_ID`] ||
      process.env[`NEXT_PUBLIC_${platform.toUpperCase()}_APP_ID`]

    if (!clientId) {
      toast({
        title: "Error",
        description: `${platform} is not configured. Please add credentials to environment.`,
      })
      return
    }

    // Direct redirect to OAuth provider - MCPs handle the heavy lifting
    if (platform === "shopify") {
      const shop = prompt(`Enter your Shopify store URL (e.g., your-store.myshopify.com):`)
      if (shop) {
        window.location.href = `/api/auth/shopify/login?shop=${encodeURIComponent(shop)}`
      }
      return
    }

    const redirectUri = `${window.location.origin}/api/auth/${platform}`

    if (platform === "linkedin") {
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile%20r_emailaddress%20r_basicprofile&state=${Math.random().toString(36)}`
    } else if (platform === "meta") {
      window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_management,ads_read,pages_read_engagement&state=${Math.random().toString(36)}`
    } else if (platform === "google") {
      window.location.href = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/adwords&response_type=code&access_type=offline&state=${Math.random().toString(36)}`
    }
  }

  const handleIntegrationDisconnect = (platform: keyof typeof integrations) => {
    setIntegrations((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        connected: false,
        clientId: "",
        clientSecret: "",
        user: null,
        connectedAt: null,
        ...(platform === "meta" && { adAccounts: [] }),
        ...(platform === "google" && { adsAccounts: [] }),
        ...(platform === "shopify" && { shop: null, productsCount: 0 }),
      },
    }))
  }

  const handleApiKeyChange = (platform: keyof typeof apiKeys, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [platform]: value,
    }))
  }

  return (
    <DashboardLayout activeTab="settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your integrations and preferences</p>
          </div>
          <Button onClick={() => {}} className="bg-black hover:bg-gray-800 text-white">
            Save Settings
          </Button>
        </div>

        {/* Platform Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Integrations</CardTitle>
          </CardHeader>
          <div className="p-6">
            <PlatformConnectAutomatic />
          </div>
        </Card>

        {/* Permission Dialog */}
        {/* Removed the PlatformPermissionDialog component as it's no longer needed */}
      </div>
    </DashboardLayout>
  )
}
