import { useState, useMemo, useCallback } from 'react'
import type { CartItem, SaleProduct } from '@/types/sales'

/**
 * Custom hook for managing shopping cart state and operations
 */
export function useSalesCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  /**
   * Add a product to cart or remove if already exists (toggle behavior)
   */
  const addToCart = useCallback((product: SaleProduct) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      
      if (existingItem) {
        // Remove product if already in cart (unselect behavior)
        return prev.filter(item => item.product.id !== product.id)
      } else {
        // Add new product with quantity 1
        return [...prev, { product, quantity: 1 }]
      }
    })
  }, [])

  /**
   * Update quantity for a specific cart item
   */
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }, [])

  /**
   * Remove an item from cart
   */
  const removeItem = useCallback((productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId))
  }, [])

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  /**
   * Calculate subtotal (sum of all items before discount)
   */
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.product.sell_price * item.quantity)
    }, 0)
  }, [cartItems])

  /**
   * Calculate total after discount
   */
  const calculateTotal = useCallback((discountAmount: number = 0) => {
    return Math.max(0, subtotal - discountAmount)
  }, [subtotal])

  /**
   * Check if a product is in cart
   */
  const isInCart = useCallback((productId: number) => {
    return cartItems.some(item => item.product.id === productId)
  }, [cartItems])

  /**
   * Get quantity of a specific product in cart
   */
  const getItemQuantity = useCallback((productId: number) => {
    const item = cartItems.find(item => item.product.id === productId)
    return item?.quantity || 0
  }, [cartItems])

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    calculateTotal,
    isInCart,
    getItemQuantity,
  }
}
