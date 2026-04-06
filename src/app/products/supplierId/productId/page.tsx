"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Package,
  Calendar,
  Layers,
  Plus,
  Pencil,
  Archive,
} from "lucide-react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  productsService,
  type Product,
  type ProductBatch,
  type ProductsListResponse,
} from "@/services/products.service"
import { ProductEditDialog } from "../../components/product-edit-dialog"
import { API_BASE_URL } from "@/config/api"
import { formatVerboseDate } from "@/lib/date-utils"
import { useLanguage } from "@/hooks/use-language"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getExchangeRate } from "@/lib/exchange-rate-storage"

const batchEditSchema = z.object({
  sell_price: z.string().min(1, "Sell price is required"),
})

type BatchEditFormValues = z.infer<typeof batchEditSchema>

const batchCreateSchema = z.object({
  quantity: z.string().min(1, "Quantity is required"),
  buy_price: z.string().min(1, "Buy price is required"),
  sell_price: z.string().min(1, "Sell price is required"),
  has_payment: z.boolean().default(false),
  currency: z.enum(["UZS", "USD"]).optional(),
  exchange_rate: z.string().optional(),
  amount: z.string().optional(),
  method: z.string().optional(),
})

type BatchCreateFormValues = z.infer<typeof batchCreateSchema>

interface ProductImageGalleryProps {
  images: { id: number; url: string; is_main: boolean }[]
  productName: string
  currentIndex: number
  onImageSelect: (index: number) => void
}

