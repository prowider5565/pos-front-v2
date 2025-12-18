"use client"

import { useTranslation } from "react-i18next"
import { ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import { CartItem } from "./cart-item"
import { PaymentSection } from "./payment-section"
import { CartSummary } from "./cart-summary"
import { ClientSelector } from "./client-selector"
import type { CartItem as CartItemType, PaymentEntry } from "@/types/sales"

interface CartSidebarProps {
  cartItems: CartItemType[]
  payments: PaymentEntry[]
  discount: string
  selectedClientId: number | null
  exchangeRate: number
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
  onDiscountChange: (discount: string) => void
  onAddPayment: (method: string, currency: string, amount: string) => void
  onRemovePayment: (paymentId: string) => void
  onAddFullPayment: (method: string, currency: string) => void
  onClientSelect: (clientId: number | null) => void
  onExchangeRateChange: (rate: number) => void
  onSubmit: () => void
  onSubmitAndPrint: () => void
  isSubmitting: boolean
}

export function CartSidebar({
  cartItems,
  payments,
  discount,
  selectedClientId,
  exchangeRate,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onDiscountChange,
  onAddPayment,
  onRemovePayment,
  onAddFullPayment,
  onClientSelect,
  onExchangeRateChange,
  onSubmit,
  onSubmitAndPrint,
  isSubmitting,
}: CartSidebarProps) {
  const { t } = useTranslation('sales')

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0)
  const discountAmount = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmount)
  
  const totalPayments = payments.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount) || 0
    return sum + (payment.currency === 'USD' ? amount * exchangeRate : amount)
  }, 0)
  
  const remaining = Math.max(0, total - totalPayments)
  const hasStockErrors = cartItems.some(item => item.quantity > item.product.quantity)

  return (
    <Sidebar side="right" variant="sidebar" collapsible="none" className="border-l w-[480px]">
      <SidebarHeader className="flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
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

      <SidebarContent className="flex flex-col p-0">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{t('cart.empty')}</h3>
            <p className="text-sm text-muted-foreground">{t('cart.emptyDescription')}</p>
          </div>
        ) : (
          <>
            {/* Cart Items Table - Fixed Height with Scroll */}
            <div className="flex-shrink-0 border-b" style={{ height: '400px' }}>
              <div className="h-full overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10 border-b">
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
                        exchangeRate={exchangeRate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary and Actions - Fixed at Bottom (No Scroll) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Exchange Rate Editor */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exchange Rate</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">1 USD =</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={exchangeRate}
                      onChange={(e) => onExchangeRateChange(parseFloat(e.target.value) || 0)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm text-muted-foreground">UZS</span>
                  </div>
                </div>

                <Separator />

                {/* Cart Summary */}
                <CartSummary
                  subtotal={subtotal}
                  discount={discount}
                  total={total}
                  totalPayments={totalPayments}
                  remaining={remaining}
                  exchangeRate={exchangeRate}
                  onDiscountChange={onDiscountChange}
                />

                <Separator />

                {/* Payment Section */}
                <PaymentSection
                  payments={payments}
                  total={total}
                  exchangeRate={exchangeRate}
                  onAddPayment={onAddPayment}
                  onRemovePayment={onRemovePayment}
                  onAddFullPayment={onAddFullPayment}
                />

                {/* Client Selection - Only show if there's remaining debt */}
                {remaining > 0 && (
                  <>
                    <Separator />
                    <ClientSelector
                      selectedClientId={selectedClientId}
                      onClientSelect={onClientSelect}
                      hasRemaining={remaining > 0}
                    />
                  </>
                )}
              </div>

              {/* Submit Buttons - Always Visible */}
              <div className="flex-shrink-0 border-t bg-background px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    onClick={onSubmit}
                    disabled={isSubmitting || cartItems.length === 0 || hasStockErrors || (remaining > 0 && !selectedClientId)}
                    className="flex-1"
                  >
                    {isSubmitting ? t('loading') : t('actions.submit')}
                  </Button>
                  <Button
                    onClick={onSubmitAndPrint}
                    disabled={isSubmitting || cartItems.length === 0 || hasStockErrors || (remaining > 0 && !selectedClientId)}
                    variant="outline"
                    className="flex-1"
                  >
                    {t('actions.submitAndPrint')}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
