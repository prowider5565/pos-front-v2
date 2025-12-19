"use client"

import { useTranslation } from "react-i18next"

interface CartSummaryProps {
  subtotal: number
  exchangeRate: number
}

export function CartSummary({
  subtotal,
  exchangeRate,
}: CartSummaryProps) {
  const { t } = useTranslation('sales')

  const formatUZS = (amount: number) => amount.toLocaleString()
  const formatUSD = (amountUZS: number) => (amountUZS / exchangeRate).toFixed(2)

  return (
    <div className="space-y-2">
      {/* Subtotal display only (final total moved to footer) */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">{t('cart.subtotal')}</div>
        <div className="font-semibold">
          {formatUZS(subtotal)} UZS (${formatUSD(subtotal)})
        </div>
      </div>
    </div>
  )
}
