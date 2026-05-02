import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Search, CreditCard, History } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { Skeleton } from '@/components/ui/skeleton'
import { BulkPaymentDialog } from '@/components/bulk-payment-dialog'
import { SalePaymentDialog } from '@/components/sale-payment-dialog'
import { ClientSalePaymentDialog } from '@/components/client-sale-payment-dialog'
import { PaymentHistoryDialog } from '@/components/payment-history-dialog'
import { TBAPaymentsDialog } from '@/components/tba-payments-dialog'
import type { ClientDebt, ClientDebtsResponse } from '@/types/debts'

interface DataTableProps {
  data?: ClientDebtsResponse
  isLoading: boolean
  page?: number
  search: string
  debtType: 'sale' | 'old'
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
  onPaymentSuccess?: () => void
}

function formatCurrency(uzs: string, usd: string) {
  const uzsNum = parseFloat(uzs)
  const usdNum = parseFloat(usd)
  const parts = []
  if (uzsNum !== 0) parts.push(`${uzsNum.toLocaleString()} UZS`)
  if (usdNum !== 0) parts.push(`$${usdNum.toLocaleString()}`)
  return parts.length > 0 ? parts.join(' / ') : '—'
}

function formatDate(dateString?: string) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface GroupedClientDebt {
  clientId: number
  clientName: string
  phoneNumber: string
  totalDebtUzs: number
  totalDebtUsd: number
  totalPaidUzs: number
  totalPaidUsd: number
  totalRemainingUzs: number
  totalRemainingUsd: number
  saleDebts: ClientDebt[]
  latestCreatedAt?: string
}

function groupSaleDebtsByClient(debts: ClientDebt[]): GroupedClientDebt[] {
  const grouped = new Map<number, GroupedClientDebt>()

  debts.forEach(debt => {
    const clientId = debt.client || debt.id
    const clientName = debt.client_full_name || debt.full_name || `Client #${clientId}`
    const phoneNumber = debt.client_phone_number || debt.phone_number || '—'

    if (!grouped.has(clientId)) {
      grouped.set(clientId, {
        clientId,
        clientName,
        phoneNumber,
        totalDebtUzs: 0,
        totalDebtUsd: 0,
        totalPaidUzs: 0,
        totalPaidUsd: 0,
        totalRemainingUzs: 0,
        totalRemainingUsd: 0,
        saleDebts: [],
        latestCreatedAt: debt.created_at
      })
    }

    const group = grouped.get(clientId)!
    group.totalDebtUzs += parseFloat(debt.debt_amounts.total_debt.uzs_amount)
    group.totalDebtUsd += parseFloat(debt.debt_amounts.total_debt.usd_amount)
    group.totalPaidUzs += parseFloat(debt.debt_amounts.total_paid.uzs_amount)
    group.totalPaidUsd += parseFloat(debt.debt_amounts.total_paid.usd_amount)
    group.totalRemainingUzs += parseFloat(debt.debt_amounts.total_remaining.uzs_amount)
    group.totalRemainingUsd += parseFloat(debt.debt_amounts.total_remaining.usd_amount)
    group.saleDebts.push(debt)

    // Update latest created_at
    if (debt.created_at && (!group.latestCreatedAt || debt.created_at > group.latestCreatedAt)) {
      group.latestCreatedAt = debt.created_at
    }
  })

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.latestCreatedAt && b.latestCreatedAt) {
      return new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
    }
    return a.clientName.localeCompare(b.clientName)
  })
}

