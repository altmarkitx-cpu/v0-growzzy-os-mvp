"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function OAuthSetupPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState({
    META_APP_ID: "",
    META_APP_SECRET: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    LINKEDIN_CLIENT_ID: "",
    LINKEDIN_CLIENT_SECRET: "",
    TIKTOK_CLIENT_ID: "",
    TIKTOK_CLIENT_SECRET: "",
  })

  const [status, setStatus] = useState({
    meta: false,
    google: false,
    linkedin: false,
    tiktok: false,
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/check")
      if (response.ok) {
        setIsAdmin(true)
        await loadCredentials()
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("[v0] Admin check failed:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const loadCredentials = async () => {
    try {
      const response = await fetch("/api/admin/oauth-credentials")
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
        updateStatus(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load credentials:", error)
    }
  }

  const updateStatus = (creds: typeof credentials) => {
    setStatus({
      meta: !!creds.META_APP_ID && !!creds.META_APP_SECRET,
      google: !!creds.GOOGLE_CLIENT_ID && !!creds.GOOGLE_CLIENT_SECRET,
      linkedin: !!creds.LINKEDIN_CLIENT_ID && !!creds.LINKEDIN_CLIENT_SECRET,
      tiktok: !!creds.TIKTOK_CLIENT_ID && !!creds.TIKTOK_CLIENT_SECRET,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/oauth-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        updateStatus(credentials)
        toast({
          title: "Success",
          description: "OAuth credentials saved successfully. One-click connections are now active for all users!",
        })
      } else {
        throw new Error("Failed to save credentials")
      }
    } catch (error) {
      console.error("[v0] Save failed:", error)
      toast({
        title: "Error",
        description: "Failed to save OAuth credentials",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Unauthorized</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">OAuth Setup</h1>
          <p className="text-slate-400">Configure platform credentials once for one-click user connections</p>
        </div>

        <div className="grid gap-6">
          {/* Meta/Facebook */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Meta Ads</CardTitle>
                  <CardDescription>Configure your Meta Business Account</CardDescription>
                </div>
                {status.meta && <CheckCircle2 className="text-green-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="META_APP_ID" className="text-slate-300">
                  App ID
                </Label>
                <Input
                  id="META_APP_ID"
                  name="META_APP_ID"
                  value={credentials.META_APP_ID}
                  onChange={handleChange}
                  placeholder="Your Meta App ID"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="META_APP_SECRET" className="text-slate-300">
                  App Secret
                </Label>
                <Input
                  id="META_APP_SECRET"
                  name="META_APP_SECRET"
                  type="password"
                  value={credentials.META_APP_SECRET}
                  onChange={handleChange}
                  placeholder="Your Meta App Secret"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Google */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Google Ads</CardTitle>
                  <CardDescription>Configure your Google Ads credentials</CardDescription>
                </div>
                {status.google && <CheckCircle2 className="text-green-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="GOOGLE_CLIENT_ID" className="text-slate-300">
                  Client ID
                </Label>
                <Input
                  id="GOOGLE_CLIENT_ID"
                  name="GOOGLE_CLIENT_ID"
                  value={credentials.GOOGLE_CLIENT_ID}
                  onChange={handleChange}
                  placeholder="Your Google Client ID"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="GOOGLE_CLIENT_SECRET" className="text-slate-300">
                  Client Secret
                </Label>
                <Input
                  id="GOOGLE_CLIENT_SECRET"
                  name="GOOGLE_CLIENT_SECRET"
                  type="password"
                  value={credentials.GOOGLE_CLIENT_SECRET}
                  onChange={handleChange}
                  placeholder="Your Google Client Secret"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">LinkedIn</CardTitle>
                  <CardDescription>Configure your LinkedIn Campaign Manager</CardDescription>
                </div>
                {status.linkedin && <CheckCircle2 className="text-green-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="LINKEDIN_CLIENT_ID" className="text-slate-300">
                  Client ID
                </Label>
                <Input
                  id="LINKEDIN_CLIENT_ID"
                  name="LINKEDIN_CLIENT_ID"
                  value={credentials.LINKEDIN_CLIENT_ID}
                  onChange={handleChange}
                  placeholder="Your LinkedIn Client ID"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="LINKEDIN_CLIENT_SECRET" className="text-slate-300">
                  Client Secret
                </Label>
                <Input
                  id="LINKEDIN_CLIENT_SECRET"
                  name="LINKEDIN_CLIENT_SECRET"
                  type="password"
                  value={credentials.LINKEDIN_CLIENT_SECRET}
                  onChange={handleChange}
                  placeholder="Your LinkedIn Client Secret"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* TikTok */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">TikTok Ads</CardTitle>
                  <CardDescription>Configure your TikTok Business Account</CardDescription>
                </div>
                {status.tiktok && <CheckCircle2 className="text-green-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="TIKTOK_CLIENT_ID" className="text-slate-300">
                  Client ID
                </Label>
                <Input
                  id="TIKTOK_CLIENT_ID"
                  name="TIKTOK_CLIENT_ID"
                  value={credentials.TIKTOK_CLIENT_ID}
                  onChange={handleChange}
                  placeholder="Your TikTok Client ID"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="TIKTOK_CLIENT_SECRET" className="text-slate-300">
                  Client Secret
                </Label>
                <Input
                  id="TIKTOK_CLIENT_SECRET"
                  name="TIKTOK_CLIENT_SECRET"
                  type="password"
                  value={credentials.TIKTOK_CLIENT_SECRET}
                  onChange={handleChange}
                  placeholder="Your TikTok Client Secret"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
          >
            {saving ? "Saving..." : "Save OAuth Credentials"}
          </Button>

          <Card className="bg-blue-900 border-blue-700">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" />
              <div className="text-blue-200 text-sm">
                <p className="font-semibold mb-1">After saving, all users will have one-click platform connections!</p>
                <p>Users just need to click "Connect" and authorize their account. No credential entry needed.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
