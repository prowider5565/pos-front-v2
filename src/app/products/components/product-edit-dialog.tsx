"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { productsService, type Category, type Product } from "@/services/products.service"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

// Form validation schema
const productEditSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  barcode_number: z.string().optional(),
  product_type: z.enum(["KG", "PIECE", "WEIGHT", "LITER"]),
  category: z.string().min(1, "Category is required"),
})

type ProductEditFormValues = z.infer<typeof productEditSchema>

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess?: () => void
}

export function ProductEditDialog({ 
  open, 
  onOpenChange, 
  product,
  onSuccess 
}: ProductEditDialogProps) {
  const { t } = useTranslation(['products', 'common'])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const form = useForm<ProductEditFormValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode_number: "",
      product_type: "PIECE",
      category: "",
    },
  })

  useBarcodeScanner({
    enabled: open,
    onBarcode: (barcode) => {
      form.setValue("barcode_number", barcode, {
        shouldDirty: true,
        shouldTouch: true,
      })
    },
  })

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsService.getCategories()
        setCategories(response.results)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        toast.error(t('common:messages.error'), {
          description: "Failed to load categories"
        })
      }
    }
    if (open) {
      fetchCategories()
    }
  }, [open, t])

  // Populate form when product changes
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description || "",
        barcode_number: product.barcode_number || "",
        product_type: product.product_type,
        category: String(product.category),
      })
    }
  }, [product, open, form])

  // Form submission handler
  const onSubmit = async (data: ProductEditFormValues) => {
    if (!product) return

    setIsLoading(true)
    try {
      await productsService.updateProduct(product.id, {
        name: data.name,
        description: data.description || "",
        barcode_number: data.barcode_number?.trim() || "",
        product_type: data.product_type,
        category: parseInt(data.category),
      })

      toast.success(t('common:messages.success'), {
        description: t('productUpdatedSuccessfully')
      })

      onOpenChange(false)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Failed to update product:", error)
      
      const errorMessage = error?.response?.data?.detail || error?.message
      
      toast.error(t('common:messages.error'), {
        description: errorMessage || t('failedToUpdateProduct')
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('editProduct')}</DialogTitle>
          <DialogDescription>
            {t('editProductDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('productName')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('productNamePlaceholder')} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('productDescription')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('productDescriptionPlaceholder')}
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="barcode_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('barcodeScanner')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('barcodeScannerPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Product Type - horizontal layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t('selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('productType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder={t('selectProductType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PIECE">{t('productTypes.PIECE')}</SelectItem>
                        <SelectItem value="KG">{t('productTypes.KG')}</SelectItem>
                        <SelectItem value="WEIGHT">{t('productTypes.WEIGHT')}</SelectItem>
                        <SelectItem value="LITER">{t('productTypes.LITER')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {t('common:actions.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? t('common:actions.saving') : t('common:actions.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
