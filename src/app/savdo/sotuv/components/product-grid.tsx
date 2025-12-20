"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProductCard } from "./product-card"
import { salesService } from "@/services/sales.service"
import type { SaleProduct } from "@/types/sales"
import { toast } from "sonner"

interface ProductGridProps {
  onAddToCart: (product: SaleProduct) => void
  isInCart: (productId: number) => boolean
}

export function ProductGrid({ onAddToCart, isInCart }: ProductGridProps) {
  const { t } = useTranslation('sales')
  const [products, setProducts] = useState<SaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await salesService.getProductsForSale({
        page: pageNum,
        page_size: 20,
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
      })

      if (isInitial) {
        setProducts(response.results)
      } else {
        setProducts(prev => [...prev, ...response.results])
      }

      // Check if there are more pages
      setHasMore(response.next !== null)
      
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error(t('messages.loadError'))
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [searchQuery, selectedCategory, t])

  // Initial fetch and reset on search/category change
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchProducts(1, true)
  }, [searchQuery, selectedCategory, fetchProducts])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchProducts(nextPage, false)
        }
      },
      { threshold: 0.1 }
    )

    const currentLoadMoreRef = loadMoreRef.current
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef)
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef)
      }
    }
  }, [loading, loadingMore, hasMore, page, fetchProducts])

  // Get unique categories
  const categories = useMemo(() => {
    const categoryMap = new Map<number, string>()
    products.forEach(product => {
      if (product.category) {
        categoryMap.set(product.category.id, product.category.name)
      }
    })
    return Array.from(categoryMap, ([id, name]) => ({ id, name }))
  }, [products])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {products.length === 0 && !loading ? (
        <Card className="flex-1">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('noProducts')}</h3>
            <p className="text-muted-foreground">{t('noProductsDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isInCart={isInCart(product.id)}
              />
            ))}
          </div>

          {/* Load more trigger and loading indicator */}
          {hasMore && (
            <div
              ref={loadMoreRef}
              className="flex items-center justify-center py-8"
            >
              {loadingMore && (
                <>
                  <LoadingSpinner size="md" />
                  <span className="ml-3 text-muted-foreground">{t('loadingMore')}</span>
                </>
              )}
            </div>
          )}

          {/* End of products message */}
          {!hasMore && products.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">{t('allProductsLoaded')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
