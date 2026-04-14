import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { AnalyticsDashboard, LowStockResponse, PendingSalesResponse, PartiallyPaidSalesResponse, FullyPaidSalesResponse } from '@/types/analytics'
import type { DateFilterParams } from '@/app/dashboard/components/dashboard-filter'

type PaginatedAnalyticsResponse<T> = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: T[]
}

const DEFAULT_CURRENCY_AMOUNT = {
  uzs: '0',
  usd: '0',
}

const DEFAULT_REVENUE_STATE = {
  direction: 'Up' as const,
  percentage: 0,
}

const normalizeDashboardMetrics = (
  response: Partial<AnalyticsDashboard> | null | undefined
): AnalyticsDashboard => ({
  graph_data: Array.isArray(response?.graph_data)
    ? response.graph_data.map((item) => ({
        debt: {
          uzs: item?.debt?.uzs ?? '0',
          usd: item?.debt?.usd ?? '0',
        },
        income: {
          uzs: item?.income?.uzs ?? '0',
          usd: item?.income?.usd ?? '0',
        },
      }))
    : [],
  client_debt: {
    amounts: {
      uzs: response?.client_debt?.amounts?.uzs ?? DEFAULT_CURRENCY_AMOUNT.uzs,
      usd: response?.client_debt?.amounts?.usd ?? DEFAULT_CURRENCY_AMOUNT.usd,
    },
  },
  supplier_debt: {
    amounts: {
      uzs: response?.supplier_debt?.amounts?.uzs ?? DEFAULT_CURRENCY_AMOUNT.uzs,
      usd: response?.supplier_debt?.amounts?.usd ?? DEFAULT_CURRENCY_AMOUNT.usd,
    },
  },
  raw_income: {
    amounts: {
      uzs: response?.raw_income?.amounts?.uzs ?? DEFAULT_CURRENCY_AMOUNT.uzs,
      usd: response?.raw_income?.amounts?.usd ?? DEFAULT_CURRENCY_AMOUNT.usd,
    },
    state: {
      direction: response?.raw_income?.state?.direction ?? DEFAULT_REVENUE_STATE.direction,
      percentage: response?.raw_income?.state?.percentage ?? DEFAULT_REVENUE_STATE.percentage,
    },
  },
  total_products: response?.total_products ?? 0,
  total_asset_value: response?.total_asset_value ?? 0,
  categories_count: response?.categories_count ?? 0,
  low_stock_products: response?.low_stock_products ?? 0,
  total_products_sold: response?.total_products_sold ?? 0,
  total_sales_revenue: {
    amounts: {
      uzs: response?.total_sales_revenue?.amounts?.uzs ?? DEFAULT_CURRENCY_AMOUNT.uzs,
      usd: response?.total_sales_revenue?.amounts?.usd ?? DEFAULT_CURRENCY_AMOUNT.usd,
    },
    state: {
      direction: response?.total_sales_revenue?.state?.direction ?? DEFAULT_REVENUE_STATE.direction,
      percentage: response?.total_sales_revenue?.state?.percentage ?? DEFAULT_REVENUE_STATE.percentage,
    },
  },
  sales_by_status: {
    paid: response?.sales_by_status?.paid ?? 0,
    partially_paid: response?.sales_by_status?.partially_paid ?? 0,
    pending: response?.sales_by_status?.pending ?? 0,
  },
  users_count: response?.users_count ?? 0,
  clients_count: response?.clients_count ?? 0,
  suppliers_count: response?.suppliers_count ?? 0,
  archived_counts: {
    products: response?.archived_counts?.products ?? 0,
    suppliers: response?.archived_counts?.suppliers ?? 0,
    clients: response?.archived_counts?.clients ?? 0,
    users: response?.archived_counts?.users ?? 0,
  },
})

const normalizePaginatedResponse = <T>(
  response: PaginatedAnalyticsResponse<T> | T[] | null | undefined
) => {
  if (Array.isArray(response)) {
    return {
      count: response.length,
      next: null,
      previous: null,
      results: response,
    }
  }

  const results = Array.isArray(response?.results) ? response.results : []

  return {
    count: typeof response?.count === 'number' ? response.count : results.length,
    next: response?.next ?? null,
    previous: response?.previous ?? null,
    results,
  }
}

export const analyticsService = {
  getDashboardMetrics: async (filters?: DateFilterParams): Promise<AnalyticsDashboard> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${API_ENDPOINTS.ANALYTICS.DASHBOARD_METRICS}?${queryString}`
      : API_ENDPOINTS.ANALYTICS.DASHBOARD_METRICS
    
    const response = await api.get<Partial<AnalyticsDashboard>>(url)
    return normalizeDashboardMetrics(response)
  },

  getLowStockProducts: async (filters?: DateFilterParams, page?: number): Promise<LowStockResponse> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    if (page) {
      params.append('page', String(page))
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${API_ENDPOINTS.ANALYTICS.LOW_STOCK}?${queryString}`
      : API_ENDPOINTS.ANALYTICS.LOW_STOCK
    
    const response = await api.get<LowStockResponse | LowStockResponse['results']>(url)
    return normalizePaginatedResponse(response)
  },

  getPendingSales: async (filters?: DateFilterParams, page?: number): Promise<PendingSalesResponse> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    if (page) {
      params.append('page', String(page))
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${API_ENDPOINTS.ANALYTICS.SALES_PENDING}?${queryString}`
      : API_ENDPOINTS.ANALYTICS.SALES_PENDING
    
    const response = await api.get<PendingSalesResponse | PendingSalesResponse['results']>(url)
    return normalizePaginatedResponse(response)
  },

  getPartiallyPaidSales: async (filters?: DateFilterParams, page?: number): Promise<PartiallyPaidSalesResponse> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    if (page) {
      params.append('page', String(page))
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${API_ENDPOINTS.ANALYTICS.SALES_PARTIALLY_PAID}?${queryString}`
      : API_ENDPOINTS.ANALYTICS.SALES_PARTIALLY_PAID
    
    const response = await api.get<PartiallyPaidSalesResponse | PartiallyPaidSalesResponse['results']>(url)
    return normalizePaginatedResponse(response)
  },

  getFullyPaidSales: async (filters?: DateFilterParams, page?: number): Promise<FullyPaidSalesResponse> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    if (page) {
      params.append('page', String(page))
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${API_ENDPOINTS.ANALYTICS.SALES_FULLY_PAID}?${queryString}`
      : API_ENDPOINTS.ANALYTICS.SALES_FULLY_PAID
    
    const response = await api.get<FullyPaidSalesResponse | FullyPaidSalesResponse['results']>(url)
    return normalizePaginatedResponse(response)
  },
}
