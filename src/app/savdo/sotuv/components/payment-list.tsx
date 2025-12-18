"use client"

import { useTranslation } from "react-i18next"
import { Trash2, CreditCard, Banknote, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PaymentEntry } from "@/types/sales"

interface PaymentListProps {
  payments: PaymentEntry[]
  exchangeRate: number
  onRemovePayment: (paymentId: string) => void
}

export function PaymentList({ payments, exchangeRate, onRemovePayment }: PaymentListProps) {
  const { t } = useTranslation('sales')

  if (payments.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">{t('payment.noPayments')}</p>
      </div>
    )
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <Building2 className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => {
        const amount = parseFloat(payment.amount) || 0
        const amountInUZS = payment.currency === 'USD' ? amount * exchangeRate : amount
        const amountInUSD = payment.currency === 'USD' ? amount : amount / exchangeRate

        return (
          <Card key={payment.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(payment.method)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t(`payment.methods.${payment.method}`)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {payment.currency}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {amount.toLocaleString()} {payment.currency}
                        </span>
                        {payment.currency === 'USD' && (
                          <span className="text-xs text-muted-foreground">
                            ≈ {amountInUZS.toLocaleString()} UZS
                          </span>
                        )}
                        {payment.currency === 'UZS' && (
                          <span className="text-xs text-muted-foreground">
                            ≈ ${amountInUSD.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => onRemovePayment(payment.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
