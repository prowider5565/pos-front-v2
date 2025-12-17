"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Package, Search, Pencil, Archive } from "lucide-react"

import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { productsService, type Product, type ProductsListResponse, type SupplierInfo } from "@/services/products.service"
import { MEDIA_BASE_URL } from "@/config/api"

export default function MahsulotlarProductsPage() {
  const { t } = useTranslation(['products', 'common'])
  const navigate = useNavigate()
  const { supplierId } = useParams<{ supplierId: string }>()
  
  const [products, setProducts] = useState<Product[]>([])
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Memoized fetch function with search support
  const fetchProducts = useCallback(async (page: number, search?: string) => {
    if (!supplierId) return
    
    setLoading(true)
    try {
      // Note: API endpoint needs to support search parameter
      // For now, we'll pass it and handle it on backend
      const response: ProductsListResponse = await productsService.getProductsBySupplier(
        parseInt(supplierId),
        page,
        search
      )
      setProducts(response.results)
      setSupplier(response.supplier)
      setTotalPages(response.total_pages)
      setTotalCount(response.count)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast.error(t('common:messages.error'), {
        description: "Failed to load products"
      })
    } finally {
      setLoading(false)
    }
  }, [supplierId, t])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 1 when searching
      if (searchQuery) {
        setCurrentPage(1)
      }
      fetchProducts(searchQuery ? 1 : currentPage, searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, currentPage, fetchProducts])

  const handleProductClick = (productId: number) => {
    navigate(`/products/${supplierId}/${productId}`)
  }

  const handleBackClick = () => {
    navigate('/products')
  }

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackClick} className="cursor-pointer">
                {t('suppliersTitle')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{supplier?.company_name || '...'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
              <p className="text-muted-foreground">{supplier?.company_name}</p>
            </div>
          </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchProducts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-all hover:shadow-lg hover:border-primary group p-0 pb-4"
            >
              {/* Product Image - flush with card top */}
              <div 
                className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                {product.cover_image ? (
                  <>
                    <img
                      src={`${MEDIA_BASE_URL}${product.cover_image}`}
                      alt={product.name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.currentTarget
                        // Prevent infinite loop by only setting fallback once
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = 'true'
                          target.style.display = 'none'
                          // Show fallback icon
                          const fallback = target.nextElementSibling
                          if (fallback) {
                            fallback.classList.remove('hidden')
                          }
                        }
                      }}
                    />
                    <div className="hidden flex items-center justify-center w-full h-full absolute inset-0">
                      <Package className="size-12 text-muted-foreground" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Package className="size-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2">
                  {t(`productTypes.${product.product_type}`)}
                </Badge>
              </div>

              <CardHeader className="cursor-pointer" onClick={() => handleProductClick(product.id)}>
                <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                <CardDescription className="line-clamp-1">{product.category.name}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('sellPrice')}:</span>
                    <span className="text-lg font-bold">{product.sell_price.toLocaleString()} UZS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('quantity')}:</span>
                    <span className="text-sm font-medium">{product.quantity}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement edit functionality
                      toast.info(t('common:messages.comingSoon'))
                    }}
                  >
                    <Pencil className="size-3 mr-1" />
                    {t('common:actions.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement archive functionality
                      toast.info(t('common:messages.comingSoon'))
                    }}
                  >
                    <Archive className="size-3 mr-1" />
                    {t('common:actions.archive')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noProducts')}</h3>
            <p className="text-sm text-muted-foreground">{t('common:messages.noData')}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {t('common:table.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common:table.page')} {currentPage} {t('common:table.of')} {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common:table.next')}
          </Button>
        </div>
      )}
      </div>
    </BaseLayout>
  )
}
