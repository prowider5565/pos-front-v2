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
