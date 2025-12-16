import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/analytics.service'
import type { AnalyticsDashboard } from '@/types/analytics'
import type { DateFilterParams } from '@/app/dashboard/components/dashboard-filter'

export const useAnalyticsDashboard = (filters?: DateFilterParams) => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics', 'dashboard', filters],
    queryFn: () => analyticsService.getDashboardMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })
}
