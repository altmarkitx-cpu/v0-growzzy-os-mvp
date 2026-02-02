'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, AlertCircle, Zap } from 'lucide-react'

interface Creative {
  id: number
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

export default function CreativeGeneratorPage() {
  const [formData, setFormData] = useState({
    productName: '',
    benefits: '',
    ageRange: '18-65',
    gender: 'all',
    interests: '',
    painPoints: '',
    campaignGoal: 'sales',
    tones: ['professional'],
    platforms: ['meta'],
  })

  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.productName,
          benefits: formData.benefits.split(',').map(b => b.trim()),
          audience: {
            age: formData.ageRange,
            gender: formData.gender,
            interests: formData.interests.split(',').map(i => i.trim()),
          },
          painPoints: formData.painPoints,
          campaignGoal: formData.campaignGoal,
          tones: formData.tones,
          platforms: formData.platforms,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate creatives')

      const data = await response.json()
      setCreatives(data.creatives || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate creatives')
      console.error('[v0] Creative generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">AI Creative Generator</h1>
          <p className="text-muted-foreground">Generate 20+ high-converting ad variations powered by OpenAI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card className="p-6 border border-border sticky top-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product/Service Name</label>
                  <Input
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g., AI Marketing Platform"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Key Benefits (comma-separated)</label>
                  <Input
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    placeholder="Save time, Boost ROI, Scale faster"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Age Range</label>
                    <Input
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      placeholder="18-65"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                    >
                      <option value="all">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Interests (comma-separated)</label>
                  <Input
                    value={formData.interests}
                    onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                    placeholder="Marketing, Technology, Business"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Pain Points</label>
                  <Input
                    value={formData.painPoints}
                    onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                    placeholder="Manual optimization, Wasted budget, Poor ROI"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Campaign Goal</label>
                  <select
                    value={formData.campaignGoal}
                    onChange={(e) => setFormData({ ...formData, campaignGoal: e.target.value })}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  >
                    <option value="sales">Sales</option>
                    <option value="leads">Leads</option>
                    <option value="traffic">Traffic</option>
                    <option value="awareness">Brand Awareness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Platforms</label>
                  <div className="space-y-2">
                    {['meta', 'google', 'linkedin', 'tiktok'].map((platform) => (
                      <label key={platform} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, platforms: [...formData.platforms, platform] })
                            } else {
                              setFormData({ ...formData, platforms: formData.platforms.filter(p => p !== platform) })
                            }
                          }}
                          disabled={loading}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-foreground capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate 20 Variations
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {creatives.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-border">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No creatives generated yet</h3>
                <p className="text-muted-foreground">Fill out the form and click "Generate" to create AI-powered ad variations</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">Generated Creatives</h2>
                  <div className="text-sm text-muted-foreground">
                    {creatives.length} variations generated
                  </div>
                </div>

                <div className="space-y-4">
                  {creatives.map((creative) => (
                    <Card key={creative.id} className="p-6 border border-border">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">Variation #{creative.id}</h3>
                          <p className="text-sm text-muted-foreground">{creative.framework} Framework</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{creative.score.toFixed(1)}/10</div>
                          <p className="text-xs text-muted-foreground">{creative.trigger}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Primary Text</p>
                          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg break-words">{creative.primaryText}</p>
                          <p className="text-xs text-muted-foreground mt-1">{creative.primaryText.length} chars</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Headline</p>
                            <p className="text-sm text-foreground bg-muted/50 p-2 rounded-lg">{creative.headline}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">CTA</p>
                            <p className="text-sm text-foreground bg-muted/50 p-2 rounded-lg font-medium">{creative.cta}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Creative Brief</p>
                          <p className="text-sm text-foreground">{creative.creativeBrief}</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Why This Works</p>
                          <p className="text-sm text-foreground">{creative.reasoning}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyText(creative.primaryText)}
                        className="w-full"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy Text'}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
