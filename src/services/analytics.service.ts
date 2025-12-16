import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import type { AnalyticsDashboard } from '@/types/analytics'
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
}
