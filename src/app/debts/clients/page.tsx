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
import { useSaleClientDebts, useOldClientDebts } from '@/hooks/use-debts'
import { clientsService } from '@/services/clients.service'

export default function ClientDebtsPage() {
  const { t } = useTranslation('debts')
  const [activeTab, setActiveTab] = useState<'sale' | 'old'>('sale')
  
  const [salePage, setSalePage] = useState(1)
  const [saleSearch, setSaleSearch] = useState('')
  const [saleDebouncedSearch, setSaleDebouncedSearch] = useState('')
  const [oldPage, setOldPage] = useState(1)
  const [oldSearch, setOldSearch] = useState('')
  const [oldDebouncedSearch, setOldDebouncedSearch] = useState('')

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [addDebtDialogOpen, setAddDebtDialogOpen] = useState(false)

  // Debounce sale search
  useEffect(() => {
    const timer = setTimeout(() => setSaleDebouncedSearch(saleSearch), 400)
    return () => clearTimeout(timer)
  }, [saleSearch])

  // Debounce old search
  useEffect(() => {
    const timer = setTimeout(() => setOldDebouncedSearch(oldSearch), 400)
    return () => clearTimeout(timer)
  }, [oldSearch])

  const saleDebts = useSaleClientDebts(salePage, saleDebouncedSearch)
  const oldDebts = useOldClientDebts(oldPage, oldDebouncedSearch)

  const currentData = activeTab === 'sale' ? saleDebts : oldDebts

  // Fetch clients list for the selector
  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => clientsService.getClients(1, 1000), // Get all clients
  })

  const selectedClient = clientsData?.results.find(c => c.id === selectedClientId)

  const handleAddOldDebt = () => {
    if (!selectedClientId) return
    setAddDebtDialogOpen(true)
  }

  return (
    <BaseLayout
      title={t('clients.title')}
      description={t('clients.description')}
    >
      <div className="px-4 lg:px-6 space-y-6">
        <SummaryCards metadata={currentData.data?.metadata} isLoading={currentData.isLoading} />
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sale' | 'old')}>
          <TabsContent value="sale" className="mt-0 space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="sale" className="flex-1">{t('tabs.saleDebts')}</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">{t('tabs.oldDebts')}</TabsTrigger>
            </TabsList>
            <DataTable
              data={saleDebts.data}
              isLoading={saleDebts.isLoading}
              page={salePage}
              search={saleSearch}
              debtType="sale"
              onPageChange={setSalePage}
              onSearchChange={setSaleSearch}
              onPaymentSuccess={() => saleDebts.refetch()}
            />
          </TabsContent>
          
          <TabsContent value="old" className="mt-0 space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="sale" className="flex-1">{t('tabs.saleDebts')}</TabsTrigger>
              <TabsTrigger value="old" className="flex-1">{t('tabs.oldDebts')}</TabsTrigger>
            </TabsList>
            
            {/* Client selector + Add Old Debt button */}
            <div className="flex items-center gap-3">
              <Select
                value={selectedClientId?.toString() || ""}
                onValueChange={(value) => setSelectedClientId(Number(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={t('addOldDebt.selectClient')} />
                </SelectTrigger>
                <SelectContent>
                  {clientsData?.results.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.full_name} ({client.phone_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddOldDebt}
                disabled={!selectedClientId}
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

        {selectedClient && (
          <AddOldDebtDialog
            open={addDebtDialogOpen}
            onOpenChange={setAddDebtDialogOpen}
            entityType="client"
            entityId={selectedClient.id}
            entityName={selectedClient.full_name}
            onSuccess={() => oldDebts.refetch()}
          />
        )}
      </div>
    </BaseLayout>
  )
}
