"use client"

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { debtsService } from '@/services/debts.service'
import { paymentsService } from '@/services/payments.service'
import type { DebtAmounts, SupplierDebt } from '@/types/debts'

interface PaymentsSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  debtType: 'new' | 'old'
  search?: string
  metadata?: DebtAmounts
}

interface PaymentRow {
  id: string
  supplierName: string
  companyName: string
  phoneNumber: string
  amountUzs: string
  amountUsd: string
  currency: string
  paymentMethod?: string
  createdAt?: string
}

export function PaymentsSummaryDialog({
  open,
  onOpenChange,
  debtType,
  search,
  metadata,
}: PaymentsSummaryDialogProps) {
  const { t } = useTranslation('debts')
  const [isLoading, setIsLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentRow[]>([])

  useEffect(() => {
    if (!open) return

    const fetchAllSupplierPages = async () => {
      const fetchPage = debtType === 'new' ? debtsService.getNewSupplierDebts : debtsService.getOldSupplierDebts
      const firstPage = await fetchPage({ page: 1, search })

      if (firstPage.total_pages <= 1) {
        return firstPage.results
      }

      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.total_pages - 1 }, (_, index) =>
          fetchPage({ page: index + 2, search })
        )
      )

      return firstPage.results.concat(remainingPages.flatMap((page) => page.results))
    }

    const fetchPayments = async () => {
      setIsLoading(true)
      try {
        const suppliers = await fetchAllSupplierPages()
        const uniqueSuppliers = Array.from(
          new Map(suppliers.map((supplier) => [supplier.id, supplier])).values()
        )

        const paymentResponses = await Promise.all(
          uniqueSuppliers.map(async (supplier: SupplierDebt) => {
            const response = debtType === 'new'
              ? await paymentsService.getNewSupplierPayments(supplier.id)
              : await paymentsService.getOldSupplierPayments(supplier.id)

            return response.payments.map((payment) => ({
              id: `${supplier.id}-${payment.id}`,
              supplierName: supplier.full_name || supplier.company_name,
              companyName: supplier.company_name,
              phoneNumber: supplier.phone_number,
              amountUzs: payment.amount_display.uzs_amount,
              amountUsd: payment.amount_display.usd_amount,
              currency: payment.currency,
              paymentMethod: payment.payment_method,
              createdAt: payment.created_at,
            }))
          })
        )

        const mergedPayments = paymentResponses
          .flat()
          .sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            }

            if (a.createdAt) return -1
            if (b.createdAt) return 1

            return b.id.localeCompare(a.id)
          })

        setPayments(mergedPayments)
      } catch (error) {
        console.error('Failed to fetch supplier payments summary:', error)
        setPayments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [open, debtType, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{t('summary.allPaymentsTitle')}</DialogTitle>
          <DialogDescription>
            {t('summary.allPaymentsDescription')}
          </DialogDescription>
        </DialogHeader>

        {metadata && (
          <div className="text-sm text-muted-foreground">
            {t('paymentHistory.totalPaid')}:{" "}
            <span className="font-medium text-foreground">
              {parseFloat(metadata.total_paid.uzs_amount).toLocaleString()} UZS / ${parseFloat(metadata.total_paid.usd_amount).toLocaleString()}
            </span>
          </div>
        )}

        <div className="rounded-md border max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('table.supplier')}</TableHead>
                <TableHead>{t('table.phone')}</TableHead>
                <TableHead>{t('paymentHistory.amount')}</TableHead>
                <TableHead>{t('paymentHistory.currency')}</TableHead>
                <TableHead>{t('paymentHistory.method')}</TableHead>
                <TableHead>{t('paymentHistory.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t('paymentHistory.noPayments')}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment, index) => (
                  <TableRow key={payment.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.supplierName}</div>
                        <div className="text-sm text-muted-foreground">{payment.companyName}</div>
                      </div>
                    </TableCell>
                    <TableCell>{payment.phoneNumber || '—'}</TableCell>
                    <TableCell>
                      {parseFloat(payment.amountUzs).toLocaleString()} UZS / ${parseFloat(payment.amountUsd).toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.currency}</TableCell>
                    <TableCell>{payment.paymentMethod || '—'}</TableCell>
                    <TableCell>
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
