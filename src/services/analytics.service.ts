import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { AnalyticsDashboard, LowStockResponse, PendingSalesResponse, PartiallyPaidSalesResponse, FullyPaidSalesResponse } from '@/types/analytics'
import type { DateFilterParams } from '@/app/dashboard/components/dashboard-filter'

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
    
    return api.get<AnalyticsDashboard>(url)
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
    
    return api.get<LowStockResponse>(url)
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
    
    return api.get<PendingSalesResponse>(url)
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
    
    return api.get<PartiallyPaidSalesResponse>(url)
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
    
    return api.get<FullyPaidSalesResponse>(url)
  },
}
