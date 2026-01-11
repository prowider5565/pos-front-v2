"use client"

import { Package, Minus, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LazyImage } from "@/components/ui/lazy-image"
import { API_BASE_URL } from "@/config/api"
import type { SaleProduct } from "@/types/sales"

interface ProductCardProps {
  product: SaleProduct
  onAddToCart: (product: SaleProduct) => void
  isInCart: boolean
  onUpdateQuantity: (productId: number, quantity: number) => void
  cartQuantity: number
}

export function ProductCard({ product, onAddToCart, isInCart, onUpdateQuantity, cartQuantity }: ProductCardProps) {
  const handleClick = () => {
    // Only add to cart if not already in cart and has stock
    if (product.quantity > 0 && !isInCart) {
      onAddToCart(product)
    }
  }

  const incrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartQuantity < product.quantity) {
      onUpdateQuantity(product.id, cartQuantity + 1)
    }
  }

  const decrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartQuantity > 1) {
      onUpdateQuantity(product.id, cartQuantity - 1)
    } else {
      // Remove from cart if quantity becomes 0
      onUpdateQuantity(product.id, 0)
    }
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const value = e.target.value
    
    // Allow empty input for easier editing
    if (value === '') {
      return
    }
    
    const newQuantity = parseInt(value, 10)
    
    // Validate the input
    if (isNaN(newQuantity) || newQuantity < 0) {
      return
    }
    
    // Clamp to valid range (0 to stock quantity)
    if (newQuantity === 0) {
      onUpdateQuantity(product.id, 0) // Remove from cart
    } else if (newQuantity > product.quantity) {
      onUpdateQuantity(product.id, product.quantity) // Cap at max stock
    } else {
      onUpdateQuantity(product.id, newQuantity)
    }
  }

  const handleQuantityInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation()
    // If input is empty or invalid on blur, reset to 1
    const value = e.target.value
    if (value === '' || parseInt(value, 10) <= 0) {
      onUpdateQuantity(product.id, 1)
    }
  }

  return (
    <Card
      key={product.id}
      role={product.quantity > 0 && !isInCart ? "button" : undefined}
      tabIndex={product.quantity > 0 && !isInCart ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (product.quantity <= 0 || isInCart) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`overflow-hidden transition-all hover:shadow-lg hover:border-primary group p-0 pb-4 ${
        product.quantity > 0 && !isInCart ? 'cursor-pointer' : isInCart ? '' : 'opacity-60 cursor-not-allowed'
      } ${isInCart ? 'border-2 border-primary' : ''}`}
    >
      {/* Product Image - flush with card top */}
      <div className="relative">
        {product.cover_image ? (
          <LazyImage
            src={`${API_BASE_URL}${product.cover_image}`}
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

        {/* Quantity Controls - shown when product is in cart */}
        {isInCart && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decrementQuantity}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              max={product.quantity}
              value={cartQuantity}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityInputBlur}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-8 text-center font-semibold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={incrementQuantity}
              disabled={cartQuantity >= product.quantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
