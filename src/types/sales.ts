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
  total_remaining: string
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

/**
 * Sale status type
 */
export type SaleStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID'

/**
 * Supported filters for sales list endpoint (SaleFilterSet)
 */
export interface SalesListFilterParams {
  client?: number
  status?: SaleStatus
  needs_cheque?: boolean
  date_from?: string // YYYY-MM-DD
  date_to?: string // YYYY-MM-DD
  day?: string // YYYY-MM-DD
  week?: number
  month?: number
  year?: number
}

/**
 * Query params for sales list endpoint (pagination + filters)
 */
export interface SalesListQueryParams extends SalesListFilterParams {
  page?: number
  page_size?: number
}

/**
 * Amount display structure (UZS + USD)
 */
export interface AmountDisplay {
  uzs_amount: string
  usd_amount: string
}

/**
 * Debt amounts structure
 */
export interface DebtAmounts {
  total_amount: AmountDisplay
  discount_amount: AmountDisplay
  paid_amount: AmountDisplay
  remaining_amount: AmountDisplay
  total_after_discount: AmountDisplay
}

/**
 * Sale list item (for sales overview)
 */
export interface SaleListItem {
  id: number
  sale_date: string
  status: SaleStatus
  client_full_name: string
  number_of_products: number
  debt_amounts: DebtAmounts
}

/**
 * Paginated sales list response
 */
export interface SalesListResponse {
  count: number
  next: string | null
  previous: string | null
  results: SaleListItem[]
}

/**
 * Sale detail - client info
 */
export interface SaleDetailClient {
  id: number
  full_name: string
  phone_number: string
  address: string | null
}

/**
 * Sale detail - item
 */
export interface SaleDetailItem {
  id: number
  product: {
    id: number
    cover_image: string | null
    name: string
    product_type: string
  }
  qty: number
  unit_price: string
  subtotal: string
}

/**
 * Sale detail - payment
 */
export interface SaleDetailPayment {
  id: number
  amount_display: AmountDisplay
  currency: Currency
  payment_method: PaymentMethod
  created_at: string
}

/**
 * Sale detail (full sale info)
 */
export interface SaleDetail {
  id: number
  client: SaleDetailClient
  sale_date: string
  status: SaleStatus
  exchange_rate: string
  needs_cheque: boolean
  notes: string | null
  debt_amounts: DebtAmounts
  items: SaleDetailItem[]
  payments: SaleDetailPayment[]
}
