import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { DataTable } from './components/data-table'
import { SummaryCards } from './components/summary-cards'
import { AddOldDebtDialog } from '@/components/add-old-debt-dialog'
import { useNewSupplierDebts, useOldSupplierDebts } from '@/hooks/use-debts'

export default function SupplierDebtsPage() {
  const { t } = useTranslation('debts')
  const [activeTab, setActiveTab] = useState<'new' | 'old'>('new')
  
  const [newPage, setNewPage] = useState(1)
  const [newSearch, setNewSearch] = useState('')
  const [newDebouncedSearch, setNewDebouncedSearch] = useState('')
  const [oldPage, setOldPage] = useState(1)
  const [oldSearch, setOldSearch] = useState('')
  const [oldDebouncedSearch, setOldDebouncedSearch] = useState('')

  const [addDebtDialogOpen, setAddDebtDialogOpen] = useState(false)

  // Debounce new search
  useEffect(() => {
    const timer = setTimeout(() => setNewDebouncedSearch(newSearch), 400)
    return () => clearTimeout(timer)
  }, [newSearch])

  // Debounce old search
  useEffect(() => {
    const timer = setTimeout(() => setOldDebouncedSearch(oldSearch), 400)
    return () => clearTimeout(timer)
  }, [oldSearch])

  const newDebts = useNewSupplierDebts(newPage, newDebouncedSearch)
  const oldDebts = useOldSupplierDebts(oldPage, oldDebouncedSearch)

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
              debtType="new"
              onPageChange={setNewPage}
              onSearchChange={setNewSearch}
              onPaymentSuccess={() => newDebts.refetch()}
            />
          </TabsContent>
          
          <TabsContent value="old" className="mt-0 space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">{t('tabs.newDebts')}</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">{t('tabs.oldDebts')}</TabsTrigger>
            </TabsList>
            
            {/* Add Old Debt button */}
            <div className="flex items-center justify-end">
              <Button
                onClick={() => setAddDebtDialogOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addOldDebt.button')}
              </Button>
            </div>

            <DataTable
              data={oldDebts.data}
              isLoading={oldDebts.isLoading}
              page={oldPage}
              search={oldSearch}
              debtType="old"
              onPageChange={setOldPage}
              onSearchChange={setOldSearch}
              onPaymentSuccess={() => oldDebts.refetch()}
            />
          </TabsContent>
        </Tabs>

        <AddOldDebtDialog
          open={addDebtDialogOpen}
          onOpenChange={setAddDebtDialogOpen}
          entityType="supplier"
          onSuccess={() => oldDebts.refetch()}
        />
      </div>
    </BaseLayout>
  )
}
