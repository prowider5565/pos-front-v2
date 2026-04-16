"use client"

import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { productsService } from "@/services/products.service"
import { getExchangeRateNumber } from "@/lib/exchange-rate-storage"

const batchImportSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  qty: z.string().min(1, "Quantity is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Quantity must be greater than 0"),
  purchase_price: z.string().min(1, "Purchase price is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Purchase price must be greater than 0"),
  sell_price: z.string().min(1, "Sell price is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Sell price must be greater than 0"),
  has_payment: z.boolean(),
  currency: z.enum(["UZS", "USD"]),
  exchange_rate: z.string().optional(),
  amount: z.string().optional(),
  method: z.string().optional(),
})

type BatchImportFormValues = z.infer<typeof batchImportSchema>

interface BatchImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: number | null // Optional - if provided, product selector is hidden
  onSuccess?: () => void
}

export function BatchImportDialog({
  open,
  onOpenChange,
  productId = null,
  onSuccess,
}: BatchImportDialogProps) {
  const { t } = useTranslation(['products', 'common'])

  const sanitizeDecimalInput = (value: string) => value.replace(/[^0-9.]/g, '')

  const formatTwoDecimals = (value: string) => {
    if (!value) return ""
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? "" : parsed.toFixed(2)
  }

  const form = useForm<BatchImportFormValues>({
    resolver: zodResolver(batchImportSchema),
    defaultValues: {
      product_id: productId ? String(productId) : "",
      qty: "",
      purchase_price: "",
      sell_price: "",
      has_payment: false,
      currency: "UZS",
      exchange_rate: "",
      amount: "",
      method: "CASH",
    },
  })

  // Fetch products list (only if productId is not provided)
  const { data: productsData } = useQuery({
    queryKey: ['products-for-sale'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/products/products/for-sale/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/auth/sign-in'
        throw new Error('Unauthorized')
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      return response.json()
    },
    enabled: open && !productId,
  })

  // Pre-fill exchange rate from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      const rate = getExchangeRateNumber()
      form.setValue("exchange_rate", rate.toString())
      
      // If productId is provided, set it in the form
      if (productId) {
        form.setValue("product_id", String(productId))
      }
    }
  }, [open, productId, form])

  const quantity = useWatch({ control: form.control, name: "qty" })
  const purchasePrice = useWatch({ control: form.control, name: "purchase_price" })
  const hasPayment = useWatch({ control: form.control, name: "has_payment" })
  const currency = useWatch({ control: form.control, name: "currency" })
  const exchangeRate = useWatch({ control: form.control, name: "exchange_rate" })
  const paymentAmount = useWatch({ control: form.control, name: "amount" })
  const purchasePriceNumber = parseFloat(purchasePrice || "0") || 0
  const exchangeRateNumber = parseFloat(exchangeRate || "0") || 0
  const purchasePriceUsd = exchangeRateNumber > 0 ? purchasePriceNumber / exchangeRateNumber : 0

  const calculations = useMemo(() => {
    const qty = parseFloat(quantity || "0") || 0
    const price = parseFloat(purchasePrice || "0") || 0
    const rate = parseFloat(exchangeRate || "1") || 1
    const payment = parseFloat(paymentAmount || "0") || 0

    const totalCostUzs = qty * price
    const totalCostUsd = rate > 0 ? totalCostUzs / rate : 0
    const paidAmountUzs = currency === "USD" ? payment * rate : payment
    const paidAmountUsd = currency === "USD" ? payment : rate > 0 ? paidAmountUzs / rate : 0
    const remainingDebtUzs = totalCostUzs - paidAmountUzs
    const remainingDebtUsd = rate > 0 ? remainingDebtUzs / rate : 0
    const isOverpayment = paidAmountUzs > totalCostUzs && totalCostUzs > 0

    return {
      totalCostUzs,
      totalCostUsd,
      paidAmountUzs,
      paidAmountUsd,
      remainingDebtUzs,
      remainingDebtUsd: remainingDebtUsd > 0 ? remainingDebtUsd : 0,
      isOverpayment,
    }
  }, [quantity, purchasePrice, exchangeRate, paymentAmount, currency])

  const showPaymentSummary = calculations.totalCostUzs > 0

  const mutation = useMutation({
    mutationFn: async (data: BatchImportFormValues) => {
      const payload: Parameters<typeof productsService.createBatch>[0] = {
        product: Number(data.product_id),
        quantity: parseFloat(data.qty),
        buy_price: data.purchase_price,
        sell_price: data.sell_price,
      }

      if (data.has_payment && data.amount && parseFloat(data.amount) > 0) {
        payload.finance = {
          currency: data.currency,
          exchange_rate: data.exchange_rate || "1",
          amount: data.amount,
          method: data.method || "CASH",
        }
      }

      await productsService.createBatch(payload)
    },
    onSuccess: () => {
      toast.success(t('common:messages.success'), {
        description: "Batch imported successfully"
      })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      console.error('Import batch error:', error)
      const errorData = error.data || error.response?.data
      let errorMessage = "Failed to import batch"
      
      if (errorData?.detail) {
        errorMessage = errorData.detail
      } else if (errorData?.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        errorMessage = errorData.non_field_errors.join(', ')
      }
      
      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    },
  })

  const onSubmit = (data: BatchImportFormValues) => {
    if (data.has_payment && calculations.isOverpayment) {
      toast.error(t('products:paymentExceedsCost'), {
        description: t('products:overpaymentWarning')
      })
      return
    }

    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Product Batch</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Selector - Only show if productId is not provided */}
            {!productId && (
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <Combobox
                        items={
                          Array.isArray(productsData?.results)
                            ? productsData.results.map((product: any) => ({
                                value: String(product.id),
                                label: product.name,
                              }))
                            : Array.isArray(productsData)
                            ? productsData.map((product: any) => ({
                                value: String(product.id),
                                label: product.name,
                              }))
                            : []
                        }
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select product"
                        searchPlaceholder="Search product..."
                        emptyText="No product found."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter quantity"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('products:exchangeRate')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter exchange rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FormDescription>UZS</FormDescription>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter purchase price"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(sanitizeDecimalInput(e.target.value))
                          }}
                          onBlur={(e) => {
                            field.onChange(formatTwoDecimals(e.target.value))
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                    </div>

                    <div className="space-y-2">
                      <FormDescription>USD</FormDescription>
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={field.value ? purchasePriceUsd.toFixed(2) : ""}
                        onChange={(e) => {
                          const sanitized = sanitizeDecimalInput(e.target.value)
                          if (!sanitized) {
                            field.onChange("")
                            return
                          }

                          const usdValue = parseFloat(sanitized)
                          if (Number.isNaN(usdValue)) return

                          if (exchangeRateNumber > 0) {
                            field.onChange((usdValue * exchangeRateNumber).toFixed(2))
                          }
                        }}
                        onBlur={(e) => {
                          const sanitized = sanitizeDecimalInput(e.target.value)
                          if (!sanitized) {
                            field.onChange("")
                            return
                          }

                          const usdValue = parseFloat(sanitized)
                          if (Number.isNaN(usdValue)) return

                          if (exchangeRateNumber > 0) {
                            field.onChange((usdValue * exchangeRateNumber).toFixed(2))
                          }
                        }}
                      />
                    </div>
                  </div>
                  <FormDescription>
                    {t('products:exchangeRate')}: 1 USD = {exchangeRateNumber > 0 ? exchangeRateNumber.toLocaleString() : 0} UZS
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sell_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sell Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter sell price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_payment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t('products:addPayment')}</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {hasPayment && (
              <div className="space-y-4 rounded-md border bg-muted/50 p-4">
                <h4 className="text-sm font-medium">{t('products:paymentDetails')}</h4>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('products:paymentAmount')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter payment amount"
                              className={calculations.isOverpayment ? "border-red-500 focus-visible:ring-red-500" : ""}
                              {...field}
                            />
                          </FormControl>
                          {calculations.isOverpayment && (
                            <p className="text-sm font-medium text-red-500">
                              {t('products:overpaymentWarning')}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('products:currency')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UZS">UZS</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('products:paymentMethod')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CASH">{t('products:paymentMethods.CASH')}</SelectItem>
                              <SelectItem value="CARD">{t('products:paymentMethods.CARD')}</SelectItem>
                              <SelectItem value="TRANSFER">{t('products:paymentMethods.TRANSFER')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {showPaymentSummary && (
              <div className="space-y-2 rounded-md border p-4">
                <h4 className="text-sm font-semibold">{t('products:paymentSummary')}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('products:totalCost')} (UZS):</span>
                    <span className="font-medium">{calculations.totalCostUzs.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('products:totalCost')} (USD):</span>
                    <span className="font-medium">${calculations.totalCostUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('products:paidAmount')} (UZS):</span>
                    <span className="font-medium">{calculations.paidAmountUzs.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('products:paidAmount')} (USD):</span>
                    <span className="font-medium">${calculations.paidAmountUsd.toLocaleString()}</span>
                  </div>
                  {!calculations.isOverpayment ? (
                    <>
                      <div className="flex justify-between font-semibold text-primary">
                        <span>{t('products:remainingDebt')} (UZS):</span>
                        <span>{calculations.remainingDebtUzs.toLocaleString()} UZS</span>
                      </div>
                      <div className="flex justify-between font-semibold text-primary">
                        <span>{t('products:remainingDebt')} (USD):</span>
                        <span>${calculations.remainingDebtUsd.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-semibold text-red-500">
                      <span>{t('products:overpaymentWarning')}</span>
                      <span>+{Math.abs(calculations.remainingDebtUzs).toLocaleString()} UZS</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || (hasPayment && calculations.isOverpayment)}>
                {mutation.isPending ? "Importing..." : "Import Batch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
