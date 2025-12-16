import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { DataTable } from "./components/data-table"
import { SectionCards } from "./components/section-cards"
import { QuickActionsBar } from "./components/quick-actions-bar"

import data from "./data/data.json"
import pastPerformanceData from "./data/past-performance-data.json"
import keyPersonnelData from "./data/key-personnel-data.json"
import focusDocumentsData from "./data/focus-documents-data.json"

export default function Page() {
  const { t } = useTranslation('dashboard')
  
  return (
    <BaseLayout title={t('title')} description={t('welcome')}>
        <div className="@container/main px-4 lg:px-6 space-y-6">
          <SectionCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <QuickActionsBar />
            </div>
            <div className="lg:col-span-2">
              <ChartAreaInteractive />
            </div>
          </div>
        </div>
        <div className="@container/main">
          <DataTable 
            data={data} 
            pastPerformanceData={pastPerformanceData}
            keyPersonnelData={keyPersonnelData}
            focusDocumentsData={focusDocumentsData}
          />
        </div>
    </BaseLayout>
  )
}
