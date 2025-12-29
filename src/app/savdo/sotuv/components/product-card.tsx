"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Package, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
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
  const { t } = useTranslation("sales")
  // Local state for input value - allows free editing without affecting cart immediately
  const [inputValue, setInputValue] = useState<string>(cartQuantity.toString())

  // Sync local input value when cart quantity changes externally (e.g., from +/- buttons or cart sidebar)
  useEffect(() => {
    setInputValue(cartQuantity.toString())
  }, [cartQuantity])
  const handleClick = () => {
    if (product.quantity <= 0) return
    
    if (isInCart) {
      // Remove from cart if already in cart (toggle behavior)
      onUpdateQuantity(product.id, 0)
    } else {
      // Add to cart if not in cart
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
    
    // Allow any input including empty - just update local state
    // Only allow digits
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value)
      
      // Alert user when quantity matches max stock
      const numericValue = parseInt(value, 10)
      if (!isNaN(numericValue) && numericValue === product.quantity) {
        toast.warning(t("cartItem.maxStockReached", { stock: product.quantity }))
      }
    }
  }

  const handleQuantityInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const value = inputValue.trim()
    
    // If input is empty or invalid on blur, reset to current cart quantity
    if (value === '') {
      setInputValue(cartQuantity.toString())
      return
    }
    
    const newQuantity = parseInt(value, 10)
    
    // Validate and apply the quantity
    if (isNaN(newQuantity) || newQuantity <= 0) {
      // Reset to current cart quantity if invalid
      setInputValue(cartQuantity.toString())
    } else if (newQuantity > product.quantity) {
      // Cap at max stock
      onUpdateQuantity(product.id, product.quantity)
      setInputValue(product.quantity.toString())
    } else {
      // Apply valid quantity
      onUpdateQuantity(product.id, newQuantity)
    }
  }

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur() // Trigger blur to apply the value
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
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityInputBlur}
              onKeyDown={handleQuantityInputKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-16 h-8 text-center font-semibold text-lg"
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
