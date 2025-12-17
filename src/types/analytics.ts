export interface CurrencyAmount {
  uzs: string
  usd: string
}

export interface RevenueState {
  direction: 'Up' | 'Down'
  percentage: number
}

export interface GraphDataPoint {
  debt: CurrencyAmount
  income: CurrencyAmount
}

export interface SalesByStatus {
  paid: number
  partially_paid: number
  pending: number
}

export interface ArchivedCounts {
  products: number
  suppliers: number
  clients: number
  users: number
}

export interface AnalyticsDashboard {
  graph_data: GraphDataPoint[]
  client_debt: {
    amounts: CurrencyAmount
  }
  supplier_debt: {
    amounts: CurrencyAmount
  }
  raw_income: {
    amounts: CurrencyAmount
    state: RevenueState
  }
  total_products: number
  total_asset_value: number
  categories_count: number
  low_stock_products: number
  total_products_sold: number
  total_sales_revenue: {
    amounts: CurrencyAmount
    state: RevenueState
  }
  sales_by_status: SalesByStatus
  users_count: number
  clients_count: number
  suppliers_count: number
  archived_counts: ArchivedCounts
}

export interface LowStockProduct {
  id: number
  name: string
  image: string
  product_type: string
  category: number
  category_name: string
  total_quantity: number
  created_at: string
}

export interface LowStockResponse {
  count: number
  next: string | null
  previous: string | null
  results: LowStockProduct[]
}

export interface PendingSale {
  id: number
  client: number
  client_name: string
  total_amount: string
  discount_amount: string
  status: string
  exchange_rate: string
  needs_cheque: boolean
  notes: string
  created_at: string
}

export interface PendingSalesResponse {
  count: number
  next: string | null
  previous: string | null
  results: PendingSale[]
}

export interface PartiallyPaidSale {
  id: number
  client: number
  client_name: string
  total_amount: string
  discount_amount: string
  status: string
  exchange_rate: string
  needs_cheque: boolean
  notes: string
  created_at: string
}

export interface PartiallyPaidSalesResponse {
  count: number
  next: string | null
  previous: string | null
  results: PartiallyPaidSale[]
}

export interface FullyPaidSale {
  id: number
  client: number
  client_name: string
  total_amount: string
  discount_amount: string
  status: string
  exchange_rate: string
  needs_cheque: boolean
  notes: string | null
  created_at: string
}

export interface FullyPaidSalesResponse {
  count: number
  next: string | null
  previous: string | null
  results: FullyPaidSale[]
}
