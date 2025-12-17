import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table"
import { SectionCards } from "./components/section-cards"
import { SectionCardsSkeleton } from "./components/section-cards-skeleton"
import { QuickActionsBar } from "./components/quick-actions-bar"
import { MetricsCards } from "./components/metrics-cards"
import { DashboardFilter } from "./components/dashboard-filter"
import type { DateFilterParams, FilterType } from "./components/dashboard-filter"
import { useAnalyticsDashboard } from "@/hooks/use-analytics"

import data from "./data/data.json"
import pastPerformanceData from "./data/past-performance-data.json"
import keyPersonnelData from "./data/key-personnel-data.json"
import focusDocumentsData from "./data/focus-documents-data.json"

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
  
  const { data: analyticsData, isLoading } = useAnalyticsDashboard(filterParams)

  const handleFilterChange = (type: FilterType, params: DateFilterParams) => {
    setFilterParams(params)
  }
  
  return (
    <BaseLayout 
      title={t('title')} 
      description={t('welcome')}
      actions={<DashboardFilter onFilterChange={handleFilterChange} />}
    >
        <div className="@container/main px-4 lg:px-6 space-y-6">
          {isLoading ? (
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
          <DataTable 
            data={data} 
            pastPerformanceData={pastPerformanceData}
            keyPersonnelData={keyPersonnelData}
            focusDocumentsData={focusDocumentsData}
            filterParams={filterParams}
          />
        </div>
    </BaseLayout>
  )
}
