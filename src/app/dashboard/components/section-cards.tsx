import { TrendingDown, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AnalyticsDashboard } from "@/types/analytics"

interface SectionCardsProps {
  data?: AnalyticsDashboard
}

export function SectionCards({ data }: SectionCardsProps) {
  const { t } = useTranslation('dashboard')
  
  // Format currency with proper thousands separator
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.totalRevenue')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${data ? formatCurrency(data.total_sales_revenue.amounts.usd) : '0.00'}
          </CardTitle>
          <div className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-muted-foreground">
            {data ? formatCurrency(data.total_sales_revenue.amounts.uzs) : '0.00'} UZS
          </div>
          <CardAction>
            <Badge variant="outline">
              {data?.total_sales_revenue.state.direction === 'Up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {data?.total_sales_revenue.state.direction === 'Up' ? '+' : '-'}
              {data?.total_sales_revenue.state.percentage ?? 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data?.total_sales_revenue.state.direction === 'Up' ? (
              <>
                Growing up this month <TrendingUp className="size-4" />
              </>
            ) : (
              <>
                Falling down this month <TrendingDown className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {t('cards.visitorsLast6Months')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.sellerProfit')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            ${data ? formatCurrency(data.raw_income.amounts.usd) : '0.00'}
          </CardTitle>
          <div className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-muted-foreground">
            {data ? formatCurrency(data.raw_income.amounts.uzs) : '0.00'} UZS
          </div>
          <CardAction>
            <Badge variant="outline">
              {data?.raw_income.state.direction === 'Up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {data?.raw_income.state.direction === 'Up' ? '+' : '-'}
              {data?.raw_income.state.percentage ?? 0}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data?.raw_income.state.direction === 'Up' ? (
              <>
                Growing up this month <TrendingUp className="size-4" />
              </>
            ) : (
              <>
                Falling down this month <TrendingDown className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {t('cards.visitorsLast6Months')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.activeAccounts')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.strongRetention')} <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('cards.engagementExceeds')}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.growthRate')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.steadyPerformance')} <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('cards.meetsProjections')}</div>
        </CardFooter>
      </Card>
    </div>
  )
}
