"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
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
import { productsService, type Category, type Product, type ProductImage } from "@/services/products.service"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { API_BASE_URL } from "@/config/api"

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

interface ApiErrorResponse {
  response?: {
    data?: {
      barcode_number?: string[]
      detail?: string
      image?: string[]
      name?: string[]
    }
  }
  message?: string
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
  const [showCategoryEditDialog, setShowCategoryEditDialog] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryImage, setCategoryImage] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const [isCategorySaving, setIsCategorySaving] = useState(false)
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([])

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

  const refreshCategories = async () => {
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
      const productCategoryValue = product.category ? String(product.category) : ""

      form.reset({
        name: product.name,
        description: product.description || "",
        barcode_number: product.barcode_number || "",
        product_type: product.product_type,
        category: productCategoryValue,
      })
      setProductImages(product.images || [])
    }
  }, [product, open, form])

  useEffect(() => {
    if (!open || !product || !product.category || categories.length === 0) return

    const expectedCategoryValue = String(product.category)
    const hasMatchingCategory = categories.some((category) => String(category.id) === expectedCategoryValue)

    if (hasMatchingCategory) {
      form.setValue("category", expectedCategoryValue, {
        shouldDirty: false,
        shouldTouch: false,
      })
    }
  }, [categories, open, product, form])

  useEffect(() => {
    return () => {
      if (categoryImagePreview) {
        URL.revokeObjectURL(categoryImagePreview)
      }
    }
  }, [categoryImagePreview])

  useEffect(() => {
    return () => {
      pendingImagePreviews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [pendingImagePreviews])

  const currentCategoryId = formCategoryValueToNumber(form.watch("category"))
  const selectedCategory =
    categories.find((category) => category.id === currentCategoryId) ||
    (product?.category
      ? {
          id: product.category,
          name: product.category_name || "",
          image: product.category_image || undefined,
          created_at: "",
        }
      : null)
  const categoryImageUrl = categoryImagePreview || getCategoryImageUrl(selectedCategory?.image)

  function formCategoryValueToNumber(value: string): number | null {
    if (!value) return null
    const parsedValue = Number(value)
    return Number.isNaN(parsedValue) ? null : parsedValue
  }

  function getCategoryImageUrl(imagePath?: string): string | null {
    if (!imagePath) return null
    return imagePath.startsWith("http") ? imagePath : `${API_BASE_URL}${imagePath}`
  }

  const resetCategoryEditor = () => {
    setCategoryName(selectedCategory?.name || "")
    setCategoryImage(null)
    setCategoryImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }
      return null
    })
  }

  const handleOpenCategoryEditor = () => {
    if (!selectedCategory) {
      toast.error(t('common:messages.error'), {
        description: "Please select a category first"
      })
      return
    }

    resetCategoryEditor()
    setShowCategoryEditDialog(true)
  }

  const handleCategoryImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCategoryImage(file)
    setCategoryImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }
      return URL.createObjectURL(file)
    })
  }

  const handleRemoveCategoryImage = () => {
    setCategoryImage(null)
    setCategoryImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }
      return null
    })
  }

  const handlePendingImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const selectedFiles = Array.from(files)
    const totalImages = productImages.length + pendingImages.length + selectedFiles.length

    if (totalImages > 15) {
      toast.error(t('common:messages.error'), {
        description: t('maxImages')
      })
      return
    }

    setPendingImages((currentImages) => [...currentImages, ...selectedFiles])
    setPendingImagePreviews((currentPreviews) => [
      ...currentPreviews,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ])

    event.target.value = ""
  }

  const handleRemovePendingImage = (index: number) => {
    const previewToRemove = pendingImagePreviews[index]
    if (previewToRemove) {
      URL.revokeObjectURL(previewToRemove)
    }

    setPendingImages((currentImages) => currentImages.filter((_, imageIndex) => imageIndex !== index))
    setPendingImagePreviews((currentPreviews) => currentPreviews.filter((_, previewIndex) => previewIndex !== index))
  }

  const handleUploadProductImages = async () => {
    if (!product || pendingImages.length === 0) return

    setIsUploadingImages(true)
    try {
      const response = await productsService.addProductImages(product.id, pendingImages)
      setProductImages((currentImages) => [...currentImages, ...response.images])
      pendingImagePreviews.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
      setPendingImages([])
      setPendingImagePreviews([])

      toast.success(t('common:messages.success'), {
        description: "Product images added successfully"
      })

      onSuccess?.()
    } catch (error) {
      console.error("Failed to add product images:", error)
      const apiError = error as ApiErrorResponse
      const errorMessage = apiError.response?.data?.detail || apiError.message || t('failedToUploadImages')

      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    } finally {
      setIsUploadingImages(false)
    }
  }

  const handleDeleteProductImage = async (imageId: number) => {
    setDeletingImageIds((currentIds) => [...currentIds, imageId])
    try {
      await productsService.deleteProductImage(imageId)
      setProductImages((currentImages) => currentImages.filter((image) => image.id !== imageId))

      toast.success(t('common:messages.success'), {
        description: "Product image deleted successfully"
      })

      onSuccess?.()
    } catch (error) {
      console.error("Failed to delete product image:", error)
      const apiError = error as ApiErrorResponse
      const errorMessage = apiError.response?.data?.detail || apiError.message || "Failed to delete product image"

      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    } finally {
      setDeletingImageIds((currentIds) => currentIds.filter((currentId) => currentId !== imageId))
    }
  }

  const handleCategoryUpdate = async () => {
    if (!selectedCategory) return

    const trimmedName = categoryName.trim()
    if (!trimmedName) {
      toast.error(t('common:messages.error'), {
        description: "Category name is required"
      })
      return
    }

    setIsCategorySaving(true)
    try {
      const shouldUpdateName = trimmedName !== selectedCategory.name
      const shouldUpdateImage = Boolean(categoryImage)

      if (shouldUpdateName) {
        await productsService.updateCategory(selectedCategory.id, { name: trimmedName })
      }

      if (shouldUpdateImage && categoryImage) {
        await productsService.updateCategoryImage(selectedCategory.id, categoryImage)
      }

      await refreshCategories()
      form.setValue("category", String(selectedCategory.id), {
        shouldDirty: true,
        shouldTouch: true,
      })

      toast.success(t('common:messages.success'), {
        description: "Category updated successfully"
      })

      setShowCategoryEditDialog(false)
      resetCategoryEditor()
    } catch (error: unknown) {
      console.error("Failed to update category:", error)
      const apiError = error as ApiErrorResponse
      const errorMessage =
        apiError.response?.data?.detail ||
        apiError.response?.data?.name?.[0] ||
        apiError.response?.data?.image?.[0] ||
        apiError.message ||
        "Failed to update category"

      toast.error(t('common:messages.error'), {
        description: errorMessage
      })
    } finally {
      setIsCategorySaving(false)
    }
  }

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
    } catch (error: unknown) {
      console.error("Failed to update product:", error)

      const apiError = error as ApiErrorResponse
      const barcodeErrors = apiError.response?.data?.barcode_number
      const errorMessage = apiError.response?.data?.detail || apiError.message

      if (Array.isArray(barcodeErrors) && barcodeErrors.length > 0) {
        form.setError("barcode_number", {
          type: "server",
          message: t('barcodeNumberAlreadyExists'),
        })
        toast.error(t('common:messages.error'), {
          description: t('barcodeNumberAlreadyExists')
        })
      } else {
        toast.error(t('common:messages.error'), {
          description: errorMessage || t('failedToUpdateProduct')
        })
      }
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>{t('images')}</FormLabel>
                <span className="text-sm text-muted-foreground">
                  {t('imagesSelected', { count: productImages.length + pendingImages.length })}
                </span>
              </div>

              <div className="space-y-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.bmp"
                  multiple
                  onChange={handlePendingImageSelect}
                  disabled={isUploadingImages || productImages.length + pendingImages.length >= 15}
                  className="cursor-pointer"
                />

                {pendingImages.length > 0 && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <span className="text-sm text-muted-foreground">
                      {pendingImages.length} image(s) ready to upload
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadProductImages}
                      disabled={isUploadingImages}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isUploadingImages ? t('common:actions.saving') : t('common:buttons.add')}
                    </Button>
                  </div>
                )}

                {(productImages.length > 0 || pendingImagePreviews.length > 0) && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {productImages.map((image) => {
                      const imageUrl = image.url.startsWith("http") ? image.url : `${API_BASE_URL}${image.url}`
                      const isDeleting = deletingImageIds.includes(image.id)

                      return (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={imageUrl}
                              alt={product?.name || "Product image"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                            onClick={() => handleDeleteProductImage(image.id)}
                            disabled={isDeleting}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {image.is_main && (
                            <div className="absolute bottom-1 left-1 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              {t('mainImage')}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {pendingImagePreviews.map((previewUrl, index) => (
                      <div key={previewUrl} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border border-dashed bg-muted">
                          <img
                            src={previewUrl}
                            alt={`Pending upload ${index + 1}`}
                            className="h-full w-full object-cover opacity-80"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                          onClick={() => handleRemovePendingImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category and Product Type - horizontal layout */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('category')}</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        key={`${field.value || "empty"}-${categories.length}`}
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
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
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={handleOpenCategoryEditor}
                        disabled={!field.value || isLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
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

      <Dialog
        open={showCategoryEditDialog}
        onOpenChange={(nextOpen) => {
          setShowCategoryEditDialog(nextOpen)
          if (!nextOpen) {
            resetCategoryEditor()
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the selected category name and image
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="edit-category-name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="edit-category-name"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Enter category name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-category-image" className="text-sm font-medium">
                Category Image
              </label>
              <Input
                id="edit-category-image"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.bmp"
                onChange={handleCategoryImageSelect}
                className="cursor-pointer"
              />
            </div>

            {categoryImageUrl && (
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border bg-muted">
                <img
                  src={categoryImageUrl}
                  alt={categoryName || selectedCategory?.name || "Category image"}
                  className="h-full w-full object-cover"
                />
                {categoryImagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveCategoryImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryEditDialog(false)
                resetCategoryEditor()
              }}
              disabled={isCategorySaving}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCategoryUpdate}
              disabled={isCategorySaving}
            >
              {isCategorySaving ? t('common:actions.saving') : t('common:actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
