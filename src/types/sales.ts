/**
 * Sales Type Definitions
 * Type definitions for sales-related data structures
 */

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER'
export type Currency = 'UZS' | 'USD'

/**
 * Product category structure
 */
export interface ProductCategory {
  id: number
  name: string
}

/**
 * Product image structure
 */
export interface ProductImage {
  id: number
  url: string
  is_main: boolean
}

/**
 * Product for sale structure from API
 */
export interface SaleProduct {
  id: number
  name: string
  quantity: number
  category: ProductCategory
  images: ProductImage[]
  sell_price: number
  cover_image: string
}

/**
 * Paginated response for products for sale
 */
export interface SaleProductsResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: SaleProduct[]
}

/**
 * Cart item structure (client-side)
 */
export interface CartItem {
  product: SaleProduct
  quantity: number
}

/**
 * Payment entry structure (client-side)
 */
export interface PaymentEntry {
  id: string // temporary client-side ID
  method: PaymentMethod
  currency: Currency
  amount: string
}

/**
 * Sale item for API request
 */
export interface SaleItemRequest {
  product_id: number
  quantity: number
}

/**
 * Payment for API request
 */
export interface SalePaymentRequest {
  method: PaymentMethod
  currency: Currency
  amount: string
}

/**
 * Create sale request payload
 */
export interface CreateSaleRequest {
  items: SaleItemRequest[]
  payments: SalePaymentRequest[]
  exchange_rate: string
  client_id?: number
  discount_amount?: string
  notes?: string
  needs_cheque?: boolean
}

/**
 * Create sale response
 */
export interface CreateSaleResponse {
  id: number
  sale_number: string
  total_amount: string
  discount_amount: string
  final_amount: string
  total_paid: string
  remaining_amount: string
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID'
  exchange_rate: string
  created_at: string
  client?: {
    id: number
    name: string
  }
  items: Array<{
    id: number
    product: {
      id: number
      name: string
    }
    quantity: number
    price: string
    total: string
  }>
  payments: Array<{
    id: number
    method: PaymentMethod
    currency: Currency
    amount: string
    created_at: string
  }>
}
