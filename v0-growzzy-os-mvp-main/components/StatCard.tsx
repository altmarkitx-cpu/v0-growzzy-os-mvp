/**
 * Real-time statistics card component
 */

'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber, formatROAS, calculateTrend, formatPercentage } from '@/lib/api-utils'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: number | string
  format?: 'currency' | 'number' | 'roas' | 'percentage' | 'custom'
  previousValue?: number
  isLoading?: boolean
  icon?: React.ReactNode
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  format = 'number',
  previousValue,
  isLoading,
  icon,
  onClick,
}: StatCardProps) {
  let displayValue: string = ''
  let trend = null

  // Format value
  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        displayValue = formatCurrency(value)
        break
      case 'roas':
        displayValue = formatROAS(value)
        break
      case 'percentage':
        displayValue = formatPercentage(value)
        break
      case 'custom':
        displayValue = value.toString()
        break
      default:
        displayValue = formatNumber(value)
    }
  } else {
    displayValue = value
  }

  // Calculate trend
  if (previousValue !== undefined && typeof value === 'number') {
    trend = calculateTrend(value, previousValue)
  }

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
          <div className="h-8 bg-muted rounded w-full"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`p-4 md:p-6 ${onClick ? 'cursor-pointer hover:bg-muted' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground mt-2">{displayValue}</p>

          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : null}
              <span
                className={`text-xs font-medium ${
                  trend.direction === 'up'
                    ? 'text-green-600'
                    : trend.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
                {trend.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {icon && <div className="text-primary opacity-50">{icon}</div>}
      </div>
    </Card>
  )
}
