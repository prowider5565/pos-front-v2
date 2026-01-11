import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table-simplified"
import { SectionCards } from "./components/section-cards"
import { SectionCardsSkeleton } from "./components/section-cards-skeleton"
import { QuickActionsBar } from "./components/quick-actions-bar"
import { MetricsCards } from "./components/metrics-cards"
import { DashboardFilter } from "./components/dashboard-filter"
import type { DateFilterParams, FilterType } from "./components/dashboard-filter"
import { useAnalyticsDashboard } from "@/hooks/use-analytics"

export default function Page() {
  const { t } = useTranslation('dashboard')
  const [filterParams, setFilterParams] = useState<DateFilterParams>(() => {
    // Default to monthly filter
    const now = new Date()
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }
  })
  
  // Use isFetching for background indicator, but show data if available (even if stale)
  const { data: analyticsData, isLoading } = useAnalyticsDashboard(filterParams)
  
  // Show skeleton only on initial load (no cached data), not on background refresh
  const showSkeleton = isLoading && !analyticsData

  const handleFilterChange = (_type: FilterType, params: DateFilterParams) => {
    setFilterParams(params)
  }
  
  return (
    <BaseLayout 
      title={t('title')} 
      description={t('welcome')}
      actions={<DashboardFilter onFilterChange={handleFilterChange} />}
    >
        <div className="@container/main px-4 lg:px-6 space-y-6">
          {showSkeleton ? (
            <SectionCardsSkeleton />
          ) : (
            <SectionCards data={analyticsData} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickActionsBar />
            </div>
            <div className="lg:col-span-2">
              <ChartAreaInteractive graphData={analyticsData?.graph_data} />
            </div>
          </div>
          <MetricsCards data={analyticsData} />
        </div>
        <div className="@container/main">
          <DataTable filterParams={filterParams} />
        </div>
    </BaseLayout>
  )
}
