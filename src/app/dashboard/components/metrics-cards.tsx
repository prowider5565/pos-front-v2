import { useTranslation } from "react-i18next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalyticsDashboard } from "@/types/analytics"
import { Package, DollarSign, FolderOpen, AlertTriangle, ShoppingCart, Users, UserPlus, Building, Archive } from "lucide-react"

interface MetricsCardsProps {
  data?: AnalyticsDashboard
}

export function MetricsCards({ data }: MetricsCardsProps) {
  const { t } = useTranslation('dashboard')

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US')
  }

  const formatCurrency = (num: number) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const metrics = [
    {
      icon: Package,
      title: t('metrics.totalProducts'),
      value: data?.total_products ?? 0,
      formatter: formatNumber,
    },
    {
      icon: DollarSign,
      title: t('metrics.totalAssetValue'),
      value: data?.total_asset_value ?? 0,
      formatter: formatCurrency,
      suffix: ' UZS',
    },
    {
      icon: FolderOpen,
      title: t('metrics.categoriesCount'),
      value: data?.categories_count ?? 0,
      formatter: formatNumber,
    },
    {
      icon: AlertTriangle,
      title: t('metrics.lowStockProducts'),
      value: data?.low_stock_products ?? 0,
      formatter: formatNumber,
      highlight: (data?.low_stock_products ?? 0) > 0,
    },
    {
      icon: ShoppingCart,
      title: t('metrics.totalProductsSold'),
      value: data?.total_products_sold ?? 0,
      formatter: formatNumber,
    },
    {
      icon: Users,
      title: t('metrics.usersCount'),
      value: data?.users_count ?? 0,
      formatter: formatNumber,
    },
    {
      icon: UserPlus,
      title: t('metrics.clientsCount'),
      value: data?.clients_count ?? 0,
      formatter: formatNumber,
    },
    {
      icon: Building,
      title: t('metrics.suppliersCount'),
      value: data?.suppliers_count ?? 0,
      formatter: formatNumber,
    },
  ]

  const archivedMetricsWithIcons = [
    {
      icon: Package,
      title: t('metrics.archivedProducts'),
      value: data?.archived_counts.products ?? 0,
    },
    {
      icon: Building,
      title: t('metrics.archivedSuppliers'),
      value: data?.archived_counts.suppliers ?? 0,
    },
    {
      icon: UserPlus,
      title: t('metrics.archivedClients'),
      value: data?.archived_counts.clients ?? 0,
    },
    {
      icon: Users,
      title: t('metrics.archivedUsers'),
      value: data?.archived_counts.users ?? 0,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Left side: 4 columns × 2 rows = 8 metrics */}
      <div className="lg:col-span-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription className="text-sm font-medium">
                  {metric.title}
                </CardDescription>
                <Icon className={`h-4 w-4 ${metric.highlight ? 'text-red-600' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.highlight ? 'text-red-600' : ''}`}>
                  {metric.formatter(metric.value)}{metric.suffix || ''}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Right side: Archived Counts Card with 4 rectangle cards */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="h-4 w-4" />
              {t('metrics.archivedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              {archivedMetricsWithIcons.map((metric, index) => {
                const Icon = metric.icon
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-3 text-card-foreground"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-lg font-bold">{formatNumber(metric.value)}</p>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {metric.title}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
