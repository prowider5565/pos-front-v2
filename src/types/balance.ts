/**
 * Balance (Kassa) Types
 * Types for revenue and expense transactions
 */

/**
 * Individual balance transaction (expense or revenue)
 */
export interface BalanceTransaction {
  id: number
  amount: string
  currency: 'UZS' | 'USD'
  exchange_rate: string
  notes: string
  category: string | null
  created_by: number
  created_by_name: string
  created_at: string
}

/**
 * Metadata containing total amounts
 */
export interface BalanceMetadata {
  total_expense?: {
    uzs: string
    usd: string
  }
  total_revenue?: {
    uzs: string
    usd: string
  }
}

/**
 * Paginated list response for balance transactions
 */
export interface BalanceListResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: BalanceTransaction[]
  metadata: BalanceMetadata
}

/**
 * Form data for creating a new transaction
 */
export interface CreateBalanceTransactionData {
  amount: string | number
  currency: 'UZS' | 'USD'
  exchange_rate: string | number
  notes: string
  category?: number | null
}

/**
 * Transaction type
 */
export type TransactionType = 'expense' | 'revenue'

/**
 * Category type for API
 */
export type CategoryType = 'REVENUE' | 'EXPENSE'

/**
 * Category model
 */
export interface Category {
  id: number
  name: string
  description: string
  type: CategoryType
  created_at: string
}

/**
 * Create category data
 */
export interface CreateCategoryData {
  name: string
  description: string
  type: CategoryType
}
