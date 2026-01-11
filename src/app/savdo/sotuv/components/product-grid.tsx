"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, Filter, FolderOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProductCard } from "./product-card"
import { salesService } from "@/services/sales.service"
import { productsService, type Category } from "@/services/products.service"
import type { SaleProduct } from "@/types/sales"
import { toast } from "sonner"

interface ProductGridProps {
  onAddToCart: (product: SaleProduct) => void
  isInCart: (productId: number) => boolean
  onUpdateQuantity: (productId: number, quantity: number) => void
  getItemQuantity: (productId: number) => number
  isCartOpen?: boolean
}

export function ProductGrid({ onAddToCart, isInCart, onUpdateQuantity, getItemQuantity, isCartOpen = false }: ProductGridProps) {
  const { t } = useTranslation('sales')
  const [products, setProducts] = useState<SaleProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [initialLoading, setInitialLoading] = useState(true) // Only for first page load
  const [searching, setSearching] = useState(false) // For search/filter loading
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number, isInitial: boolean = false, isFirstLoad: boolean = false) => {
    try {
      if (isFirstLoad) {
        setInitialLoading(true)
      } else if (isInitial) {
        setSearching(true)
      } else {
        setLoadingMore(true)
      }

      const response = await salesService.getProductsForSale({
        page: pageNum,
        page_size: 20,
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
      })

      if (isInitial || isFirstLoad) {
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
      if (isFirstLoad) {
        setInitialLoading(false)
      } else if (isInitial) {
        setSearching(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [searchQuery, selectedCategory, t])

  // Track if this is the first load
  const isFirstLoadRef = useRef(true)

  // Initial fetch and reset on search/category change
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    if (isFirstLoadRef.current) {
      fetchProducts(1, true, true) // First load - show full page loading
      isFirstLoadRef.current = false
    } else {
      fetchProducts(1, true, false) // Subsequent searches - keep search bar visible
    }
  }, [searchQuery, selectedCategory, fetchProducts])

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (initialLoading || searching || loadingMore || !hasMore) return

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
  }, [initialLoading, searching, loadingMore, hasMore, page, fetchProducts])

  // Fetch all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsService.getCategories()
        setCategories(response.results)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Find selected category for display
  const selectedCategoryData = categories.find(c => c.id.toString() === selectedCategory)

  // Show full-page loading only on initial load
  if (initialLoading) {
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
            <div className="flex items-center gap-2">
              {selectedCategory === 'all' ? (
                <>
                  <Filter className="h-4 w-4" />
                  <span>{t('allCategories')}</span>
                </>
              ) : selectedCategoryData ? (
                <>
                  {selectedCategoryData.image ? (
                    <img 
                      src={selectedCategoryData.image} 
                      alt=""
                      className="h-5 w-5 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span>{selectedCategoryData.name}</span>
                </>
              ) : null}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>{t('allCategories')}</span>
              </div>
            </SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                <div className="flex items-center gap-2">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="h-5 w-5 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <FolderOpen className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {searching ? (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">{t('loading')}</span>
        </div>
      ) : products.length === 0 ? (
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
          <div className={`grid gap-4 grid-cols-2 md:grid-cols-3 ${isCartOpen ? 'lg:grid-cols-3 xl:grid-cols-3' : 'lg:grid-cols-4 xl:grid-cols-5'}`}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                isInCart={isInCart(product.id)}
                onUpdateQuantity={onUpdateQuantity}
                cartQuantity={getItemQuantity(product.id)}
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