export function DataTable({ data, isLoading, page: _page, search, debtType, onPageChange, onSearchChange, onPaymentSuccess }: DataTableProps) {
  const { t } = useTranslation('debts')
  const navigate = useNavigate()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [tbaDialogOpen, setTbaDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientDebt | null>(null)
  const [selectedGroupedClient, setSelectedGroupedClient] = useState<GroupedClientDebt | null>(null)

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    onPageChange(1)
  }

  const handleMakePayment = (e: React.MouseEvent, client: ClientDebt) => {
    e.stopPropagation()
    setSelectedClient(client)
    setPaymentDialogOpen(true)
  }

  const handleViewTBA = (e: React.MouseEvent, client: ClientDebt) => {
    e.stopPropagation()
    setSelectedClient(client)
    setTbaDialogOpen(true)
  }

  const handleRowClick = (client: ClientDebt, groupedClient?: GroupedClientDebt) => {
    if (debtType === 'old') {
      // Navigate to old debts detail page for this client
      const clientId = client.client || client.id
      navigate(`/debts/clients/${clientId}/old-debts`)
    } else {
      // Show payment history dialog for sale debts
      if (groupedClient) {
        // For grouped clients, show all payments for all their sales
        setSelectedGroupedClient(groupedClient)
        setHistoryDialogOpen(true)
      } else {
        // For individual sales (fallback)
        setSelectedClient(client)
        setHistoryDialogOpen(true)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search.clientPlaceholder')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {debtType === 'sale' && <TableHead>{t('table.date')}</TableHead>}
              <TableHead>{t('table.client')}</TableHead>
              <TableHead>{t('table.phone')}</TableHead>
              <TableHead>{t('table.totalDebt')}</TableHead>
              <TableHead>{t('table.totalPaid')}</TableHead>
              <TableHead>{t('table.remaining')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: debtType === 'sale' ? 7 : 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={debtType === 'sale' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  {t('table.noResults')}
                </TableCell>
              </TableRow>
            ) : debtType === 'sale' && data ? (
              // Grouped sale debts by client
              groupSaleDebtsByClient(data.results).map((groupedClient) => {
                const remaining = groupedClient.totalRemainingUzs + groupedClient.totalRemainingUsd
                return (
                  <TableRow key={groupedClient.clientId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(groupedClient.saleDebts[0], groupedClient)}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(groupedClient.latestCreatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {groupedClient.clientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {groupedClient.phoneNumber}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(groupedClient.totalDebtUzs.toString(), groupedClient.totalDebtUsd.toString())}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(groupedClient.totalPaidUzs.toString(), groupedClient.totalPaidUsd.toString())}
                    </TableCell>
                    <TableCell>
                      <span className={remaining > 0 ? 'text-destructive font-medium' : remaining < 0 ? 'text-green-600 font-medium' : ''}>
                        {formatCurrency(groupedClient.totalRemainingUzs.toString(), groupedClient.totalRemainingUsd.toString())}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {remaining > 0 && (
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation()
                            setSelectedGroupedClient(groupedClient)
                            setPaymentDialogOpen(true)
                          }}>
                            <CreditCard className="h-4 w-4 mr-1" />
                            {t('actions.makePayment')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              // Old debts - individual rows
              data?.results.map((client) => {
                const remaining = parseFloat(client.debt_amounts.total_remaining.uzs_amount) + parseFloat(client.debt_amounts.total_remaining.usd_amount)
                return (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(client)}>
                    <TableCell>
                      <div className="font-medium">
                        {client.full_name || `Client #${client.client || client.id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone_number || '—'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(client.debt_amounts.total_debt.uzs_amount, client.debt_amounts.total_debt.usd_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(client.debt_amounts.total_paid.uzs_amount, client.debt_amounts.total_paid.usd_amount)}
                    </TableCell>
                    <TableCell>
                      <span className={remaining > 0 ? 'text-destructive font-medium' : remaining < 0 ? 'text-green-600 font-medium' : ''}>
                        {formatCurrency(client.debt_amounts.total_remaining.uzs_amount, client.debt_amounts.total_remaining.usd_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={(e) => handleViewTBA(e, client)}>
                          <History className="h-4 w-4 mr-1" />
                          {t('actions.paymentHistory')}
                        </Button>
                        {remaining > 0 && (
                          <Button size="sm" variant="outline" onClick={(e) => handleMakePayment(e, client)}>
                            <CreditCard className="h-4 w-4 mr-1" />
                            {t('actions.makePayment')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.count > 0 && (
        <PaginationControls
          currentPage={data.current_page}
          totalCount={data.count}
          hasNext={!!data.next}
          hasPrevious={!!data.previous}
          onPageChange={onPageChange}
        />
      )}

      {selectedClient && debtType === 'sale' && (
        <SalePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          saleId={selectedClient.id}
          clientName={selectedClient.full_name || `Client #${selectedClient.client || selectedClient.id}`}
          debtUzs={parseFloat(selectedClient.debt_amounts.total_remaining.uzs_amount)}
          debtUsd={parseFloat(selectedClient.debt_amounts.total_remaining.usd_amount)}
          onSuccess={onPaymentSuccess}
        />
      )}

      {selectedClient && debtType === 'old' && (
        <BulkPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          type="old-client"
          entityId={selectedClient.client || selectedClient.id}
          entityName={selectedClient.full_name || `Client #${selectedClient.client || selectedClient.id}`}
          remainingUzs={selectedClient.debt_amounts.total_remaining.uzs_amount}
          remainingUsd={selectedClient.debt_amounts.total_remaining.usd_amount}
          onSuccess={onPaymentSuccess}
        />
      )}

      {selectedClient && debtType === 'sale' && !selectedGroupedClient && (
        <PaymentHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          type="sale"
          entityId={selectedClient.id}
          entityName={selectedClient.full_name || `Client #${selectedClient.client || selectedClient.id}`}
        />
      )}

      {selectedGroupedClient && debtType === 'sale' && (
        <PaymentHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          type="client-sales"
          entityId={selectedGroupedClient.clientId}
          entityName={selectedGroupedClient.clientName}
          saleIds={selectedGroupedClient.saleDebts.map(debt => debt.id)}
        />
      )}

      {selectedClient && debtType === 'old' && (
        <TBAPaymentsDialog
          open={tbaDialogOpen}
          onOpenChange={setTbaDialogOpen}
          type="old-client"
          entityId={selectedClient.client || selectedClient.id}
          entityName={selectedClient.full_name || `Client #${selectedClient.client || selectedClient.id}`}
        />
      )}

      {selectedGroupedClient && debtType === 'sale' && (
        <ClientSalePaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          clientName={selectedGroupedClient.clientName}
          saleDebts={selectedGroupedClient.saleDebts}
          onSuccess={onPaymentSuccess}
        />
      )}
    </div>
  )
}
