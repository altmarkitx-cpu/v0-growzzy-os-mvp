'use client'

import React from "react"

import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Copy, Download, Zap, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Filter } from 'lucide-react'

interface Creative {
  id: string
  primaryText: string
  headline: string
  description: string
  cta: string
  creativeBrief: string
  trigger: string
  framework: string
  score: number
  targetSegment: string
  reasoning: string
}

export default function CreativeStudioPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'results'>('form')
  
  // Form state
  const [productName, setProductName] = useState('')
  const [benefits, setBenefits] = useState(['', ''])
  const [audience, setAudience] = useState({
    age: '25-45',
    gender: 'All',
    interests: '',
  })
  const [painPoints, setPainPoints] = useState('')
  const [campaignGoal, setCampaignGoal] = useState('Sales')
  const [tones, setTones] = useState(['Professional', 'Persuasive'])
  const [platforms, setPlatforms] = useState(['Meta', 'Google'])
  
  // Results state
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'framework' | 'trigger'>('score')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toneOptions = ['Professional', 'Casual', 'Urgent', 'Storytelling', 'Data-driven', 'Emotional']
  const platformOptions = ['Meta', 'Google', 'LinkedIn', 'TikTok']
  const triggerOptions = ['Urgency', 'Scarcity', 'Social Proof', 'Authority', 'Reciprocity', 'Curiosity', 'Fear of Missing Out']
  const frameworkOptions = ['PAS', 'AIDA', 'BAB', '4P', 'FAB']

  const handleAddBenefit = () => {
    setBenefits([...benefits, ''])
  }

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const handleUpdateBenefit = (index: number, value: string) => {
    const updated = [...benefits]
    updated[index] = value
    setBenefits(updated)
  }

  const toggleTone = (tone: string) => {
    setTones(tones.includes(tone) ? tones.filter(t => t !== tone) : [...tones, tone])
  }

  const togglePlatform = (platform: string) => {
    setPlatforms(platforms.includes(platform) ? platforms.filter(p => p !== platform) : [...platforms, platform])
  }

  const handleGenerateCreatives = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('[v0] Starting creative generation with:', {
        productName,
        benefits: benefits.filter(b => b),
        audience,
        painPoints,
        campaignGoal,
        tones,
        platforms,
      })

      const response = await fetch('/api/creative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          benefits: benefits.filter(b => b),
          audience,
          painPoints,
          campaignGoal,
          tones,
          platforms,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate creatives')
      }

      const data = await response.json()
      console.log('[v0] Generated', data.creatives.length, 'creatives')

      setCreatives(data.creatives)
      setStep('results')
    } catch (err: any) {
      console.error('[v0] Generation error:', err)
      setError(err.message || 'Failed to generate creatives')
    } finally {
      setLoading(false)
    }
  }

  const sortedCreatives = useMemo(() => {
    const sorted = [...creatives].sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score
      } else if (sortBy === 'framework') {
        return a.framework.localeCompare(b.framework)
      } else {
        return a.trigger.localeCompare(b.trigger)
      }
    })
    return sorted
  }, [creatives, sortBy])

  const stats = useMemo(() => {
    return {
      excellent: creatives.filter(c => c.score >= 9).length,
      good: creatives.filter(c => c.score >= 7 && c.score < 9).length,
      test: creatives.filter(c => c.score >= 5 && c.score < 7).length,
    }
  }, [creatives])

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Primary Text', 'Headline', 'Description', 'CTA', 'Trigger', 'Framework', 'Score', 'Target Segment']
    const rows = creatives.map(c => [
      c.id,
      c.primaryText,
      c.headline,
      c.description,
      c.cta,
      c.trigger,
      c.framework,
      c.score,
      c.targetSegment,
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creatives-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (step === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Creative Studio</h1>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-amber-500" />
                AI Creative Generator
              </h2>
              <p className="text-muted-foreground">Create 20 high-performance ad variations using AI in seconds</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerateCreatives} className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Product/Service Name *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., AI Marketing Platform, Fitness App"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-semibold mb-2">What does it do? (Key Benefits)</label>
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleUpdateBenefit(idx, e.target.value)}
                      placeholder="e.g., Save 10 hours per week"
                      className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  + Add another benefit
                </button>
              </div>

              {/* Audience */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Age Range</label>
                  <select
                    value={audience.age}
                    onChange={(e) => setAudience({ ...audience, age: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>18-25</option>
                    <option>25-35</option>
                    <option>35-45</option>
                    <option>45-55</option>
                    <option>55+</option>
                    <option>All</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Gender</label>
                  <select
                    value={audience.gender}
                    onChange={(e) => setAudience({ ...audience, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option>All</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Interests</label>
                  <input
                    type="text"
                    value={audience.interests}
                    onChange={(e) => setAudience({ ...audience, interests: e.target.value })}
                    placeholder="e.g., Tech, Marketing"
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Pain Points */}
              <div>
                <label className="block text-sm font-semibold mb-2">Pain Points They Face *</label>
                <textarea
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="e.g., Spending too much time on manual tasks, lack of visibility into campaign performance"
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Campaign Goal */}
              <div>
                <label className="block text-sm font-semibold mb-3">Campaign Goal</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Sales', 'Leads', 'Traffic', 'Brand Awareness'].map(goal => (
                    <label key={goal} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="goal"
                        value={goal}
                        checked={campaignGoal === goal}
                        onChange={(e) => setCampaignGoal(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tones */}
              <div>
                <label className="block text-sm font-semibold mb-3">Tone & Style (Select 1-3)</label>
                <div className="grid grid-cols-3 gap-2">
                  {toneOptions.map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => toggleTone(tone)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        tones.includes(tone)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-input bg-background text-foreground hover:bg-muted'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold mb-3">Platforms (Select at least 1)</label>
                <div className="grid grid-cols-2 gap-3">
                  {platformOptions.map(platform => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={platforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !productName || !painPoints || platforms.length === 0}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating 20 Variations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate 20 High-Performance Variations
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    )
  }

  // Results View
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Creative Results</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('form')}
              size="sm"
            >
              ← New Generation
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Performance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Excellent (9+)</p>
                <p className="text-3xl font-bold text-green-600">{stats.excellent}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Good (7-9)</p>
                <p className="text-3xl font-bold text-blue-600">{stats.good}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>
          <Card className="p-6 border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-950/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Test (5-7)</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.test}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Recommendation */}
        <Card className="p-6 mb-8 border-primary/50 bg-primary/5">
          <p className="text-sm font-medium text-foreground mb-2">Recommendation</p>
          <p className="text-sm text-muted-foreground">
            Start by testing the {stats.excellent} excellent variations (score 9+). These have the highest probability of converting. Then gradually test the good variations (7-9) to expand your testing matrix.
          </p>
        </Card>

        {/* Sorting */}
        <div className="mb-6 flex gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="score">Sort by Score (High to Low)</option>
            <option value="framework">Sort by Framework</option>
            <option value="trigger">Sort by Trigger</option>
          </select>
        </div>

        {/* Creatives Grid */}
        <div className="grid gap-6">
          {sortedCreatives.map((creative, idx) => (
            <Card key={creative.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Variation #{idx + 1}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">Framework: <span className="font-semibold text-foreground">{creative.framework}</span></span>
                    <span className="text-muted-foreground">Trigger: <span className="font-semibold text-foreground">{creative.trigger}</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-bold ${
                    creative.score >= 9 ? 'text-green-600' :
                    creative.score >= 7 ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {creative.score.toFixed(1)}/10
                  </p>
                  <p className="text-xs text-muted-foreground">Performance Score</p>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PRIMARY TEXT</p>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm bg-muted p-3 rounded-lg flex-1">{creative.primaryText}</p>
                    <button
                      onClick={() => handleCopyText(creative.primaryText, creative.id)}
                      className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copiedId === creative.id ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">HEADLINE</p>
                    <p className="text-sm font-medium">{creative.headline}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">DESCRIPTION</p>
                    <p className="text-sm">{creative.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CTA</p>
                    <p className="text-sm font-medium text-primary">{creative.cta}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">CREATIVE BRIEF</p>
                  <p className="text-sm text-muted-foreground">{creative.creativeBrief}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">TARGET SEGMENT & REASONING</p>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-sm"><span className="font-semibold">Segment:</span> {creative.targetSegment}</p>
                    <p className="text-sm"><span className="font-semibold">Why it works:</span> {creative.reasoning}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  Use in Campaign
                </Button>
                <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                  Save as Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
