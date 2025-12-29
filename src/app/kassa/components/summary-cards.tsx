/**
 * Summary Cards Component
 * Displays total amounts for expenses or revenue
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface SummaryCardsProps {
  totalUzs: string
  totalUsd: string
  type: 'expense' | 'revenue'
}

export function SummaryCards({ totalUzs, totalUsd, type }: SummaryCardsProps) {
  const { t } = useTranslation('kassa')

  const Icon = type === 'expense' ? TrendingDown : TrendingUp
  const title = type === 'expense' ? t('summary.totalExpenses') : t('summary.totalRevenue')
  const iconColorClass = type === 'expense' ? 'text-destructive' : 'text-green-600'
  const bgColorClass = type === 'expense' ? 'bg-destructive/10' : 'bg-green-100 dark:bg-green-900/20'

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title} (UZS)</CardTitle>
          <div className={`rounded-full p-2 ${bgColorClass}`}>
            <Icon className={`h-4 w-4 ${iconColorClass}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatAmount(totalUzs)}</div>
          <p className="text-xs text-muted-foreground mt-1">UZS</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title} (USD)</CardTitle>
          <div className={`rounded-full p-2 ${bgColorClass}`}>
            <Icon className={`h-4 w-4 ${iconColorClass}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatAmount(totalUsd)}</div>
          <p className="text-xs text-muted-foreground mt-1">USD</p>
        </CardContent>
      </Card>
    </div>
  )
}
