import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
import { PaymentHistoryDialog } from '@/components/payment-history-dialog'
import type { PaymentType } from '@/services/payments.service'
import type { SupplierDebt, SupplierDebtsResponse } from '@/types/debts'

interface DataTableProps {
  data?: SupplierDebtsResponse
  isLoading: boolean
  page?: number
  search: string
  debtType: 'new' | 'old'
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
  const navigate = useNavigate()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDebt | null>(null)

  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    onPageChange(1)
  }

  const handleMakePayment = (e: React.MouseEvent, supplier: SupplierDebt) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setPaymentDialogOpen(true)
  }

  const handleRowClick = (supplier: SupplierDebt) => {
    if (debtType === 'old') {
      // Navigate to old debts detail page for this supplier
      const supplierId = supplier.supplier || supplier.id
      navigate(`/debts/suppliers/${supplierId}/old-debts`)
    } else {
      // Show payment history dialog for new debts
      setSelectedSupplier(supplier)
      setHistoryDialogOpen(true)
    }
  }

  const paymentType: PaymentType = debtType === 'new' ? 'new-supplier' : 'old-supplier'

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search.placeholder')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.supplier')}</TableHead>
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
              data?.results.map((supplier) => {
                const remaining = parseFloat(supplier.debt_amounts.total_remaining.uzs_amount) + parseFloat(supplier.debt_amounts.total_remaining.usd_amount)
                return (
                  <TableRow key={supplier.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(supplier)}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.full_name}</div>
                        <div className="text-sm text-muted-foreground">{supplier.company_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.phone_number}</TableCell>
                    <TableCell>
                      {formatCurrency(supplier.debt_amounts.total_debt.uzs_amount, supplier.debt_amounts.total_debt.usd_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(supplier.debt_amounts.total_paid.uzs_amount, supplier.debt_amounts.total_paid.usd_amount)}
                    </TableCell>
                    <TableCell>
                      <span className={remaining > 0 ? 'text-destructive font-medium' : remaining < 0 ? 'text-green-600 font-medium' : ''}>
                        {formatCurrency(supplier.debt_amounts.total_remaining.uzs_amount, supplier.debt_amounts.total_remaining.usd_amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {remaining > 0 && (
                        <Button size="sm" variant="outline" onClick={(e) => handleMakePayment(e, supplier)}>
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

      {data && data.count > 0 && (
        <PaginationControls
          currentPage={data.current_page}
          totalCount={data.count}
          hasNext={!!data.next}
          hasPrevious={!!data.previous}
          onPageChange={onPageChange}
        />
      )}

      {selectedSupplier && (
        <BulkPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          type={paymentType}
          entityId={selectedSupplier.id}
          entityName={selectedSupplier.full_name || selectedSupplier.company_name}
          onSuccess={onPaymentSuccess}
        />
      )}

      {selectedSupplier && (
        <PaymentHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          type={debtType === 'new' ? 'new-supplier' : 'old-supplier'}
          entityId={selectedSupplier.id}
          entityName={selectedSupplier.full_name || selectedSupplier.company_name}
        />
      )}
    </div>
  )
}
