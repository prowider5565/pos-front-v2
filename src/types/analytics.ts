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
