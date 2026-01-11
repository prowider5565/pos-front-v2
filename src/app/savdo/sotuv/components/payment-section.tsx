"use client"

import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PaymentEntry, PaymentMethod, Currency } from "@/types/sales"

interface PaymentSectionProps {
  payments: PaymentEntry[]
  onAddPayment: (method: PaymentMethod, currency: Currency, amount: string) => void
  onRemovePayment: (paymentId: string) => void
  // Controlled pending payment state
  pendingMethod: PaymentMethod
  pendingCurrency: Currency
  pendingAmount: string
  onPendingMethodChange: (method: PaymentMethod) => void
  onPendingCurrencyChange: (currency: Currency) => void
  onPendingAmountChange: (amount: string) => void
}

export function PaymentSection({
  payments,
  onAddPayment,
  onRemovePayment,
  pendingMethod,
  pendingCurrency,
  pendingAmount,
  onPendingMethodChange,
  onPendingCurrencyChange,
  onPendingAmountChange,
}: PaymentSectionProps) {
  const { t } = useTranslation('sales')

  const handleAddPayment = () => {
    if (!pendingAmount || parseFloat(pendingAmount) <= 0) {
      return
    }
    
    onAddPayment(pendingMethod, pendingCurrency, pendingAmount)
    onPendingAmountChange('')
  }

  const formatAmount = (amount: string, currency: Currency) => {
    const num = parseFloat(amount)
    if (Number.isNaN(num)) return amount
    return currency === 'UZS' ? num.toLocaleString() : num.toFixed(2)
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{t('payment.title')}</h3>
      
      {/* Existing payments list (inline, not cards) */}
      {payments.length > 0 && (
        <div className="space-y-1">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between text-sm py-1 px-2 rounded border bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatAmount(payment.amount, payment.currency)} {payment.currency}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`payment.methods.${payment.method}`)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemovePayment(payment.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Horizontal add row: amount | currency | method | + (Enter works from any field) */}
      <div
        className="flex items-end gap-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAddPayment()
          }
        }}
      >
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={pendingAmount}
            onChange={(e) => onPendingAmountChange(e.target.value)}
            placeholder={t('payment.amount')}
            className="h-9"
          />
        </div>
        <Select value={pendingCurrency} onValueChange={(value) => onPendingCurrencyChange(value as Currency)}>
          <SelectTrigger className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UZS">UZS</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pendingMethod} onValueChange={(value) => onPendingMethodChange(value as PaymentMethod)}>
          <SelectTrigger className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">{t('payment.methods.CASH')}</SelectItem>
            <SelectItem value="CARD">{t('payment.methods.CARD')}</SelectItem>
            <SelectItem value="BANK_TRANSFER">{t('payment.methods.BANK_TRANSFER')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={handleAddPayment}
          disabled={!pendingAmount || parseFloat(pendingAmount) <= 0}
          size="sm"
          className="h-9 w-9 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
