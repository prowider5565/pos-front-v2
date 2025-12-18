"use client"

import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface CartSummaryProps {
  subtotal: number
  discount: string
  total: number
  totalPayments: number
  remaining: number
  exchangeRate: number
  onDiscountChange: (discount: string) => void
}

export function CartSummary({
  subtotal,
  discount,
  total,
  totalPayments,
  remaining,
  exchangeRate,
  onDiscountChange,
}: CartSummaryProps) {
  const { t } = useTranslation('sales')

  const formatAmount = (amount: number) => ({
    uzs: amount.toLocaleString(),
    usd: (amount / exchangeRate).toFixed(2),
  })

  const subtotalFormatted = formatAmount(subtotal)
  const totalFormatted = formatAmount(total)
  const paymentsFormatted = formatAmount(totalPayments)
  const remainingFormatted = formatAmount(remaining)

  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('cart.subtotal')}:</span>
        <div className="text-right">
          <div className="font-semibold">{subtotalFormatted.uzs} UZS</div>
          <div className="text-xs text-muted-foreground">${subtotalFormatted.usd}</div>
        </div>
      </div>

      {/* Discount */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t('discount.label')}</Label>
        <Input
          type="number"
          min="0"
          max={subtotal}
          step="1000"
          value={discount}
          onChange={(e) => onDiscountChange(e.target.value)}
          placeholder={t('discount.placeholder')}
          className="h-9"
        />
      </div>

      <Separator />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="font-semibold">{t('cart.total')}:</span>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{totalFormatted.uzs} UZS</div>
          <div className="text-sm text-muted-foreground">${totalFormatted.usd}</div>
        </div>
      </div>

      {/* Payments */}
      {totalPayments > 0 && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('cart.payments')}:</span>
            <div className="text-right">
              <div className="font-semibold text-green-600">{paymentsFormatted.uzs} UZS</div>
              <div className="text-xs text-muted-foreground">${paymentsFormatted.usd}</div>
            </div>
          </div>

          <Separator />

          {/* Remaining */}
          <div className="flex items-center justify-between">
            <span className="font-semibold">{t('cart.remaining')}:</span>
            <div className="text-right">
              <div className={`text-lg font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {remainingFormatted.uzs} UZS
              </div>
              <div className="text-sm text-muted-foreground">${remainingFormatted.usd}</div>
            </div>
          </div>
        </>
      )}

      {/* Exchange Rate Info */}
      <div className="pt-2 text-xs text-muted-foreground text-center">
        {t('summary.exchangeRate')}: 1 USD = {exchangeRate.toLocaleString()} UZS
      </div>
    </div>
  )
}
