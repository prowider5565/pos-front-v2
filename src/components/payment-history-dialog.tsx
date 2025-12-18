"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { paymentsService, type PaymentRecord, type SalePaymentRecord } from "@/services/payments.service"

type HistoryType = 'new-supplier' | 'old-supplier' | 'old-client' | 'sale'

interface PaymentHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: HistoryType
  entityId: number
  entityName: string
}

export function PaymentHistoryDialog({ open, onOpenChange, type, entityId, entityName }: PaymentHistoryDialogProps) {
  const { t } = useTranslation('debts')
  const [isLoading, setIsLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[] | SalePaymentRecord[]>([])
  const [totalPaid, setTotalPaid] = useState<string>('')

  useEffect(() => {
    if (!open) return
    const fetchPayments = async () => {
      setIsLoading(true)
      try {
        if (type === 'sale') {
          const data = await paymentsService.getSalePayments(entityId)
          setPayments(data)
          setTotalPaid('')
        } else if (type === 'new-supplier') {
          const data = await paymentsService.getNewSupplierPayments(entityId)
          setPayments(data.payments)
          setTotalPaid(data.total_paid)
        } else if (type === 'old-supplier') {
          const data = await paymentsService.getOldSupplierPayments(entityId)
          setPayments(data.payments)
          setTotalPaid(data.total_paid)
        } else {
          const data = await paymentsService.getOldClientPayments(entityId)
          setPayments(data.payments)
          setTotalPaid(data.total_paid)
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPayments()
  }, [open, type, entityId])

  const isSaleType = type === 'sale'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('paymentHistory.title', { name: entityName })}</DialogTitle>
        </DialogHeader>

        {totalPaid && (
          <div className="text-sm text-muted-foreground">
            {t('paymentHistory.totalPaid')}: <span className="font-medium text-foreground">{parseFloat(totalPaid).toLocaleString()} UZS</span>
          </div>
        )}

        <div className="rounded-md border max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('paymentHistory.amount')}</TableHead>
                <TableHead>{t('paymentHistory.currency')}</TableHead>
                {isSaleType && <TableHead>{t('paymentHistory.method')}</TableHead>}
                {isSaleType && <TableHead>{t('paymentHistory.date')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: isSaleType ? 5 : 3 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSaleType ? 5 : 3} className="text-center py-8 text-muted-foreground">
                    {t('paymentHistory.noPayments')}
                  </TableCell>
                </TableRow>
              ) : isSaleType ? (
                (payments as SalePaymentRecord[]).map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{parseFloat(p.amount).toLocaleString()}</TableCell>
                    <TableCell>{p.currency}</TableCell>
                    <TableCell className="capitalize">{p.payment_method}</TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                (payments as PaymentRecord[]).map((p, idx) => (
                  <TableRow key={p.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      {parseFloat(p.amount_display.uzs_amount).toLocaleString()} UZS / ${parseFloat(p.amount_display.usd_amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{p.currency}</TableCell>
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
