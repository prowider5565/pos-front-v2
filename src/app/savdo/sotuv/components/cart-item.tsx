"use client"

import { useTranslation } from "react-i18next"
import { Trash2, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CartItem as CartItemType } from "@/types/sales"

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemove: (productId: number) => void
  quantityInputValue: string
  onQuantityInputChange: (productId: number, value: string) => void
  onQuantityInputCommit: (productId: number, maxQuantity: number) => void
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  quantityInputValue,
  onQuantityInputChange,
  onQuantityInputCommit,
}: CartItemProps) {
  const { t } = useTranslation('sales')
  
  const { product, quantity } = item
  const total = product.sell_price * quantity
  
  const hasStockError = quantity > product.quantity
  const isAtMinQuantity = quantity <= 1

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      onQuantityInputChange(product.id, value)

      const numericValue = parseInt(value, 10)
      if (!Number.isNaN(numericValue) && numericValue > 0 && numericValue <= product.quantity) {
        onUpdateQuantity(product.id, numericValue)
      }
    }
  }

  const handleQuantityBlur = () => {
    onQuantityInputCommit(product.id, product.quantity)
  }

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const incrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdateQuantity(product.id, quantity + 1)
  }

  const decrementQuantity = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (quantity > 1) {
      onUpdateQuantity(product.id, quantity - 1)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(product.id)
  }

  return (
    <tr className={`border-b ${hasStockError ? 'bg-destructive/5' : ''}`}>
      {/* Product Name & Price */}
      <td className="p-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {product.sell_price.toLocaleString()} UZS
          </p>
          {hasStockError && (
            <p className="text-xs text-destructive">
              {t('cartItem.stockError', { stock: product.quantity })}
            </p>
          )}
        </div>
      </td>

      {/* Quantity Controls */}
      <td className="p-2">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={decrementQuantity}
            disabled={isAtMinQuantity}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="text"
            inputMode="numeric"
            value={quantityInputValue}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            onKeyDown={handleQuantityKeyDown}
            className="h-7 w-14 text-center px-1"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={incrementQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </td>

      {/* Total */}
      <td className="p-2 text-right">
        <p className="text-sm font-semibold">
          {total.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">UZS</p>
      </td>

      {/* Remove Button */}
      <td className="p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleRemove}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </td>
    </tr>
  )
}
