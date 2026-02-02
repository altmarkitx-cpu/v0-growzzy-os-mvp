'use client'

import React from "react"

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2, Clock, Zap, Settings, Play, Pause } from 'lucide-react'

interface Automation {
  id: string
  name: string
  trigger_type: 'metric_threshold' | 'time_based' | 'event'
  trigger_config: any
  action_type: 'send_alert' | 'pause_campaign' | 'adjust_budget' | 'generate_report'
  action_config: any
  is_active: boolean
  created_at: string
  last_executed: string | null
  execution_count: number
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'metric_threshold' as const,
    triggerConfig: {
      metric: 'roas',
      operator: 'below',
      value: 1.5,
      campaignId: '',
    },
    actionType: 'send_alert' as const,
    actionConfig: {
      message: '',
      recipient: 'email',
    },
  })

  useEffect(() => {
    fetchAutomations()
  }, [])

  const fetchAutomations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/automations')
      const data = await response.json()
      setAutomations(data.automations || [])
      console.log('[v0] Loaded', data.automations?.length || 0, 'automations')
    } catch (error) {
      console.error('[v0] Error fetching automations:', error)
      setError('Failed to load automations')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      console.log('[v0] Creating automation:', formData.name)

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          trigger_type: formData.triggerType,
          trigger_config: formData.triggerConfig,
          action_type: formData.actionType,
          action_config: formData.actionConfig,
          is_active: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create automation')
      }

      const newAutomation = await response.json()
      setAutomations([newAutomation, ...automations])
      setSuccess('Automation created successfully!')
      setShowForm(false)
      
      // Reset form
      setFormData({
        name: '',
        triggerType: 'metric_threshold',
        triggerConfig: { metric: 'roas', operator: 'below', value: 1.5, campaignId: '' },
        actionType: 'send_alert',
        actionConfig: { message: '', recipient: 'email' },
      })

      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('[v0] Error creating automation:', error)
      setError(error.message || 'Failed to create automation')
    }
  }

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) return

    try {
      setDeleting(id)
      const response = await fetch(`/api/automations?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete automation')

      setAutomations(automations.filter(a => a.id !== id))
      setSuccess('Automation deleted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('[v0] Error deleting automation:', error)
      setError(error.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const response = await fetch('/api/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: !current,
        }),
      })

      if (!response.ok) throw new Error('Failed to update automation')

      setAutomations(automations.map(a =>
        a.id === id ? { ...a, is_active: !current } : a
      ))
      setSuccess(`Automation ${!current ? 'activated' : 'paused'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('[v0] Error updating automation:', error)
      setError(error.message)
    }
  }

  const triggerDescription = useMemo(() => {
    if (formData.triggerType === 'metric_threshold') {
      return `When ${formData.triggerConfig.metric} ${formData.triggerConfig.operator} ${formData.triggerConfig.value}`
    }
    if (formData.triggerType === 'time_based') {
      return `Every ${formData.triggerConfig.intervalMinutes || 60} minutes`
    }
    return 'Event-based trigger'
  }, [formData])

  const actionDescription = useMemo(() => {
    if (formData.actionType === 'send_alert') {
      return `Send alert: ${formData.actionConfig.message || 'No message set'}`
    }
    if (formData.actionType === 'pause_campaign') {
      return 'Pause campaign'
    }
    if (formData.actionType === 'adjust_budget') {
      return `Adjust budget to $${formData.actionConfig.newBudget || 0}`
    }
    return 'Generate report'
  }, [formData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Automations</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 dark:bg-green-950/20 dark:border-green-900/30">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowForm(!showForm)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Automation
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create New Automation</h2>

            <form onSubmit={handleCreateAutomation} className="space-y-6">
              {/* Automation Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Automation Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Pause low ROAS campaigns"
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Trigger Configuration */}
              <div className="border rounded-lg p-6 bg-muted/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  When (Trigger)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Trigger Type</label>
                    <select
                      value={formData.triggerType}
                      onChange={(e) => setFormData({
                        ...formData,
                        triggerType: e.target.value as any,
                      })}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                    >
                      <option value="metric_threshold">Metric Falls Below Threshold</option>
                      <option value="time_based">Time-Based (Recurring)</option>
                      <option value="event">Event Occurs</option>
                    </select>
                  </div>

                  {formData.triggerType === 'metric_threshold' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-2">Metric</label>
                        <select
                          value={formData.triggerConfig.metric}
                          onChange={(e) => setFormData({
                            ...formData,
                            triggerConfig: { ...formData.triggerConfig, metric: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-input rounded bg-background text-foreground text-sm"
                        >
                          <option value="roas">ROAS</option>
                          <option value="cpc">CPC</option>
                          <option value="ctr">CTR</option>
                          <option value="conversions">Conversions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-2">Operator</label>
                        <select
                          value={formData.triggerConfig.operator}
                          onChange={(e) => setFormData({
                            ...formData,
                            triggerConfig: { ...formData.triggerConfig, operator: e.target.value },
                          })}
                          className="w-full px-3 py-2 border border-input rounded bg-background text-foreground text-sm"
                        >
                          <option value="below">Below</option>
                          <option value="above">Above</option>
                          <option value="equals">Equals</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-2">Value</label>
                        <input
                          type="number"
                          value={formData.triggerConfig.value}
                          onChange={(e) => setFormData({
                            ...formData,
                            triggerConfig: { ...formData.triggerConfig, value: parseFloat(e.target.value) },
                          })}
                          step="0.1"
                          className="w-full px-3 py-2 border border-input rounded bg-background text-foreground text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {formData.triggerType === 'time_based' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">Run Every (minutes)</label>
                      <input
                        type="number"
                        value={formData.triggerConfig.intervalMinutes || 60}
                        onChange={(e) => setFormData({
                          ...formData,
                          triggerConfig: { ...formData.triggerConfig, intervalMinutes: parseInt(e.target.value) },
                        })}
                        min="5"
                        step="5"
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Configuration */}
              <div className="border rounded-lg p-6 bg-muted/50">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Then (Action)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Action Type</label>
                    <select
                      value={formData.actionType}
                      onChange={(e) => setFormData({
                        ...formData,
                        actionType: e.target.value as any,
                      })}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                    >
                      <option value="send_alert">Send Alert</option>
                      <option value="pause_campaign">Pause Campaign</option>
                      <option value="adjust_budget">Adjust Budget</option>
                      <option value="generate_report">Generate Report</option>
                    </select>
                  </div>

                  {formData.actionType === 'send_alert' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">Alert Message</label>
                      <textarea
                        value={formData.actionConfig.message}
                        onChange={(e) => setFormData({
                          ...formData,
                          actionConfig: { ...formData.actionConfig, message: e.target.value },
                        })}
                        placeholder="e.g., Campaign {campaign_name} ROAS dropped to {roas}x"
                        rows={3}
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Use {'{campaign_name}'}, {'{roas}'}, {'{spend}'} as placeholders</p>
                    </div>
                  )}

                  {formData.actionType === 'adjust_budget' && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">New Daily Budget ($)</label>
                      <input
                        type="number"
                        value={formData.actionConfig.newBudget || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          actionConfig: { ...formData.actionConfig, newBudget: parseFloat(e.target.value) },
                        })}
                        min="0"
                        step="10"
                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <Card className="p-4 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">Preview</p>
                <p className="text-sm text-blue-800 dark:text-blue-500">
                  When <span className="font-semibold">{triggerDescription}</span>, then <span className="font-semibold">{actionDescription}</span>
                </p>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" size="lg" className="flex-1">
                  Save Automation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Automations List */}
        <div className="grid gap-4">
          {automations.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No automations yet</p>
              <Button onClick={() => setShowForm(true)}>
                Create Your First Automation
              </Button>
            </Card>
          ) : (
            automations.map((automation) => (
              <Card key={automation.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{automation.name}</h3>
                      <button
                        onClick={() => handleToggleActive(automation.id, automation.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          automation.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {automation.is_active ? (
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Pause className="w-3 h-3" />
                            Paused
                          </span>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Created {new Date(automation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAutomation(automation.id)}
                    disabled={deleting === automation.id}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p>
                    <span className="text-muted-foreground font-semibold">When:</span> {automation.trigger_type.replace(/_/g, ' ')}
                    {automation.trigger_config.metric && ` • ${automation.trigger_config.metric.toUpperCase()}`}
                    {automation.trigger_config.operator && ` ${automation.trigger_config.operator}`}
                    {automation.trigger_config.value && ` ${automation.trigger_config.value}`}
                  </p>
                  <p>
                    <span className="text-muted-foreground font-semibold">Then:</span> {automation.action_type.replace(/_/g, ' ')}
                    {automation.action_config.message && ` • "${automation.action_config.message.substring(0, 50)}..."`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                  <span>
                    Executed {automation.execution_count} times
                    {automation.last_executed && ` • Last: ${new Date(automation.last_executed).toLocaleString()}`}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="mt-8 p-6 bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">How Automations Work</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-500 space-y-1">
            <li>• Automations run every 5 minutes via background job (Vercel Cron)</li>
            <li>• Triggers are evaluated against your real campaign data</li>
            <li>• When triggered, actions execute immediately</li>
            <li>• All executions are logged in the Execution Monitor</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
