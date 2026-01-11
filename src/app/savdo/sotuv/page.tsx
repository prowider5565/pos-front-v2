"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProductGrid } from "./components/product-grid"
import { CartSidebar } from "./components/cart-sidebar"
import { ChequePreviewModal } from "@/components/cheque-preview-modal"
import { useSalesCart } from "@/hooks/use-sales-cart"
import { useSalesPayments } from "@/hooks/use-sales-payments"
import { salesService } from "@/services/sales.service"
import { getExchangeRateNumber } from "@/lib/exchange-rate-storage"
import type { SaleProduct } from "@/types/sales"

export default function SotuvPage() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false)
  const { config } = useSidebarConfig()
  const { t } = useTranslation('sales')
  
  // Cart management
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    isInCart,
    getItemQuantity,
  } = useSalesCart()

  // Payment management
  const {
    payments,
    addPayment,
    removePayment,
    clearPayments,
    calculateRemaining,
  } = useSalesPayments()

  // Form state
  const [finalTotalUZS, setFinalTotalUZS] = useState<string>('')
  const [isFinalTotalDirty, setIsFinalTotalDirty] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number>(12600)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chequeModalOpen, setChequeModalOpen] = useState(false)
  const [lastSaleData, setLastSaleData] = useState<any>(null)

  // Load + subscribe to exchange rate changes (from navbar input)
  useEffect(() => {
    const applyRate = (next: number) => {
      if (!Number.isFinite(next) || next <= 0) return
      setExchangeRate(next)
    }

    applyRate(getExchangeRateNumber())

    // Same-tab updates
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ rate: string }>).detail
      if (detail?.rate) applyRate(parseFloat(detail.rate))
    }

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'exchange_rate' && e.newValue) {
        applyRate(parseFloat(e.newValue))
      }
    }

    window.addEventListener('exchange-rate:changed', onCustom)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('exchange-rate:changed', onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Handle add product to cart
  const handleAddToCart = useCallback((product: SaleProduct) => {
    addToCart(product)
    toast.success(t('messages.productAdded', { productName: product.name }))
  }, [addToCart, t])

  // Keep final total in sync with subtotal unless user overrides it
  useEffect(() => {
    if (!isFinalTotalDirty) {
      setFinalTotalUZS(subtotal.toString())
    }
  }, [subtotal, isFinalTotalDirty])

  // Handle clear cart
  const handleClearCart = useCallback(() => {
    clearCart()
    clearPayments()
    setFinalTotalUZS('')
    setIsFinalTotalDirty(false)
    setNotes('')
    setSelectedClientId(null)
    toast.success(t('messages.cartCleared'))
  }, [clearCart, clearPayments, t])

  // Handle remove item
  const handleRemoveItem = useCallback((productId: number) => {
    removeItem(productId)
    toast.success(t('messages.productRemoved'))
  }, [removeItem, t])

  const finalTotalNumber = parseFloat(finalTotalUZS)
  const isFinalTotalValidNumber = !Number.isNaN(finalTotalNumber)
  const isFinalTotalTooHigh = isFinalTotalValidNumber && finalTotalNumber > subtotal

  const computedTotal = isFinalTotalValidNumber ? Math.max(0, Math.min(finalTotalNumber, subtotal)) : subtotal
  const discountAmount = Math.max(0, subtotal - computedTotal)

  // Calculate totals
  const remaining = calculateRemaining(computedTotal, exchangeRate)

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validation
    if (cartItems.length === 0) {
      toast.error(t('validation.cartEmpty'))
      return
    }

    // Check stock
    const hasStockErrors = cartItems.some(item => item.quantity > item.product.quantity)
    if (hasStockErrors) {
      const errorItem = cartItems.find(item => item.quantity > item.product.quantity)
      toast.error(t('validation.stockExceeded', { 
        productName: errorItem?.product.name,
        stock: errorItem?.product.quantity
      }))
      return
    }

    // Final total must not exceed subtotal
    if (isFinalTotalTooHigh) {
      toast.error(t('validation.discountTooHigh'))
      return
    }

    // Check client requirement
    if (remaining > 0 && !selectedClientId) {
      toast.error(t('validation.clientRequired'))
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare request data
      const saleData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payments: payments.map(payment => ({
          method: payment.method,
          currency: payment.currency,
          amount: payment.amount,
        })),
        exchange_rate: exchangeRate.toString(),
        client_id: selectedClientId || undefined,
        discount_amount: discountAmount > 0 ? discountAmount.toString() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      }

      // Submit sale
      await salesService.createSale(saleData)

      // Success
      if (remaining > 0) {
        toast.success(t('messages.saleCreatedWithDebt'))
      } else {
        toast.success(t('messages.saleCreated'))
      }

      // Clear form
      handleClearCart()

    } catch (error: any) {
      console.error('Failed to create sale:', error)
      toast.error(error.response?.data?.message || t('messages.error'))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    cartItems,
    payments,
    exchangeRate,
    selectedClientId,
    discountAmount,
    remaining,
    notes,
    isFinalTotalTooHigh,
    t,
    handleClearCart,
  ])

  // Handle submit and print
  const handleSubmitAndPrint = useCallback(async () => {
    // Validation
    if (cartItems.length === 0) {
      toast.error(t('validation.cartEmpty'))
      return
    }

    // Check stock
    const hasStockErrors = cartItems.some(item => item.quantity > item.product.quantity)
    if (hasStockErrors) {
      const errorItem = cartItems.find(item => item.quantity > item.product.quantity)
      toast.error(t('validation.stockExceeded', { 
        productName: errorItem?.product.name,
        stock: errorItem?.product.quantity
      }))
      return
    }

    // Final total must not exceed subtotal
    if (isFinalTotalTooHigh) {
      toast.error(t('validation.discountTooHigh'))
      return
    }

    // Check client requirement
    if (remaining > 0 && !selectedClientId) {
      toast.error(t('validation.clientRequired'))
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare request data
      const saleData = {
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        payments: payments.map(payment => ({
          method: payment.method,
          currency: payment.currency,
          amount: payment.amount,
        })),
        exchange_rate: exchangeRate.toString(),
        client_id: selectedClientId || undefined,
        discount_amount: discountAmount > 0 ? discountAmount.toString() : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        needs_cheque: true, // Mark that cheque is needed
      }

      // Submit sale and get response
      const createdSale = await salesService.createSale(saleData)

      // Fetch full sale details for cheque
      const saleDetail = await salesService.getSaleDetail(createdSale.id)
      
      // Store sale data for cheque
      setLastSaleData(saleDetail)

      // Success message
      if (remaining > 0) {
        toast.success(t('messages.saleCreatedWithDebt'))
      } else {
        toast.success(t('messages.saleCreated'))
      }

      // Clear form
      handleClearCart()
      
      // Open cheque modal
      setChequeModalOpen(true)

    } catch (error: any) {
      console.error('Failed to create sale:', error)
      toast.error(error.response?.data?.message || t('messages.error'))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    cartItems,
    payments,
    exchangeRate,
    selectedClientId,
    discountAmount,
    remaining,
    notes,
    isFinalTotalTooHigh,
    t,
    handleClearCart,
  ])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {/* Left Sidebar */}
      <AppSidebar
        variant={config.variant}
        collapsible={config.collapsible}
        side={config.side}
      />

      {/* Main Content */}
      <SidebarInset className="overflow-hidden">
        <SiteHeader onThemeCustomizerOpen={() => setThemeCustomizerOpen(true)} />
        <div className="flex flex-col h-[calc(100vh-var(--header-height))]">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
            <div className="flex h-16 items-center px-4 lg:px-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Product Grid - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
            <ProductGrid
              onAddToCart={handleAddToCart}
              isInCart={isInCart}
              onUpdateQuantity={updateQuantity}
              getItemQuantity={getItemQuantity}
            />
          </div>
        </div>
      </SidebarInset>

      {/* Right Cart Sidebar - only show after first product added */}
      {cartItems.length > 0 && (
        <CartSidebar
          cartItems={cartItems}
          payments={payments}
          total={computedTotal}
          isTotalInvalid={isFinalTotalTooHigh}
          finalTotalUZS={finalTotalUZS}
          onFinalTotalChange={(value) => {
            setFinalTotalUZS(value)
            setIsFinalTotalDirty(true)
          }}
          notes={notes}
          onNotesChange={setNotes}
          selectedClientId={selectedClientId}
          exchangeRate={exchangeRate}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onAddPayment={addPayment}
          onRemovePayment={removePayment}
          onClientSelect={setSelectedClientId}
          onSubmit={handleSubmit}
          onSubmitAndPrint={handleSubmitAndPrint}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Theme Customizer */}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />

      {/* Cheque Preview Modal */}
      <ChequePreviewModal
        open={chequeModalOpen}
        onOpenChange={setChequeModalOpen}
        saleData={lastSaleData}
      />
    </SidebarProvider>
  )
}
