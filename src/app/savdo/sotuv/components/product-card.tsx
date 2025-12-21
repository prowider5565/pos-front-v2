"use client"

import { Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LazyImage } from "@/components/ui/lazy-image"
import { MEDIA_BASE_URL } from "@/config/api"
import type { SaleProduct } from "@/types/sales"

interface ProductCardProps {
  product: SaleProduct
  onAddToCart: (product: SaleProduct) => void
  isInCart: boolean
}

export function ProductCard({ product, onAddToCart, isInCart }: ProductCardProps) {
  const handleClick = () => {
    // Allow toggle - add if not in cart, or trigger remove if already in cart
    if (product.quantity > 0) {
      onAddToCart(product)
    }
  }

  return (
    <Card
      key={product.id}
      role={product.quantity > 0 ? "button" : undefined}
      tabIndex={product.quantity > 0 ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (product.quantity <= 0) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`overflow-hidden transition-all hover:shadow-lg hover:border-primary group p-0 pb-4 ${
        product.quantity > 0 ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
      } ${isInCart ? 'border-2 border-primary' : ''}`}
    >
      {/* Product Image - flush with card top */}
      <div className="relative">
        {product.cover_image ? (
          <LazyImage
            src={`${MEDIA_BASE_URL}${product.cover_image}`}
            alt={product.name}
            aspectRatio="square"
            objectFit="cover"
            fallback={
              <Package className="size-12 text-muted-foreground" />
            }
          />
        ) : (
          <div className="aspect-square flex items-center justify-center bg-muted">
            <Package className="size-12 text-muted-foreground" />
          </div>
        )}
        <Badge className="absolute top-2 right-2">
          {product.category?.name || 'N/A'}
        </Badge>
      </div>

      <CardHeader>
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
