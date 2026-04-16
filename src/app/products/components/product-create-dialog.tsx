"use client"

import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plus } from "lucide-react"
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { productsService, type Category } from "@/services/products.service"
import { suppliersService, type Supplier } from "@/services/suppliers.service"
import { getExchangeRate } from "@/lib/exchange-rate-storage"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { SupplierFormDialog } from "@/app/suppliers/components/supplier-form-dialog"
import apiClient from "@/lib/api-client"

// Form validation schema
const productCreateSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  product_type: z.enum(["KG", "PIECE", "WEIGHT", "LITER"]),
  category: z.string().min(1, "Category is required"),
  supplier: z.string().min(1, "Supplier is required"),
  
  // Batch fields
  quantity: z.string().min(1, "Quantity is required"),
  buy_price: z.string().min(1, "Buy price is required"),
  sell_price: z.string().min(1, "Sell price is required"),
  
  // Finance fields (optional)
  has_payment: z.boolean().default(false),
  currency: z.enum(["UZS", "USD"]).optional(),
  exchange_rate: z.string().optional(),
  amount: z.string().optional(),
  method: z.enum(["CASH", "CARD", "TRANSFER"]).optional(),
})

type ProductCreateFormInput = z.input<typeof productCreateSchema>
type ProductCreateFormValues = z.output<typeof productCreateSchema>

interface ProductCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId?: number  // If provided, hide supplier selectbox and auto-fill
  onSuccess?: () => void
}

