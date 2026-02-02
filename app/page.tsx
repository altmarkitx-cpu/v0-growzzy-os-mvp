"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Play,
  Star,
  ChevronDown,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Bot,
  Wand2,
  PieChart,
  LineChart,
  Check,
  Menu,
  X,
  ArrowUpRight,
  Layers,
  Shield,
  Clock,
  RefreshCw,
} from "lucide-react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  
  const integrations = [
    {
      name: "Meta Ads",
      logo: "/images/image.png",
      description: "Facebook & Instagram Ads",
      color: "#0081FB",
    },
    {
      name: "Google Ads",
      logo: "/images/image.png",
      description: "Search & Display Campaigns",
      color: "#4285F4",
    },
    {
      name: "Shopify",
      logo: "/images/image.png",
      description: "E-commerce Analytics",
      color: "#96BF48",
    },
    {
      name: "LinkedIn",
      logo: "/images/image.png",
      description: "B2B Marketing",
      color: "#0A66C2",
    },
    {
      name: "AI Ad Creative",
      logo: null,
      icon: Wand2,
      description: "Generate ad creatives with AI",
      color: "#f97316",
    },
  ]

  const features = [
    {
      icon: BarChart3,
      title: "Unified Analytics",
      description: "Real-time metrics across Meta, Google, LinkedIn, and Shopify unified in one view.",
      gradient: "from-blue-500/10 to-cyan-500/10",
    },
    {
      icon: Bot,
      title: "AI Co-Pilot",
      description: "Get intelligent recommendations and insights powered by advanced AI models.",
      gradient: "from-purple-500/10 to-pink-500/10",
    },
    {
      icon: Wand2,
      title: "AI Ad Generator",
      description: "Create high-converting ad creatives automatically with AI assistance.",
      gradient: "from-orange-500/10 to-amber-500/10",
    },
    {
      icon: Target,
      title: "Smart Targeting",
      description: "AI-optimized audience segments for maximum campaign performance.",
      gradient: "from-green-500/10 to-emerald-500/10",
    },
    {
      icon: RefreshCw,
      title: "Workflow Automation",
      description: "Automate repetitive tasks and scale your marketing operations.",
      gradient: "from-indigo-500/10 to-violet-500/10",
    },
    {
      icon: Shield,
      title: "Data Security",
      description: "Enterprise-grade security with SOC2 compliance and data encryption.",
      gradient: "from-slate-500/10 to-gray-500/10",
    },
  ]

  const featureTabs = [
    {
      title: "Analytics Dashboard",
      icon: PieChart,
      description: "Unified metrics from all your marketing channels in real-time.",
    },
    {
      title: "AI Insights",
      icon: Sparkles,
      description: "Smart recommendations to optimize your campaign performance.",
    },
    {
      title: "Ad Generator",
      icon: Wand2,
      description: "Create stunning ad creatives with AI in seconds.",
    },
    {
      title: "Automations",
      icon: Zap,
      description: "Set up intelligent workflows that run on autopilot.",
    },
  ]

  const testimonials = [
    {
      quote: "GROWZZY OS reduced our reporting time by 80% and increased our ROAS by 2.4x within the first month.",
      author: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow",
      avatar: "S",
    },
    {
      quote: "The AI recommendations are incredibly accurate. It's like having a senior strategist on the team 24/7.",
      author: "Marcus Williams",
      role: "Founder & CEO",
      company: "Ecom Brands",
      avatar: "M",
    },
    {
      quote: "Finally, a platform that truly unifies all our marketing data. The time savings alone is worth it.",
      author: "Jessica Park",
      role: "Head of Growth",
      company: "ScaleUp",
      avatar: "J",
    },
  ]

  const faqs = [
    {
      question: "How does GROWZZY OS integrate with my existing tools?",
      answer:
        "GROWZZY OS connects seamlessly with Meta Ads, Google Ads, Shopify, and LinkedIn through secure API integrations. Setup takes less than 5 minutes per platform, and your data syncs in real-time.",
    },
    {
      question: "Is my data secure with GROWZZY OS?",
      answer:
        "Yes, absolutely. We use enterprise-grade encryption, are SOC2 compliant, and never share your data with third parties. Your marketing data is stored securely and only accessible by you.",
    },
    {
      question: "Can I try GROWZZY OS before committing?",
      answer:
        "Yes! We offer a 14-day free trial with full access to all features. No credit card required. You can explore the entire platform and see the value before making a decision.",
    },
    {
      question: "How does the AI Ad Generator work?",
      answer:
        "Our AI analyzes your best-performing ads, brand guidelines, and industry trends to generate high-converting ad creatives. Simply provide a brief, and get multiple variations in seconds.",
    },
    {
      question: "What kind of support do you offer?",
      answer:
        "We provide 24/7 email support for all plans, with priority support and dedicated account managers for Pro and Enterprise customers. Our average response time is under 2 hours.",
    },
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for small teams getting started",
      features: ["Up to 3 ad accounts", "Basic analytics", "Email support", "1 team member", "7-day data retention"],
      cta: "Start free trial",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$149",
      period: "/month",
      description: "For growing teams that need more power",
      features: [
        "Unlimited ad accounts",
        "Advanced analytics",
        "AI recommendations",
        "AI Ad Generator",
        "5 team members",
        "90-day data retention",
        "Priority support",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with custom needs",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated account manager",
        "SSO & advanced security",
        "Unlimited team members",
        "Unlimited data retention",
        "SLA guarantee",
      ],
      cta: "Contact sales",
      highlighted: false,
    },
  ]

  const stats = [
    { value: "500+", label: "Active teams" },
    { value: "2.4x", label: "Avg. ROAS increase" },
    { value: "80%", label: "Time saved" },
    { value: "99.9%", label: "Uptime SLA" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % featureTabs.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [featureTabs.length])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  const FeatureIcon = ({ icon }) => {
    const IconComponent = icon
    return <IconComponent className="w-12 h-12 text-orange-500" />
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl tracking-tight">
                <span className="font-semibold">GROWZZY</span>
                <span className="font-light text-slate-500"> OS</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {["Features", "Integrations", "Pricing", "FAQ"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth">
                <button className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
                  Sign in
                </button>
              </Link>
              <Link href="/auth">
                <button className="h-10 px-5 bg-slate-900 text-white text-sm rounded-full hover:bg-slate-800 transition-all flex items-center gap-2">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-200/50 shadow-lg">
            <nav className="flex flex-col p-4 gap-2">
              {["Features", "Integrations", "Pricing", "FAQ"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-left px-4 py-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {item}
                </button>
              ))}
              <div className="border-t border-slate-200 mt-2 pt-4 flex flex-col gap-2">
                <Link href="/auth" className="px-4 py-3 text-center text-slate-600 hover:text-slate-900 rounded-lg">
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  className="px-4 py-3 bg-slate-900 text-white text-center rounded-full hover:bg-slate-800"
                >
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section - Updated with font-serif for headlines, font-normal weight */}
        <section className="pt-32 sm:pt-40 pb-20 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 border border-slate-200 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-slate-900/80 text-sm">AI-Powered Marketing Operations</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl text-slate-900 leading-[1.1] mb-6 font-serif font-normal">
                All your marketing channels, <span className="text-orange-500 italic">one intelligent dashboard</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                Unify Meta Ads, Google Ads, Shopify & LinkedIn. Get AI-driven insights, generate ad creatives, and
                automate your marketing operations.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
                <Link href="/auth">
                  <button className="h-12 px-8 bg-slate-900 text-white text-base rounded-full hover:bg-slate-800 transition-all hover:shadow-xl flex items-center gap-2 shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]">
                    Get started free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <button className="h-12 px-8 bg-white border border-slate-200 text-slate-900 text-base rounded-full hover:bg-white/80 transition-all flex items-center gap-2 shadow-sm">
                  <Play className="w-5 h-5 fill-current" />
                  Watch demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex -space-x-2">
                  {["S", "M", "R", "A", "J"].map((letter, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-xs text-slate-900"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-500 fill-orange-500" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-500">Trusted by 500+ marketing teams</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-20">
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200 overflow-hidden">
                  {/* Browser Chrome */}
                  <div className="h-11 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1.5 bg-white rounded-md text-xs text-slate-900/40 border border-slate-200">
                        app.growzzy.io/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="flex min-h-[500px]">
                    {/* Sidebar */}
                    <div className="w-56 bg-slate-50 border-r border-slate-200 p-4 hidden sm:block">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">GROWZZY OS</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 px-3 py-2 bg-orange-50 text-orange-500 rounded-lg text-sm">
                          <BarChart3 className="w-4 h-4" />
                          Dashboard
                        </div>
                        {[
                          { icon: LineChart, label: "Analytics" },
                          { icon: Target, label: "Campaigns" },
                          { icon: Bot, label: "AI Co-Pilot" },
                          { icon: Wand2, label: "Ad Generator" },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm cursor-pointer transition-colors"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-900/40 px-3 mb-2 uppercase tracking-wider">Channels</p>
                        <div className="space-y-1">
                          {integrations.slice(0, 4).map((integration, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <Image
                                src={integration.logo || "/placeholder.svg"}
                                alt={integration.name}
                                width={16}
                                height={16}
                                className="rounded"
                              />
                              {integration.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-6 bg-white">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl text-slate-900 font-medium">Welcome back</h3>
                          <p className="text-sm text-slate-900/50">Here's your marketing performance overview</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-500 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Last 30 days
                          </div>
                        </div>
                      </div>

                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                          { label: "Total Spend", value: "$24,580", change: "+12%", positive: true },
                          { label: "Revenue", value: "$86,420", change: "+24%", positive: true },
                          { label: "ROAS", value: "3.52x", change: "+18%", positive: true },
                          { label: "Conversions", value: "1,842", change: "+8%", positive: true },
                        ].map((kpi, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xs text-slate-900/50 mb-1">{kpi.label}</p>
                            <p className="text-xl text-slate-900 font-medium">{kpi.value}</p>
                            <span
                              className={`text-xs ${kpi.positive ? "text-green-600" : "text-red-600"} flex items-center gap-1 mt-1`}
                            >
                              <TrendingUp className="w-3 h-3" />
                              {kpi.change}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Chart Preview */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm text-slate-900 font-medium">Revenue by Channel</h4>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#0081FB]" />
                              Meta
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                              Google
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#96BF48]" />
                              Shopify
                            </span>
                          </div>
                        </div>
                        <div className="h-40 flex items-end gap-3">
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
                            <div key={month} className="flex-1 flex flex-col gap-1">
                              <div className="flex flex-col gap-0.5">
                                <div
                                  className="bg-[#0081FB] rounded-t"
                                  style={{ height: `${40 + Math.random() * 60}px` }}
                                />
                                <div
                                  className="bg-[#4285F4] rounded"
                                  style={{ height: `${30 + Math.random() * 40}px` }}
                                />
                                <div
                                  className="bg-[#96BF48] rounded-b"
                                  style={{ height: `${20 + Math.random() * 30}px` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-900/40 text-center">{month}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 w-full border-y border-slate-200 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl sm:text-5xl text-slate-900 font-serif mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-900/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 text-sm mb-4">
                Features
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 font-serif font-normal">
                Everything you need to scale
              </h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">
                Powerful tools designed for modern marketing teams
              </p>
            </div>

            {/* Feature Tabs */}
            <div className="mb-20">
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {featureTabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all ${
                      activeTab === i
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.title}
                  </button>
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <FeatureIcon icon={featureTabs[activeTab].icon} />
                <h3 className="text-2xl text-slate-900 mb-2 font-medium">{featureTabs[activeTab].title}</h3>
                <p className="text-slate-500 max-w-md mx-auto">{featureTabs[activeTab].description}</p>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-6 h-6 text-slate-900" />
                  </div>
                  <h3 className="text-lg text-slate-900 mb-2 font-medium">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section id="integrations" className="w-full py-24 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 text-sm mb-4">
                Integrations
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 font-serif font-normal">
                Connect all your channels
              </h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">
                Seamlessly integrate with the platforms you already use
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {integrations.map((platform) => (
                <div
                  key={platform.name}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-4 hover:shadow-lg hover:border-slate-200 transition-all cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white group-hover:scale-110 transition-transform overflow-hidden shadow-sm">
                    {platform.logo ? (
                      <Image
                        src={platform.logo || "/placeholder.svg"}
                        alt={platform.name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    ) : platform.icon ? (
                      <platform.icon className="w-8 h-8 text-orange-500" />
                    ) : null}
                  </div>
                  <div className="text-center">
                    <span className="text-slate-900 font-medium block text-sm">{platform.name}</span>
                    <span className="text-slate-900/50 text-xs">{platform.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 text-sm mb-4">
                Testimonials
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 font-serif font-normal">
                Loved by marketing teams
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-orange-500 fill-orange-500" />
                    ))}
                  </div>
                  <p className="text-slate-900/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm text-slate-900">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium text-sm">{testimonial.author}</p>
                      <p className="text-slate-900/50 text-xs">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 w-full bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 text-sm mb-4">
                Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 font-serif font-normal">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-500 text-lg max-w-lg mx-auto">Start free, upgrade when you're ready</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`rounded-2xl p-6 ${
                    plan.highlighted
                      ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-4 ring-offset-white"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <h3 className={`text-lg mb-2 font-medium ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-serif ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                      {plan.price}
                    </span>
                    <span className={plan.highlighted ? "text-white/60" : "text-slate-900/50"}>{plan.period}</span>
                  </div>
                  <p className={`text-sm mb-6 ${plan.highlighted ? "text-white/70" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${plan.highlighted ? "text-orange-500" : "text-orange-500"}`} />
                        <span className={plan.highlighted ? "text-white/80" : "text-slate-600"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth" className="block">
                    <button
                      className={`w-full h-11 rounded-full text-sm font-medium transition-all ${
                        plan.highlighted
                          ? "bg-white text-slate-900 hover:bg-white/90"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 w-full">
          <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 text-sm mb-4">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 font-serif font-normal">
                Common questions
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-slate-900 font-medium">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-900/40 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4">
                      <p className="text-slate-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 rounded-3xl p-12 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4 font-serif font-normal">
                Ready to transform your marketing?
              </h2>
              <p className="text-white/60 text-lg max-w-lg mx-auto mb-8">
                Join 500+ marketing teams already using GROWZZY OS
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <button className="h-12 px-8 bg-white text-slate-900 text-base rounded-full hover:bg-white/90 transition-all flex items-center gap-2 mx-auto sm:mx-0">
                    Get started free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <button className="h-12 px-8 border border-white/20 text-white text-base rounded-full hover:bg-white/10 transition-all flex items-center gap-2 mx-auto sm:mx-0">
                  Talk to sales
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg">
                  <span className="font-semibold">GROWZZY</span>
                  <span className="font-light text-slate-500"> OS</span>
                </span>
              </Link>
              <p className="text-sm text-slate-500 max-w-xs">
                AI-powered marketing operations platform for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-slate-900">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("integrations")} className="hover:text-slate-900">
                    Integrations
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing")} className="hover:text-slate-900">
                    Pricing
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-slate-900">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-900/50">© 2025 GROWZZY OS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-900/40 hover:text-slate-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-slate-900/40 hover:text-slate-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="text-slate-900/40 hover:text-slate-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
