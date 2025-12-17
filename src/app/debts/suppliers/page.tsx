import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from './components/data-table'
import { SummaryCards } from './components/summary-cards'
import { useNewSupplierDebts, useOldSupplierDebts } from '@/hooks/use-debts'

export default function SupplierDebtsPage() {
  const { t } = useTranslation('debts')
  const [activeTab, setActiveTab] = useState<'new' | 'old'>('new')
  
  const [newPage, setNewPage] = useState(1)
  const [newSearch, setNewSearch] = useState('')
  const [oldPage, setOldPage] = useState(1)
  const [oldSearch, setOldSearch] = useState('')

  const newDebts = useNewSupplierDebts(newPage, newSearch)
  const oldDebts = useOldSupplierDebts(oldPage, oldSearch)

  const currentData = activeTab === 'new' ? newDebts : oldDebts

  return (
    <BaseLayout
      title={t('suppliers.title')}
      description={t('suppliers.description')}
    >
      <div className="px-4 lg:px-6 space-y-6">
        <SummaryCards metadata={currentData.data?.metadata} isLoading={currentData.isLoading} />
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'old')}>
          <TabsContent value="new" className="mt-0 space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">{t('tabs.newDebts')}</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">{t('tabs.oldDebts')}</TabsTrigger>
            </TabsList>
            <DataTable
              data={newDebts.data}
              isLoading={newDebts.isLoading}
              page={newPage}
              search={newSearch}
              onPageChange={setNewPage}
              onSearchChange={setNewSearch}
            />
          </TabsContent>
          
          <TabsContent value="old" className="mt-0 space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">{t('tabs.newDebts')}</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">{t('tabs.oldDebts')}</TabsTrigger>
            </TabsList>
            <DataTable
              data={oldDebts.data}
              isLoading={oldDebts.isLoading}
              page={oldPage}
              search={oldSearch}
              onPageChange={setOldPage}
              onSearchChange={setOldSearch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </BaseLayout>
  )
}
