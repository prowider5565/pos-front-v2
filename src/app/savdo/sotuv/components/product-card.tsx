"use client"

import { Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MEDIA_BASE_URL } from "@/config/api"
import type { SaleProduct } from "@/types/sales"

interface ProductCardProps {
  product: SaleProduct
  onAddToCart: (product: SaleProduct) => void
  isInCart: boolean
}

export function ProductCard({ product, onAddToCart, isInCart }: ProductCardProps) {
  const handleClick = () => {
    // Only add to cart if not already in cart and has stock
    if (!isInCart && product.quantity > 0) {
      onAddToCart(product)
    }
  }

  return (
    <Card
      key={product.id}
      className="overflow-hidden transition-all hover:shadow-lg hover:border-primary group p-0 pb-4"
    >
      {/* Product Image - flush with card top */}
      <div 
        className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={handleClick}
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
          {product.category?.name || 'N/A'}
        </Badge>
      </div>

      <CardHeader className="cursor-pointer" onClick={handleClick}>
        <CardTitle className="line-clamp-2">{product.name}</CardTitle>
        <CardDescription className="line-clamp-1">{product.category?.name || 'N/A'}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="text-lg font-bold">{product.sell_price.toLocaleString()} UZS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stock:</span>
            <span className="text-sm font-medium">{product.quantity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