export function ProductCreateDialog({ 
  open, 
  onOpenChange, 
  supplierId,
  onSuccess 
}: ProductCreateDialogProps) {
  const { t } = useTranslation(['products', 'common'])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)

  const form = useForm<ProductCreateFormInput, unknown, ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      product_type: "PIECE" as const,
      category: "",
      supplier: supplierId ? String(supplierId) : "",
      quantity: "",
      buy_price: "",
      sell_price: "",
      has_payment: false,
      currency: "UZS" as const,
      exchange_rate: getExchangeRate(),
      amount: "",
      method: "CASH" as const,
    },
  })

  // Watch form values for dynamic calculations
  const hasPayment = useWatch({ control: form.control, name: "has_payment" })
  const quantity = useWatch({ control: form.control, name: "quantity" })
  const buyPrice = useWatch({ control: form.control, name: "buy_price" })
  const paymentAmount = useWatch({ control: form.control, name: "amount" })
  const currency = useWatch({ control: form.control, name: "currency" })
  const exchangeRate = useWatch({ control: form.control, name: "exchange_rate" })

  // Calculate payment values and overpayment
  const calculations = useMemo(() => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(buyPrice) || 0
    const payment = parseFloat(paymentAmount || '0') || 0
    const rate = parseFloat(exchangeRate || '1') || 1

    const totalCost = qty * price
    const totalCostUsd = rate > 0 ? totalCost / rate : 0
    const paidInUZS = currency === "USD" ? payment * rate : payment
    const paidInUSD = currency === "USD" ? payment : rate > 0 ? paidInUZS / rate : 0
    const remainingUZS = totalCost - paidInUZS
    const remainingUSD = rate > 0 ? remainingUZS / rate : 0
    const isOverpayment = paidInUZS > totalCost && totalCost > 0

    return {
      totalCost,
      totalCostUsd,
      paidInUZS,
      paidInUSD,
      remainingUZS,
      remainingUSD: remainingUSD > 0 ? remainingUSD : 0,
      isOverpayment,
    }
  }, [quantity, buyPrice, paymentAmount, currency, exchangeRate])

  // Fetch categories on mount
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

  useEffect(() => {
    fetchCategories()
  }, [t])

  // Fetch suppliers if not pre-selected
  const fetchSuppliers = async () => {
    try {
      const response = await suppliersService.listSuppliers({ is_active: true })
      setSuppliers(response.results)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load suppliers"
      })
    }
  }

  useEffect(() => {
    if (!supplierId) {
      fetchSuppliers()
    }
  }, [supplierId, t])

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files)
    const totalImages = selectedImages.length + newFiles.length

    if (totalImages > 15) {
      toast.error(t('common:messages.error'), {
        description: t('maxImages')
      })
      return
    }

    // Add new files
    setSelectedImages(prev => [...prev, ...newFiles])

    // Create preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    // Revoke URL to free memory
    URL.revokeObjectURL(imagePreviews[index])
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSelectedImages([])
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      setImagePreviews([])
    }
  }, [open])

  // Handler for category image selection
  const handleCategoryImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCategoryImage(file)
    const previewUrl = URL.createObjectURL(file)
    setCategoryImagePreview(previewUrl)
  }

  // Handler for creating new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error(t('common:messages.error'), {
        description: "Category name is required"
      })
      return
    }

    try {
      // Step 1: Create category
      const response = await apiClient.post('/products/categories/create/', { name: newCategoryName.trim() })
      const newCategory = response.data

      // Step 2: Upload image if provided
      if (categoryImage && newCategory.id) {
        try {
          await productsService.uploadCategoryImage(newCategory.id, categoryImage)
        } catch (imageError) {
          console.error("Failed to upload category image:", imageError)
          toast.warning("Warning", {
            description: "Category created but image upload failed"
          })
        }
      }

      toast.success(t('common:messages.success'), {
        description: "Category created successfully"
      })
      
      // Reset state
      setNewCategoryName("")
      setCategoryImage(null)
      if (categoryImagePreview) {
        URL.revokeObjectURL(categoryImagePreview)
        setCategoryImagePreview(null)
      }
      setShowCategoryDialog(false)
      await fetchCategories()
    } catch (error) {
      console.error("Failed to create category:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to create category"
      })
    }
  }

  // Form submission handler
  const onSubmit = async (data: ProductCreateFormValues) => {
    // Frontend validation for overpayment
    if (data.has_payment && calculations.isOverpayment) {
      toast.error(t('paymentExceedsCost'), {
        description: t('overpaymentWarning')
      })
      return
    }

    setIsLoading(true)
    try {
      // Step 1: Upload images if any
      let product_uuid: string | undefined
      let imageUrls: { url: string; is_main: boolean }[] = []

      if (selectedImages.length > 0) {
        const uploadResponse = await productsService.uploadImages(selectedImages)
        product_uuid = uploadResponse.product_uuid
        imageUrls = uploadResponse.images.map((img, index) => ({
          url: img.url,
          is_main: index === 0  // First image is main
        }))
      }

      // Step 2: Create product with batch
      const payload: any = {
        name: data.name,
        description: data.description || "",
        product_type: data.product_type,
        category: parseInt(data.category),
        supplier: parseInt(data.supplier),
        images: imageUrls,
        batch: {
          quantity: parseInt(data.quantity),
          buy_price: data.buy_price,
          sell_price: data.sell_price,
        },
        product_uuid: product_uuid,
        // Step 3: Always include finance with exchange_rate and currency
        finance: {
          exchange_rate: data.exchange_rate || getExchangeRate(),
          currency: "UZS",
        },
      }

      // Step 4: Add payment details to finance if payment provided
      if (data.has_payment && data.amount && parseFloat(data.amount) > 0) {
        payload.finance.currency = data.currency || "UZS"
        payload.finance.amount = data.amount
        payload.finance.method = data.method || "CASH"
      }

      // Step 4: Submit
      await productsService.createProduct(payload)

      toast.success(t('common:messages.success'), {
        description: t('productCreatedSuccessfully')
      })

      onOpenChange(false)
      form.reset()
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Failed to create product:", error)
      
      // Parse backend errors
      const errorMessage = error?.response?.data?.detail || error?.message
      
      if (errorMessage && errorMessage.includes("Payment amount") && errorMessage.includes("cannot exceed")) {
        toast.error(t('paymentExceedsCost'), {
          description: errorMessage
        })
      } else {
        toast.error(t('common:messages.error'), {
          description: t('failedToCreateProduct')
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createProduct')}</DialogTitle>
          <DialogDescription>
            {t('createProductDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('basicInformation')}</h3>
              
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

              {/* Category and Product Type in one row */}
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('category')}</FormLabel>
                      <FormControl>
                        <Combobox
                          items={categories.map((cat) => ({
                            value: String(cat.id),
                            label: cat.name,
                            image: cat.image,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={t('selectCategory')}
                          searchPlaceholder="Search category..."
                          emptyText="No category found."
                          showAddButton={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Add category button in the middle */}
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCategoryDialog(true)}
                    title="Add new category"
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name="product_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('productType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Supplier field with add button */}
              {!supplierId && (
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selectSupplier')}</FormLabel>
                        <FormControl>
                          <Combobox
                            items={suppliers.map((supplier) => ({
                              value: String(supplier.id),
                              label: supplier.company_name,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={t('selectSupplier')}
                            searchPlaceholder="Search supplier..."
                            emptyText="No supplier found."
                            showAddButton={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Add supplier button */}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSupplierDialog(true)}
                      title="Add new supplier"
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Images Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t('images')}</h3>
                <span className="text-sm text-muted-foreground">
                  {t('imagesSelected', { count: selectedImages.length })}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    disabled={selectedImages.length >= 15}
                    className="cursor-pointer"
                    id="image-upload"
                  />
                  <FormDescription className="text-xs">
                    {t('maxImages')}
                  </FormDescription>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                            {t('mainImage')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Batch Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('batchInformation')}</h3>

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('quantity')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="100" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          field.onChange(value)
                        }}
                        value={field.value ? parseInt(field.value).toLocaleString() : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="buy_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buyPrice')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="10,000.00" 
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            field.onChange(value)
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            if (value && !isNaN(parseFloat(value))) {
                              field.onChange(parseFloat(value).toFixed(2))
                            }
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sell_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sellPrice')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="15,000.00" 
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            field.onChange(value)
                          }}
                          onBlur={(e) => {
                            const value = e.target.value
                            if (value && !isNaN(parseFloat(value))) {
                              field.onChange(parseFloat(value).toFixed(2))
                            }
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Finance Section (Optional) */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="has_payment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        {t('addPayment')}
                      </FormLabel>
                      <FormDescription>
                        {t('addPaymentDescription')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {hasPayment && (
                <Card className="p-4 space-y-4">
                  {/* Exchange Rate - Full width */}
                  <FormField
                    control={form.control}
                    name="exchange_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('exchangeRate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder="12500.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount, Currency, Payment Method - Single row */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-6">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('paymentAmount')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="100000.00"
                                className={calculations.isOverpayment ? "border-red-500" : ""}
                                {...field} 
                              />
                            </FormControl>
                            {calculations.isOverpayment && (
                              <p className="text-sm text-red-500">{t('overpaymentWarning')}</p>
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
                            <FormLabel>{t('currency')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
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
                            <FormLabel>{t('paymentMethod')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CASH">{t('paymentMethods.CASH')}</SelectItem>
                                <SelectItem value="CARD">{t('paymentMethods.CARD')}</SelectItem>
                                <SelectItem value="TRANSFER">{t('paymentMethods.TRANSFER')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Payment Summary */}
                  {hasPayment && calculations.totalCost > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('totalCost')} (UZS):</span>
                        <span className="font-medium">{calculations.totalCost.toLocaleString()} UZS</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('totalCost')} (USD):</span>
                        <span className="font-medium">${calculations.totalCostUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('paidAmount')} (UZS):</span>
                        <span className="font-medium">{calculations.paidInUZS.toLocaleString()} UZS</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('paidAmount')} (USD):</span>
                        <span className="font-medium">${calculations.paidInUSD.toLocaleString()}</span>
                      </div>
                      {!calculations.isOverpayment ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('remainingDebt')} (UZS):</span>
                            <span className="font-medium text-orange-600">
                              {calculations.remainingUZS.toLocaleString()} UZS
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t('remainingDebt')} (USD):</span>
                            <span className="font-medium text-orange-600">
                              ${calculations.remainingUSD.toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm text-red-500">
                          <span>{t('overpaymentWarning')}</span>
                          <span>+{Math.abs(calculations.remainingUZS).toLocaleString()} UZS</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )}
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
                disabled={isLoading || (hasPayment && calculations.isOverpayment)}
                className="cursor-pointer"
              >
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Supplier Creation Dialog */}
      <SupplierFormDialog
        open={showSupplierDialog}
        onOpenChange={setShowSupplierDialog}
        onSuccess={async () => {
          await fetchSuppliers()
          setShowSupplierDialog(false)
        }}
      />

      {/* Category Creation Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Enter a name for the new category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="category-name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !categoryImage) {
                    handleCreateCategory()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category-image" className="text-sm font-medium">
                Category Image (Optional)
              </label>
              <Input
                id="category-image"
                type="file"
                accept="image/*"
                onChange={handleCategoryImageSelect}
                className="cursor-pointer"
              />
            </div>

            {categoryImagePreview && (
              <div className="relative w-32 h-32 rounded-lg border overflow-hidden bg-muted">
                <img
                  src={categoryImagePreview}
                  alt="Category preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setCategoryImage(null)
                    if (categoryImagePreview) {
                      URL.revokeObjectURL(categoryImagePreview)
                      setCategoryImagePreview(null)
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false)
                setNewCategoryName("")
                setCategoryImage(null)
                if (categoryImagePreview) {
                  URL.revokeObjectURL(categoryImagePreview)
                  setCategoryImagePreview(null)
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim()}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
