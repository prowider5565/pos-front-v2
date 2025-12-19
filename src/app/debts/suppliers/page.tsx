import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from './components/data-table'
import { SummaryCards } from './components/summary-cards'
import { AddOldDebtDialog } from '@/components/add-old-debt-dialog'
import { useNewSupplierDebts, useOldSupplierDebts } from '@/hooks/use-debts'
import { suppliersService } from '@/services/suppliers.service'

export default function SupplierDebtsPage() {
  const { t } = useTranslation('debts')
  const [activeTab, setActiveTab] = useState<'new' | 'old'>('new')
  
  const [newPage, setNewPage] = useState(1)
  const [newSearch, setNewSearch] = useState('')
  const [newDebouncedSearch, setNewDebouncedSearch] = useState('')
  const [oldPage, setOldPage] = useState(1)
  const [oldSearch, setOldSearch] = useState('')
  const [oldDebouncedSearch, setOldDebouncedSearch] = useState('')

  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)
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

  // Fetch suppliers list for the selector
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersService.listSuppliers({ is_active: true }),
  })

  const selectedSupplier = suppliersData?.results.find(s => s.id === selectedSupplierId)

  const handleAddOldDebt = () => {
    if (!selectedSupplierId) return
    setAddDebtDialogOpen(true)
  }

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
            
            {/* Supplier selector + Add Old Debt button */}
            <div className="flex items-center gap-3">
              <Select
                value={selectedSupplierId?.toString() || ""}
                onValueChange={(value) => setSelectedSupplierId(Number(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={t('addOldDebt.selectSupplier')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliersData?.results.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.full_name} {supplier.company_name ? `(${supplier.company_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddOldDebt}
                disabled={!selectedSupplierId}
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

        {selectedSupplier && (
          <AddOldDebtDialog
            open={addDebtDialogOpen}
            onOpenChange={setAddDebtDialogOpen}
            entityType="supplier"
            entityId={selectedSupplier.id}
            entityName={selectedSupplier.full_name || selectedSupplier.company_name}
            onSuccess={() => oldDebts.refetch()}
          />
        )}
      </div>
    </BaseLayout>
  )
}
