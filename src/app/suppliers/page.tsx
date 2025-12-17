"use client"

import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { DataTable } from "./components/data-table"

export default function SuppliersPage() {
  const { t } = useTranslation('suppliers')

  return (
    <BaseLayout 
      title={t('title')} 
      description={t('subtitle')}
    >
      <div className="@container/main px-4 lg:px-6">
        <DataTable />
      </div>
    </BaseLayout>
  )
}
