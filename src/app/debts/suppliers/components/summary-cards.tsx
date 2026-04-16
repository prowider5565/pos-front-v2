import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DebtAmounts } from '@/types/debts'

interface SummaryCardsProps {
  metadata?: DebtAmounts
  isLoading: boolean
  onTotalPaidClick?: () => void
}

function formatAmount(uzs: string, usd: string) {
  const uzsNum = parseFloat(uzs)
  const usdNum = parseFloat(usd)
  return (
    <div className="space-y-1">
      <div className="text-2xl font-bold">{uzsNum.toLocaleString()} UZS</div>
      <div className="text-sm text-muted-foreground">${usdNum.toLocaleString()} USD</div>
    </div>
  )
}

export function SummaryCards({ metadata, isLoading, onTotalPaidClick }: SummaryCardsProps) {
  const { t } = useTranslation('debts')

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!metadata) return null

  const isNegativeRemaining = parseFloat(metadata.total_remaining.uzs_amount) < 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('summary.totalDebt')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formatAmount(metadata.total_debt.uzs_amount, metadata.total_debt.usd_amount)}
        </CardContent>
      </Card>
      <Card
        className={onTotalPaidClick ? 'cursor-pointer transition-colors hover:bg-muted/40' : undefined}
        onClick={onTotalPaidClick}
        role={onTotalPaidClick ? 'button' : undefined}
        tabIndex={onTotalPaidClick ? 0 : undefined}
        onKeyDown={onTotalPaidClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onTotalPaidClick()
          }
        } : undefined}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('summary.totalPaid')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formatAmount(metadata.total_paid.uzs_amount, metadata.total_paid.usd_amount)}
          {onTotalPaidClick && (
            <div className="mt-2 text-xs text-muted-foreground">
              {t('summary.clickToViewPayments')}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('summary.totalRemaining')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={isNegativeRemaining ? 'text-green-600' : 'text-destructive'}>
            {formatAmount(metadata.total_remaining.uzs_amount, metadata.total_remaining.usd_amount)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
