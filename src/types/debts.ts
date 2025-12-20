export interface DebtAmounts {
  total_debt: { uzs_amount: string; usd_amount: string }
  total_paid: { uzs_amount: string; usd_amount: string }
  total_remaining: { uzs_amount: string; usd_amount: string }
}

export interface SupplierDebt {
  id: number
  full_name: string
  company_name: string
  phone_number: string
  debt_amounts: DebtAmounts
}

export interface SupplierDebtsResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: SupplierDebt[]
  metadata: DebtAmounts
}

export interface ClientDebt {
  id: number
  full_name?: string
  phone_number?: string
  client?: number
  debt_amounts: DebtAmounts
}

export interface ClientDebtsResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: ClientDebt[]
  metadata: DebtAmounts
}

/**
 * Create old supplier debt request
 */
export interface CreateOldSupplierDebtRequest {
  supplier: number
  amount: string
  exchange_rate: string
  currency: 'UZS' | 'USD'
}

/**
 * Create old client debt request
 */
export interface CreateOldClientDebtRequest {
  client: number
  amount: string
  exchange_rate: string
  currency: 'UZS' | 'USD'
}

/**
 * Old debt item (for detail view)
 */
export interface OldDebtItem {
  id: number
  exchange_rate: string
  currency: 'UZS' | 'USD'
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID'
  debt_amounts: {
    total_debt: {
      usd_amount: string
      uzs_amount: string
    }
    total_paid: {
      usd_amount: string
      uzs_amount: string
    }
    total_remaining: {
      usd_amount: string
      uzs_amount: string
    }
  }
}

/**
 * Supplier old debts detail response
 */
export interface SupplierOldDebtsDetailResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: OldDebtItem[]
  metadata: DebtAmounts
}

/**
 * Client old debts detail response (same structure as supplier)
 */
export interface ClientOldDebtsDetailResponse {
  count: number
  current_page: number
  next: string | null
  previous: string | null
  total_pages: number
  results: OldDebtItem[]
  metadata: DebtAmounts
}

/**
 * Direct payment request for old client debt
 */
export interface DirectOldDebtPaymentRequest {
  old_debt_id: number
  amount: string
  currency: 'UZS' | 'USD'
  method: 'CASH' | 'CARD' | 'TRANSFER'
}

/**
 * Direct payment request for old supplier debt
 */
export interface DirectOldSupplierDebtPaymentRequest {
  old_debt_id: number
  amount: string
  currency: 'UZS' | 'USD'
  method: 'CASH' | 'CARD' | 'TRANSFER'
}
