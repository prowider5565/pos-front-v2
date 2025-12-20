"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
  currency: z.enum(["UZS", "USD"]),
  exchange_rate: z.string().min(1, "Exchange rate is required").refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  }, "Exchange rate must be greater than 0"),
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

  const form = useForm<BatchImportFormValues>({
    resolver: zodResolver(batchImportSchema),
    defaultValues: {
      product_id: productId ? String(productId) : "",
      qty: "",
      purchase_price: "",
      currency: "UZS",
      exchange_rate: "",
    },
  })

  // Fetch products list (only if productId is not provided)
  const { data: productsData, error } = useQuery({
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

  const mutation = useMutation({
    mutationFn: async (data: BatchImportFormValues) => {
      await productsService.createBatch({
        product: Number(data.product_id),
        quantity: parseFloat(data.qty),
        buy_price: data.purchase_price,
        sell_price: "0", // Default sell price, can be updated later
        finance: {
          currency: data.currency,
          exchange_rate: data.exchange_rate,
        },
      })
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
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter purchase price"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
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

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Rate</FormLabel>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Importing..." : "Import Batch"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
