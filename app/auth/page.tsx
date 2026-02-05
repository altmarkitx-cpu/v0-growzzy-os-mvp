"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Layers, Mail, Lock, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (isLogin) {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        let data
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("[v0] Non-JSON response:", text.substring(0, 200))
          throw new Error("Server returned invalid response. Please check your connection.")
        }

        if (!response.ok) {
          throw new Error(data.error || "Login failed")
        }

        console.log("[v0] Login successful, redirecting to dashboard...")
        router.push("/dashboard")
        // Fallback redirect
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
        setIsLoading(false)
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })

        let data
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("[v0] Non-JSON response:", text.substring(0, 200))
          throw new Error("Server returned invalid response. Please check your connection.")
        }

        if (!response.ok) {
          throw new Error(data.error || "Registration failed")
        }

        setSuccessMessage("Account created! Please check your email to verify your account.")
        setIsLoading(false)
        setIsLogin(true)
      }
    } catch (err: any) {
      console.error("[v0] Auth error:", err)
      setError(err.message || "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#37322f] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl">
            <span className="font-semibold">GROWZZY</span>
            <span className="font-light opacity-60"> OS</span>
          </span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl text-white leading-tight font-serif font-normal">
            All your marketing channels, <span className="text-[#f97316] italic">one intelligent dashboard</span>
          </h1>
          <p className="text-white/60 text-lg font-normal">
            Unify Meta Ads, Google Ads, Shopify & LinkedIn with AI-driven insights.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {["S", "M", "R", "A"].map((letter, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-white/10 border-2 border-[#37322f] flex items-center justify-center text-sm text-white"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-white/60 text-sm">
              Trusted by <span className="text-white">500+</span> marketing teams
            </p>
          </div>
        </div>

        <p className="text-white/40 text-sm">© 2025 GROWZZY. All rights reserved.</p>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile Logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#37322f] rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#37322f] text-xl">
            <span className="font-semibold">GROWZZY</span>
            <span className="font-light opacity-60"> OS</span>
          </span>
        </Link>

        <Link
          href="/"
          className="absolute top-6 left-6 lg:left-auto lg:right-6 flex items-center gap-2 text-[#37322f]/60 hover:text-[#37322f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <h2 className="text-2xl text-[#37322f] mb-2 font-serif">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-[#37322f]/60 font-normal">
              {isLogin ? "Sign in to access your marketing dashboard" : "Start managing your campaigns with AI"}
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm text-[#37322f]/70">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37322f]/40" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 pl-11 bg-white border-[#37322f]/10 text-[#37322f] placeholder:text-[#37322f]/40 rounded-xl focus:border-[#f97316]/30 focus:ring-[#f97316]/10"
                    required={!isLogin}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-[#37322f]/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37322f]/40" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-11 bg-white border-[#37322f]/10 text-[#37322f] placeholder:text-[#37322f]/40 rounded-xl focus:border-[#f97316]/30 focus:ring-[#f97316]/10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm text-[#37322f]/70">Password</label>
                {isLogin && (
                  <Link href="/auth/forgot-password" className="text-sm text-[#f97316] hover:text-[#ea580c]">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37322f]/40" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-11 pr-11 bg-white border-[#37322f]/10 text-[#37322f] placeholder:text-[#37322f]/40 rounded-xl focus:border-[#f97316]/30 focus:ring-[#f97316]/10"
                  required
                  disabled={isLoading}
                />
                {!isLogin && <p className="text-xs text-[#37322f]/60">Must be at least 8 characters</p>}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#37322f] hover:bg-[#37322f]/90 text-white rounded-xl transition-all shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </div>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-[#37322f]/40">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              setIsLogin(!isLogin)
              setError("")
              setSuccessMessage("") // Clear success message on toggle
            }}
          >
            {isLogin ? "Create Account" : "Sign In"}
          </Button>
        </div>
      </div>
    </div>
  )
}
