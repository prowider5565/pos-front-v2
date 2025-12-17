"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft,
  Package,
  Building2,
  Phone,
  User,
  Calendar,
  Tag,
  Layers,
} from "lucide-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
import { MEDIA_BASE_URL } from "@/config/api"

export default function MahsulotlarProductDetailPage() {
  const { t } = useTranslation(['products', 'common'])
  const navigate = useNavigate()
  const { supplierId, productId } = useParams<{ supplierId: string; productId: string }>()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [batches, setBatches] = useState<ProductBatch[]>([])
  const [supplierName, setSupplierName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  // Fetch product batches
  const fetchBatches = useCallback(async () => {
    if (!productId) return
    
    setBatchesLoading(true)
    try {
      const response = await productsService.getProductBatches(parseInt(productId))
      setBatches(response.results)
    } catch (error) {
      console.error("Failed to fetch batches:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load batches"
      })
    } finally {
      setBatchesLoading(false)
    }
  }, [productId, t])

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
          <span className="text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [t]
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={handleBackToSuppliers} className="cursor-pointer">
              {t('title')}
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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : product ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Images */}
            <Card>
              <CardContent className="p-6">
                {product.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                      <img
                        src={`${MEDIA_BASE_URL}${product.images[currentImageIndex].url}`}
                        alt={product.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.png'
                        }}
                      />
                    </div>
                    {product.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {product.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex
                                ? 'border-primary'
                                : 'border-transparent hover:border-muted-foreground'
                            }`}
                          >
                            <img
                              src={`${MEDIA_BASE_URL}${image.url}`}
                              alt={`${product.name} ${index + 1}`}
                              className="object-cover w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center bg-muted rounded-lg">
                    <Package className="size-24 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.category.name}</Badge>
                      <Badge>{t(`productTypes.${product.product_type}`)}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t('description')}</h4>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('sellPrice')}</p>
                    <p className="text-2xl font-bold">{product.sell_price.toLocaleString()} UZS</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('totalQuantity')}</p>
                    <p className="text-2xl font-bold">{product.quantity.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    {t('createdAt')}: {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Supplier Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('supplierInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="size-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{supplierName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('batches')}</CardTitle>
              <CardDescription>
                {batches.length} {t('batches').toLowerCase()}
              </CardDescription>
            </div>
            <Layers className="size-5 text-muted-foreground" />
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
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
                    <TableRow key={row.id}>
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
  )
}
