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
import type { SupplierDebt, SupplierDebtsResponse } from '@/types/debts'

interface DataTableProps {
  data?: SupplierDebtsResponse
  isLoading: boolean
  page: number
  search: string
  onPageChange: (page: number) => void
  onSearchChange: (search: string) => void
}

function formatCurrency(uzs: string, usd: string) {
  const uzsNum = parseFloat(uzs)
  const usdNum = parseFloat(usd)
  const parts = []
  if (uzsNum !== 0) parts.push(`${uzsNum.toLocaleString()} UZS`)
  if (usdNum !== 0) parts.push(`$${usdNum.toLocaleString()}`)
  return parts.length > 0 ? parts.join(' / ') : '—'
}

export function DataTable({ data, isLoading, page, search, onPageChange, onSearchChange }: DataTableProps) {
  const { t } = useTranslation('debts')
  const [searchInput, setSearchInput] = useState(search)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(searchInput)
    onPageChange(1)
  }

  const handleMakePayment = (supplier: SupplierDebt) => {
    console.log('Make payment for:', supplier.id)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t('common:buttons.search')}
        </Button>
      </form>

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
                  <TableRow key={supplier.id}>
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
                        <Button size="sm" variant="outline" onClick={() => handleMakePayment(supplier)}>
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
    </div>
  )
}
