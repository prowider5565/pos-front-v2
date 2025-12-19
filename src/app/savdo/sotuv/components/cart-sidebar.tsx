"use client"

import { useTranslation } from "react-i18next"
import { ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { CartItem } from "./cart-item"
import { PaymentSection } from "./payment-section"
import { ClientSelector } from "./client-selector"
import type { CartItem as CartItemType, PaymentEntry, PaymentMethod, Currency } from "@/types/sales"

interface CartSidebarProps {
  cartItems: CartItemType[]
  payments: PaymentEntry[]

  total: number
  isTotalInvalid: boolean
  finalTotalUZS: string
  onFinalTotalChange: (value: string) => void

  notes: string
  onNotesChange: (value: string) => void

  selectedClientId: number | null
  exchangeRate: number
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
  onAddPayment: (method: PaymentMethod, currency: Currency, amount: string) => void
  onRemovePayment: (paymentId: string) => void
  onClientSelect: (clientId: number | null) => void
  onSubmit: () => void
  onSubmitAndPrint: () => void
  isSubmitting: boolean
}

export function CartSidebar({
  cartItems,
  payments,
  total,
  isTotalInvalid,
  finalTotalUZS,
  onFinalTotalChange,
  notes,
  onNotesChange,
  selectedClientId,
  exchangeRate,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddPayment,
  onRemovePayment,
  onClientSelect,
  onSubmit,
  onSubmitAndPrint,
  isSubmitting,
}: CartSidebarProps) {
  const { t } = useTranslation('sales')

  const totalPayments = payments.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount) || 0
    return sum + (payment.currency === 'USD' ? amount * exchangeRate : amount)
  }, 0)

  const remaining = Math.max(0, total - totalPayments)
  const hasStockErrors = cartItems.some(item => item.quantity > item.product.quantity)

  return (
    <Sidebar
      side="right"
      variant="sidebar"
      collapsible="none"
      className="border-l w-[480px] h-svh flex flex-col"
    >
      <SidebarHeader className="flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('cart.title')} ({cartItems.length})</h3>
          </div>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('actions.clearCart')}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 min-h-0 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{t('cart.empty')}</h3>
            <p className="text-sm text-muted-foreground">{t('cart.emptyDescription')}</p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            {/* Cart Items Table - scrolls together with the rest */}
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs">
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-center p-2 font-medium w-[120px]">Quantity</th>
                    <th className="text-right p-2 font-medium w-[100px]">Total</th>
                    <th className="w-[40px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.product.id}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemove={onRemoveItem}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Client selection */}
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientSelect={onClientSelect}
              hasRemaining={remaining > 0}
            />

            {/* Inline error: client required when debt exists */}
            {remaining > 0 && !selectedClientId && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                {t('validation.clientRequired')}
              </div>
            )}

            {/* Optional comment */}
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={t('comment.placeholder')}
              className="min-h-10"
            />

            <Separator />

            {/* Payment Section */}
            <PaymentSection
              payments={payments}
              onAddPayment={onAddPayment}
              onRemovePayment={onRemovePayment}
            />

          </div>
        )}
      </SidebarContent>

      {/* Pinned footer: Total Summary + Submit Buttons */}
      {cartItems.length > 0 && (
        <SidebarFooter className="border-t bg-background px-4 py-3 space-y-3">
          {/* Total Summary: Total (editable) / Paid / Remaining (UZS + USD, 1.7x larger) */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Total - Editable (UZS and USD both editable, synced) */}
            <div className="rounded-md border px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground uppercase mb-1">{t('cart.total')}</div>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={finalTotalUZS}
                onChange={(e) => onFinalTotalChange(e.target.value)}
                aria-invalid={isTotalInvalid}
                className={
                  "h-8 text-base font-bold p-1 text-center " +
                  (isTotalInvalid ? "border-destructive focus-visible:ring-destructive/30" : "")
                }
                placeholder="UZS"
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={0.01}
                value={(total / exchangeRate).toFixed(2)}
                onChange={(e) => {
                  const usdValue = parseFloat(e.target.value)
                  if (!Number.isNaN(usdValue)) {
                    const uzsValue = usdValue * exchangeRate
                    onFinalTotalChange(uzsValue.toString())
                  }
                }}
                aria-invalid={isTotalInvalid}
                className={
                  "h-7 text-xs p-1 text-center mt-1 " +
                  (isTotalInvalid ? "border-destructive focus-visible:ring-destructive/30" : "")
                }
                placeholder="USD"
              />
              {isTotalInvalid && (
                <div className="text-[10px] text-destructive text-center mt-1">{t('validation.discountTooHigh')}</div>
              )}
            </div>

            {/* Paid */}
            <div className="rounded-md border px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground uppercase mb-1">{t('cart.payments')}</div>
              <div className="font-bold text-base text-green-600 text-center">{totalPayments.toLocaleString()}</div>
              <div className="text-[11px] text-muted-foreground text-center mt-1">
                ${(totalPayments / exchangeRate).toFixed(2)}
              </div>
            </div>

            {/* Remaining */}
            <div className="rounded-md border px-3 py-2.5">
              <div className="text-[11px] text-muted-foreground uppercase mb-1">{t('cart.remaining')}</div>
              <div className={"font-bold text-base text-center " + (remaining > 0 ? "text-orange-600" : "text-green-600")}>
                {remaining.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground text-center mt-1">
                ${(remaining / exchangeRate).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Submit Buttons (always enabled if cart has items; validation handled in submit handler) */}
          <div className="flex gap-2">
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || cartItems.length === 0 || hasStockErrors || isTotalInvalid}
              className="flex-1"
            >
              {isSubmitting ? t('loading') : t('actions.submit')}
            </Button>
            <Button
              onClick={onSubmitAndPrint}
              disabled={isSubmitting || cartItems.length === 0 || hasStockErrors || isTotalInvalid}
              variant="outline"
              className="flex-1"
            >
              {t('actions.submitAndPrint')}
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