// E-commerce style image gallery component
function ProductImageGallery({ images, productName, currentIndex, onImageSelect }: ProductImageGalleryProps) {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center aspect-square bg-muted rounded-lg">
        <Package className="size-24 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Thumbnail sidebar with scroll */}
      <div className="flex flex-col gap-2 w-20 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onImageSelect(index)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:border-primary flex-shrink-0 ${
              index === currentIndex ? 'border-primary' : 'border-border'
            }`}
          >
            <img
              src={`${API_BASE_URL}${image.url}`}
              alt={`${productName} ${index + 1}`}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.currentTarget
                if (!target.dataset.fallback) {
                  target.dataset.fallback = 'true'
                  target.style.display = 'none'
                }
              }}
            />
          </button>
        ))}
      </div>

      {/* Main image display */}
      <div className="flex-1 aspect-square overflow-hidden rounded-lg bg-muted border">
        <img
          src={`${API_BASE_URL}${images[currentIndex].url}`}
          alt={productName}
          className="object-contain w-full h-full"
          onError={(e) => {
            const target = e.currentTarget
            if (!target.dataset.fallback) {
              target.dataset.fallback = 'true'
              target.style.display = 'none'
            }
          }}
        />
      </div>
    </div>
  )
}

export default function MahsulotlarProductDetailPage() {
  const { t } = useTranslation(['products', 'common'])
  const { currentLanguage } = useLanguage()
  const navigate = useNavigate()
  const { supplierId, productId } = useParams<{ supplierId: string; productId: string }>()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [supplierName, setSupplierName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [batchesPage, setBatchesPage] = useState(1)
  const [hasMoreBatches, setHasMoreBatches] = useState(true)
  const [loadingMoreBatches, setLoadingMoreBatches] = useState(false)
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isProductEditDialogOpen, setIsProductEditDialogOpen] = useState(false)

  // Fetch product details and supplier info
  const fetchProductDetails = useCallback(async () => {
    if (!productId || !supplierId) return
    
    setLoading(true)
    try {
      // Fetch product details
      const productData = await productsService.getProductDetail(parseInt(productId))
      setProduct(productData)

      // Fetch supplier info from products list (to get supplier name)
      const productsResponse: ProductsListResponse = await productsService.getProductsBySupplier(
        parseInt(supplierId),
        1
      )
      setSupplierName(productsResponse.supplier.company_name)
    } catch (error) {
      console.error("Failed to fetch product details:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load product details"
      })
    } finally {
      setLoading(false)
    }
  }, [productId, supplierId, t])

  // Fetch product batches with pagination
  const fetchBatches = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!productId) return
    
    if (append) {
      setLoadingMoreBatches(true)
    } else {
      setBatchesLoading(true)
    }
    
    try {
      const response = await productsService.getProductBatches(parseInt(productId), page)
      
      if (append) {
        setBatches(prev => [...prev, ...response.results])
      } else {
        setBatches(response.results)
      }
      
      // Check if there are more pages
      setHasMoreBatches(response.next !== null)
    } catch (error) {
      console.error("Failed to fetch batches:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load batches"
      })
    } finally {
      setBatchesLoading(false)
      setLoadingMoreBatches(false)
    }
  }, [productId, t])

  // Load more batches (infinite scroll)
  const loadMoreBatches = useCallback(() => {
    if (!loadingMoreBatches && hasMoreBatches) {
      const nextPage = batchesPage + 1
      setBatchesPage(nextPage)
      fetchBatches(nextPage, true)
    }
  }, [batchesPage, loadingMoreBatches, hasMoreBatches, fetchBatches])

  useEffect(() => {
    fetchProductDetails()
    fetchBatches()
  }, [fetchProductDetails, fetchBatches])

  // Memoized columns for batches table
  const columns = useMemo<ColumnDef<ProductBatch>[]>(
    () => [
      {
        accessorKey: "id",
        header: t('batchId'),
        cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
      },
      {
        accessorKey: "quantity",
        header: t('quantity'),
        cell: ({ row }) => <span>{row.original.quantity.toLocaleString()}</span>,
      },
      {
        accessorKey: "buy_price",
        header: t('buyPrice'),
        cell: ({ row }) => (
          <span className="font-medium">
            {parseFloat(row.original.buy_price).toLocaleString()} UZS
          </span>
        ),
      },
      {
        accessorKey: "sell_price",
        header: t('sellPrice'),
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {parseFloat(row.original.sell_price).toLocaleString()} UZS
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: t('createdAt'),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatVerboseDate(row.original.created_at, currentLanguage)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className={hoveredRowId === row.original.id ? "opacity-100" : "opacity-0"}
              onClick={(e) => {
                e.stopPropagation()
                setEditingBatch(row.original)
                setIsEditDialogOpen(true)
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, currentLanguage, hoveredRowId]
  )

  const table = useReactTable({
    data: batches,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  const handleBackClick = () => {
    navigate(`/products/${supplierId}`)
  }

  const handleBackToSuppliers = () => {
    navigate('/products')
  }

  // Form for batch editing
  const editForm = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      sell_price: "",
    },
  })

  // Form for batch creation
  const createForm = useForm({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      quantity: "",
      buy_price: "",
      sell_price: "",
      has_payment: false,
      currency: "UZS" as const,
      exchange_rate: getExchangeRate(),
      amount: "",
      method: "CASH",
    },
  })

  // Watch form values for dynamic calculations
  const hasPayment = useWatch({ control: createForm.control, name: "has_payment" })
  const quantity = useWatch({ control: createForm.control, name: "quantity" })
  const buyPrice = useWatch({ control: createForm.control, name: "buy_price" })
  const paymentAmount = useWatch({ control: createForm.control, name: "amount" })
  const currency = useWatch({ control: createForm.control, name: "currency" })
  const exchangeRate = useWatch({ control: createForm.control, name: "exchange_rate" })

  // Calculate payment values
  const calculations = useMemo(() => {
    const qty = parseFloat(quantity) || 0
    const price = parseFloat(buyPrice) || 0
    const payment = parseFloat(paymentAmount || '0') || 0
    const rate = parseFloat(exchangeRate || '1') || 1

    const totalCost = qty * price
    const paidInUZS = currency === "USD" ? payment * rate : payment
    const remainingUZS = totalCost - paidInUZS
    const remainingUSD = remainingUZS / rate
    const isOverpayment = paidInUZS > totalCost && totalCost > 0

    return {
      totalCost,
      paidInUZS,
      remainingUZS,
      remainingUSD: remainingUSD > 0 ? remainingUSD : 0,
      isOverpayment,
    }
  }, [quantity, buyPrice, paymentAmount, currency, exchangeRate])

  const showPaymentSummary = calculations.totalCost > 0

  // Open edit dialog with batch data
  useEffect(() => {
    if (isEditDialogOpen && editingBatch) {
      editForm.reset({
        sell_price: editingBatch.sell_price,
      })
    }
  }, [isEditDialogOpen, editingBatch, editForm])

  // Handle batch update
  const handleBatchUpdate = async (data: BatchEditFormValues) => {
    if (!editingBatch) return

    try {
      await productsService.updateBatch(editingBatch.id, {
        sell_price: data.sell_price,
      })
      
      toast.success(t('common:messages.success'), {
        description: "Batch updated successfully"
      })
      
      // Update the batch in the list
      setBatches(prev => 
        prev.map(batch => 
          batch.id === editingBatch.id 
            ? { ...batch, sell_price: data.sell_price }
            : batch
        )
      )
      
      setIsEditDialogOpen(false)
      setEditingBatch(null)
    } catch (error) {
      console.error("Failed to update batch:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to update batch"
      })
    }
  }

  // Handle batch creation
  const handleBatchCreate = async (data: BatchCreateFormValues) => {
    if (!productId) return

    // Frontend validation for overpayment
    if (data.has_payment && calculations.isOverpayment) {
      toast.error(t('paymentExceedsCost'), {
        description: t('overpaymentWarning')
      })
      return
    }

    try {
      const payload: any = {
        product: parseInt(productId),
        quantity: parseInt(data.quantity),
        buy_price: data.buy_price,
        sell_price: data.sell_price,
      }

      // Add finance if payment is provided
      if (data.has_payment && data.amount && parseFloat(data.amount) > 0) {
        payload.finance = {
          currency: data.currency || "UZS",
          exchange_rate: data.exchange_rate || "1",
          amount: data.amount,
          method: data.method || "CASH",
        }
      }

      const newBatch = await productsService.createBatch(payload)
      
      toast.success(t('common:messages.success'), {
        description: "Batch created successfully"
      })
      
      // Add new batch to the top of the list
      setBatches(prev => [newBatch, ...prev])
      
      setIsCreateDialogOpen(false)
      createForm.reset()
    } catch (error: any) {
      console.error("Failed to create batch:", error)
      
      // Parse backend overpayment error
      const errorMessage = error?.response?.data?.detail || error?.message
      
      if (errorMessage && errorMessage.includes("Payment amount") && errorMessage.includes("cannot exceed")) {
        toast.error(t('paymentExceedsCost'), {
          description: errorMessage
        })
      } else {
        toast.error(t('common:messages.error'), {
          description: "Failed to create batch"
        })
      }
    }
  }

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackToSuppliers} className="cursor-pointer">
                {t('suppliersTitle')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackClick} className="cursor-pointer">
                {supplierName || '...'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product?.name || '...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t('productDetails')}</h1>
        </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[800px] w-full" />
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[380px] w-full" />
          </div>
        </div>
      ) : product ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Product Images - Full Height */}
          <div className="h-full">
            <Card className="h-full">
              <CardContent className="p-6 h-full">
                <ProductImageGallery
                  images={product.images || []}
                  productName={product.name}
                  currentIndex={currentImageIndex}
                  onImageSelect={setCurrentImageIndex}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Product Details + Batches Table */}
          <div className="flex flex-col gap-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline">{product.category_name}</Badge>
                  <Badge>{t(`productTypes.${product.product_type}`)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supplier Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">{t('suppliers')}</h4>
                  <p className="text-base font-medium">{product.supplier_name}</p>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground">{t('description')}</h4>
                    <p className="text-base">{product.description}</p>
                  </div>
                )}

                {/* Created At */}
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-muted-foreground">{t('createdAt')}</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-base">{formatVerboseDate(product.created_at, currentLanguage)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 cursor-pointer"
                    onClick={() => setIsProductEditDialogOpen(true)}
                  >
                    <Pencil className="size-4 mr-2" />
                    {t('editProduct')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      toast.info("Archive functionality coming soon")
                    }}
                  >
                    <Archive className="size-4 mr-2" />
                    {t('archiveProduct')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Batches Table */}
            <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('batches')}</CardTitle>
              <CardDescription>
                {batches.length} {t('batches').toLowerCase()}
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="cursor-pointer"
            >
              <Plus className="size-4 mr-2" />
              {t('importNewBatch')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : batches.length > 0 ? (
            <div 
              className="rounded-md border max-h-[400px] overflow-y-auto"
              onScroll={(e) => {
                const target = e.currentTarget
                const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight
                // Load more when scrolled to 80%
                if (scrollPercentage > 0.8 && hasMoreBatches && !loadingMoreBatches) {
                  loadMoreBatches()
                }
              }}
            >
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow 
                      key={row.id}
                      onMouseEnter={() => setHoveredRowId(row.original.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {loadingMoreBatches && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm text-muted-foreground">{t('common:actions.loading')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noBatches')}</h3>
              <p className="text-sm text-muted-foreground">{t('common:messages.noData')}</p>
            </div>
          )}
        </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Batch Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('common:actions.edit')} {t('batches')}</DialogTitle>
            <DialogDescription>
              {t('batchId')}: #{editingBatch?.id}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleBatchUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="sell_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sellPrice')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('sellPrice')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={editForm.formState.isSubmitting}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                  {editForm.formState.isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Batch Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('importNewBatch')}</DialogTitle>
            <DialogDescription>
              {product?.name}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleBatchCreate)} className="space-y-4">
              {/* Quantity */}
              <FormField
                control={createForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('quantity')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('quantity')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buy Price */}
              <FormField
                control={createForm.control}
                name="buy_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('buyPrice')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('buyPrice')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sell Price */}
              <FormField
                control={createForm.control}
                name="sell_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sellPrice')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('sellPrice')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Has Payment Checkbox */}
              <FormField
                control={createForm.control}
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
                      <FormLabel>{t('addPayment')}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Payment Section */}
              {hasPayment && (
                <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                  <h4 className="text-sm font-medium">{t('paymentDetails')}</h4>
                  
                  {/* Exchange Rate - Full width */}
                  <FormField
                    control={createForm.control}
                    name="exchange_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('exchangeRate')} *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={t('exchangeRate')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount, Currency, Payment Method - Single row */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* Payment Amount */}
                    <div className="col-span-6">
                      <FormField
                        control={createForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('paymentAmount')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={t('paymentAmount')}
                                className={calculations.isOverpayment ? "border-red-500 focus-visible:ring-red-500" : ""}
                                {...field}
                              />
                            </FormControl>
                            {calculations.isOverpayment && (
                              <p className="text-sm font-medium text-red-500">
                                {t('overpaymentWarning')}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Currency */}
                    <div className="col-span-3">
                      <FormField
                        control={createForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('currency')} *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('currency')} />
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

                    {/* Payment Method */}
                    <div className="col-span-3">
                      <FormField
                        control={createForm.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('paymentMethod')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('paymentMethod')} />
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

                </div>
              )}

              {/* Payment Summary */}
              {showPaymentSummary && (
                <div className="space-y-2 rounded-md border p-4">
                  <h4 className="text-sm font-semibold">{t('paymentSummary')}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('totalCost')}:</span>
                      <span className="font-medium">{calculations.totalCost.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('paidAmount')}:</span>
                      <span className="font-medium">{calculations.paidInUZS.toLocaleString()} UZS</span>
                    </div>
                    {!calculations.isOverpayment ? (
                      <>
                        <div className="flex justify-between text-primary font-semibold">
                          <span>{t('remainingDebt')} (UZS):</span>
                          <span>{calculations.remainingUZS.toLocaleString()} UZS</span>
                        </div>
                        <div className="flex justify-between text-primary font-semibold">
                          <span>{t('remainingDebt')} (USD):</span>
                          <span>${calculations.remainingUSD.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-red-500 font-semibold">
                        <span>{t('overpaymentWarning')}</span>
                        <span>+{Math.abs(calculations.remainingUZS).toLocaleString()} UZS</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createForm.formState.isSubmitting}
                >
                  {t('common:actions.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createForm.formState.isSubmitting || (hasPayment && calculations.isOverpayment)}
                >
                  {createForm.formState.isSubmitting ? t('common:actions.saving') : t('common:actions.save')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Edit Dialog */}
      <ProductEditDialog
        open={isProductEditDialogOpen}
        onOpenChange={setIsProductEditDialogOpen}
        product={product}
        onSuccess={() => {
          // Refresh product details after update
          fetchProductDetails()
        }}
      />
      </div>
    </BaseLayout>
  )
}
