"use client"

import { useState, useEffect, useCallback } from "react"
import { invoke } from "@tauri-apps/api/core"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ProductGrid } from "./components/product-grid"
import { CartSidebar } from "./components/cart-sidebar"
import { buildChequeText } from "@/components/cheque-preview"
import { useAuth } from "@/contexts/auth-context"
import { useSalesCart } from "@/hooks/use-sales-cart"
import { useSalesPayments } from "@/hooks/use-sales-payments"
import { salesService } from "@/services/sales.service"
import { debtsService } from "@/services/debts.service"
import { getExchangeRateNumber } from "@/lib/exchange-rate-storage"
import type { SaleProduct, PaymentMethod, Currency, SaleDetail } from "@/types/sales"

export default function SotuvPage() {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = useState(false)
  const { config } = useSidebarConfig()
  const { t } = useTranslation('sales')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const getApiErrorMessage = (error: any) => {
    const data = error?.response?.data

    const collectMessages = (value: unknown, acc: string[]) => {
      if (typeof value === "string" && value.trim()) {
        acc.push(value.trim())
        return
      }
      if (Array.isArray(value)) {
        value.forEach((item) => collectMessages(item, acc))
        return
      }
      if (value && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach((item) =>
          collectMessages(item, acc)
        )
      }
    }

    const messages: string[] = []
    collectMessages(data, messages)

    if (typeof data?.message === "string" && data.message.trim()) {
      messages.unshift(data.message.trim())
    }

    const unique = Array.from(new Set(messages)).filter(Boolean)
    if (unique.length > 0) return unique.join("\n")

    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message.trim()
    }

    return t('messages.error')
  }

  const extractSaleId = (sale: unknown): number | null => {
    if (!sale || typeof sale !== "object") return null

    const root = sale as Record<string, unknown>
    const data = root.data as Record<string, unknown> | undefined

    const candidate = root.id
      ?? root.sale_id
      ?? (root.sale as Record<string, unknown> | undefined)?.id
      ?? data?.id
      ?? data?.sale_id
      ?? (data?.sale as Record<string, unknown> | undefined)?.id

    const parsed = Number(candidate)
    if (!Number.isInteger(parsed) || parsed <= 0) return null

    return parsed
  }
  
  // Cart management
  const {
    cartItems,
    addToCart,
    updateQuantity,
    updateUnitPrice,
    setQuantityDraft,
    commitQuantityDraft,
    setPriceDraft,
    commitPriceDraft,
    removeItem,
    clearCart,
    subtotal,
    isInCart,
    getItemQuantity,
    getItemQuantityDraft,
    getItemPriceDraft,
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

  // Pending payment state (for uncommitted payment in input field)
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod>('CASH')
  const [pendingCurrency, setPendingCurrency] = useState<Currency>('UZS')
  const [pendingAmount, setPendingAmount] = useState<string>('')

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
    // Reset pending payment
    setPendingMethod('CASH')
    setPendingCurrency('UZS')
    setPendingAmount('')
    toast.success(t('messages.cartCleared'))
  }, [clearCart, clearPayments, t])

  // Handle remove item
  const handleRemoveItem = useCallback((productId: number) => {
    removeItem(productId)
    toast.success(t('messages.productRemoved'))
  }, [removeItem, t])

  const finalTotalNumber = parseFloat(finalTotalUZS)
  const isFinalTotalValidNumber = !Number.isNaN(finalTotalNumber)
  const adjustedSubtotal = subtotal
  const isFinalTotalTooHigh = isFinalTotalValidNumber && finalTotalNumber > adjustedSubtotal

  const computedTotal = isFinalTotalValidNumber ? Math.max(0, Math.min(finalTotalNumber, adjustedSubtotal)) : adjustedSubtotal
  const saleLevelDiscountAmount = Math.max(0, adjustedSubtotal - computedTotal)

  // Calculate totals
  const remaining = calculateRemaining(computedTotal, exchangeRate)
  const hasSelectedClient = selectedClientId !== null
  const formatAmount = useCallback((value: number) => value.toFixed(2), [])

  const buildSaleItems = useCallback(() => {
    return cartItems.map(item => {
      const unitDiscount = Math.max(0, item.product.sell_price - item.unitPrice)
      const lineDiscount = unitDiscount * item.quantity

      return {
        product_id: item.product.id,
        quantity: item.quantity,
        discount_amount: formatAmount(lineDiscount),
      }
    })
  }, [cartItems, formatAmount])

  const buildSalePayments = useCallback(() => {
    if (!hasSelectedClient) {
      // Walk-in sales should be submitted as fully paid in UZS.
      return [{
        method: 'CASH' as PaymentMethod,
        currency: 'UZS' as Currency,
        amount: computedTotal.toString(),
      }]
    }

    const allPayments = [...payments.map(payment => ({
      method: payment.method,
      currency: payment.currency,
      amount: payment.amount,
    }))]

    const pendingAmountNum = parseFloat(pendingAmount)
    if (pendingAmount && !isNaN(pendingAmountNum) && pendingAmountNum > 0) {
      allPayments.push({
        method: pendingMethod,
        currency: pendingCurrency,
        amount: pendingAmount,
      })
    }

    return allPayments
  }, [
    hasSelectedClient,
    computedTotal,
    payments,
    pendingAmount,
    pendingMethod,
    pendingCurrency,
  ])

  const printSaleCheque = useCallback(async (saleDetail: SaleDetail) => {
    const oldDebts = saleDetail.client?.id
      ? await debtsService.getOldDebtsForCheque(saleDetail.client.id)
      : { total_usd: "0", total_uzs: "0" }

    const chequeText = buildChequeText({
      saleData: saleDetail,
      oldDebts,
      username: user?.username,
    })

    const result = await invoke<string>('print_receipt', { content: chequeText })
    toast.success('Cheque printed', {
      description: result,
    })
  }, [user?.username])

  const invalidateDebtQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['debts', 'clients'] }),
      queryClient.invalidateQueries({ queryKey: ['debts', 'suppliers'] }),
      queryClient.invalidateQueries({ queryKey: ['client-old-debts-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['supplier-new-debts-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['supplier-old-debts-detail'] }),
    ])
  }, [queryClient])

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

    try {
      setIsSubmitting(true)

      const allPayments = buildSalePayments()
      const payloadRemaining = hasSelectedClient ? remaining : 0

      // Prepare request data
      const saleData = {
        items: buildSaleItems(),
        payments: allPayments,
        exchange_rate: exchangeRate.toString(),
        client_id: selectedClientId || undefined,
        discount_amount: saleLevelDiscountAmount > 0 ? formatAmount(saleLevelDiscountAmount) : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      }

      // Submit sale
      await salesService.createSale(saleData)
      await invalidateDebtQueries()

      // Success
      if (payloadRemaining > 0) {
        toast.success(t('messages.saleCreatedWithDebt'))
      } else {
        toast.success(t('messages.saleCreated'))
      }

      // Clear form
      handleClearCart()

    } catch (error: any) {
      console.error('Failed to create sale:', error)
      toast.error(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    cartItems,
    payments,
    exchangeRate,
    selectedClientId,
    remaining,
    hasSelectedClient,
    notes,
    isFinalTotalTooHigh,
    buildSalePayments,
    buildSaleItems,
    computedTotal,
    saleLevelDiscountAmount,
    formatAmount,
    t,
    handleClearCart,
    invalidateDebtQueries,
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

    try {
      setIsSubmitting(true)

      const allPayments = buildSalePayments()
      const payloadRemaining = hasSelectedClient ? remaining : 0

      // Prepare request data
      const saleData = {
        items: buildSaleItems(),
        payments: allPayments,
        exchange_rate: exchangeRate.toString(),
        client_id: selectedClientId || undefined,
        discount_amount: saleLevelDiscountAmount > 0 ? formatAmount(saleLevelDiscountAmount) : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        needs_cheque: true, // Mark that cheque is needed
      }

      // Submit sale and get response
      const createdSale = await salesService.createSale(saleData)
      await invalidateDebtQueries()
      const saleId = extractSaleId(createdSale)

      // Success message for create action
      if (payloadRemaining > 0) {
        toast.success(t('messages.saleCreatedWithDebt'))
      } else {
        toast.success(t('messages.saleCreated'))
      }

      // Clear form after successful sale creation
      handleClearCart()

      if (!saleId) {
        toast.error(t('history.detail.loadError'))
        return
      }

      // Fetch full sale details and print immediately
      const saleDetail = await salesService.getSaleDetail(saleId)
      await printSaleCheque(saleDetail)

    } catch (error: any) {
      console.error('Failed to create sale:', error)
      toast.error(getApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    cartItems,
    payments,
    exchangeRate,
    selectedClientId,
    remaining,
    hasSelectedClient,
    notes,
    isFinalTotalTooHigh,
    buildSalePayments,
    buildSaleItems,
    computedTotal,
    saleLevelDiscountAmount,
    formatAmount,
    t,
    handleClearCart,
    invalidateDebtQueries,
    printSaleCheque,
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
              getItemQuantityDraft={getItemQuantityDraft}
              onQuantityInputChange={setQuantityDraft}
              onQuantityInputCommit={commitQuantityDraft}
              isCartOpen={cartItems.length > 0}
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
          onUpdateUnitPrice={updateUnitPrice}
          getItemQuantityDraft={getItemQuantityDraft}
          getItemPriceDraft={getItemPriceDraft}
          onQuantityInputChange={setQuantityDraft}
          onQuantityInputCommit={commitQuantityDraft}
          onPriceInputChange={setPriceDraft}
          onPriceInputCommit={commitPriceDraft}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onAddPayment={addPayment}
          onRemovePayment={removePayment}
          onClientSelect={setSelectedClientId}
          onSubmit={handleSubmit}
          onSubmitAndPrint={handleSubmitAndPrint}
          isSubmitting={isSubmitting}
          pendingMethod={pendingMethod}
          pendingCurrency={pendingCurrency}
          pendingAmount={pendingAmount}
          onPendingMethodChange={setPendingMethod}
          onPendingCurrencyChange={setPendingCurrency}
          onPendingAmountChange={setPendingAmount}
        />
      )}

      {/* Theme Customizer */}
      <ThemeCustomizer
        open={themeCustomizerOpen}
        onOpenChange={setThemeCustomizerOpen}
      />
    </SidebarProvider>
  )
}
