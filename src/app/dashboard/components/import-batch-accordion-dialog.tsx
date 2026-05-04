"use client"

import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PackageOpen, Plus, Trash2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { BatchImportForm } from "@/components/batch-import-dialog"
import type { BatchImportDraft } from "@/components/batch-import-dialog"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { salesService } from "@/services/sales.service"
import { productsService } from "@/services/products.service"
import type { SaleProduct } from "@/types/sales"

interface ImportBatchAccordionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ImportBatchItem {
  id: string
  product: SaleProduct | null
}

const createDraftSignature = (draft: Partial<BatchImportDraft> | undefined) =>
  JSON.stringify({
    product_id: draft?.product_id ?? "",
    qty: draft?.qty ?? "",
    purchase_price: draft?.purchase_price ?? "",
    sell_price: draft?.sell_price ?? "",
    has_payment: draft?.has_payment ?? false,
    currency: draft?.currency ?? "UZS",
    exchange_rate: draft?.exchange_rate ?? "",
    amount: draft?.amount ?? "",
    method: draft?.method ?? "",
  })

const createBlankItem = (): ImportBatchItem => ({
  id: `manual-${crypto.randomUUID()}`,
  product: null,
})

export function ImportBatchAccordionDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportBatchAccordionDialogProps) {
  const { t } = useTranslation(['dashboard', 'products', 'common'])
  const [expandedItemId, setExpandedItemId] = useState<string | undefined>()
  const [items, setItems] = useState<ImportBatchItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, BatchImportDraft>>({})

  const { data } = useQuery({
    queryKey: ['dashboard-import-batch-products'],
    queryFn: async () => {
      return salesService.getProductsForSale({
        page: 1,
        page_size: 100,
      })
    },
    enabled: open,
  })

  const products = data?.results ?? []

  const handleProductResolved = useCallback((itemId: string, product: SaleProduct | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        const currentProductId = item.product?.id ?? null
        const nextProductId = product?.id ?? null

        if (currentProductId === nextProductId) {
          return item
        }

        return { ...item, product }
      })
    )
  }, [])

  const handleAddManualItem = useCallback(() => {
    const item = createBlankItem()
    setItems((prev) => [...prev, item])
    setExpandedItemId(item.id)
  }, [])

  const handleDraftChange = useCallback((itemId: string, draft: BatchImportDraft) => {
    setDrafts((prev) => {
      const previousDraft = prev[itemId]

      if (createDraftSignature(previousDraft) === createDraftSignature(draft)) {
        return prev
      }

      return {
        ...prev,
        [itemId]: draft,
      }
    })
  }, [])

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    try {
      const product = await productsService.lookupProductByBarcode(barcode)

      setItems((prev) => {
        const existingItem = prev.find((item) => item.product?.id === product.id)
        if (existingItem) {
          setExpandedItemId(existingItem.id)
          return prev
        }

        const nextItem = {
          id: `scanned-${product.id}`,
          product,
        }

        setExpandedItemId(nextItem.id)
        return [...prev, nextItem]
      })
    } catch (error) {
      console.error('Failed to add scanned product to import accordion:', error)
    }
  }, [])

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setExpandedItemId((prev) => (prev === itemId ? undefined : prev))
  }, [])

  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      const batches = items.map((item) => {
        const draft = drafts[item.id]
        if (!draft) {
          throw new Error(`Missing draft for ${item.id}`)
        }

        const quantity = parseFloat(draft.qty)
        const amount =
          draft.has_payment && draft.amount && draft.amount.trim() !== ''
            ? draft.amount
            : null
        const method =
          draft.has_payment && amount
            ? draft.method || 'CASH'
            : null

        return {
          product: Number(draft.product_id),
          quantity,
          buy_price: draft.purchase_price,
          sell_price: draft.sell_price,
          finance: {
            currency: draft.currency,
            exchange_rate: draft.exchange_rate || '1.00',
            amount,
            method,
          },
        }
      })

      return productsService.bulkCreateBatches({ batches })
    },
    onSuccess: (response) => {
      const count = response.count ?? response.results?.length ?? items.length
      onOpenChange(false)
      setExpandedItemId(undefined)
      setItems([])
      setDrafts({})
      onSuccess?.()
      window.setTimeout(() => {
        import('sonner').then(({ toast }) => {
          toast.success(t('common:messages.success'), {
            description: t('dashboard:quickActions.bulkImportSuccess', { count }),
          })
        })
      }, 0)
    },
    onError: (error: any) => {
      console.error('Bulk batch import failed:', error)
    },
  })

  const handleBulkSubmit = useCallback(() => {
    if (items.length === 0) {
      return
    }

    const invalidItem = items.find((item) => {
      const draft = drafts[item.id]
      if (!draft) return true

      const quantity = parseFloat(draft.qty)
      const buyPrice = parseFloat(draft.purchase_price)
      const sellPrice = parseFloat(draft.sell_price)
      const exchangeRate = parseFloat(draft.exchange_rate || '1')
      const amount = parseFloat(draft.amount || '0')
      const totalCostUzs = quantity * buyPrice
      const paidAmountUzs = draft.currency === 'USD' ? amount * exchangeRate : amount
      const isOverpayment = draft.has_payment && paidAmountUzs > totalCostUzs && totalCostUzs > 0

      return (
        !draft.product_id ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(buyPrice) ||
        buyPrice <= 0 ||
        !Number.isFinite(sellPrice) ||
        sellPrice <= 0 ||
        isOverpayment
      )
    })

    if (invalidItem) {
      setExpandedItemId(invalidItem.id)
      return
    }

    bulkImportMutation.mutate()
  }, [drafts, items, bulkImportMutation])

  useBarcodeScanner({
    enabled: open,
    onBarcode: handleBarcodeScan,
  })

  const hasItems = items.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
        if (!nextOpen) {
          setExpandedItemId(undefined)
          setItems([])
          setDrafts({})
        }
      }}
    >
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('products:importNewBatch')}</DialogTitle>
          <DialogDescription>
            {t('dashboard:quickActions.importBatchDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={handleAddManualItem}>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard:quickActions.addProductToImport')}
          </Button>
        </div>

        {!hasItems ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <PackageOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{t('dashboard:quickActions.importBatchEmptyState')}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t('dashboard:quickActions.importBatchScanHint')}</p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            value={expandedItemId}
            onValueChange={setExpandedItemId}
            className="rounded-lg border px-4"
          >
            {items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <div className="flex items-start gap-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 flex-col gap-1 pr-4 text-left">
                      <span className="font-medium">
                        {item.product?.name || t('dashboard:quickActions.selectProductPlaceholder')}
                      </span>
                      {item.product ? (
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>
                            {t('products:quantity')}: {item.product.quantity}
                          </span>
                          <span>
                            {t('products:sellPrice')}: {item.product.sell_price.toLocaleString()} UZS
                          </span>
                          <span>
                            {t('products:category')}: {item.product.category?.name || 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t('dashboard:quickActions.selectProductDescription')}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-2 shrink-0 text-destructive hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleRemoveItem(item.id)
                    }}
                    aria-label={t('dashboard:quickActions.removeImportItem')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="pt-2">
                  <div className="rounded-lg border bg-card p-4">
                    <BatchImportForm
                      productId={item.product?.id ?? null}
                      initialProduct={item.product}
                      products={products}
                      mode="draft"
                      onDraftChange={(draft) => handleDraftChange(item.id, draft)}
                      onProductResolved={(product) => handleProductResolved(item.id, product)}
                      onCancel={() => setExpandedItemId(undefined)}
                      onSuccess={() => {
                        setItems((prev) => prev.filter((entry) => entry.id !== item.id))
                        setExpandedItemId(undefined)
                        onSuccess?.()
                      }}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {hasItems && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending
                ? t('dashboard:quickActions.importingBatches')
                : t('dashboard:quickActions.importBatches')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
