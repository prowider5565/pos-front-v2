import { useState, useMemo, useCallback } from 'react'
import type { CartItem, SaleProduct } from '@/types/sales'

/**
 * Custom hook for managing shopping cart state and operations
 */
export function useSalesCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({})
  const [priceDrafts, setPriceDrafts] = useState<Record<number, string>>({})

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
        return [...prev, { product, quantity: 1, unitPrice: product.sell_price }]
      }
    })
    setQuantityDrafts(prev => {
      const next = { ...prev }
      if (next[product.id]) {
        delete next[product.id]
      } else {
        next[product.id] = '1'
      }
      return next
    })
    setPriceDrafts(prev => {
      const next = { ...prev }
      if (next[product.id]) {
        delete next[product.id]
      } else {
        next[product.id] = String(product.sell_price)
      }
      return next
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

    setQuantityDrafts(prev => ({
      ...prev,
      [productId]: String(quantity),
    }))

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
    setQuantityDrafts(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setPriceDrafts(prev => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }, [])

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setCartItems([])
    setQuantityDrafts({})
    setPriceDrafts({})
  }, [])

  const setQuantityDraft = useCallback((productId: number, value: string) => {
    setQuantityDrafts(prev => ({
      ...prev,
      [productId]: value,
    }))
  }, [])

  const getItemQuantityDraft = useCallback((productId: number) => {
    const draft = quantityDrafts[productId]
    if (draft !== undefined) return draft

    const item = cartItems.find(item => item.product.id === productId)
    return item ? String(item.quantity) : ''
  }, [cartItems, quantityDrafts])

  const updateUnitPrice = useCallback((productId: number, unitPrice: number) => {
    const safeUnitPrice = Math.max(0, unitPrice)

    setPriceDrafts(prev => ({
      ...prev,
      [productId]: String(safeUnitPrice),
    }))

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, unitPrice: safeUnitPrice }
          : item
      )
    )
  }, [])

  const setPriceDraft = useCallback((productId: number, value: string) => {
    setPriceDrafts(prev => ({
      ...prev,
      [productId]: value,
    }))
  }, [])

  const getItemPriceDraft = useCallback((productId: number) => {
    const draft = priceDrafts[productId]
    if (draft !== undefined) return draft

    const item = cartItems.find(cartItem => cartItem.product.id === productId)
    return item ? String(item.unitPrice) : ''
  }, [cartItems, priceDrafts])

  const commitPriceDraft = useCallback((productId: number) => {
    const draft = priceDrafts[productId]
    const item = cartItems.find(cartItem => cartItem.product.id === productId)

    if (!item) return

    const trimmedDraft = draft?.trim() ?? String(item.unitPrice)
    if (trimmedDraft === '') {
      setPriceDrafts(prev => ({
        ...prev,
        [productId]: String(item.unitPrice),
      }))
      return
    }

    const parsedPrice = parseFloat(trimmedDraft)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setPriceDrafts(prev => ({
        ...prev,
        [productId]: String(item.unitPrice),
      }))
      return
    }

    updateUnitPrice(productId, parsedPrice)
  }, [cartItems, priceDrafts, updateUnitPrice])

  const commitQuantityDraft = useCallback((productId: number, maxQuantity?: number) => {
    const draft = quantityDrafts[productId]
    const item = cartItems.find(cartItem => cartItem.product.id === productId)

    if (!item) return

    const trimmedDraft = draft?.trim() ?? String(item.quantity)
    if (trimmedDraft === '') {
      setQuantityDrafts(prev => ({
        ...prev,
        [productId]: String(item.quantity),
      }))
      return
    }

    const parsedQuantity = parseInt(trimmedDraft, 10)
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setQuantityDrafts(prev => ({
        ...prev,
        [productId]: String(item.quantity),
      }))
      return
    }

    const nextQuantity = maxQuantity ? Math.min(parsedQuantity, maxQuantity) : parsedQuantity
    updateQuantity(productId, nextQuantity)
  }, [cartItems, quantityDrafts, updateQuantity])

  /**
   * Calculate subtotal (sum of all items before discount)
   */
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity)
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
    setQuantityDraft,
    commitQuantityDraft,
    updateUnitPrice,
    setPriceDraft,
    commitPriceDraft,
    removeItem,
    clearCart,
    subtotal,
    calculateTotal,
    isInCart,
    getItemQuantity,
    getItemQuantityDraft,
    getItemPriceDraft,
  }
}
