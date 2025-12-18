import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, CreditCard } from 'lucide-react'
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
import { PaymentHistoryDialog } from '@/components/payment-history-dialog'
import type { ClientDebt, ClientDebtsResponse } from '@/types/debts'

interface DataTableProps {
  data?: ClientDebtsResponse
  isLoading: boolean
  page: number
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

export function DataTable({ data, isLoading, page, search, debtType, onPageChange, onSearchChange, onPaymentSuccess }: DataTableProps) {
  const { t } = useTranslation('debts')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientDebt | null>(null)

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    onPageChange(1)
  }

  const handleMakePayment = (e: React.MouseEvent, client: ClientDebt) => {
    e.stopPropagation()
    setSelectedClient(client)
    setPaymentDialogOpen(true)
  }

  const handleRowClick = (client: ClientDebt) => {
    setSelectedClient(client)
    setHistoryDialogOpen(true)
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
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('table.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((client) => {
                const remaining = parseFloat(client.debt_amounts.total_remaining.uzs_amount) + parseFloat(client.debt_amounts.total_remaining.usd_amount)
                return (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(client)}>
                    <TableCell>
                      <div className="font-medium">{client.full_name || `Client #${client.client || client.id}`}</div>
                    </TableCell>
                    <TableCell>{client.phone_number || '—'}</TableCell>
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
                      {remaining > 0 && (
                        <Button size="sm" variant="outline" onClick={(e) => handleMakePayment(e, client)}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          {t('actions.makePayment')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total_pages > 1 && (
        <PaginationControls
          currentPage={data.current_page}
          totalPages={data.total_pages}
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
          onSuccess={onPaymentSuccess}
        />
      )}

      {selectedClient && (
        <PaymentHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          type={debtType === 'sale' ? 'sale' : 'old-client'}
          entityId={debtType === 'sale' ? selectedClient.id : (selectedClient.client || selectedClient.id)}
          entityName={selectedClient.full_name || `Client #${selectedClient.client || selectedClient.id}`}
        />
      )}
    </div>
  )
}
