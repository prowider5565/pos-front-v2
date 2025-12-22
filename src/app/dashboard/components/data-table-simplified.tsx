"use client"

import { useTranslation } from "react-i18next"
import { LowStockTable } from "./low-stock-table"
import { PendingSalesTable } from "./pending-sales-table"
import { PartiallyPaidSalesTable } from "./partially-paid-sales-table"
import { FullyPaidSalesTable } from "./fully-paid-sales-table"
import type { DateFilterParams } from "./dashboard-filter"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface DataTableProps {
  filterParams: DateFilterParams
}

export function DataTable({ filterParams }: DataTableProps) {
  const { t } = useTranslation()

  return (
    <Tabs defaultValue="low-stock" className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b px-4 lg:px-6">
        <TabsList className="justify-start border-0 bg-transparent p-0 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="low-stock" className="cursor-pointer">{t('dashboard:table.lowStock')}</TabsTrigger>
          <TabsTrigger value="pending-sales" className="cursor-pointer">
            {t('dashboard:table.pendingSales')}
          </TabsTrigger>
          <TabsTrigger value="partially-paid-sales" className="cursor-pointer">
            {t('dashboard:table.partiallyPaidSales')}
          </TabsTrigger>
          <TabsTrigger value="fully-paid-sales" className="cursor-pointer">
            {t('dashboard:table.fullyPaidSales')}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="low-stock"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <LowStockTable />
      </TabsContent>
      <TabsContent
        value="pending-sales"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <PendingSalesTable filterParams={filterParams} />
      </TabsContent>
      <TabsContent
        value="partially-paid-sales"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <PartiallyPaidSalesTable filterParams={filterParams} />
      </TabsContent>
      <TabsContent
        value="fully-paid-sales"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <FullyPaidSalesTable filterParams={filterParams} />
      </TabsContent>
    </Tabs>
  )
}
