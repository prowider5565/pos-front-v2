import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { History } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { paymentsService } from "@/services/payments.service"
import type { TBAPaymentRecord } from "@/services/payments.service"

type TBAType = 'old-client' | 'old-supplier' | 'new-supplier'

interface TBAPaymentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: TBAType
  entityId: number
  entityName: string
}

export function TBAPaymentsDialog({ open, onOpenChange, type, entityId, entityName }: TBAPaymentsDialogProps) {
  const { t } = useTranslation('debts')

  const { data: tbaPayments, isLoading } = useQuery<TBAPaymentRecord[]>({
    queryKey: ['tba-payments', type, entityId],
    queryFn: () => {
      if (type === 'old-client') {
        return paymentsService.getOldClientDebtTBA(entityId)
      } else if (type === 'old-supplier') {
        return paymentsService.getOldSupplierDebtTBA(entityId)
      } else {
        return paymentsService.getNewSupplierDebtTBA(entityId)
      }
    },
    enabled: open && !!entityId,
  })

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount)
    if (currency === 'UZS') {
      return `${num.toLocaleString()} UZS`
    } else {
      return `$${num.toLocaleString()}`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return t('oldDebtPayment.methods.cash')
      case 'CARD':
        return t('oldDebtPayment.methods.card')
      case 'TRANSFER':
      case 'BANK_ACCOUNT':
        return t('oldDebtPayment.methods.transfer')
      default:
        return method
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('tbaPayments.title')}
          </DialogTitle>
          <DialogDescription>
            {t('tbaPayments.description', { name: entityName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !tbaPayments || tbaPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('tbaPayments.noPayments')}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tbaPayments.columns.id')}</TableHead>
                    <TableHead>{t('tbaPayments.columns.amount')}</TableHead>
                    <TableHead>{t('tbaPayments.columns.currency')}</TableHead>
                    <TableHead>{t('tbaPayments.columns.method')}</TableHead>
                    <TableHead>{t('tbaPayments.columns.date')}</TableHead>
                    <TableHead className="text-right">{t('tbaPayments.columns.distributed')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tbaPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.currency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPaymentMethodLabel(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={payment.distributed_payments_count > 0 ? "default" : "outline"}>
                          {t('tbaPayments.distributedCount', { count: payment.distributed_payments_count })}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('tbaPayments.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
